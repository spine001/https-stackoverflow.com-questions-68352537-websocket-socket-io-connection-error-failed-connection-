// Dependencies
const express = require('express')
const app = express()
const httpPort = process.env.PORT || 80
const httpsPort = 443
const { ExpressPeerServer } = require('peer')
const path = require('path')
const http = require('http')
const https = require('https')
const fs = require('fs')
const certs = `C:/Users/spine/Documents/Personal Files/ArduinoData/packages/esp8266/hardware/esp8266/2.7.4/libraries/ESP8266WiFi/examples/BearSSL_Server/`


// Certificate & credentials
const privateKey = fs.readFileSync(path.join(certs, 'key.pem'))
const certificate = fs.readFileSync(path.join(certs, 'cert.pem'))
const credentials = {
        key: privateKey,
        cert: certificate
}

const mainServer = http.createServer(app).listen(httpPort, () => { console.log('Main Server listening to port ' + httpPort) })
const httpsServer = https.createServer(credentials, app).listen(httpsPort, () => { console.log('Peer Server listening to port ' + httpsPort) })

const peerServer = ExpressPeerServer(mainServer, {
        debug: true,
        ssl: {},
})

app.use('/peerjs', peerServer)
// app.use(peerServer)

const io = require('socket.io')(httpsServer,{
// const io = require('socket.io')(mainServer, {
  cors: {
      origin: "*",
  },
});
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
  //console.log('Room Created / Joined')
})

io.on('connection', (socket) => {
    //console.log('IO Connectedd')
    socket.on('join-room', (roomId, userId) => {
        console.log(roomId, userId)
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })
    })
})