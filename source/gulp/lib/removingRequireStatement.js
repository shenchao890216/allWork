/**
 * gulp pipe流里的streamer插件
 * 主要原理参考了这里 https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/dealing-with-streams.md
 * 删除文件中多余的replace语句
 */

const through2  = require('through2')

module.exports = () => {
  return through2.obj(function(file, enc, callback){
    if (file.isStream()) {
      return callback('File should be buffer', file)
    }

    const contents = file.contents.toString('utf8')

    file.contents = new Buffer(contents.replace(/,?require\(\[[^\]]+?\]\)[,;]?/g, ''))
    // file.contents = new Buffer(contents.replace(,/require\(\[[^\]]+?\]\)/g, ''))
    // make sure the file goes through the next gulp plugin
    this.push(file)
    // tell the stream engine that we are done with this file
    return callback()
  })
}
