const express = require('express')
var Sqrl = require('squirrelly')
var MediaFinder = require('./finders/MediaFinder')
var Renamer = require('./renamers/Renamer')
var mediascraper = require('./utils/mediascraper')
const { winNameCleaner } = require('./utils/fileHelpers')

class Server {
  constructor() {
    this.FilePath = null
    this.OutputPath = null

    this.media = []
  }

  async loadFiles() {
    this.media = await mediascraper.findMediaDirectories(this.FilePath)
    for (const mediatype in this.media) {
      var mediadir_path = this.media[mediatype].path
      this.media[mediatype].files = await mediascraper.scrape(mediadir_path, mediatype)
    }
  }

  async start(PORT, HOST, FILE_PATH, OUTPUT_PATH) {
    this.FilePath = FILE_PATH
    this.OutputPath = OUTPUT_PATH
    Renamer.OutputPath = this.OutputPath

    await this.loadFiles()

    const app = express()
    app.use(express.static('public'))
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json())

    app.set('views', './views')
    app.engine('html', Sqrl.renderFile)
    app.set('view engine', 'html')

    app.get('/', (req, res) => {
      res.render('index', {
        media: Object.values(this.media)
      })
    })

    app.post('/refresh', this.refresh.bind(this))

    app.post('/rename', (req, res) => Renamer.rename(req, res, this.media))

    app.post('/lookup', this.lookup.bind(this))

    app.listen(PORT, HOST)
    console.log(`Running on http://${HOST}:${PORT}`)
  }

  async refresh(req, res) {
    await this.loadFiles()
    res.sendStatus(200)
  }

  async lookup(req, res) {
    var file_id = req.body.file_id
    var imdb_id = req.body.imdb_id || null
    var media_type = file_id.split('_')[0]
    var mediaObj = this.media[media_type]
    var fileObj = mediaObj.files.find(f => f.id === file_id)

    console.log('Find Media', file_id, media_type, fileObj.path)

    var result = await MediaFinder.find(media_type, fileObj, imdb_id)
    if (result && result.media) {
      result.media.title = winNameCleaner(result.media.title)
      if (media_type === 'series') {
        result.media.season = fileObj.parsed.season
        result.media.episode = fileObj.parsed.episode
        if (result.media.episode_title) {
          result.media.episode_title = winNameCleaner(result.media.episode_title)
        }
      }
      if (result.media.authors) {
        result.media.authors = winNameCleaner(result.media.authors)
      }
    }
    console.log('Media', result)
    res.json(result)
  }
}
module.exports = new Server()

