/* 
 * Extension of PouchDB that directly handles insertion of replay objects
 */
const level = require('level')
const toArray = require('stream-to-array')
const config = require('./serverConfig.js')
const db = level(config.DATABASE_DIR, { valueEncoding: 'json' })

module.exports = class ReplayDB  {
  constructor() {
    console.log('Replay database started')
  }

  /* Add a replay object to the database. Duplicates not allowed via md5 */
  addReplay(replay) {
    // Check if it already exists in the database
    return db.get(replay.md5)
      .then(() => {
        // This replay already exists!
        let e = new Error('Already uploaded!')
        e.name = 'ReplayRejectedError'
        throw e
      })
      .catch(err => {
        // If we didn't find the key in the database, insert it
        if (err.name === 'NotFoundError') {
          console.log('Inserting replay into database')
          return db.put(replay.md5, replay)
        }
        // For other errors, pass them down to be handled 
        throw err
      })
  } 

  /* Get all the replays, we'll filter this down for other requests */
  getAllReplays() {
    // Convert the readable stream of data to a promise that returns an array
    return toArray(db.createValueStream())
  }

  /* Get all the replays that match the given argument criteria */
  getReplays(criteria={}) {
    return this.getAllReplays()
      .then( allReplays => {
        return allReplays.filter(replay => this.matchReplay(replay, criteria))
      })
  }

  /* Returns true if replay matches given criteria */
  matchReplay(replay, criteria) {
    // Loop through given criteria, return false if any don't match
    for (var key of Object.keys(criteria)) {
      if (replay[key] !== criteria[key]) return false
    }
    return true
  }
}