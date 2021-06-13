const Path = require('path')
const fs = require('fs-extra')
const { createDirectory, copyFile } = require('../utils/fileHelpers')

class BookRenamer {
  constructor() { }

  getNewTitle(fileObj) {
    var { ext, basename, filetype } = fileObj

    if (filetype === 'image') {
      return 'Cover.' + ext
    } else {
      return basename
    }
  }

  getRenameArray(fileObj) {
    if (fileObj.dir) {
      return fileObj.children.map((child) => {
        return {
          path: child.path,
          basename: Path.basename(child.path),
          newname: this.getNewTitle(child)
        }
      })
    } else {
      return [{
        path: fileObj.path,
        basename: Path.basename(fileObj.path),
        newname: this.getNewTitle(fileObj)
      }]
    }
  }

  async rename(fileObj, outputPath, mediatype, title, authors) {
    var mediatype_title = mediatype.substr(0, 1).toUpperCase() + mediatype.substr(1)

    console.log('BookRenamer', outputPath, mediatype, title, authors)
    var path = Path.join(outputPath, mediatype_title, authors, title)
    console.log('Directory', path)
    var successful = await createDirectory(outputPath, mediatype_title, authors, title)
    if (!successful) {
      return false
    }

    var fileRenameArray = await this.getRenameArray(fileObj)
    var filesFailed = []
    var filesSucceeded = []

    for (let i = 0; i < fileRenameArray.length; i++) {
      var fileToRename = fileRenameArray[i]
      var newFilePath = Path.join(path, fileToRename.newname)

      var alreadyExists = await fs.pathExists(newFilePath)
      if (alreadyExists) {
        console.log(`File with name ${fileToRename.newname} already exists. Skipping..`)
        filesFailed.push({
          reason: `File with name ${fileToRename.newname} already exists.`,
          file: fileToRename
        })
      } else {
        var copySuccess = await copyFile(fileToRename.path, newFilePath, false)
        if (copySuccess) {
          filesSucceeded.push(fileToRename)
        } else {
          filesFailed.push({
            reason: 'Failed to copy',
            file: fileToRename
          })
        }
      }
    }

    return {
      filesFailed,
      filesSucceeded
    }
  }
}
module.exports = new BookRenamer()