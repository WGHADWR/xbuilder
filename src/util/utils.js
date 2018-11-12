const fs = require('fs');

class StringUtils {

  static trimEnd(str, replace) {
    while (str.endsWith(replace)) {
      str = str.substring(0, str.length - replace.length)
    }
    return str
  }

}

class FileUtils {

  static readSync(path) {
    let buffer = fs.readFileSync(path)
    return buffer.toString('UTF-8')
  }

  static copyDir(src, dist, callback) {
    fs.access(dist, function (err) {
      if (err) {
        // 目录不存在时创建目录
        fs.mkdirSync(dist);
      }
      FileUtils._copy(null, src, dist, callback);
    });
  }

  static _copy(err, src, dist, callback) {
    if (err) {
      callback(err);
    } else {
      fs.readdir(src, function (err, paths) {
        if (err) {
          callback(err)
        } else {
          paths.forEach(function (path) {
            var _src = src + '/' + path;
            var _dist = dist + '/' + path;
            fs.stat(_src, function (err, stat) {
              if (err) {
                callback(err);
              } else {
                // 判断是文件还是目录
                if (stat.isFile()) {
                  fs.writeFileSync(_dist, fs.readFileSync(_src));
                } else if (stat.isDirectory()) {
                  // 当是目录是，递归复制
                  FileUtils.copyDir(_src, _dist, callback)
                }
              }
            })
          })
        }
      })
    }
  }

}

module.exports = { StringUtils, FileUtils }
