const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')
const { defaults } = require('lodash')

const convertVideo = async (videouuid, filetype, res) => {
    try {
        let filePath = path.join(__dirname, `./converted-videos`, `${videouuid}.${filetype}`)
        ffmpeg(`./uploads/${videouuid}`)
            .output(filePath)
            .on('error', function (err) {
                console.log('Error has occured')
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
                fs.unlink(`./uploads/${videouuid}`, (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
                console.log(err)
            })
            .on('end', function () {
                let finished_conversions = fs.readFileSync('video-conversions-done.json')
                let conversions_object = JSON.parse(finished_conversions)

                conversions_object.finished.push(videouuid)
                let conversions_json = JSON.stringify(conversions_object)

                fs.writeFile('./video-conversions-done.json', conversions_json, (err) => {
                    if (err) { console.log(err) }
                    console.log('writing to file')
                })
            }).run()
    } catch (err) {
        console.log(err)
    }
}

exports.defaults = {
    convertVideo: convertVideo,
}