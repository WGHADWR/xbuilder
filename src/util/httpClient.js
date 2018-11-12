const fs = require('fs')
const http = require('http')
const https = require('https')

const Log = require('./log')

class HttpClient {

  static download(url, target, callback = () => void(0)) {
    return new Promise((resolve, reject) => {
      try {
        const stream = fs.createWriteStream(target)
        let protocal = url.substring(0, url.indexOf(':')).toLowerCase()
        let _http = protocal === 'https' ? https : http

        let contentLength = 0
        let len = 0
        _http.get(url, res => {
          contentLength = parseFloat(res.headers['content-length'])
          res.on('data', (chunk) => {
            stream.write(chunk)
            len += chunk.length
            let progress = (len / contentLength * 100).toFixed(2)
            
            callback(progress, len, contentLength)
          }).on('end', () => {
            stream.end()
            resolve(true)
          })
        })
      } catch (e) {
        reject(e)
      }
    })
  }

}

module.exports = HttpClient
