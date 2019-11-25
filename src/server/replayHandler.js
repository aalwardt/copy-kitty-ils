/**
 * Parses .replaykitty files to extract relevant data
 */
 const fs = require('fs')

function parseReplay(replayPath) {
	fs.readFile(replayPath, (err, data) => {
		if (err) throw err
	})
}

 /** Testing code, only run when this is executed on its own **/
 if (require.main === module) {
    
}