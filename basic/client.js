'use strict'

const net = require('net')
const { Readable } = require('readable-stream')

function run (port, hostname, cb) {
  const socket = net.connect(port, hostname)

  socket.on('connect', () => {
    var req = `GET / HTTP/1.1\r\nHost: ${hostname}\r\nConnection: keep-alive\r\n`
    socket.write(req, 'ascii')
    // 最后要加 \r\n
    socket.write('\r\n', 'ascii')
    kRead()
  })

  function kRead () {
    let hasRead = null
    var chunk = null
    const _lastBody = new Readable({ read: kRead })
    while ((chunk = socket.read()) !== null) {
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
      socket.once('readable', kRead)
    }
  }
}

run(3000, 'localhost', (err, { body }) => {
  if (err) return err
  const bufs = []
  body.on('data', (buf) => {
    bufs.push(buf)
  })
  body.on('end', () => {
    console.log('---->', bufs.toString())
  })
})
