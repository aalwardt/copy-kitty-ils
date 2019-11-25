const path = require('path')
const multer = require('multer')

/** Setup multer options **/
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, 'tmp'))
//   },
//   filename: function (req, file, cb) {
//     cb(null, 'uploaded-' + file.originalname)
//   }
// })
const upload = multer({
  // storage: storage,
  dest: path.join(__dirname, 'tmp')
})

module.exports = app => {
  // Handle uploaded files
  app.post('/upload', upload.single('replay'), (req, res) => {
    if (!req.file) {
      console.log('No file received')
      return res.send({
        success: false
      })
    } else {
      console.log(`File uploaded: ${req.file.filename}`)
      console.log(req.file)
      return res.send({
        success: true
      })
    }
    
  })
}