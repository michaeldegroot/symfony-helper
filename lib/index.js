var inquirer = require('inquirer')
var colors = require('colors')
var path = require('path')
var fs = require('fs-extra')
var moment = require('moment')
require('shelljs/global')
var clear = require("cli-clear")

var php = "php"
var prependSymfony = "app/console"
var promptInterval
var ansiRegex = /[\u001b\u009b][[()#?]*(?:[0-9]{1,4}(?:[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
var waitTime = 6
var progressCount = 0
var grunt = true
var nextTime = 2500;
exports.workingDir = process.cwd();
exports.testing = false;

// Some files check before we actually start the program
fs.access(path.join(exports.workingDir,"Gruntfile.js"), fs.F_OK, function(err) {
  if (err) grunt = false

  fs.access(path.join(exports.workingDir,"composer.json"), fs.F_OK, function(err) {
    if (err) return(log("You are not executing the symfony command in a symfony root folder or there is no composer.json file","fail"))
    symfonyVersion = require(path.join(exports.workingDir,"composer.json")).require['symfony/symfony'][0]
    if(symfonyVersion >= 3) prependSymfony = "bin/console"
    if(exports.testing) return;
    clear()
    exports.prompt()
  })
})

// Main menu prompt
exports.prompt = function(){
  var choices = ['Cache', 'Assets', 'Composer', 'Doctrine', 'Exit']
  if(grunt) choices = ['Cache', 'Assets', 'Composer', 'Doctrine', 'Grunt', 'Exit']
  
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Symfony Helper ' + require('../package.json').version,
      choices: choices,
      when: function (answers) {
        return answers.comments !==  'Nope, all good!'
      }
    }
  ]).then(function (answers) {
    clear()
    if(answers.command == "Exit") {
      log("Goodbye!","success")
      setTimeout(function(){process.exit(1)},1000)
    }
    if(answers.command == "Cache") clearCachePrompt()
    if(answers.command == "Assets") installAssetsPrompt()
    if(answers.command == "Composer") composerPrompt()
    if(answers.command == "Doctrine") doctrinePrompt()
    if(answers.command == "Grunt") gruntPrompt()
  })
}

// Prompt shown when user selects 'Composer'
function composerPrompt(){
  log("Executing 'composer install'")
  var diff = new diffMs();diff.start()
  
  var composerLock = path.join(exports.workingDir,"composer.lock")
  if(existsSync(composerLock)) fs.unlink(composerLock)
  
  var child = exec("composer install", {async:true,silent:true})
  child.stdout.on('data', function(data) {
    progress()
    data = data.replace(ansiRegex,"")
    if(data.indexOf("successfully installed") > -1){
      log("Composer install done.","success",diff.stop())
      setTimeout(reset,nextTime)
    }
  })
}

// Prompt shown when user selects 'Doctrine'
function doctrinePrompt(){
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What do would you like Doctrine to do?',
      choices: ['Load Fixtures', 'Back'],
      when: function (answers) {
        return answers.comments !==  'Nope, all good!'
      }
    }
  ]).then(function (answers) {
    if(answers.command == "Back") reset()
    if(answers.command == "Load Fixtures"){
      var diff = new diffMs();diff.start()
      symfony("doctrine:fixtures:load -n",function(){
        log("All fixtures were successfully installed.","success",diff.stop())
        setTimeout(reset,nextTime)
      })
    }
  })
}

// Prompt shown when user selects 'Grunt'
function gruntPrompt(){
  log("Executing Grunt")
  var diff = new diffMs();diff.start()
  var child = exec("grunt", {async:true,silent:true})
  child.stdout.on('data', function(data) {
    progress()
    data = data.replace(ansiRegex,"")
    if(data.indexOf("Done, without errors.") > -1){
      log("Done, without errors.","success",diff.stop())
      setTimeout(reset,nextTime)
    }
  })
}

