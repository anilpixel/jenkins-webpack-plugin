/**
 *
 * @author Rubick
 * @date 2017年7月31日 下午3:32
 */

const request = require('request')
const temp = require('temp')
const fs = require('fs')

const archiver = require('archiver')

class WebpackJenkins {
  constructor({ path, outdir, url, name, crumbfield, crumb }) {
    this.path = path
    this.outdir = outdir
    this.url = url
    this.name = name
    this.crumbfield = crumbfield
    this.crumb = crumb

    this.apply = this.apply.bind(this)
  }

  apply(compiler) {
    // compile done
    compiler.plugin('done', () => {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      })

      // clear temp file at exit
      temp.track()

      temp.open('build.zip', (err, info) => {
        if (!err) {
          const output = fs.createWriteStream(info.path, {
            fd: info.fd
          })

          archive.pipe(output)
          archive.directory(this.path, this.outdir)

          archive.finalize()

          output.on('close', () => {
            global.console.log(archive.pointer() + ' total bytes')
            postBuild(info.path, this.url, {
              name: this.name,
              crumbfield: this.crumbfield,
              crumb: this.crumb
            })
          })
        }
      })
    })
  }
}

// post build
function postBuild(path, url, { name, crumbfield, crumb }) {
  const formData = {
    file0: fs.createReadStream(path),
    json: `{"parameter": [{"name":"${name}", "file":"file0"}]}`
  }

  request.post({
    url,
    headers: {
      'Content-Type': 'multipart/form-data',
      [crumbfield]: crumb
    },
    formData
  }, (err, resp, body) => {
    if (err) {
      global.console.log(err)
    } else {
      global.console.log('URL: ' + body)
    }
  })
}

module.exports = WebpackJenkins
