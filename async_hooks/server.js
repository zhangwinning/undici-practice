const { createServer } = require('http')

createServer((req, res) => {
  res.end('hello')
}).listen(3000)
