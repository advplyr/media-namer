var omdb = require('../sources/omdb')
var ImdbFinder = require('./ImdbFinder')

class MovieFinder {
  constructor() { }

  async find(fileObj, identifier) {
    var parsed = fileObj.parsed
    var title = parsed.title
    var year = parsed.year
    var season = parsed.season
    var episode = parsed.episode

    console.log(identifier, 'SeriesFinder parsed', parsed)

    if (identifier) {
      var media = await omdb.getImdbData(identifier)
      if (!media) {
        return {
          error: 'Not Found'
        }
      }

      var episodeData = await omdb.getEpisodeInfo(identifier, season, episode)
      if (!episodeData) {
        console.error('Episode not found', identifier, season, episode)
        return {
          error: 'Episode not found'
        }
      }
      media.episode_title = episodeData.title
      media.episode_poster = episodeData.image
      media.episode_year = episodeData.year

      return { media }
    } else if (!title) {
      return {
        error: 'Series not found'
      }
    }

    var mediaData = await ImdbFinder.lookForMedia('series', title, year)
    if (mediaData.error) {
      if (title.includes(' - ')) {
        title = title.replace(' - ', ' ')
        console.log('Second attempt', title)
        mediaData = await ImdbFinder.lookForMedia('series', title, year)
      }
    }

    if (!mediaData.error) {
      var episodeData = await omdb.getEpisodeInfo(mediaData.media.id, season, episode)
      if (!episodeData) {
        console.error('Episode not found')
        mediaData.media.episode_title = `Episode ${episode}`
        mediaData.media.episode_poster = mediaData.media.image
        mediaData.media.episode_year = mediaData.media.year
        mediaData.media.year = mediaData.media.year
      } else {
        mediaData.media.episode_title = episodeData.title
        mediaData.media.episode_poster = episodeData.image
        mediaData.media.episode_year = episodeData.year
        mediaData.media.year = mediaData.media.year
      }
    }

    return mediaData
  }
}
module.exports = new MovieFinder()