// Prompt shown when user selects 'Assets'
function installAssetsPrompt(){
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What do you want to do with your Assets?',
      choices: ['Install', 'Dump', 'Back'],
      when: function (answers) {
        return answers.comments !==  'Nope, all good!'
      }
    }
  ]).then(function (answers) {
    var diff = new diffMs();diff.start()
    var cacheFolder = path.join(exports.workingDir,"app","cache")
    var prodFolder = path.join(cacheFolder,"prod")
    var devFolder = path.join(cacheFolder,"dev")
    
    if(answers.command == "Back"){
      reset()
    }
    
    if(answers.command == "Install"){
      symfony("assets:install",function(){
        log("All assets were successfully installed.","success",diff.stop())
        setTimeout(reset,nextTime)
      })
    }
    if(answers.command == "Dump"){
      symfony("assetic:dump",function(){
        log("All assets were successfully dumped.","success",diff.stop())
        setTimeout(reset,nextTime)
      })
    }
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
      when: function (answers) {
        return answers.comments !==  'Nope, all good!'
      }
    }
  ]).then(function (answers) {
    var diff = new diffMs();diff.start()
    var cacheFolder = path.join(exports.workingDir,"app","cache")
    var prodFolder = path.join(cacheFolder,"prod")
    var devFolder = path.join(cacheFolder,"dev")
    
    if(answers.command == "Back"){
      reset()
    }
    
    if(answers.command == "All Cache"){
      emptyDir(cacheFolder, function(){
        log("All cache successfully cleared","success",diff.stop())
        setTimeout(reset,nextTime)
      })
    }
    
    if(answers.command == "Dev Cache"){
      emptyDir(devFolder, function(){
        log("Dev cache successfully cleared","success",diff.stop())
        setTimeout(reset,nextTime)
      })
    }
    
    if(answers.command == "Prod Cache"){
      emptyDir(prodFolder, function(){
        log("Prod cache successfully cleared","success",diff.stop())
        setTimeout(reset,nextTime)
      })
    }
  })
}

// Resets the program and returns to main menu
function reset(){
  clearInterval(promptInterval)
  clear()
  exports.prompt()
}

// Check if a file exists (sync)
function existsSync(filePath){
  try{
    fs.statSync(filePath)
  }catch(err){
    if(err.code  ==  'ENOENT') return false
  }
  return true
}

// Calculate the difference between 2 moment objects
function diffMs(func){
    this.start = function(){
      this.startTime = moment()
    }
    this.stop = function (){
      this.endTime = moment()
      return moment.duration(this.endTime.diff(this.startTime)).asMilliseconds()
    }
}

// Everytime data has changed this will be called. After a amount of flags the function assumes that the child proc is finished.
function dataChanged(){
  this.start = 0
  this.lastVal = 0
  this.flags = 0
  this.changed = function(){
    this.start++
  }
  this.onResponsive = function(cb){
    this.interval = setInterval(function(that){
      progress()
      if(that.lastVal==that.start) that.flags++
      if(that.flags>=waitTime){
        clearInterval(that.interval)
        cb()
      }
      that.lastVal = that.start
    },500,this)
  }
}

// Show a little loading message
function progress(){
  clear();
  if(progressCount == 3) progressCount = 0
  if(progressCount == 0) log("Waiting.","busy")
  if(progressCount == 1) log("Waiting..","busy")
  if(progressCount == 2) log("Waiting...","busy")
  progressCount++
}

// Executes a symfony command
function symfony(cmd,cb){
  var child = exec(prepCmd(cmd), {async:true,silent:true})
  var dataWatch = new dataChanged()
  child.stdout.on('data', function(data) {
    progress()
    dataWatch.changed()
  })
  dataWatch.onResponsive(function(){
    cb()
  })
}

// Checks if a directory is empty
function emptyDir(folder,cb){
  fs.emptyDir(folder, function (err) {
    if(err){
      log(err,"fail")
      exports.prompt()
    }else{
      cb()
    }
  })
}

// How messages are displayed to the user
function log(msg,type,time){
  if(exports.testing) return;
  if(time) msg = msg + " - " + time + "ms"
  if(!type) return(console.log(msg))
  if(type  ==  "success") return(console.log('[OK] '.green + msg))
  if(type  ==  "fail") return(console.log('[FAIL] '.red + msg))
  if(type  ==  "busy") return(console.log('[BUSY] '.yellow + msg))
}

// Prepare a command (concat some variables)
function prepCmd(tmp){
  var cmd = php + " " + prependSymfony + " " + tmp
  return cmd
}