'use strict'

const symfony  = require('./symfony')
const util     = require('./util')
const commands = require('./commands')

exports.execute = (cmd, cb) => {
  let commandFailed = false
  let async = false
  symfony.getVersion(version => {
    if (cmd.hasOwnProperty('symfony') === false)
      throw new Error('This command has no symfony property!')

    if (cmd.hasOwnProperty('symfony')) {
      // The command is a system command
      if (cmd.symfony === false) {
        async = true
        const spawn = require('child_process').spawn
        let commandArray = eval('cmd.symfony' + version).split(' ')
        const command = commandArray[0]
        commandArray.shift()
        const args = commandArray

        const exec = spawn(command, args)

        exec.stdout.on('data', data => {
          util.console.log(data)
        })

        exec.stderr.on('data', data => {
          commandFailed = true
          util.console.error(stderr)
        })

        exec.on('close', code => {
          util.console.warn(`Command exited with code ${code}`)
          if (commandFailed)
            util.console.warn('The command has failed check the output above!')
          cb()
        })
      }

      // The command is a symfony command
      if (cmd.symfony === true) {
        let foundValidProp = false
        let foundCommand = false
        if (cmd.hasOwnProperty('both')) {
          foundValidProp = true
          foundCommand = cmd.both
        }

        if (cmd.hasOwnProperty('symfony2')) {
          if (cmd.hasOwnProperty('symfony3')) {
            foundValidProp = true
            foundCommand = 'cmd.symfony' + version
          }
        }

        if (foundValidProp === false)
          throw new Error('This command has no valid symfony props (foundValidProp = false)')

        const constructedCommand = 'php ' + eval('commands.symfony().symfony' + version) + ' ' + foundCommand
        console.log(constructedCommand)
      }
    }

    if (commandFailed)
      util.console.warn('The command has failed check the output above!')

    if (cb && async === false)
      cb()
  })
}
