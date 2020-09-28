'use strict'


var events = require('events');
var eventEmitter = new events.EventEmitter();

//Create an event handler:
var myEventHandler = function () {
    setTimeout(() => {
        console.log('time ')
    }, 4000);
}

//Assign the event handler to an event:
eventEmitter.on('scream', myEventHandler);

//Fire the 'scream' event:
// eventEmitter.emit('scream');

var queue = require('fastq')(worker, 2)




queue.push(42, function (err, result) {
  if (err) { throw err }
  console.log('the result is', result)
  eventEmitter.emit('scream');
})

queue.push(40, function (err, result) {
    if (err) { throw err }
    console.log('the result is', result)
})


function worker (arg, cb) {
  setTimeout(() => {
    cb(null, arg * 2)
  }, 2000)
}
