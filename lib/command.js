'use strict'

const symfony  = require('./symfony')
const util     = require('./util')
const commands = require('./commands')
require('shelljs/global')

exports.execute = (cmd, cb) => {
  util.clearScreen()
  util.console.info('Executing command: ' + cmd)

  if (!cmd) {
    util.console.error('Not a valid command')
    cb()
    return
  }

  symfony.getVersion(version => {
    if (cmd.hasOwnProperty('func')) {
      // Special function case
      cmd.func(cmd.arg, () => {
        cb()
      })
      return
    }

    if (cmd.hasOwnProperty('symfony') === false)
      throw new Error('This command has no symfony property!')

    // The command is a system command
    if (cmd.symfony === false) {
      if (cmd.hasOwnProperty('both')) {
        exports.shell(cmd.both, cb)
        return
      }

      exports.shell(eval('cmd.symfony' + version), cb)
      return
    }

    // The command is a symfony command
    if (cmd.symfony === true) {
      let foundValidProp = false
      let foundCommand = false
      if (cmd.hasOwnProperty('both')) {
        foundValidProp = true
        foundCommand = cmd.both
      }

      if (cmd.hasOwnProperty('symfony2') && cmd.hasOwnProperty('symfony3')) {
        foundValidProp = true
        foundCommand = 'cmd.symfony' + version
      }

      if (foundValidProp === false)
        throw new Error('This command has no valid symfony props (foundValidProp = false)')

      const constructedCommand = 'php ' + eval('commands.symfony().symfony' + version) + ' ' + foundCommand
      exports.shell(constructedCommand, cb)
    }
  })
}

exports.shell = (cmd, cb) => {
  let failed = false

  const child = exec(cmd, {
    async: true,
    silent: true,
  })

  child.stdout.on('data', function(data) {
    if (data.toLowerCase().indexOf('exception') > -1) {
      util.console.error(data)
      failed = true
    }
  })

  child.stderr.on('data', function(data) {
    util.console.error(data)
    failed = true
  })

  child.on('close', function(code) {
    if (!failed)
      util.console.success('Command finished')

    if (failed)
      util.console.error('Command failed: ' + cmd)

    cb()
  })
}
