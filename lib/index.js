'use strict'

var inquirer = require('inquirer')
var colors   = require('colors')
var path     = require('path')
var fs       = require('fs-extra')
var moment   = require('moment')
var jsonfile = require('jsonfile')
var util     = require('util')
require('shelljs/global')

var php            = 'php'
var prependSymfony = 'app/console'
var promptInterval
var ansiRegex      = /[\u001b\u009b][[()#?]*(?:[0-9]{1,4}(?:[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
var waitTime       = 6
var progressCount  = 0
var grunt          = true
var nextTime       = 1500
var canReset       = false
var jsonPath       = path.join(process.cwd(), 'symfony-helper.json')
jsonfile.spaces    = 4
var version        = require('../package.json').version
exports.workingDir = process.cwd()
exports.testing    = typeof global.it === 'function'

// Main function to get the app running
exports.main = function() {
  loadData(checkPhp)
}

// First running function of the program
function start() {
  exports.main()
}

if (!exports.testing)
  start()

// Load symfony helper json
function loadData(cb) {
  jsonfile.readFile(jsonPath, function(err, obj) {
    if (err) {
      if (err.code == 'ENOENT') {
        var obj = {version: version}

        jsonfile.writeFile(jsonPath, obj, function(err) {
          if (err) {
            if (err.code == 'EPERM') {
              log('No permission to place symfony-helper.json in ' + path.dirname(jsonPath), 'fail')
              return false
            }

            throw new Error(err)
          }

          log('Created a symfony-helper.json file in project root', 'success')
          loadData(cb)
        })

        return false
      }

      throw new Error(err)
    }

    if (!obj)
      return

    if (obj.php)
      php = obj.php

    cb(obj)
  })
}

// Save symfony helper data to json
function saveData(key, val) {
  jsonfile.readFile(jsonPath, function(err, obj) {
    if (err)
      throw new Error(err)
    obj[key] = val
    jsonfile.writeFile(jsonPath, obj, function(err) {
      if (err)
        throw new Error(err)
    })
  })
}

// Check if php command works
function checkPhp() {
  const execFile = require('child_process').execFile
  const child = execFile(php, ['-v'], function(err, stdout, stderr) {
    if (err) {
      log('The "' + php + ' -v" command failed!', 'fail')
      inquirer.prompt([
        {
          type: 'input',
          name: 'php',
          message: 'What\'s your shell php command?',
        },
      ]).then(function(answers) {
        php = answers.php
        saveData('php', answers.php)
        checkPhp()
      })

      throw new Error(err)
    } else {
      checkFiles()
    }
  })
}

// Some files check before we actually start the program
function checkFiles() {
  fs.access(path.join(exports.workingDir, 'Gruntfile.js'), fs.F_OK, function(err) {
    if (err)
      grunt = false

    fs.access(path.join(exports.workingDir, 'composer.json'), fs.F_OK, function(err) {
      fs.access(path.join(exports.workingDir, 'deps'), fs.F_OK, function(err2) {
        if (err && err2)
          return (log('You are not executing the symfony command in a symfony root folder or there is no composer.json or deps file', 'fail'))

        if (err) {
          symfonyVersion = 2
          clear()
          exports.prompt()
          return
        }

        symfonyVersion = parseInt(require(path.join(exports.workingDir, 'composer.json')).require['symfony/symfony'][0])
        if (symfonyVersion >= 3)
          prependSymfony = 'bin/console'
        clear()
        exports.prompt()
      })
    })
  })
}

// Main menu prompt
exports.prompt = function() {
  var choices = ['Cache', 'Assets', 'Composer', 'Doctrine', 'Exit']
  if (grunt)
    choices = ['Cache', 'Assets', 'Composer', 'Doctrine', 'Grunt', 'Exit']

  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Symfony Helper ' + version,
      choices: choices,
      when: function(answers) {
        return answers.comments !==  'Nope, all good!'
      },
    },
  ]).then(function(answers) {
    mainPrompt(answers)
  })

  if (exports.testing) {
    setTimeout(clearCachePrompt, 500)
    setTimeout(installAssetsPrompt, 2500)
    setTimeout(composerPrompt, 4500)
    setTimeout(doctrinePrompt, 6500)
    setTimeout(gruntPrompt, 8500)
  }
}

function mainPrompt(answers) {
  clear()
  if (answers.command == 'Exit') {
    log('Goodbye!', 'success')
    setTimeout(function() {process.exit(1)}, 1000)
  }

  if (answers.command == 'Cache')
    clearCachePrompt()
  if (answers.command == 'Assets')
    installAssetsPrompt()
  if (answers.command == 'Composer')
    composerPrompt()
  if (answers.command == 'Doctrine')
    doctrinePrompt()
  if (answers.command == 'Grunt')
    gruntPrompt()
}

// Prompt shown when user selects 'Composer'
function composerPrompt() {
  var composerLock = path.join(exports.workingDir, 'composer.lock')
  if (existsSync(composerLock))
    fs.unlink(composerLock)

  command('composer install', 'Composer install done.')
}

// Prompt shown when user selects 'Doctrine'
function doctrinePrompt() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What do would you like Doctrine to do?',
      choices: ['Create Database', 'Load Fixtures', 'Back'],
      when: function(answers) {
        return answers.comments !==  'Nope, all good!'
      },
    },
  ]).then(function(answers) {
    if (answers.command == 'Back')
      reset()
    if (answers.command == 'Load Fixtures')
      command('doctrine:fixtures:load -n', 'All fixtures were successfully installed.', true)
    if (answers.command == 'Create Database')
      command('doctrine:database:create -n', 'Database successfully created.', true)
  })
}

// Prompt shown when user selects 'Grunt'
function gruntPrompt() {
  command('grunt', 'Done,  without errors.')
}

