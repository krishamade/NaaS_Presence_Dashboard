const WebSocket = require('ws')
const express = require('express')
var http = require('http')
var Airtable = require('airtable')
const childProcess = require('child_process')
const parseString = require('xml2js').parseString
const request = require('axios')
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Packages not required at this time
//var parse = require('csv-parse');

// Set initial server action
var action = 'connect'

// A JSON object that contains all Field NA's and their assigned districts
var districtAssignment = []

// Set initial leaveCalendar results data
var leaveCalendarResults
var dummyLeaveData = process.env.LEAVECALENDARDUMMYDATA
// A JSON Object That will encapsulate all data that needs to transfer to the client
var serverData = {
  districtAssignment: districtAssignment,
  leaveCalendar: leaveCalendarResults,
  action: action
}

// Airtable configurations and variables. This is where we are currently keeping our NAS primary/backup list.
Airtable.configure({
  apiKey: process.env.AIRTABLEAPIKEY,
  endpointUrl: 'https://api.airtable.com'
})
var base = Airtable.base(process.env.AIRTABLEAPIBASE);

// Implementing express and websockets for client connections
const app = express();
app.use(express.static(path.join(__dirname, 'build')))
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.listen(80)
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});
server.listen(8180, () => console.log("Websocket Server Started."));

// Initialize Sentry.io - Project is labeled as NAS_DASHBOARD_BACKEND
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRYCONNECTOR
});

// Initialize PRTG API Information
const prtgUsername = process.env.PRTGUSERNAME
const prtgPassHash = process.env.PRTGPASSHASH

var servicesDown = [];

const getPrtgDownData = () => new Promise((resolve, reject) => {
  request.get(`https://prtg.oakland.k12.mi.us/api/table.json?content=all&username=${prtgUsername}&passhash=${prtgPassHash}&columns=device,sensor,probe,group,status,downtimesince`)
  .then(response => {
    var serviceList = response.data.all;
    resolve(serviceList)
    for (var i = 0; i < serviceList.length; i++) {

      var curService = serviceList[i];
      var curStatus = curService.status;
      var curRawStatus = curService.status_raw;
      var curName = curService.sensor;
      var curGroup = curService.group;
      var curProbe = curService.probe;

      if (curRawStatus == 5 || curRawStatus == 4 || curRawStatus == 10 || curStatus == "Down   (simulated error)" || curRawStatus == 13) {
        servicesDown[i] = {
          status: curStatus,
          status_raw: curRawStatus,
          name: curName,
          group: curGroup,
          probe: curProbe
        }
      }
  }
  buildServerData()
  }).catch(error => {
    
    console.log("There was an error: ", error)
    
    }).finally()
})

// Airtable API export to get an always up-to-date list of District assignments
const airtableData = async () => {
  // Clears the districtAssignment array before every API request, to clear all table data
  districtAssignment = []

  base('Imported table').select({
    view: 'Grid view'
  }).firstPage(function (err, records) {
    if (err) {
      console.error(err);
      return;
    }
    records.forEach(function (record) {
      // Checks to see if any Network As a Service Members are on the Leave Calendar. Then sets the activeNA to primary or backup accordingly
      if (leaveCalendarResults.includes(record.get('Primary'))) {
        districtAssignment.push({
          district: record.get('District'),
          primary: record.get('Primary'),
          backup: record.get('Backup'),
          activeNA: 'backup'
        })
      } else {
        districtAssignment.push({
          district: record.get('District'),
          primary: record.get('Primary'),
          backup: record.get('Backup'),
          activeNA: 'primary'
        })
      }
    });
    buildServerData();
  });
  
}

const leaveCalendar = () => new Promise((fufill, reject) => {

  var now = Date.now()
  setTimeout(() => reject('calendar timeout'), 10000)

  let command = process.env.SOAPCOMMAND

  childProcess.exec(command, async (err, stdout, stderr) => {
    if (err) {
      reject(err)
      return
    }
    parseString(stdout, parse)

    function parse(err, result) {

      if (err) var results = []
      try {
        results = result['soap:Envelope']['soap:Body'][0]['GetListItemsResponse'][0]['GetListItemsResult'][0]['listitems'][0]['rs:data'][0]['z:row'] || []

      } catch (err) {
        results = []
      }
      fufill(
        // Adds the results of the parsed leave calendar to an array
        leaveCalendarResults = results // Sets filtered results to leaveCalendarResults so that we can add them to our JSON object
        .filter(event => Date.parse(event['$']['ows_EventDate']) < now && now < Date.parse(event['$']['ows_EndDate'])) // filter only events for today
        .map(event => event['$']['ows_LinkTitle'].split(' - ')[0]) // Get name (lastname, firstname)
        .sort() // Alphabetical
        .map(name => name.split(', ').reverse().join(' ')) // Switch to firstname lastname
        .filter((value, index, self) => self.filter(e => e === value).length % 2 !== 0) // filter out even occurances
        .filter((value, index, self) => self.indexOf(value) === index) // filter out duplicate names
      )
      console.log("Currently on Leave " + leaveCalendarResults)
    }
  })

})


// This function constructs the JSON object before sending it over web sockets to the client
const buildServerData = async () => {
  
serverData = {
  districtAssignment: districtAssignment,
  prtgDownAlarms: servicesDown,
  leaveCalendar: leaveCalendarResults,
  action: action
}

if (serverData['action'] == 'refresh') {
  reloadClients();
}else{updateClients();}
}

const connectWebsocketServer = async () => {
wss.on('connection', (ws, req) => {
  //Alert server of client connection, then send ONLY that client what data we have for them.
  console.log("Client Connected.")
  ws.on('message', (data) => {
    console.log("A client sent us a message: ", data)
  })

  ws.on('close', () => {
    console.log("A Client Has Disconnected.")
  });
})
}

//Sends the updated information to our clients
const updateClients = async () => {
  serverData['action'] = "update"
  console.log(serverData)
  wss.clients.forEach((client) => {
    if (client.readyState == WebSocket.OPEN) {

      client.send(JSON.stringify(serverData))
    }
  });
}

const reloadClients = async () => {
  serverData['action'] = "refresh"
  wss.clients.forEach((client) => {
    if (client.readyState == WebSocket.OPEN) {
      client.send(JSON.stringify(serverData))
    }
  });
}

const runProgram = async () => {
  await leaveCalendar()
  await airtableData()
  await getPrtgDownData()
  await connectWebsocketServer()
}


runProgram()
setInterval(airtableData, 5000)
setInterval(getPrtgDownData, 10000)
setInterval(leaveCalendar, 30000)
