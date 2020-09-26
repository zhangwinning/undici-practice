'use strict'

const net = require('net')
const { Readable } = require('readable-stream')

class Client {
  constructor (port, hostname) {
    this.port = port
    this.hostname = hostname
    this.socket = net.connect(port, hostname)
  }

  request (method, path, cb) {
    this.socket.on('connect', () => {
      var req = `GET / HTTP/1.1\r\nHost: ${this.hostname}\r\nConnection: keep-alive\r\n`
      this.socket.write(req, 'ascii')
      this.socket.write('\r\n', 'ascii')

      function kRead () {
        let hasRead = null
        var chunk = null
        const _lastBody = new Readable({ read: () => { } })
        while ((chunk = this.socket.read()) !== null) {
          hasRead = true
          cb(null, {
            body: _lastBody
          })
          let data = chunk.toString()
          data = data.split('\r\n\r\n')[1]
          _lastBody.push(data)
          _lastBody.push(null)
        }
        if (!hasRead) {
          this.socket.once('readable', kRead.bind(this))
        }
      }

      kRead.call(this)
    })
  }
}

module.exports = Client
