FROM node:8.7.0-alpine

# Create app directory and use it as the working directory
RUN mkdir -p /srv/app/nas_dashboard
WORKDIR /srv/app/nas_dashboard

COPY package.json /srv/app/nas_dashboard
COPY package-lock.json /srv/app/nas_dashboard

RUN npm install

RUN apk update 

RUN apk add curl

COPY . /srv/app/nas_dashboard

RUN npm run build

CMD [ "node", "server.js" ]