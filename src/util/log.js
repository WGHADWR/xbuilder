const singleLog = require('single-line-log')
const clc = require('cli-color')

class Log {

  static write(message, end = false) {
    if (end) {
      // log.clear();

      this._endProcess()
      console.log(message);
    } else {
      singleLog.stdout(message + '\n');
    }
  }

  static slog(message, singleLine = false) {
    message = clc.blue.bold(message)
    singleLog.stdout(message)
    if (!singleLine) {
      console.log()
    }
  }

  static process(message) {
    let paddings = ['', '.', '..', '...']

    if (this.inter) {
      this._endProcess()
    }
    let i = 0

    let start = () => {
      if (i >= paddings.length) {
        i = 0
      }
      let _message = message + ' ' + paddings[i]
      _message = clc.blue.bold(_message)
      this.write(_message)
      i++
    }

    this.inter = setInterval(() => {
      start()
    }, 300)
  }

  static _endProcess() {
    clearInterval(this.inter)
  }

  static info(message) {
    message = clc.blue.bold(message)
    this.write(message, true)
  }

  static success(message) {
    message = clc.greenBright.bold(message)
    this.write(message, true)
  }

  static warn(message) {
    message = clc.yellow.bold(message)
    this.write(message, true)
  }

  static error(message) {
    message = clc.red.bold(message)
    this.write(message, true)
  }

  static debug(message) {
    message = clc.cyan(message)
    this.write(message, true)
  }

  static log(message) {
    console.log(message)
  }

}

module.exports = Log
