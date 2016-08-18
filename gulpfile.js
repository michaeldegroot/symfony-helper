'use strict'

const gulp     = require('gulp')
const watch    = require('gulp-watch')
const path     = require('path')
const readline = require('readline')
const fs       = require('fs')
const leftpad  = require('left-pad')

let npmRoot
const exec = require('child_process').exec
const child = exec('npm root -g', function(error, stdout, stderr) {
  npmRoot = path.join(stdout.replace('\n', ''), 'symfony-helper')
  console.log('Init copy to ' + npmRoot)
  reinstall(() => {
    console.log('done... file watcher is now active!')
    files.push(path.join(process.cwd(), '**/*'))
    files.push('!node_modules')
    files.push('!node_modules/**')
    watch(files, {debounceDelay: 200}, ((event) => {
      hotreload(() => {
        console.log(event.path.split(process.cwd())[1].replace(path.sep, '') + ' reloaded')
      }, event.path)
    }))
    console.log('Have fun developing :)')
  })
})

gulp.task('default', cb => {
  console.log('Please wait...')
})

let files = []
readline.createInterface({
  input: fs.createReadStream('.gitignore'),
  terminal: false,
}).on('line', function(line) {
  files.push('!' + line)
})

const reinstall = cb => {
  gulp.src([process.cwd() + '/**/*'])
  .pipe(gulp.dest(npmRoot))
  .on('end', cb)
}

const hotreload = (cb, hotreload) => {
  const fullPath = path.join(npmRoot, hotreload.split(process.cwd())[1].replace(path.sep, ''))
  const dest     = fullPath.replace(path.win32.basename(fullPath), '')
  const source   = hotreload.split(process.cwd())[1].replace(path.sep, '')

  gulp.src(source)
  .pipe(gulp.dest(dest))
  .on('end', cb)
}
