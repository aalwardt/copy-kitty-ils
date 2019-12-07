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
  // Handle uploaded files
  app.post('/upload', upload.single('replay'), (req, res) => {
    if (!req.file) {
      res.status(400).send("No replay uploaded!")
    } else {
      let replayData
      console.log(`File uploaded: ${req.file.originalname}`)
      parseReplay(req.file.path)
        .then( replay => {
          replayData = replay
          // Insert the replay into the database
          return db.addReplay(replay)
        })
        .then( dbResult => {
          // Insertion successful! 
          return res.json(replayData)
        })
        .catch( err => {
          if (err.name == "ReplayRejectedError" || err.name == "DuplicateReplayError"){
            return res.status(400).send(err.message)
          } else {
            console.log(`Internal Error: ${err.message}`)
            console.log(err)
            return res.status(500).send("An internal server error occured")
          }
        })
      
      
    }
  })
}