'use strict'

const util        = require('./util')
const updatecheck = require('./updatecheck')

// Start the program by reseting the state
// If this fails it means we have a unsupported terminal
const start = () => {
  try {
    util.reset()
  } catch (e) {
    console.error()
    util.console.error(e.toString())
    util.console.error('Your terminal is not supported :(')
    process.exit()
  }
}

// Notify if updates are available
updatecheck.check(start)
