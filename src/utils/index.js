const VIDEO_FORMATS = ['mp4', 'avi', 'mkv', 'm4v']
const INFO_FORMATS = ['nfo']
const SUB_FORMATS = ['idx', 'sub', 'srt']


function getCollectionFileType(ext) {
  var ftype = ext
  if (VIDEO_FORMATS.includes(ftype)) return 'video'
  if (INFO_FORMATS.includes(ftype)) return 'info'
  if (SUB_FORMATS.includes(ftype)) return 'sub'
  return 'unknown'
}
module.exports.getCollectionFileType = getCollectionFileType


const levenshteinDistance = (str1 = '', str2 = '') => {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return track[str2.length][str1.length];
}
module.exports.levenshteinDistance = levenshteinDistance

function getFileLogStr(filesToCopy, otherFiles) {
  var str = '[FILES TO COPY]\n'
  if (!filesToCopy.length) str += 'None\n'
  filesToCopy.forEach((file) => {
    str += `> [${file.collectionFileType}] ${file.path} (${file.sizeMb}Mb)\n`
  })
  str += '[OTHER FILES]\n'
  if (!otherFiles.length) str += 'None\n'
  otherFiles.forEach((file) => {
    str += `> [${file.collectionFileType}] ${file.path} (${file.sizeMb}Mb)\n`
  })
  if (str.length > 0) {
    str = str.slice(0, -1)
  }
  return str
}
module.exports.getFileLogStr = getFileLogStr

function prettyBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '0 Bytes'
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  if (i === 0) {
    return bytes + " " + sizes[i]
  }
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}
module.exports.prettyBytes = prettyBytes

module.exports.stringHash = (str) => {
  var hash = 0, i, chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return (hash + 2147483647 + 1).toString(16)
}