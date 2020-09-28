const Client = require('./client')
const { test } = require('tap')
const { createServer } = require('http')
const { readFileSync } = require('fs')

// test('basic get', (t) => {
//   t.plan(5)

//   const server = createServer((req, res) => {
//     t.strictEqual('/', req.url, 'server url is same as req url')
//     t.strictEqual('GET', req.method, 'req method is same as req method')
//     res.end('hello')
//   })

//   t.tearDown(server.close.bind(server))

//   server.listen(0, () => {
//     const client = new Client('localhost', `${server.address().port}`)
//     t.tearDown(client.close.bind(client))
//     client.request({ path: '/', method: 'GET' }, (err, { headers, body }) => {
//       t.error(err)
//       t.strictEqual(200, headers.statusCode, 'statusCode is equal 200')
//       const bufs = []
//       body.on('data', (buf) => {
//         bufs.push(buf)
//       })
//       body.on('end', () => {
//         t.strictEqual('hello', Buffer.concat(bufs).toString('utf8'))
//       })
//     })
//   })
// })

// test('basic POST with string', (t) => {
//   t.plan(6)

//   const expected = readFileSync('./test1.js', 'utf8')

//   const server = createServer((req, res) => {
//     t.strictEqual(req.url, '/')
//     t.strictEqual(req.method, 'POST')

//     req.setEncoding('utf8')
//     let data = ''

//     req.on('data', function (d) { data += d })

//     req.on('end', () => {
//       t.strictEqual(data, expected)
//     })

//     res.end('hello')
//   })
//   t.tearDown(server.close.bind(server))

//   server.listen(0, () => {
//     const client = new Client('localhost', `${server.address().port}`)
//     t.tearDown(client.close.bind(client))

//     client.request({ path: '/', method: 'POST', body: expected }, (err, { headers, body }) => {
//       t.error(err)
//       t.strictEqual(headers.statusCode, 200)
//       const bufs = []
//       body.on('data', (buf) => {
//         bufs.push(buf)
//       })
//       body.on('end', () => {
//         t.strictEqual('hello', Buffer.concat(bufs).toString('utf8'))
//       })
//     })
//   })
// })

// function postServer (t, expected) {
//   return function (req, res) {
//     t.strictEqual(req.url, '/')
//     t.strictEqual(req.method, 'POST')

//     req.setEncoding('utf8')
//     let data = ''

//     req.on('data', function (d) { data += d })

//     req.on('end', () => {
//       t.strictEqual(data, expected)
//     })

//     res.end('hello')
//   }
// }
// test('basic POST with Buffer', (t) => {
//   t.plan(5)

//   const expected = readFileSync('./test01.js')

//   const server = createServer(postServer(t, expected.toString()))
//   t.tearDown(server.close.bind(server))

//   server.listen(0, () => {
//     const client = new Client('localhost', `${server.address().port}`)
//     t.tearDown(client.close.bind(client))

//     client.request({ path: '/', method: 'POST', body: expected }, (err, { body }) => {
//       t.error(err)
//       const bufs = []
//       body.on('data', (buf) => {
//         bufs.push(buf)
//       })
//       body.on('end', () => {
//         t.strictEqual('hello', Buffer.concat(bufs).toString('utf8'))
//       })
//     })
//   })
// })

test('10 times GET', (t) => {
  const num = 10
  t.plan(2 * 10)

  const server = createServer((req, res) => {
    res.end(req.url)
  })
  t.tearDown(server.close.bind(server))

  server.listen(0, () => {
    const client = new Client('localhost', `${server.address().port}`)
    t.tearDown(client.close.bind(client))

    for (var i = 0; i < num; i++) {
      makeCall(i)
    }

    function makeCall (i) {
      client.request({ path: '/' + i, method: 'GET' }, (err, { statusCode, headers, body }) => {
        t.error(err)
        // t.strictEqual(statusCode, 200)
        const bufs = []
        body.on('data', (buf) => {
          bufs.push(buf)
        })
        body.on('end', () => {
          t.strictEqual('/' + i, Buffer.concat(bufs).toString('utf8'))
        })
      })
    }
  })
})
