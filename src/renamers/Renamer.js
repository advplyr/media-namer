var SeriesRenamer = require('./SeriesRenamer')
var MovieRenamer = require('./MovieRenamer')
var BookRenamer = require('./BookRenamer')

class Renamer {
  constructor() {
    this.OutputPath = null
    this.filesProcessing = []
  }

  async rename(req, media) {
    var media_type = req.body.media_type
    var file_id = req.body.file_id

    const sendError = (msg) => {
      this.filesProcessing = this.filesProcessing.filter(fid => fid !== file_id)
      return {
        file_id,
        media_type,
        error: msg
      }
    }

    if (this.filesProcessing.includes(file_id)) {
      return sendError(`File ${file_id} already processing`)
    }

    var fileObj = media[media_type] ? media[media_type].files.find(f => f.id === file_id) : null
    if (!fileObj) {
      return sendError(`File not found in media type ${media_type}`)
    }

    this.filesProcessing.push(file_id)

    var title = req.body.title
    var renameResult = null

    if (media_type === 'movies' || media_type === 'documentaries') {
      var fileVariant = req.body.variant
      var existingFileVariant = req.body.existingvariant
      if (!fileVariant.length || !fileVariant.trim().length) fileVariant = false
      if (!existingFileVariant.length || !existingFileVariant.trim().length) existingFileVariant = false

      renameResult = await MovieRenamer.rename(fileObj, this.OutputPath, media_type, title, fileVariant, existingFileVariant)
    } else if (media_type === 'series') {
      var episode_title = req.body.episode_title
      var season = req.body.season
      var episode = req.body.episode
      if (!season || isNaN(season)) {
        return sendError('Invalid Season')
      }
      if (!episode || isNaN(episode)) {
        return sendError('Invalid Episode')
      }
      season = Number(season)
      episode = Number(episode)

      renameResult = await SeriesRenamer.rename(fileObj, this.OutputPath, title, episode_title, season, episode)
    } else if (media_type === 'books' || media_type === 'audiobooks') {
      var authors = req.body.authors
      if (!authors || typeof authors !== 'string') {
        return sendError('Invalid Authors input', req.body)
      }
      renameResult = await BookRenamer.rename(fileObj, this.OutputPath, media_type, title, authors)
    } else {
      return sendError('Invalid mediatype')
    }

    if (!renameResult) {
      return sendError('Failed to rename')
    }
    var { filesSucceeded, filesFailed } = renameResult
    console.log('[SUCCEEDED]\n', filesSucceeded.map((f) => `${f.path} => ${f.newname}`).join('\n'))
    if (filesFailed.length) {
      console.log('[FAILED]\n', filesFailed.map((f) => `${f.file.path} => ${f.file.newname} - ${f.reason}`).join('\n'))
    }

    this.filesProcessing = this.filesProcessing.filter(fid => fid !== file_id)

    return {
      success: true,
      file_id,
      media_type,
      filesSucceeded,
      filesFailed
    }
  }
}
module.exports = new Renamer()
