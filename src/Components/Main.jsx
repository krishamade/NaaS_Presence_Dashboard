import React from 'react'
import Footer from './Footer'
import Presence from './Presence'
import Navbar from './Navbar'
import LeaveCalendar from './LeaveCalendar'
import './Main.css'
import moment from 'moment'

let ws;
let wsLocation = parseQuery(window.location.search).dev !== undefined
    ? `ws://localhost:8000/`
    : 'wss://{INSERT API SERVER URL}/'

/* Purpose of the following let wsLocation line
Uncomment the below line when working in a development environment 
where you are running the api server locally and looking
for faster updates to come through for testing purposes 
*/
//let wsLocation = "ws://localhost:8000/"

wsLocation += window.location.pathname.split('/').slice(-1)[0];
ws = new WebSocket(wsLocation);
const debug = parseQuery(window.location.search).debug !== undefined;

var jobs = []
function parseQuery(queryString) {
    const query = {};
    const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (let i = 0; i < pairs.length; i += 1) {
        const pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}
class Main extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            leaveCalendar: [],
            nasAssignment: [],
            updated: []
        };
    }


    // single websocket instance for the own application and constantly trying to reconnect.

    componentDidMount() {

        //this.connect();
        console.log(ws)
        ws.onopen = function () {
            if (debug) console.log('connected');
            if (typeof jobs === 'undefined') {
                jobs = [];
            }
            ws.send(JSON.stringify({
                action: 'register',
                data: {
                    jobs: ["leaveCalendar", "nasAssignment"],
                    id: parseQuery(window.location.search).id
                },
            }));
            ws.send(JSON.stringify({
                action: 'setClientId',
                data: parseQuery(window.location.search).id
            }));
        };
        ws.onmessage = (e) => {
            const payload = JSON.parse(e.data);
            console.log(payload)
            if (debug) console.log(payload);
            // update is sent after each job completes
            if (payload.action === 'update') {
                this.setState({ [payload.name]: payload.data })
                this.setState({ updated: { ...this.state.updated, [payload.name]: moment().format('LT') } })
            }
            // fullUpdate is sent once after connection. Contains entire state.
            if (payload.action === 'fullUpdate') {
                payload.data.forEach(entry => { this.setState({ [entry.name]: entry.value }) })
                payload.data.forEach(entry => { this.setState({ updated: { ...this.state.updated, [entry.name]: moment().format('LT') } }) })
            }
            if (payload.action === 'refresh') {
                window.location.reload()
                console.log(payload)

            }
            if (payload.action === 'setDashboard') {
                window.location.href = `/${payload.data}.html${window.location.search}`
                console.log(payload)

            }
            if (payload.action === 'setSession') {
                //app.session = payload.data;
            }
        }
        // If socket is closed, retry connection every 5 seconds
        ws.onclose = function () {
            if (debug) console.log('session closed');
        };
    }

    timeout = 250; // Initial timeout duration as a class variable
    render() {
        return (
            <div>

            <div className="siteContainer">
            <header id="navbar">
                <Navbar />
            </header>
            <div className="">
                <div id="seperator" ></div>
                <div className="siteContent">
                    <div id="activeNATable">
                        <Presence payload={this.state} />
                    </div>
                    <div id="leaveCalendar">
                        <LeaveCalendar payload={this.state} />
                    </div>

                </div>
            </div>
            </div>
            <footer id="sticky-footer" className="py-4 bg-dark">
                    <Footer />
                </footer>
            </div>

        )
    }

}






export default Main;