// Prompt shown when user selects 'Assets'
function installAssetsPrompt() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What do you want to do with your Assets?',
      choices: ['Install', 'Dump', 'Back'],
      when: function(answers) {
        return answers.comments !==  'Nope, all good!'
      },
    },
  ]).then(function(answers) {
    if (answers.command == 'Back')
      reset()
    if (answers.command == 'Install')
      command('assets:install', 'All assets were successfully installed.', true)
    if (answers.command == 'Dump')
      command('assetic:dump', 'All assets were successfully dumped.', true)
  })
}

// Prompt shown when user selects 'Cache'
function clearCachePrompt() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What cache do you want to clear?',
      choices: ['All Cache', 'Dev Cache', 'Prod Cache', 'Back'],
      when: function(answers) {
        return answers.comments !==  'Nope, all good!'
      },
    },
  ]).then(function(answers) {
    if (answers.command == 'Back')
      reset()
    if (answers.command == 'All Cache')
      clearCache('all')
    if (answers.command == 'Dev Cache')
      clearCache('dev')
    if (answers.command == 'Prod Cache')
      clearCache('prod')
  })
}


// Clear cache function
function clearCache(env) {
  var diff = new diffMs()
  diff.start()

  if (symfonyVersion <= 2) {
    if (env == 'all')
      var clear = path.join(exports.workingDir, 'app', 'cache')
    if (env == 'prod')
      var clear = path.join(exports.workingDir, 'app', 'cache', 'prod')
    if (env == 'dev')
      var clear = path.join(exports.workingDir, 'app', 'cache', 'dev')
  }

  if (symfonyVersion >= 3) {
    if (env == 'all')
      var clear = path.join(exports.workingDir, 'var', 'cache')
    if (env == 'prod')
      var clear = path.join(exports.workingDir, 'var', 'cache', 'prod')
    if (env == 'dev')
      var clear = path.join(exports.workingDir, 'var', 'cache', 'dev')
  }

  emptyDir(clear, function() {
    log(env + ' cache successfully cleared', 'success', diff.stop())
    pressAnyKey()
  })
}

// Resets the program and returns to main menu
function reset() {
  clearInterval(promptInterval)
  clear()
  exports.prompt()
}

// Check if a file exists (sync)
function existsSync(filePath) {
  try {
    fs.statSync(filePath)
  } catch (err) {
    if (err.code  ==  'ENOENT')
      return false
  }

  return true
}

// Calculate the difference between 2 moment objects
function diffMs(func) {
  this.start = function() {
    this.startTime = moment()
  }

  this.stop = function() {
    this.endTime = moment()
    return moment.duration(this.endTime.diff(this.startTime)).asMilliseconds()
  }
}

// Show a little loading message
function progress() {
  this.interval
  this.stopped = false
  this.progressCount = 0
  this.progressArray = ['|', '/', '-', '\\', '|', '/', '-', '\\']

  this.start = function() {
    this.interval = setInterval(function(that) {
      if (that.stopped)
        return
      clear()
      if (that.progressCount >= that.progressArray.length)
        that.progressCount = 0
      log(that.progressArray[that.progressCount], 'busy')
      that.progressCount++
    }, 35, this)
  }

  this.stop = function() {
    stopped = true
    clearInterval(this.interval)
  }
}

// Executes a shell command
function command(cmd, msgDone, symfony) {
  var diff = new diffMs()
  diff.start()
  if (symfony)
    cmd = prepCmd(cmd)

  var dataArray = []
  var failed = false
  var child = exec(cmd, {async: true, silent: true})
  var prog = new progress()
  prog.start()
  child.stdout.on('data', function(data) {
    dataArray.push(data)
    if (data.toLowerCase().indexOf('exception') > -1) {
      prog.stop()
      log(data, 'fail')
      failed = true
    }
  })

  child.stderr.on('data', function(data) {
    dataArray.push(data)
    prog.stop()
    log(data, 'fail')
    failed = true
  })

  child.on('exit', function(code) {
    prog.stop()
    if (!failed) {
      clear()
      log(msgDone, 'success', diff.stop())
    }

    if (failed)
      log('The command did not successfully finished, please inspect the error and try again.', 'fail')
    pressAnyKey()
  })
}

// Wait for user to press a key before continuing
function pressAnyKey() {
  if (!process.stdin.setRawMode || exports.testing) {
    canReset = false
    reset()
    return
  }

  console.log('')
  console.log('')
  console.log('Press any key to continue...')
  var canReset = true
  var stdin = process.openStdin()
  process.stdin.setRawMode(true)
  stdin.on('keypress', function(chunk, key) {
    if (key && key.ctrl && key.name == 'c')
      process.exit()
    if (canReset) {
      stdin.removeAllListeners('keypress')
      reset()
      canReset = false
    }
  })
}

// Checks if a directory is empty
function emptyDir(folder, cb) {
  fs.emptyDir(folder, function(err) {
    if (err) {
      log(err, 'fail')
      exports.prompt()
    } else {
      cb()
    }
  })
}

// How messages are displayed to the user
function log(msg, type, time) {
  if (time)
    msg = msg + ' - ' + time + 'ms'
  if (!type)
    return (console.log(msg))
  if (type == 'success')
    return (console.log('[OK] '.green + msg))
  if (type == 'fail')
    return (console.log('[FAIL] '.red + msg))
  if (type == 'busy')
    return (console.log('[BUSY] '.yellow + msg))
}

// Prepare a command (concat some variables)
function prepCmd(tmp) {
  var cmd = php + ' ' + prependSymfony + ' ' + tmp
  return cmd
}

// Clear screen function
var windows = process.platform.indexOf('win') === 0
function clear() {
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
