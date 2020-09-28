'use strict'

const net = require('net')
const { Readable } = require('readable-stream')
const { HTTPParser } = require('http-parser-js')
const Q = require('fastq')
const Request = require('./request')


const { AsyncResource, executionAsyncId } = require('async_hooks');

class A extends AsyncResource {
  constructor() {
    super('UNDICI_REQ')
  }

  methodA (cb) {
    return this.runInAsyncScope.bind(this, cb, undefined)
  }
}

// const asyncResource = new AsyncResource('UNDICI_REQ')

class Client {
  constructor (hostname, port) {
    this.hostname = hostname
    this.port = port
    this.socket = net.connect(port, hostname)
    this.parser = new HTTPParser(HTTPParser.RESPONSE)

    this.parser[HTTPParser.kOnHeaders] = () => { }
    this.parser[HTTPParser.kOnHeadersComplete] = (headers) => {
      this._lastBody = new Readable({ read: () => { } })
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
    this.q = Q((request, cb) => {
      var { method, path, body } = request
      // cb = new Request().wrap(cb)
      // console.log('----->', asyncResource.runInAsyncScope)
      // cb = new AsyncResource('UNDICI_REQ').runInAsyncScope.bind(this, cb)

      cb = new AsyncResource('REQUEST_CONTEXT').runInAsyncScope.bind(this, cb, undefined)
      // cb = new A().methodA(cb)
      this._lastCb = cb
      var req = `${method} ${path} HTTP/1.1\r\nHost: ${this.hostname}\r\nConnection: keep-alive\r\n`
      this.socket.write(req, 'ascii')
      if (typeof body === 'string' || body instanceof Uint8Array) {
        this.socket.write('content-length: ' + Buffer.byteLength(body) + '\r\n', 'ascii')
        this.socket.write('\r\n', 'ascii')
        this.socket.write(body)
      }

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
    }, 1)

    this.q.pause()

    this.socket.on('connect', () => {
      this.q.resume()
    })
  }

  request ({ method, path, body }, cb) {
    // const req = new Request({ method, path, body })
    this.q.push({ method, path, body }, cb)
  }

  close () {
    if (this.socket) {
      this.socket.end()
    }
  }
}

module.exports = Client
