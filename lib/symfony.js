'use strict'

const util = require('./util')
const path = require('path')
const walk = require('walk')

exports.getVersion = cb => {
  let version = false

  const composer = path.join(process.cwd(), 'composer.json')
  if (util.fileExists(composer))
    version = require(composer).require['symfony/symfony'].split('.')[0]

  const deps = path.join(process.cwd(), 'deps')
  if (util.fileExists(deps)) {
    util.fileRead(deps, data => {
      // Lol regex??
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

exports.getBundles = cb => {
  const namespaces = {}
  const namespaceWalker = walk.walk(path.join(process.cwd(), 'src'), {
    followLinks: false,
  })

  namespaceWalker.on('directory', (root, dir, next) => {
    const cleanPath = root.split(process.cwd())[1].replace(path.sep + 'src' + path.sep, '')
    const namespace = cleanPath.split(path.sep)[0]
    if (!namespace) {
      next()
      return
    }


    if (!namespaces[namespace])
      namespaces[namespace] = {
        namespace: {
          namespace,
          root,
        },
      }

    if (cleanPath.split(path.sep)[1]) {
      let bundleName = cleanPath.split(path.sep)[1]
      if (bundleName.toLowerCase().indexOf('bundle') === -1) {
        bundleName = cleanPath.split(path.sep)[1] + cleanPath.split(path.sep)[2]
        if (!cleanPath.split(path.sep)[2]) {
          next()
          return
        }
      }

      if (namespaces[namespace].hasOwnProperty('bundles') === false)
        namespaces[namespace].bundles = []

      util.array().pushUnique(namespaces[namespace].bundles, {
        bundle: bundleName,
        root,
      })
    }

    next()
  })

  namespaceWalker.on('end', dir => {
    cb(namespaces)
  })
}

// Clear cache function
exports.clearCache = (env, cb) => {
  exports.getVersion(version => {
    let clear = false

    if (version <= 2) {
      clear = path.join(process.cwd(), 'app', 'cache', env)
      if (env == 'all')
        clear = path.join(process.cwd(), 'app', 'cache')
    }

    if (version >= 3) {
      clear = path.join(process.cwd(), 'var', 'cache', env)
      if (env == 'all')
        clear = path.join(process.cwd(), 'var', 'cache')
    }

    if (!clear)
      throw new Error('No condition found for this env (clearCache)')

    util.emptyDir(clear, function() {
      util.console.success('Cache cleared for ' + env)
      cb()
    })
  })
}
