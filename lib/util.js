'use strict'

const fs       = require('fs')
const moment   = require('moment')
const clc      = require('cli-color')
const rightpad = require('right-pad')

exports.fileExists = file => {
  try {
    fs.accessSync(file, fs.F_OK)
    return true
  } catch (e) {
    return false
  }
}

exports.fileRead = (file, cb) => {
  fs.readFile(file, 'utf8', function(err, data) {
    if (err)
      return console.log(err)
    cb(data)
  })
}

exports.console = {
  error: msg => {
    exports.console.raw(clc.red(rightpad('ERR', 5)), msg)
  },

  log: msg => {
    exports.console.raw(clc.bold(rightpad('LOG', 5)), msg)
  },

  info: msg => {
    exports.console.raw(clc.lightblue(rightpad('INFO', 5)), msg)
  },

  warn: msg => {
    exports.console.raw(clc.yellow(rightpad('WARN', 5)), msg)
  },

  success: msg => {
    exports.console.raw(clc.green(rightpad('OK', 5)), msg)
  },

  raw: (type, msg) => {
    const time = moment().format('h:mm:ss')
    console.log(type + rightpad(time, 9) + msg)
  },
}
