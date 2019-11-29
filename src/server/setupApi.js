const path = require('path')
const fs = require('fs').promises
const multer = require('multer')
const PouchDB = require('pouchdb-node')

const parseReplay = require('./replayHandler.js')

/** Directories used for storage **/
const TEMP_DIR = 'tmp'
const REPLAY_DIR = 'replays'
const DATABASE_DIR = 'db'

/** Setup multer options **/
const upload = multer({
  // storage: storage,
  dest: TEMP_DIR
})
/** Setup database **/
const db = new PouchDB('db')

module.exports = app => {
  // Handle uploaded files
  app.post('/upload', upload.single('replay'), (req, res) => {
    if (!req.file) {
      console.log('No file received')
      return res.send({
        success: false
      })
    } else {
      console.log(`File uploaded: ${req.file.originalname}`)
      console.log(req.file)
      parseReplay(req.file.path)
        .then( replayData => {
          console.log(replayData)
          return res.json(replayData)
        })
        .catch( err => {
          if (err.name == "ReplayRejectedError"){
            return res.status(400).send(err.message)
          } else {
            console.log(`Internal Error: ${err.message}`)
            return res.status(500).send("An internal server error occured")
          }
        })
      
      
    }
  })
}