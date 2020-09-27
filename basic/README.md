## 通过 net 模块实现一个简单的 http client 客户端

通过 net 模块实现一个 http 客户端。如果不借助任何依赖，可以通过以下方式实现
```js
'use strict'

const net = require('net')
const { Readable } = require('readable-stream')

class Client {
  constructor (hostname, port) {
    this.hostname = hostname
    this.port = port
    this.socket = net.connect(port, hostname)
  }

  request ({ method, path }, cb) {
    this.socket.on('connect', () => {
      var req = `${method} ${path} HTTP/1.1\r\nHost: ${this.hostname}\r\nConnection: keep-alive\r\n`
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

  close () {
    if (this.socket) {
      this.socket.end()
    }
  }
}

module.exports = Client

```
测试用例 
```js
const Client = require('./client')
const { test } = require('tap')
const { createServer } = require('http')

test('basic get', (t) => {
  t.plan(2)

  const server = createServer((req, res) => {
    res.end('hello')
  })

  t.tearDown(server.close.bind(server))

  server.listen(0, () => {
    const client = new Client('localhost', `${server.address().port}`)
    t.tearDown(client.close.bind(client))
    client.request({ path: '/', method: 'GET' }, (err, { body }) => {
      t.error(err)
      const bufs = []
      body.on('data', (buf) => {
        bufs.push(buf)
      })
      body.on('end', () => {
        t.strictEqual('hello', Buffer.concat(bufs).toString('utf8'))
      })
    })
  })
})

```
现在的流程是: 双方 socket 建立连接后，然后处理返回的数据，通过回调的形式，返回给调用者。

改进，根据耗子叔的建议，把流程和数据处理分开才好，因此下面改进，把数据的处理引入一个库 http-parser-js，这个库是解析请求数据的。

改进版本二 : 
```js
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

```
```js
const Client = require('./client')
const { test } = require('tap')
const { createServer } = require('http')

test('basic get', (t) => {
  t.plan(5)

  const server = createServer((req, res) => {
    t.strictEqual('/', req.url, 'server url is same as req url')
    t.strictEqual('GET', req.method, 'req method is same as req method')
    res.end('hello')
  })

  t.tearDown(server.close.bind(server))

  server.listen(0, () => {
    const client = new Client('localhost', `${server.address().port}`)
    t.tearDown(client.close.bind(client))
    client.request({ path: '/', method: 'GET' }, (err, { headers, body }) => {
      t.error(err)
      t.strictEqual(200, headers.statusCode, 'statusCode is equal 200')
      const bufs = []
      body.on('data', (buf) => {
        bufs.push(buf)
      })
      body.on('end', () => {
        t.strictEqual('hello', Buffer.concat(bufs).toString('utf8'))
      })
    })
  })
})

```
改进引入