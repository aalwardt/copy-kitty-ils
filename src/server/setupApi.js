const path = require('path')
const fs = require('fs').promises
const multer = require('multer')

const config = require('./serverConfig.js')
const parseReplay = require('./replayHandler.js')
const ReplayDB = require('./replayDatabase.js')

/** Setup multer options **/
const upload = multer({
  // storage: storage,
  dest: config.TEMP_DIR
})

const db = new ReplayDB()

module.exports = app => {
  /* Upload .replaykitty files */
  app.post('/upload', upload.single('replay'), (req, res) => {
    if (!req.file) {
      res.status(400).send('No replay uploaded!')
    } else {
      let replayData
      let tmpPath = req.file.path
      console.log(`\nFile uploaded: ${req.file.originalname}`)

      // Parse the replay file
      parseReplay(tmpPath)
        .then( replay => {
          replayData = replay
          // Insert the replay into the database
          return db.addReplay(replay)
        })
        .then( dbResult => {
          // Send the replay object in the response
          res.json(replayData)

          // Move the file from tmp/ to replays/
          let newPath = path.join(config.REPLAY_DIR, replayData.serverFilename)
          console.log(`\tReplay file uploaded to ${newPath}`)

          return fs.rename(tmpPath, newPath)          
        })
        .catch( err => {
          // Error! Send the appropriate response
          switch (err.name) {
            case 'conflict':
              err.message = 'Already uploaded!'
            case 'ReplayRejectedError':
              console.log(`\tReplay file rejected: ${err.message}`)
              res.status(400).send(err.message)
              break

            default:
              console.log(`\tInternal Error: ${err.message}`)
              console.log(err)
              res.status(500).send('An internal server error occured')
              break
          }

          // Delete the temporary file
          return fs.unlink(tmpPath)
        })
        .catch( err => {
          // Catch any errors caused by deleting the file
          console.log('Couldn\'t delete temporary file, something went really wrong.')
          console.log(err.message)
        })
    }
  })

  /* Get replay objects from the database */
  app.get('/replays', (req, res) => {
    // Request queries will be the requirements for filtering the results
    db.getReplays(req.query)
      .then( replays => {
        console.log(replays)
        res.json(replays)
      })
  }) 
}