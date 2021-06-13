var omdb = require('../sources/omdb')
var ImdbFinder = require('./ImdbFinder')

class MovieFinder {
  constructor() { }

  async find(fileObj, identifier) {
    var parsed = fileObj.parsed
    var title = parsed.title
    var year = parsed.year

    if (identifier) {
      var media = await omdb.getImdbData(identifier)
      if (!media) {
        return {
          error: 'Not Found'
        }
      }
      return { media }
    }

    var mediaData = await ImdbFinder.lookForMedia('movie', title, year)
    if (mediaData.error) {
      if (title.includes(' - ')) {
        title = title.replace(' - ', ' ')
        console.log('Second attempt', title)
        mediaData = await ImdbFinder.lookForMedia('movie', title, year)
      }
    }

    return mediaData
  }
}
module.exports = new MovieFinder()