var inquirer = require('inquirer')
var colors = require('colors')
var path = require('path')
var fs = require('fs-extra')
var moment = require('moment')
require('shelljs/global')
var clear = require("cli-clear")
var jsonfile = require('jsonfile')
var util = require('util')

var php = "php"
var prependSymfony = "app/console"
var promptInterval
var ansiRegex = /[\u001b\u009b][[()#?]*(?:[0-9]{1,4}(?:[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
var waitTime = 6
var progressCount = 0
var grunt = true
var nextTime = 1500;
var canReset = false;
var jsonPath = path.join(process.cwd(),'symfony-helper.json');
jsonfile.spaces = 4;
var version = require('../package.json').version;
exports.workingDir = process.cwd();
exports.testing = false;

// Main function to start the app
function start(){
  loadData(function(){
    checkPhp();
  });
}
start();

// Load symfony helper json
function loadData(cb){
  jsonfile.readFile(jsonPath, function(err, obj) {
    if(err){
      if(err.code=="ENOENT"){
        var obj = {version: version}
        jsonfile.writeFile(jsonPath, obj, function (err) {
          if(err) throw new Error(err2);
          log("Created a symfony-helper.json file in project root","success");
          loadData(cb);
        })
        return;
      }
      throw new Error(err);
    }
    
    if(!obj) return;
    if(obj.php) php = obj.php;
    
    cb(obj);
  })
}

// Save symfony helper data to json
function saveData(key,val){
  jsonfile.readFile(jsonPath, function(err, obj) {
    if(err) throw new Error(err);
    obj[key] = val;
    jsonfile.writeFile(jsonPath, obj, function (err) {
      if(err) throw new Error(err);
    });
  });
}

// Check if php command works
function checkPhp(){
  const execFile = require('child_process').execFile;
  const child = execFile(php,["-v"], (err, stdout, stderr) => {
    if (err){
      log("The '" + php + " -v' command failed!","fail");
      inquirer.prompt([
        {
          type: 'input',
          name: 'php',
          message: 'What\'s your shell php command?'
        }]).then(function (answers) {
        php = answers.php;
        saveData("php",answers.php);
        checkPhp();
      });
      //throw new Error(err);
    }else{
      checkFiles();
    }
  });
}

// Some files check before we actually start the program
function checkFiles(){
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
}

// Main menu prompt
exports.prompt = function(){
  var choices = ['Cache', 'Assets', 'Composer', 'Doctrine', 'Exit']
  if(grunt) choices = ['Cache', 'Assets', 'Composer', 'Doctrine', 'Grunt', 'Exit']
  
  inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Symfony Helper ' + version,
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
  
  var composerLock = path.join(exports.workingDir,"composer.lock")
  if(existsSync(composerLock)) fs.unlink(composerLock)
  
  command("composer install","Composer install done.");
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
      command("doctrine:fixtures:load -n","All fixtures were successfully installed.",true);
    }
  })
}

// Prompt shown when user selects 'Grunt'
function gruntPrompt(){
  log("Executing Grunt")
  command("grunt","Done, without errors.");
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
      command("assets:install","All assets were successfully installed.",true);
    }
    if(answers.command == "Dump"){
      command("assetic:dump","All assets were successfully dumped.",true);
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
        pressAnyKey()
      })
    }
    
    if(answers.command == "Dev Cache"){
      emptyDir(devFolder, function(){
        log("Dev cache successfully cleared","success",diff.stop())
        pressAnyKey()
      })
    }
    
    if(answers.command == "Prod Cache"){
      emptyDir(prodFolder, function(){
        log("Prod cache successfully cleared","success",diff.stop())
        pressAnyKey()
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
  if(progressCount == 8) progressCount = 0
  progressArray = ["Waiting |o------|","Waiting |-o-----|","Waiting |--o----|","Waiting |---o---|","Waiting |----o--|","Waiting |-----o-|","Waiting |------o|","Waiting |------o|","Waiting |-----o-|","Waiting |----o--|","Waiting |---o---|","Waiting |--o----|","Waiting |-o-----|","Waiting |o------|"];
  log(progressArray[progressCount],"busy");
  progressCount++
}

// Executes a shell command
function command(cmd,msgDone,symfony){
  var diff = new diffMs()
  diff.start()
  if(symfony) cmd = prepCmd(cmd);
  
  var failed = false;
  var child = exec(cmd, {async:true,silent:true})
  child.stdout.on('data', function(data) {
    progress()
  })
  child.stderr.on('data', (data) => {
    log(data,"fail");
    failed = true;
  });
  child.on('exit', (code) => {
    if(!failed) log(msgDone,"success",diff.stop());
    if(failed) log("The command did not successfully finished, please inspect the error and try again.","fail");
    pressAnyKey();
  });
}

// Wait for user to press a key before continuing
function pressAnyKey(){
  console.log("");
  console.log("");
  console.log("Press any key to continue...");
  var canReset = true;
  var stdin = process.openStdin(); 
  process.stdin.setRawMode(true);    
  stdin.on('keypress', function (chunk, key) {
    if (key && key.ctrl && key.name == 'c') process.exit();
    if(canReset){ 
      reset();
      canReset = false;
    }
  });
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