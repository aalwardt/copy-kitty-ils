/* 
 * Extension of PouchDB that directly handles insertion of replay objects
 */
const moment = require('moment')
const PouchDB = require('pouchdb-node')

const config = require('./serverConfig.js')

module.exports = class ReplayDB extends PouchDB {
  constructor(name, options) {
    super(config.DATABASE_DIR)
  }

  /* Add a replay object to the database. Remove it if it already exists. */
  addReplay(replay) {
    const timestamp = moment().format("x") // Timestamp, unix ms
    const id = `${replay.levelName}-${replay.username}-${timestamp}`
    replay.serverFilename = `${id}.replaykitty`

    // If replay already exists in database, reject it

    // Return a promise for entering the replay into the database
    return this.put({
      _id: id,
      replay: replay
    })
  }

  
}

class DuplicateReplayError extends Error {
  constructor(message) {
    super(message)
    this.name = "DuplicateReplayError"
  }
}