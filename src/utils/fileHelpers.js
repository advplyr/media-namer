var fs = require('fs-extra')
var Path = require('path')

var { prettyBytes } = require('./index')

const VIDEO_FORMATS = ['mp4', 'avi', 'mkv', 'm4v']
const INFO_FORMATS = ['nfo']
const SUB_FORMATS = ['idx', 'sub', 'srt']
const AUDIO_FORMATS = ['mp3', 'm4b']
const EBOOK_FORMATS = ['epub', 'pdf']
const IMAGE_FORMATS = ['png', 'jpg', 'jpeg']
const MIN_VIDEO_SIZE = 200 * 1000000

function getCollectionFileType(ext) {
  var ftype = ext
  if (VIDEO_FORMATS.includes(ftype)) return 'video'
  if (INFO_FORMATS.includes(ftype)) return 'info'
  if (SUB_FORMATS.includes(ftype)) return 'sub'
  if (AUDIO_FORMATS.includes(ftype)) return 'audio'
  if (EBOOK_FORMATS.includes(ftype)) return 'ebook'
  if (IMAGE_FORMATS.includes(ftype)) return 'image'
  return 'unknown'
}

async function fetchAllFilesInDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = entries.filter(file => !file.isDirectory()).map(file => Path.join(dir, file.name))
  const folders = entries.filter(folder => folder.isDirectory())
  for (const folder of folders) {
    files.push(...await fetchAllFilesInDir(Path.join(dir, folder.name)))
  }
  return files
}

async function fetchMediaFilesRecursive(path, mediatype) {
  var stat = await fs.lstat(path).catch((error) => {
    console.error('Failed to lstat', error)
    return false
  })
  if (!stat) return null
  var isDir = stat.isDirectory()
  var files = []

  if (isDir) {
    files = await fetchAllFilesInDir(path)
  } else {
    files = [path]
  }
  var fileObjs = []
  var invalid_files = []
  for (let i = 0; i < files.length; i++) {
    var ext = Path.extname(files[i]).substr(1).toLowerCase()
    var filetype = getCollectionFileType(ext)
    var isBook = mediatype === 'audiobooks' || mediatype === 'books'
    var filetypeIsValid = (filetype !== 'image' && filetype !== 'ebook') || isBook
    if (filetype !== 'unknown' && filetypeIsValid) {
      var filestat = await fs.lstat(files[i])
      if (filestat) {
        var isVideoTooSmall = filetype === 'video' && filestat.size < MIN_VIDEO_SIZE
        if (!isVideoTooSmall) {
          fileObjs.push({
            path: files[i],
            basename: Path.basename(files[i]),
            dir: false,
            size: filestat.size,
            prettyBytes: prettyBytes(filestat.size),
            ext: ext,
            filetype
          })
        } else {
          invalid_files.push({
            path: files[i],
            basename: Path.basename(files[i]),
            ext
          })
        }
      }
    } else {
      invalid_files.push({
        path: files[i],
        basename: Path.basename(files[i]),
        ext
      })
    }
  }
  return {
    files: fileObjs,
    invalid_files
  }
}
module.exports.fetchMediaFilesRecursive = fetchMediaFilesRecursive

async function fetchTopLevelFiles(path) {
  const entries = await fs.readdir(path, { withFileTypes: true })
  const files = await Promise.all(entries.map(async file => {
    var fullpath = Path.join(path, file.name)
    var isDir = file.isDirectory()
    var ext = !isDir ? Path.extname(file.name).substr(1).toLowerCase() : null
    return {
      basename: file.name,
      path: fullpath,
      ext,
      dir: isDir
    }
  }))
  return files
}
module.exports.fetchTopLevelFiles = fetchTopLevelFiles

async function setFilePermissionAndOwner(path) {
  try {
    await fs.chown(path, 99, 100)
    await fs.chmod(path, 0o774)

    return true
  } catch (error) {
    console.error('Failed to set perm own', error)
    return false
  }
}
module.exports.setFilePermissionAndOwner = setFilePermissionAndOwner


function winNameCleaner(dirtyName) {
  if (!dirtyName) {
    console.error('Cannot rename invalid', dirtyName)
    return ''
  }
  // replace '\\/:<>*?"|' with space, no repeating spaces
  return dirtyName.trim().replace(/[\\\/:<>*?"|]/g, " ").replace(/\s\s+/g, ' ')
}
module.exports.winNameCleaner = winNameCleaner

async function createDirectory(...pieces) {

  console.log('Create dir', pieces)
  var path_so_far = pieces[0]

  try {
    for (let i = 1; i < pieces.length; i++) {
      var _path = Path.join(path_so_far, pieces[i])
      console.log('Mk set _path', _path)
      await fs.ensureDir(_path)
      await setFilePermissionAndOwner(_path)

      path_so_far = _path
    }
    return true
  } catch (err) {
    console.error('Failed to mkdir', err)
    return false
  }
}
module.exports.createDirectory = createDirectory


async function copyFile(src, dest, overwrite = false) {
  return fs.copy(src, dest, { overwrite: overwrite, errorOnExist: !overwrite }).then(() => {
    return setFilePermissionAndOwner(dest)
  }).catch((err) => {
    console.error('Failed to copy file', src, '=>', dest, err)
    return false
  })
}
module.exports.copyFile = copyFile