/**
 * Parses .replaykitty files to extract relevant data
 */
const fs = require('fs').promises
const levelMap = require('./levelMap.js')

/** Replay format (courtesy of Azure)
int32 version
string versionname
int32 gamemode
int32 randomseed
string filename
string levelname
string username
int32 startingwave
int32 endlesspath
int32 numstartingweapons (those last few only matter in endless which barely syncs)
bool cheated
bool[] activecheats 
(I think length 37, and it'll be 1 less if the
replay version is 1483 or less, before the beta)
bool difficulty
bool restarted
int32 character
int32 (only if replayversion >= 1486)
bool     1
bool     1
int32    4
int32    4
bool     1
int16    2
int16    2
bool     1
6 floats 24
int32    4
float    4
bool     1
int32    4
bool     1
bool     1
int32    4
int32    4
bool     1     total block: 64
string   ??
string   ??
bool     1
int32 - num times to loop next line
[int16]
int16 month
int16 day
int16 year
int32 score
int32 minutes
int16 seconds
int16 frames
**/

// Export a promise
module.exports = (replayPath) => {  
  return fs.readFile(replayPath).then(parseReplay)    
}

// Given the contents of a .replaykitty file, return an object that encapsulates a replay
function parseReplay(data) {

  let replayData = {}
  const buffer = new BufferParser(data)

  /** Step through the file, storing relevant fields **/
  replayData.buildNum = buffer.getNextInt32()       // Build number

  // Is this in an older format?
  let oldReplay = replayData.buildNum < 1486 
  if (replayData.buildNum < 1483) {
    throw new ReplayRejectedError("Replays from versions older than 1483 are not accepted!")
  }

  replayData.version = buffer.getNextString()       // Version string
  replayData.gamemode = buffer.getNextInt32()       // Game mode

  // if (replayData.gamemode != 0) {
  //   throw new ReplayRejectedError("Only story mode replays are accepted!")
  // }

  buffer.getNextInt32()                             // Random seed
  
  let filename = buffer.getNextString()             // Filename
  
  replayData.levelname = buffer.getNextString()     // Level name

  replayData.username = buffer.getNextString()      // Username

  if (replayData.username === "") {
    throw new ReplayRejectedError("Replays without authors are not accepted!")
  }


  buffer.getNextInt32()                             // Starting wave
  buffer.getNextInt32()                             // Endless path
  buffer.getNextInt32()                             // Num starting weapons
  replayData.cheated = buffer.getNextBoolean()      // Cheats Active

  if (replayData.cheated) {
    throw new ReplayRejectedError("Cheats are not allowed!")
  }

  buffer.offset += oldReplay ? 36 : 37              // 36 or 37 cheats, format dependent
  replayData.hardMode = buffer.getNextBoolean()     // Hard Mode
  buffer.getNextBoolean()                           // Restarted

  let charNum = buffer.getNextInt32()               // Character
  replayData.character = (charNum === 0) ? "Boki" : "Savant"
  
  // We have to do some extra handling because
  // Boki and Savant share IcyBlockade in different level slots 
  if (replayData.levelName === "/IcyBlockade"
      && replayData.character === "Savant") {
    filename = "/IcyBlockade-s"
  }

  // Check if the filename corresponds to a story mode level
  let levelNum = levelMap.get(filename)
  if (levelNum) {
    replayData.world = levelNum.world
    replayData.level = levelNum.level
  } else {
    throw new ReplayRejectedError("Only story mode replays are accepted!")
  }

  buffer.offset += oldReplay ? 0 : 4                // Newer format only int32
  buffer.offset += 64                               // Many fields we can ignore
  buffer.getNextString()                            // 2 strings we can ignore
  buffer.getNextString()
  buffer.offset++                                   // Ignored bool
  let numNextEntries = buffer.getNextInt32()        // How many times next entry repeats
  buffer.offset += numNextEntries * 2               // ...which is also ignored (Int16)
  buffer.getNextInt16()                             // Month
  buffer.getNextInt16()                             // Day
  buffer.getNextInt16()                             // Year
  replayData.score = buffer.getNextInt32()          // Score
  replayData.minutes = buffer.getNextInt32()        // Minutes
  replayData.seconds = buffer.getNextInt16()        // Seconds
  replayData.frames = buffer.getNextInt16()         // Frames

  return replayData
}

class ReplayRejectedError extends Error {
  constructor(message) {
    super(message)
    this.name = "ReplayRejectedError"
  }
}

// Wrapper class to allow us to access buffer content sequentially
class BufferParser {
  constructor(buffer) {
    this._buffer = buffer
    this.offset = 0
  }

  getNextBoolean() {
    let out = this._buffer.readInt8(this.offset)
    this.offset++
    return out !== 0
  }

  getNextInt16() {
    let out = this._buffer.readInt16LE(this.offset)
    this.offset += 2
    return out
  }

  getNextInt32() {
    let out = this._buffer.readInt32LE(this.offset)
    this.offset += 4
    return out
  }

  getNextString() {
    // Get the length of the upcoming string
    let length = this._buffer.readInt8(this.offset)
    this.offset++
    let out = this._buffer.toString('utf8', this.offset, this.offset + length)
    this.offset += length
    return out
  }
}