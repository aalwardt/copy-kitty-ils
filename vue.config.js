const setupApi = require('./src/server/setupApi')

// Start the API before running the dev server
module.exports = {
  devServer: {
    before: setupApi
  }
}