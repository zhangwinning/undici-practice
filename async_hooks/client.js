'use strict'

const net = require('net')
const Request = require('./request')
const { Readable } = require('readable-stream')

function run (port, hostname, cb) {
  const socket = net.connect(port, hostname)

  socket.on('connect', () => {
    const request = new Request()
    request.wrap(cb)
    var req = `GET / HTTP/1.1\r\nHost: ${hostname}\r\nConnection: keep-alive\r\n`
    socket.write(req, 'ascii')
    socket.write('\r\n', 'ascii')
  })

  socket.on('data', (data) => {
      this._lastbody = new Readable({ read: () => {

      }})
      cb(null, {
          statusCode : 200,
          headers: '',
          body : this._lastbody
      })
  })
}

run(3000, 'localhost', (statusCode, headers, body) => {
    console.log([
        statusCode,
        headers,
        body
    ])
})
