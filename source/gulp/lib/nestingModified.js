const fs = require('fs')
const path = require('path')
  // gulp pipe流里的streamer插件
  // 主要原理参考了这里 https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/dealing-with-streams.md
  // nestingModified({
  //   filepath: file.base + file.relative,
  //   includeRegex: /require\(\[([^\]]+)\]\)/,
  //   extractRegex: /['"](.+?)(\.js)?['"]/g,
  //   suffix: '.js',
  //   data: file.contents,
  //   changedFiles: config.changedFiles.js
  //   },
  //   function(found) {
  //     if (found) {
  //         // make sure the file goes through the next gulp plugin
  //       _this.push(file);
  //     }
  //     // tell the stream engine that we are done with this file
  //     return callback();
  //   }
  // );
const nestingModified = function (options, fileCheckCallback) {

  if (options.data) {
    run();
  } else {
    fs.readFile(options.filepath, 'utf8',
    function(error, data) {
      options.data = data;
      run();
    });
  }

  function run() {
    const directoryPath = path.dirname(options.filepath);
    const regex = new RegExp(options.extractRegex);
    let match;

    if (options.includeRegex) {
      if ((match = new RegExp(options.includeRegex).exec(options.data)) !== null) {
        options.data = match[1];
      } else {
        return fileCheckCallback(false);
      }
    }

    function checkNext() {
      if ((match = regex.exec(options.data)) === null) {
        return fileCheckCallback(false); // all including files has been checked.
      }

      const includingFilePath = path.join(directoryPath, match[1] + options.suffix);
      fs.exists(includingFilePath,
        function(exists) {
          if (!exists) { // including file does not exists.
            return checkNext(); // skip to next
          }

          for (let i = 0; i < options.changedFiles.length; i++) {
            if (path.resolve(includingFilePath) == path.resolve(options.changedFiles[i])) { // including file has been modified, -> include it.
              return fileCheckCallback(true);
            }
          }
          nestingModified({
            filepath: includingFilePath,
            includeRegex: options.includeRegex,
            extractRegex: options.extractRegex,
            suffix: options.suffix,
            changedFiles: options.changedFiles
          },
          function(hasModified) {
            if (hasModified) {
              fileCheckCallback(true);
            } else {
              checkNext();
            }
          });
        });
    };

    checkNext();
  }
}

module.exports = (options, fileCheckCallback) => {
  nestingModified(options, fileCheckCallback);
}
