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

    this.clients = {}
    this.completedRenames = []
    this.filesRenaming = []
    this.media = []
  }

  async loadFiles() {
    this.media = await mediascraper.findMediaDirectories(this.FilePath)
    for (const mediatype in this.media) {
      this.media[mediatype].files = await mediascraper.scrape(this.media[mediatype].path, mediatype)
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

    app.post('/check', async (req, res) => {
      console.log('Check for existing file')
    })

    app.post('/rename', async (req, res) => {
      var fileId = req.body.file_id
      if (this.filesRenaming.includes(fileId)) {
        return res.json({ error: 'Already renaming file' })
      }
      var start = Date.now()
      this.filesRenaming.push(fileId)

      var requestIp = this.getRequestIp(req)
      var client = this.clients[requestIp]
      if (!client) {
        console.error('Client not established - will not send completion event')
      }
      res.json({
        client: client ? client.id : null
      })
      try {
        var renameResult = await Renamer.rename(req, this.media, client)
        var elapsed = Date.now() - start
        var elapsedSeconds = (elapsed / 1000).toFixed(1)
        console.log('Rename complete in', elapsedSeconds, 'seconds')
        console.log('Rename result', renameResult)
        this.filesRenaming = this.filesRenaming.filter(f => f !== fileId)
        if (!renameResult.error) {
          this.completedRenames.push(renameResult)
        }
        if (client) {
          console.log('Writing rename result to client', client.id)
          var payload = {
            type: 'rename',
            data: renameResult
          }
          client.response.write(`data: ${JSON.stringify(payload)}\n\n`)
        }
      } catch (error) {
        console.error('Rename crashed', error)
        this.filesRenaming = this.filesRenaming.filter(f => f !== fileId)
        if (client) {
          console.log('[CRASH] Writing rename result to client', client.id)
          var payload = {
            type: 'rename',
            data: {
              error: 'Rename crashed'
            }
          }
          client.response.write(`data: ${JSON.stringify(payload)}\n\n`)
        }
      }
    })

    app.post('/lookup', this.lookup.bind(this))

    app.get('/events', this.handleClientEvent.bind(this))

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

  getRequestIp(req) {
    return (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) || req.connection.remoteAddress
  }

  handleClientEvent(req, res) {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    }
    res.writeHead(200, headers)

    const requestIp = this.getRequestIp(req) || 'unknown'
    if (!this.clients[requestIp]) {
      this.clients[requestIp] = {
        id: requestIp,
        response: res
      }
      console.log(`Client ${requestIp} Connected`)
    } else {
      this.clients[requestIp].response = res
    }

    req.on('close', () => {
      console.log(`${requestIp} Connection closed`)
      delete this.clients[requestIp]
    })

    var info = {
      type: 'info',
      data: {
        completedRenames: this.completedRenames
      }
    }
    res.write(`data: ${JSON.stringify(info)}\n\n`)
  }
}
module.exports = new Server()

