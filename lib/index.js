'use strict'

const util = require('./util')

try {
  util.reset()
} catch (e) {
  util.console.error('Your terminal is not supported :(')
  process.exit()
}
