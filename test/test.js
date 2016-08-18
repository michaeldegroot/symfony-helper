'use strict'

var assert = require('assert')
var assert = require('assert-plus')
var fs = require('fs')
var path = require('path')

describe('Symfony >= 3.0.0', function() {
  it('Copy symfony3.json -> composer.json', function(done) {
    var myApp = require('.././lib/index.js')
    myApp.workingDir = __dirname
    copyFile(path.join(__dirname, 'symfony3.json'), path.join(__dirname, 'composer.json'), function(err) {
      if (err)
        throw new Error(err)
      done()
    })
  })

  it('Start program', function(done) {
    var myApp = require('.././lib/index.js')
    myApp.workingDir = __dirname
    this.timeout(20000)
    myApp.main()
    setTimeout(function() {
      done()
    }, 10000)
  })
})

function copyFile(source, target, cb) {
  var cbCalled = false

  var rd = fs.createReadStream(source)
  rd.on('error', function(err) {
    done(err)
  })

  var wr = fs.createWriteStream(target)
  wr.on('error', function(err) {
    done(err)
  })

  wr.on('close', function(ex) {
    done()
  })

  rd.pipe(wr)

  function done(err) {
    if (!cbCalled) {
      cb(err)
      cbCalled = true
    }
  }
}
