var omdb = require('../sources/omdb')
var { levenshteinDistance } = require('../utils')

class ImdbFinder {
  constructor() { }

  findClosestTitle(imdbData, title) {
    let closest = undefined
    let closestImdbData = null
    imdbData.forEach((imdb) => {
      var _title = imdb.title.toLowerCase()
      var levenD = levenshteinDistance(_title, title)
      if (closest === undefined || levenD < closest) {
        closest = levenD
        closestImdbData = imdb
      }
    })
    return {
      distance: closest,
      imdbRecord: closestImdbData
    }
  }

  async lookForMedia(type, searchTitle, searchYear) {
    const responsePacket = {}
    const imdbData = await omdb.searchOmdb(searchTitle, type, searchYear)
    if (!imdbData || !imdbData.length) {
      return {
        error: 'No matches'
      }
    }
    if (imdbData.length === 1) {
      responsePacket.media = imdbData[0]
    } else {
      const withMatchingYears = imdbData.filter(d => String(d.year) === String(searchYear))
      if (withMatchingYears.length === 1) {
        responsePacket.media = withMatchingYears[0]
      } else if (withMatchingYears.length > 0) {
        var { distance, imdbRecord } = this.findClosestTitle(withMatchingYears, searchTitle.toLowerCase())
        responsePacket.media = imdbRecord
      } else {
        var { distance, imdbRecord } = this.findClosestTitle(imdbData, searchTitle.toLowerCase())
        if (distance < 3) {
          var warningMsg = `Closest match with levenshtein distance ${distance}.`
          if (searchYear) {
            warningMsg = `No matching year ${searchYear}, best match year is ${imdbRecord.year}. ${warningMsg}`
          } else {
            warningMsg = `No year given. ${warningMsg}.`
          }
          responsePacket.warning = warningMsg
          responsePacket.media = imdbRecord
        } else {
          responsePacket.warning = 'No matching year and no title close enough'
          responsePacket.mediaOptions = imdbData.map(r => `${r.title} (${r.year})`).join('\n')
        }
      }
    }
    return responsePacket
  }
}
module.exports = new ImdbFinder()