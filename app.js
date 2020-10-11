const uuidv4 = require('uuid').v4
const path = require('path')
const express = require('express')
const fileUpload = require('express-fileupload')
const config = require('./config')
const convert = require('./video-convert')
const { readFileSync, unlink } = require('fs')
const app = express()
const port = config.PORT || 3000
const host = config.HOST || 'localhost'

//uploadMiddleware
app.use(fileUpload({
    createParentPath: true,
}))

app.use('/', express.static('public'))
//Middleware

app.post('/upload-video', async (req, res) => {
    console.log('post')
    try {
        if (!req.files) {
            req.send({
                status: false,
                message: "video upload failed"
            })
        } else {
            let video = req.files.video
            let uuid = uuidv4()
            video.mv(`./uploads/${uuid}`)

            convert.defaults.convertVideo(uuid, req.body.format)
            res.send({
                status: true,
                uuid: uuid,
                format: req.body.format,
                message: `Video is Converting to ${req.body.format} and will download when done`
            })
        }
    } catch (err) {
        console.log(err)
    }
})
app.get('/check-video', (req, res) => {
    let fileData = readFileSync('video-conversions-done.json')
    let jsonData = JSON.parse(fileData)

    if (jsonData.finished.indexOf(req.query.uuid) >= 0) {
        res.send({
            status: true,
            message: 'Video is Available'
        })
    }
    else {
        res.send({
            status: false,
            message: 'Video is not Available'
        })
    }
})

app.get('/get-video', (req, res) => {
    let fileData = readFileSync('video-conversions-done.json')
    let jsonData = JSON.parse(fileData)

    //TODO: fix with database by saving filetype as well errors if format inputted is not the correct one
    if (jsonData.finished.indexOf(req.query.uuid) >= 0) {
        res.sendFile(path.join(__dirname, `./converted-videos`, `${req.query.uuid}.${req.query.format}`), (err) => {
            if (err) {
                console.log(err)
            }
        })
    }
    else {
        res.send({
            status: false,
            message: `No Video Found`
        })
    }
})

app.get('/video-downloaded', (req, res) => {
	try {
		unlink(`./uploads/${req.query.uuid}`, () => {})
	}catch (err) {
		console.log(err);
		res.send({status:false,});
	}
});
app.listen(port, host, () => {
    console.log(`App being hosted on http://${host}:${port}`)
})
