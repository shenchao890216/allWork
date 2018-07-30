const path = require('path')
const fs = require('fs')
const through2 = require('through2')
const fancyLog = require('fancy-log')
const ansiColors = require('ansi-colors')
let changedFile = ''

function nestingModified (option, callback) {
  if (option.data) {
    run(option, callback)
  } else {
    fs.readFile(option.filePath, 'utf-8', function (error, data) {
      option.data = data

      run(option, callback)
    })
  }
}

function run (option, callback) {
  let match = null

  if (option.includeRegex) {
    match = new RegExp(option.includeRegex).exec(option.data)

    if (match !== null) {
      option.data = match[1];
    } else {
      return callback(false);
    }
  }

  checkNext(option, callback)
}

function checkNext(option, callback) {
  const regex = new RegExp(option.extractRegex)
  const directoryPath = path.dirname(option.filePath)
  let match = regex.exec(option.data)
  let includingFilePath = ''
  let matchArr = []
  
  while (match !== null) {
    matchArr.push(match)
    match = regex.exec(option.data)
  }

  if (matchArr.length === 0) {
    return callback(false)
  }

  matchArr.forEach(function (matchVal) {
    let tmpPath = path.join(directoryPath, matchVal[1] + option.suffix)

    if (path.resolve(tmpPath) === path.resolve(changedFile)) {
      includingFilePath = path.join(directoryPath, matchVal[1] + option.suffix)
    }
  })

  if (includingFilePath === '') {
    return callback(false)
  }

  fs.exists(includingFilePath, function (exists) {
    if (exists) {
      if (option.filePath.search(/\/_/) !== -1) {
        fancyLog(ansiColors.red('请保存 ' + option.filePath))
        return callback(false)
      } else {
        return callback(true)
      }
    }
  })
}

module.exports = function (isWatching, requireFile) {
  changedFile = requireFile

  return through2.obj(function (file, enc, callback) {
    const filePath = file.base + file.relative
    const _this = this

    if (!isWatching && filePath.search(/\/_/) === -1) {
      this.push(file)

      return callback()
    }

    if (isWatching) {
      nestingModified({
        filePath: filePath,
        includeRegex: /require\(\[([^\]]+)\]\)/,
        extractRegex: /['"](.+?)(\.js)?['"]/g,
        suffix: '.js',
        data: file.contents,
      }, function (found) {
        if (found) {
          _this.push(file)
        }

        return callback()
      })
    }

  })
}