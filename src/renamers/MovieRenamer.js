const Path = require('path')
const fs = require('fs-extra')
const mediascraper = require('../utils/mediascraper')
const { setFilePermissionAndOwner, createDirectory, copyFile } = require('../utils/fileHelpers')

class MovieRenamer {
  constructor() { }

  getNewTitle(fileObj, title, variant) {
    var { ext, filetype, basename } = fileObj

    var filename = title
    if (filetype === 'info') {
      filename += ` [Info]`
    } else if (filetype === 'sub') {
      if (basename.toLowerCase().includes('english')) {
        filename += ' [English]'
      } else {
        filename += ' [Subtitle]'
      }
    }

    if (variant) {
      filename += ` - [${variant}]`
    }
    filename += '.' + ext

    return filename
  }

  getRenameArray(fileObj, options = {}) {
    var variant = options.variant || null
    var title = options.title

    if (fileObj.dir) {
      return fileObj.children.map((child) => {
        return {
          path: child.path,
          basename: Path.basename(child.path),
          newname: this.getNewTitle(child, title, variant)
        }
      })
    } else {
      return [{
        path: fileObj.path,
        basename: Path.basename(fileObj.path),
        newname: this.getNewTitle(fileObj, title, variant)
      }]
    }
  }

  async renameExisting(newDirectoryPath, fileTitle, existingFileVariant) {
    var existingFiles = await mediascraper.scrapeExisting(newDirectoryPath)
    if (existingFiles.length) {
      console.log('Renaming existing files with variant', existingFiles)
      for (let i = 0; i < existingFiles.length; i++) {
        var existingFile = existingFiles[i]
        if (existingFile.dir) {
          console.error('File to rename is directory', existingFile.path, 'not renaming')
        } else {
          var newname = this.getNewTitle(existingFile, fileTitle, existingFileVariant)

          var newFilePath = Path.join(newDirectoryPath, newname)

          // Do not rename if file already with this name because it will overwrite existing file
          var alreadyExists = await fs.pathExists(newFilePath)
          if (alreadyExists) {
            console.error('File with this name already exists', newname, 'not renaming')
          } else {
            await fs.rename(existingFile.path, newFilePath).then(() => {
              console.log('Renamed file', newname)
              return setFilePermissionAndOwner(newFilePath)
            }).catch((error) => {
              console.error('Failed to rename', error)
            })
          }
        }
      }
    }
  }

  async rename(fileObj, outputPath, fileTitle, fileVariant, existingFileVariant) {
    var newDirectoryPath = Path.join(outputPath, 'Movies', fileTitle)
    var successful = await createDirectory(outputPath, 'Movies', fileTitle)
    if (!successful) {
      return false
    }

    if (existingFileVariant) {
      await this.renameExisting(newDirectoryPath, fileTitle, existingFileVariant)
    }


    var fileRenameArray = await this.getRenameArray(fileObj, { title: fileTitle, variant: fileVariant })
    var filesFailed = []
    var filesSucceeded = []

    for (let i = 0; i < fileRenameArray.length; i++) {
      var fileToRename = fileRenameArray[i]
      var newFilePath = Path.join(newDirectoryPath, fileToRename.newname)

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
module.exports = new MovieRenamer()