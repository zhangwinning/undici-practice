'use strict'

const { AsyncResource } = require('async_hooks')

class Request extends AsyncResource {
  constructor (opts) {
    super('UNDICI_REQ')
    this.method = 'GET'
  }

  wrap (cb) {
    // happy path for Node 10+
    if (this.runInAsyncScope) {
      return this.runInAsyncScope.bind(this, cb, undefined)
    }
  }
}

module.exports = Request
