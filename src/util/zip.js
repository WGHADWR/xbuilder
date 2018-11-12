const zipper = require('zip-local')

class Zip {

  static unpack(file, path) {
    return new Promise((resolve, reject) => {
      zipper.unzip(file, function(error, unzipped) {
        try {
          if(!error) {
            unzipped.save(path, function() {
              resolve(true)
              return;
            })
          } else {
            throw error
          }
        } catch (err) {
          reject(err)
        }
      })
    })
  }

}

module.exports = Zip
