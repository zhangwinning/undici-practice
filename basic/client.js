'use strict'

const net = require('net')
const { Readable } = require('readable-stream')
const { HTTPParser } = require('http-parser-js')

class Client {
  constructor (hostname, port) {
    this.hostname = hostname
    this.port = port
    this.socket = net.connect(port, hostname)
    this.parser = new HTTPParser(HTTPParser.RESPONSE)

    this.parser[HTTPParser.kOnHeaders] = () => { }
    this.parser[HTTPParser.kOnHeadersComplete] = (headers) => {
      this._lastHeaders = headers
      this._lastCb(null, { headers, body: this._lastBody })
    }

    this.parser[HTTPParser.kOnBody] = (chunk, offset, length) => {
      this._lastBody.push(chunk.slice(offset, offset + length))
    }

    this.parser[HTTPParser.kOnMessageComplete] = () => {
      this._lastBody.push(null)
      this._lastBody = null
      this._lastHeaders = null
    }
  }

  request ({ method, path }, cb) {
    this._lastCb = cb
    this._lastBody = new Readable({ read: () => { } })
    this.socket.on('connect', () => {
      var req = `${method} ${path} HTTP/1.1\r\nHost: ${this.hostname}\r\nConnection: keep-alive\r\n`
      this.socket.write(req, 'ascii')
      this.socket.write('\r\n', 'ascii')

      function kRead () {
        let hasRead = null
        var chunk = null
        while ((chunk = this.socket.read()) !== null) {
          hasRead = true
          this.parser.execute(chunk)
        }
        if (!hasRead) {
          this.socket.once('readable', kRead.bind(this))
        }
      }

      kRead.call(this)
    })
  }

  close () {
    if (this.socket) {
      this.socket.end()
    }
  }
}

module.exports = Client
