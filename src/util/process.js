const child_process = require('child_process')
const StringUtils = require('./utils').StringUtils

class ProcessExecutor {

  static spawn(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      let except = 0
      let proc = child_process.spawn(command, args);
      proc.stdout.on('data', (chunk) => {
        let str = chunk.toString()
        str = StringUtils.trimEnd(str, '\n')
        if (str.indexOf('npm WARN') !== -1) {
        } else if (str.indexOf('CordovaError') !== -1 || str.indexOf('npm ERR!') !== -1) {
          except = 1
        }
        console.log(str)
      });
      proc.stderr.on('data', (chunk) => {
        let str = chunk.toString()
        str = StringUtils.trimEnd(str, '\n')
        if (str.indexOf('npm WARN') !== -1) {
        } else if (str.indexOf('CordovaError') !== -1 || str.indexOf('npm ERR!') !== -1) {
          except = 1
        }
        console.log(str)
      });
      proc.on('error', (err) => {
        let { code, message, stack } = err
        console.log(`Error: code: ${code}, message: ${message}`)
        console.log(stack)
        except = 1
      });
      proc.on('exit', (code, signal) => {
        // console.log(`Exit: code: ${code}, signal: ${signal}\n`);
        resolve({code: except})
      });
    })
  }

}

module.exports = ProcessExecutor
