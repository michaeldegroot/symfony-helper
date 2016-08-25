'use strict'

const RegClient      = require('npm-registry-client')
const client         = new RegClient({
  retry: {
    count: 0,
    factor: 0,
    minTimeout: 150,
    maxTimeout: 500,
  },
})
const programVersion = require('../package.json').version
const util           = require('./util')
const clc            = require('cli-color')

exports.check = cb => {
  client.get('https://registry.npmjs.org/symfony-helper', {
    timeout: 1000,
  }, (error, data, raw, res) => {
    if (error) {
      cb()
      return
    }

    let latestVersion = programVersion
    for (let version in data.versions) {
      latestVersion = version
    }

    const programVersionInt = parseInt(programVersion.replace(/\./g, ''))
    const latestVersionInt  = parseInt(latestVersion.replace(/\./g, ''))

    if (programVersionInt < latestVersionInt) {
      util.clearScreen()
      util.console.success('NEW UPDATE!')
      console.log('')
      console.log('There is a new update for symfony-helper, update with: ')
      console.log(clc.bold('npm install symfony-helper -g'))
      console.log('')
      console.log('Your version: ' + clc.bold(programVersion))
      console.log('New version: ' + clc.bold(clc.greenBright(latestVersion)))
      util.pressAnyKey()
      return
    }

    cb()
  })
}
