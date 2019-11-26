/**
 * Parses .replaykitty files to extract relevant data
 */
const fs = require('fs')
const path = require('path')

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

function parseReplay(replayPath) {
	fs.readFile(replayPath, (err, data) => {
		if (err) { throw err }

		const buffer = new BufferParser(data)
		let replayData = {}

		// Step through the file, storing relevant fields		
		replayData.buildNum = buffer.getNextInt32()				// Build number
		// Is this in an older format?
		let oldReplay = replayData.buildNum < 1486 
		replayData.version = buffer.getNextString()				// Version string
		replayData.gamemode = buffer.getNextInt32()				// Game mode
		buffer.getNextInt32() 														// Random seed
		buffer.getNextString() 														// Filename
		replayData.levelname = buffer.getNextString()			// Level name
		replayData.username = buffer.getNextString()			// Username
		buffer.getNextInt32() 														// Starting wave
		buffer.getNextInt32() 														// Endless path
		buffer.getNextInt32() 														// Num starting weapons
		replayData.cheated = buffer.getNextBoolean()			// Cheats Active
		buffer.offset += oldReplay ? 36 : 37							// 36 or 37 cheats, format dependent
		replayData.difficulty = buffer.getNextBoolean()		// Difficulty
		buffer.getNextBoolean()														// Restarted
		replayData.character = buffer.getNextInt32()			// Character
		buffer.offset += oldReplay ? 0 : 4								// Newer format only int32
		buffer.offset += 64																// Many fields we can ignore
		buffer.getNextString()														// 2 strings we can ignore
		buffer.getNextString()
		buffer.offset++																		// Ignored bool
		let numNextEntries = buffer.getNextInt32()				// How many times next entry repeats
		buffer.offset += numNextEntries * 2								// ...which is also ignored (Int16)
		replayData.month = buffer.getNextInt16()					// Month
		replayData.day = buffer.getNextInt16()						// Day
		replayData.year = buffer.getNextInt16()						// Year
		replayData.score = buffer.getNextInt32()					// Score
		replayData.minutes = buffer.getNextInt32()				// Minutes
		replayData.seconds = buffer.getNextInt16()				// Seconds
		replayData.frames = buffer.getNextInt16()					// Frames

		console.log(replayData)
	})
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
		return out === 0 ? false : true
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

/** Testing code **/
if (require.main === module) {
	parseReplay(path.join('replays', '0.replaykitty'))
}