var fs = require('fs').promises
var ptt = require('parse-torrent-title')
var { prettyBytes } = require('.')
var { fetchMediaFilesRecursive, fetchTopLevelFiles } = require('./fileHelpers')

async function scrapeExisting(path) {
  var topLevelFiles = await fetchTopLevelFiles(path)
  return topLevelFiles
}
module.exports.scrapeExisting = scrapeExisting

function parseFilename(filename, mediatype) {
  var parsedFilename = ptt.parse(filename)
  if (mediatype === 'movies' && parsedFilename.title && parsedFilename.year) {
    return parsedFilename
  } else if (mediatype === 'series' && parsedFilename.season !== undefined && parsedFilename.episode !== undefined) {
    return parsedFilename
  } else if (mediatype === 'books' || mediatype === 'audiobooks') {
    return parsedFilename
  }
  return null
}

async function scrape(path, mediatype, index = 0) {
  var topLevelFiles = await fetchTopLevelFiles(path)
  // console.log('Top level files', topLevelFiles, mediatype)
  var mediaObjects = []

  for (let i = 0; i < topLevelFiles.length; i++) {
    var file = { ...topLevelFiles[i] }
    var parsedFilename = parseFilename(file.basename, mediatype)
    if (parsedFilename) {
      file.parsed = parsedFilename
      file.mediatype = mediatype
      var size = 0
      if (file.dir) {
        file.children = await fetchMediaFilesRecursive(file.path, mediatype)
        file.children.forEach((cf) => size += cf.size)
      } else {
        var stat = await fs.lstat(file.path)
        size = stat ? stat.size : 0
      }
      file.size = size
      file.prettyBytes = prettyBytes(size)
      file.id = `${mediatype}_${index++}`
      mediaObjects.push(file)
    } else if (file.dir) {
      var dirMediaObjects = await scrape(file.path, mediatype, index)
      mediaObjects = mediaObjects.concat(dirMediaObjects)
      index += mediaObjects.length
    }
  }

  return mediaObjects
}
module.exports.scrape = scrape

async function findMediaDirectories(path) {
  var topLevelFiles = await fetchTopLevelFiles(path)
  var mediaDirs = {}

  topLevelFiles.forEach((tlf) => {
    var dirname = tlf.basename.toLowerCase()
    if (tlf.dir) {
      if (dirname === 'movies') {
        mediaDirs['movies'] = {
          path: tlf.path,
          type: 'movies'
        }
      } else if (dirname === 'series' || dirname === 'shows' || dirname === 'tv shows') {
        mediaDirs['series'] = {
          path: tlf.path,
          type: 'series'
        }
      } else if (dirname === 'books' || dirname === 'audiobooks') {
        mediaDirs[dirname] = {
          path: tlf.path,
          type: dirname
        }
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