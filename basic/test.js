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
