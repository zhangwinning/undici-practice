const Client = require('./client')

const client = new Client(3000, 'localhost')

client.request('GET', '/', (err, { body }) => {
  if (err) console.log(err)
  const bufs = []
  body.on('data', (buf) => {
    bufs.push(buf)
  })
  body.on('end', () => {
    console.log('---->', bufs.toString())
  })
})
