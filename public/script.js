const startbutton = document.querySelector('#start')
const stopbutton = document.querySelector('#stop')
const downloadbutton = document.querySelector('#convert')
const form = document.querySelector('form')
let recordedBlobs
let mediaRecorder
let sourceBuffer;
let res
const startScript = async () => {
  startbutton.addEventListener('click', async () => {
    let stream = await startCapture()
    startRecording(stream)
    console.log("capture started")
  })

  stopbutton.addEventListener('click', () => {
    mediaRecorder.stop()
    console.log("recording stopped")
  })

  downloadbutton.addEventListener('click', () => {
    uploadVideo()
    console.log("uploading")
  })
}
startScript()



const startCapture = async () => {
  displayMediaOptions = {
    video: {
      cursor: "always"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  };
  let captureStream = null

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  } catch (err) {
    console.log(`ERROR: ${err}`)
  }
  return captureStream
}




function startRecording(stream) {
  var options = { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: 100000 };
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', options, e0);
    try {
      options = { mimeType: 'video/webm;codecs=vp8', bitsPerSecond: 100000 };
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', options, e1);
      try {
        options = 'video/mp4';
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
      }
    }
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function uploadVideo() {
  let blob = new Blob(recordedBlobs, { type: 'video/webm' })
  let formData = new FormData()

  formData.append('video', blob)
  formData.append('format', document.querySelector('select').value)

  fetch('/upload-video', { method: "POST", body: formData }).then(
    res => res.json())
    .then(
      res => downloadVideo(res.uuid, res.format)
    )
}

function downloadVideo(uuid, format) {
  checkUrl = '/check-video'
  downloadUrl = '/get-video'
  let checkurl = `${checkUrl}?uuid=${uuid}&format=${format}`
  let downloadurl = `${downloadUrl}?uuid=${uuid}&format=${format}`

  let interval = setInterval(() => {
    fetch(checkurl)
      .then(res => res.json())
      .then(res => {
        if (res.status) {
          clearInterval(interval)
          download(uuid, format, downloadurl)
        }
      })
  }, 3000);

}


function download(uuid, format, url) {
  let a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `${uuid}.${format}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 500);
}
