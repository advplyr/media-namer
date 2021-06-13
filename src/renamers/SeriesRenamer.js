const Path = require('path')
const fs = require('fs-extra')
const { createDirectory, copyFile } = require('../utils/fileHelpers')

class SeriesRenamer {
  constructor() { }

  getNewTitle(fileObj, title) {
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

    filename += '.' + ext

    return filename
  }

  getRenameArray(fileObj, options = {}) {
    var title = options.title

    if (fileObj.dir) {
      return fileObj.children.map((child) => {
        return {
          path: child.path,
          basename: Path.basename(child.path),
          newname: this.getNewTitle(child, title)
        }
      })
    } else {
      return [{
        path: fileObj.path,
        basename: Path.basename(fileObj.path),
        newname: this.getNewTitle(fileObj, title)
      }]
    }
  }

  async rename(fileObj, outputPath, seriesTitle, episodeTitle, season, episode) {
    var seasonDirname = `Season ${String(season).padStart(2, '0')}`
    var title = `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
    if (episodeTitle) title += ' - ' + episodeTitle

    var episodePath = Path.join(outputPath, 'Series', seriesTitle, seasonDirname, title)
    var successful = await createDirectory(outputPath, 'Series', seriesTitle, seasonDirname, title)
    if (!successful) {
      return false
    }

    var fileRenameArray = await this.getRenameArray(fileObj, { title })

    var filesFailed = []
    var filesSucceeded = []

    for (let i = 0; i < fileRenameArray.length; i++) {
      var fileToRename = fileRenameArray[i]
      var newFilePath = Path.join(episodePath, fileToRename.newname)


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
module.exports = new SeriesRenamer()