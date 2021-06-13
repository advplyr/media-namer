const axios = require('axios')
const OMDB_API_KEY = process.env.OMDB_API_KEY

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
      var _title = i.Title

      return {
        id: i.imdbID,
        title: _title,
        year: i.Year,
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
      'title': data.Title,
      'year': data.Year,
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
      'title': data.Title,
      'year': data.Year,
      'id': data.imdbID,
      'image': (data.Poster && data.Poster !== 'N/A') ? data.Poster : null
    }
  }).catch((error) => {
    console.error('Movie fetch fail', error)
    return null
  })
}
module.exports.getImdbData = getImdbData