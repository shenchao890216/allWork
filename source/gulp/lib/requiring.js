const thr = require('through2')
const path = require('path')
const nestingModified = require('./nestingModified')

// gulp pipe流里的streamer插件
// 主要原理参考了这里 https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/dealing-with-streams.md

// 找到所有直接或间接require了新保存文件的js文件

module.exports = (config) => {

  const stream = thr.obj(function(file, enc, callback){

    if (file.isStream()) {
      return callback('File should be buffer', file);
    }

    // 如果changedFiles.js为空，则表示正在进行批量重编译
    // 此时所有非下划线开头的文件或目录都要通过管道进入下一个gulp插件
    // if (config.changedFiles.js.length == 0
    //   && (file.base + file.relative).search(/\/_/) == -1) {
    //   // make sure the file goes through the next gulp plugin
    //   this.push(file);
    //   // tell the stream engine that we are done with this file
    //   return callback();
    // }

    // 如果新保存文件就是当前排查文件，且不以下划线开头（目录也不以下划线开头）
    // 则直接通过管道进入下一个gulp插件
    // for (let i = 0; i < config.changedFiles.js.length; i++) {
    //   if (config.changedFiles.js[i].search(/\/_/) == -1
    //     && path.resolve(file.base + file.relative) == path.resolve(config.changedFiles.js[i])) {
    //     // make sure the file goes through the next gulp plugin
    //     this.push(file);
    //     // tell the stream engine that we are done with this file
    //     return callback();
    //   }
    // }

    // 检查当前排查的文件是否直接或间接引用了新保存的文件
    const _this = this;
    nestingModified({
      filepath: file.base + file.relative,
      includeRegex: /require\(\[([^\]]+)\]\)/,
      extractRegex: /['"](.+?)(\.js)?['"]/g,
      suffix: '.js',
      data: file.contents,
      changedFiles: config.changedFiles.js
      },
      function(found) {
        if (found) {
            // make sure the file goes through the next gulp plugin
          _this.push(file);
        }
        // tell the stream engine that we are done with this file
        return callback();
      }
    );
  });
  return stream;
}
