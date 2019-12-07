/* 
 * Extension of PouchDB that directly handles insertion of replay objects
 */
const PouchDB = require('pouchdb-node')

const config = require('./serverConfig.js')

module.exports = class ReplayDB extends PouchDB {
  constructor(name, options) {
    super(config.DATABASE_DIR)
  }

  /* Add a replay object to the database. Remove it if it already exists. */
  addReplay(replay) {
    // Return a promise for entering the replay into the database
    return this.put({
      _id: replay.md5, // ID is the md5 hash, so duplicate replays will automatically conflict
      replay: replay
    })
  }

  
}