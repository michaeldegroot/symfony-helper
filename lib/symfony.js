'use strict'

const util = require('./util.js')
const path = require('path')

exports.getVersion = cb => {
  let version = false

  const composer = path.join(process.cwd(), 'composer.json')
  if (util.fileExists(composer))
    version = require(composer).require['symfony/symfony'].split('.')[0]

  const deps = path.join(process.cwd(), 'deps')
  if (util.fileExists(deps)) {
    util.fileRead(deps, data => {
      // Lol
      let depsArray = data.split('[symfony]')[1]
      depsArray = depsArray.split('[')[0]
      depsArray = depsArray.split('version')[1].replace('=', '').replace('v', '').split('.')[0]
      if (depsArray)
        version = depsArray

      cb(version)
    })
  } else {
    cb(version)
  }
}
