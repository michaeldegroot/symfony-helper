'use strict'

var fs         = require('fs-extra')
const moment   = require('moment')
const clc      = require('cli-color')
const rightpad = require('right-pad')
const prompt   = require('./prompt')

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

exports.emptyDir = (folder, cb) => {
  fs.emptyDir(folder, function(err) {
    if (err) {
      exports.console.error(err)
    } else {
      cb()
    }
  })
}

exports.console = {
  error: msg => {
    exports.console.raw(clc.redBright(rightpad('ERR', 5)), msg)
  },

  log: msg => {
    exports.console.raw(clc.bold(rightpad('LOG', 5)), msg)
  },

  info: msg => {
    exports.console.raw(clc.cyanBright(rightpad('INFO', 5)), msg)
  },

  warn: msg => {
    exports.console.raw(clc.yellowBright(rightpad('WARN', 5)), msg)
  },

  success: msg => {
    exports.console.raw(clc.greenBright(rightpad('OK', 5)), msg)
  },

  raw: (type, msg) => {
    const time = moment().format('h:mm:ss')
    console.log(type + rightpad(time, 9) + msg)
  },
}

exports.clearScreen = () => {
  var windows = process.platform.indexOf('win') === 0
  if (!process.stdout.getWindowSize)
    return

  var i
  var lines
  var stdout = ''
  if (windows === false) {
    stdout += '\x1B[2J'
  } else {
    lines = process.stdout.getWindowSize()[1]
    for (i = 0; i < lines; i ++) {
      stdout += '\r\n'
    }
  }

  stdout += '\x1B[0f'
  process.stdout.write(stdout)
}

exports.pressAnyKey = cb => {
  console.log('')
  console.log('')
  console.log('Press any key to continue')
  var stdin = process.openStdin()
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.on('data', () => {
    stdin.removeAllListeners('data')

    if (!cb) {
      exports.reset()
      return
    }

    cb()
  })
}

exports.reset = () => {
  exports.clearScreen()
  prompt.start()
}

exports.array = () => {
  return {
    pushUnique: (array, element) => {
      var id = array.length + 1
      var found = array.some(function(el) {
        return el.bundle === element.bundle
      })

      if (!found) {
        array.push(element)
      }
    },
  }
}
