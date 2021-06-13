const MovieFinder = require('./MovieFinder')
const SeriesFinder = require('./SeriesFinder')
const BookFinder = require('./BookFinder')

class MediaFinder {
  constructor() { }

  async find(media_type, fileObj, identifier) {
    var mediaData = null
    if (media_type === 'books' || media_type === 'audiobooks') {
      mediaData = await BookFinder.find(fileObj, identifier)
    } else if (media_type === 'series') {
      mediaData = await SeriesFinder.find(fileObj, identifier)
    } else if (media_type === 'movies') {
      mediaData = await MovieFinder.find(fileObj, identifier)
    }
    if (!mediaData) {
      console.log(`Critical error: ${media_type}`)
      return {
        error: 'Critical error',
        media_type
      }
    }
    mediaData.media_type = media_type
    return mediaData
  }
}
module.exports = new MediaFinder()