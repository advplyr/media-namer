var axios = require('axios')
var { levenshteinDistance } = require('../../utils/utils')

const apiKey = process.env.TMDB_API_KEY
var configData = null
var imageConfig = null
// base_url, backdrop_sizes, poster_sizes

function fetchConfig() {
  var uri = `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`
  return axios.get(uri).then((res) => {
    var data = res.data
    // console.log('Got config data', data)
    return data
  }).catch((error) => {
    console.error('Tmdb request error', error)
    return null
  })
}

function searchMovies(title, year) {
  var encodedTitle = encodeURI(title)
  var uri = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&page=1&year=${year}&query=${encodedTitle}`
  // console.log('TMDB URL', uri)
  return axios.get(uri).then(async (res) => {
    var results = res.data.results
    var movie = null
    if (results && results.length) {
      movie = results[0]
      // console.log('RESULTS RAW', movie)
      var _title = movie.title
      var _year = movie.release_date.split('-').shift()
      var levenshtein = levenshteinDistance(_title, title)
      // console.log('TITLE', _title, 'LEVEN', levenshtein)
      if (String(_year) !== String(year) || levenshtein > 4) {
        var altTitles = await getAlternativeTitles(movie.id)
        var hasVeryCloseAltTitle = altTitles.find(altt => levenshteinDistance(altt.title, title) <= 1)
        if (hasVeryCloseAltTitle) {
          // console.log('Close alt title matched', hasVeryCloseAltTitle.title)
        } else {
          console.log('No close alt title')
          movie = null
        }
      }
    }
    return movie
  }).catch((error) => {
    console.error('Tmdb request error', error)
    return null
  })
}

function findMovie(id, source = 'imdb_id') {
  var uri = `https://api.themoviedb.org/3/find/${id}?api_key=${apiKey}&language=en-US&external_source=${source}`
  return axios.get(uri).then(async (res) => {
    if (res.data.success === false || !res.data.movie_results || !res.data.movie_results.length) {
      return null
    }
    return res.data.movie_results[0]
  }).catch((error) => {
    console.error('Tmdb request error', error)
    return null
  })
}

function getAlternativeTitles(tmdbId) {
  var uri = `https://api.themoviedb.org/3/movie/${tmdbId}/alternative_titles?api_key=${apiKey}`
  return axios.get(uri).then((res) => {
    return res.data.titles
  }).catch((error) => {
    console.error('Tmdb request error', error)
    return null
  })
}

function getMovieDetails(tmdbId, crewFilter = ['Writer', 'Producer', 'Executive Producer', 'Director'], maxCast = 20) {
  var uri = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=videos,credits&language=en`
  return axios.get(uri).then((res) => {
    if (res.data.success === false) {
      console.error('Failed to fetch movie details', res.data.status_message)
      return null
    }
    var movieDetails = res.data
    var videosObj = movieDetails.videos || {}
    var videos = videosObj.results || []
    movieDetails.trailers = videos.filter(v => v.type === 'Trailer').map(t => {
      return {
        name: t.name,
        size: t.size,
        key: t.key,
        url: t.site === 'YouTube' ? `https://www.youtube.com/watch?v=${t.key}` : t.site === 'Vimeo' ? `https://vimeo.com/${t.key}` : null
      }
    })
    delete movieDetails.videos

    var creditsObj = movieDetails.credits || {}
    var cast = creditsObj.cast || []
    var crew = creditsObj.crew || []
    movieDetails.crew = crew.filter(c => crewFilter.includes(c.job))
    movieDetails.cast = cast.slice(0, maxCast)
    delete movieDetails.credits
    return movieDetails
  }).catch((error) => {
    console.error('Tmdb request error', error)
    return null
  })
}

async function fetchMovie(title, year) {
  if (!configData) {
    configData = await fetchConfig()
    imageConfig = configData.images
  }
  var movie = await searchMovies(title, year)
  if (!movie) {
    return null
  }

  var tmdbId = movie.id
  var details = await getMovieDetails(tmdbId)

  details.imageConfig = imageConfig
  return details
}
module.exports.fetchMovie = fetchMovie

async function fetchMovieFromImdbId(imdbId) {
  if (!configData) {
    configData = await fetchConfig()
    imageConfig = configData.images
  }
  var movie = await findMovie(imdbId, 'imdb_id')
  if (!movie) {
    return null
  }

  var tmdbId = movie.id
  var details = await getMovieDetails(tmdbId)

  details.imageConfig = imageConfig
  return details
}
module.exports.fetchMovieFromImdbId = fetchMovieFromImdbId