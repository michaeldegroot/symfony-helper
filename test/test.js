var assert = require('assert');
var assert = require('assert-plus');
var myApp = require('.././lib/index.js');
var fs = require('fs');
var path = require('path');

myApp.workingDir = __dirname;
myApp.testing = true;

describe('Symfony >= 3.0.0', function() {
   it('Copy symfony3.json -> composer.json', function(done) {
    copyFile(path.join(__dirname,'symfony3.json'),path.join(__dirname,'composer.json'), function(err){
      if(err) throw new Error(err);
      done();
    });
   });
});

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}