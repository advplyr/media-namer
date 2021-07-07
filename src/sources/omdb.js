const axios = require('axios')
const OMDB_API_KEY = process.env.OMDB_API_KEY

function cleanYear(year) {
  if (!year) return null
  if (year.includes('–') || year.includes('-')) {
    return year.replace('–', '-').split('-')[0]
  }
  return year
}

function cleanTitle(title) {
  if (!title) return null
  if (title.includes(': ')) {
    return title.replace(': ', ' - ')
  }
  return title
}

function searchOmdb(search, type, year) {
  var uri = null
  if (!year) {
    uri = `https://www.omdbapi.com/?s=${search}&type=${type}&apikey=${OMDB_API_KEY}`
  } else {
    uri = `https://www.omdbapi.com/?s=${search}&type=${type}&y=${year}&apikey=${OMDB_API_KEY}`
  }

  return axios.get(uri).then((res) => {
    var data = res.data
    if (data.Error) return []
    return data.Search.map(i => {
      return {
        id: i.imdbID,
        title: cleanTitle(i.Title),
        year: cleanYear(i.Year),
        image: (i.Poster && i.Poster !== 'N/A') ? i.Poster : null
      }
    })
  }).catch((error) => {
    console.error('Media query failed', error)
    return []
  })
}
module.exports.searchOmdb = searchOmdb

function getEpisodeInfo(imdbId, season, episode) {
  var uri = `https://www.omdbapi.com/?i=${imdbId}&season=${season}&episode=${episode}&apikey=${OMDB_API_KEY}`
  return axios.get(uri).then((res) => {
    var data = res.data
    if (data.Error) return null
    return {
      'title': cleanTitle(data.Title),
      'year': cleanYear(data.Year),
      'seriesID': data.seriesID,
      'episode': data.Episode,
      'season': data.Season,
      'image': (data.Poster && data.Poster !== 'N/A') ? data.Poster : null
    }
  }).catch((error) => {
    console.error('Series fetch fail', error)
    return null
  })
}
module.exports.getEpisodeInfo = getEpisodeInfo

function getImdbData(imdbId) {
  var uri = `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`
  return axios.get(uri).then((res) => {
    var data = res.data
    if (data.Error) return null
    return {
      'title': cleanTitle(data.Title),
      'year': cleanYear(data.Year),
      'id': data.imdbID,
      'image': (data.Poster && data.Poster !== 'N/A') ? data.Poster : null
    }
  }).catch((error) => {
    console.error('Movie fetch fail', error)
    return null
  })
}
module.exports.getImdbData = getImdbData