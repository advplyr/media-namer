var fs = require('fs').promises
var ptt = require('parse-torrent-title')
var { prettyBytes, stringHash } = require('.')
var { fetchMediaFilesRecursive, fetchTopLevelFiles } = require('./fileHelpers')

async function scrapeExisting(path, mediaType) {
  var res = await fetchMediaFilesRecursive(path, mediaType)
  if (!res) return []
  return res.files
  // return topLevelFiles
}
module.exports.scrapeExisting = scrapeExisting

function parseFilename(filename, mediatype) {
  var parsedFilename = ptt.parse(filename)
  if ((mediatype === 'movies' || mediatype === 'documentaries') && parsedFilename.title && parsedFilename.year) {
    return parsedFilename
  } else if (mediatype === 'series' && parsedFilename.season !== undefined && parsedFilename.episode !== undefined) {
    return parsedFilename
  } else if (mediatype === 'books' || mediatype === 'audiobooks') {
    return parsedFilename
  }
  return null
}

async function scrape(path, mediatype) {
  var topLevelFiles = await fetchTopLevelFiles(path)
  var mediaObjects = []

  for (let i = 0; i < topLevelFiles.length; i++) {
    var file = { ...topLevelFiles[i] }
    var parsedFilename = parseFilename(file.basename, mediatype)
    if (parsedFilename) {
      file.parsed = parsedFilename
      file.mediatype = mediatype
      var size = 0
      if (file.dir) {
        var { files, invalid_files } = await fetchMediaFilesRecursive(file.path, mediatype)
        file.children = files
        file.invalid_files = invalid_files
        file.children.forEach((cf) => size += cf.size)
      } else {
        var stat = await fs.lstat(file.path)
        size = stat ? stat.size : 0
      }
      file.size = size
      file.prettyBytes = prettyBytes(size)
      file.id = `${mediatype}_${stringHash(file.path)}`
      console.log('File Id', file.id)
      mediaObjects.push(file)
    } else if (file.dir) {
      var dirMediaObjects = await scrape(file.path, mediatype)
      mediaObjects = mediaObjects.concat(dirMediaObjects)
    }
  }

  return mediaObjects
}
module.exports.scrape = scrape

async function findMediaDirectories(path) {
  var topLevelFiles = await fetchTopLevelFiles(path)

  const acceptableDirnames = {
    movies: 'movies',
    documentaries: 'documentaries',
    series: 'series',
    shows: 'series',
    'tv shows': 'series',
    'tv series': 'series',
    books: 'books',
    audiobooks: 'audiobooks'
  }

  var mediaDirs = {}

  topLevelFiles.forEach((tlf) => {
    var dirname = tlf.basename.toLowerCase()
    if (tlf.dir && acceptableDirnames[dirname]) {
      var mediaType = acceptableDirnames[dirname]
      mediaDirs[mediaType] = {
        type: mediaType,
        path: tlf.path
      }
    }
  })
  if (!Object.keys(mediaDirs).length) {
    console.log('No Media Dirs found, use this dir as movies', path)
    mediaDirs['movies'] = {
      path,
      type: 'movies'
    }
  }

  return mediaDirs
}
module.exports.findMediaDirectories = findMediaDirectories