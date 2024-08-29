const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const Stream = require('node-rtsp-stream-jsmpeg');
const axios = require('axios');

const app = express();

require('dotenv').config();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

let rtsp_url;
const ws_port = process.env.WS_PORT || 9999;
const port = process.env.PORT || 8093;

let stream;
let options = {
  name: 'ip-camera',
  url: rtsp_url, // This will be updated after fetching the RTSP URL
  wsPort: ws_port,
  ffmpegOptions: {
    '-stats': '',
    '-r': 30,
    '-b:v': '600', // Reduced video bitrate
    '-bufsize': '512k', // Reduced buffer size
    '-maxrate': '800k', // Maximum video bitrate
    '-an': '', // Disable audio
    '-vf': 'scale=854:480',
    '-c:v': 'libx264',
    '-preset': 'ultrafast', // Faster preset for debugging
    '-crf': '23',
    '-max_muxing_queue_size': '4096'
    // '-loglevel': 'debug', // More detailed logs
  },
};

async function fetchRTSPUrl() {
  try {
    await axios.get('https://ebike-dev.giantiot.com/api/v1/ngstorage/link').
    then(response => {
      rtsp_url = "rtsp://" + response.data.result.split("//")[1] + "/";
      // rtsp_url = "rtsp://0.tcp.jp.ngrok.io:19897/";
      console.log('Fetched RTSP URL:', rtsp_url);

      options.url = rtsp_url;

      startStream();
    }).
    catch(error => {
      return console.error("axios get rtsp api error :",error.message); 
    })
  } catch (error) {
    console.error('Error fetching RTSP URL:', error);
  }
}

function startStream() {
  if (stream) {
    stream.stop();
  }

  stream = new Stream(options);
  stream.start();

  stream.on('ffmpegStderr', handleFFmpegStderr);
  stream.on('exitWithError', restartStream);
}

// function handleFFmpegStderr(stderr) {
//   console.error('FFmpeg STDERR:', stderr.toString());
//   if (stderr.toString().includes('Conversion failed!')) {
//     console.log('Conversion failed detected, restarting stream...');
//     restartStream();
//   }
// }

function handleFFmpegStderr(stderr) {
  const errorMessage = stderr.toString();
  console.error('FFmpeg STDERR:', errorMessage);
  
  // ตรวจสอบข้อความข้อผิดพลาดเฉพาะและดำเนินการที่เหมาะสม
  if (errorMessage.includes('Conversion failed!')) {
    console.log('Conversion failed detected, restarting stream...');
    restartStream();
  }

  // ตรวจสอบข้อผิดพลาดอื่น ๆ ที่เป็นไปได้
  if (errorMessage.includes('Broken pipe')) {
    console.error('Broken pipe detected, restarting stream...');
    restartStream();
  }

  // ตรวจสอบข้อผิดพลาดเกี่ยวกับความเร็วของเฟรม
  if (errorMessage.includes('Too many packets')) {
    console.warn('Too many packets detected, possible frame drop. Consider adjusting bitrate.');
  }

  // ตรวจสอบข้อผิดพลาดอื่น ๆ ที่อาจเกิดขึ้น
  if (errorMessage.includes('Error muxing a packet')) {
    console.error('Error muxing a packet, attempting to restart stream...');
    restartStream();
  }
}


function restartStream() {
  console.log('\nRestarting stream...\n');

  if (stream) {
    stream.stop();
  }

  setTimeout(() => {
    startStream();
    console.log('\nStream restarted.\n');
  }, 3000);
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/stream/seturl', async (req, res) => {
  const { url } = req.body;
  console.log(`\nReceived new RTSP URL: ${url}\n`);
  rtsp_url = "rtsp://" + url.split("//")[1] + "/";
  restartStream();
  res.send({ message: 'RTSP URL updated and stream restarted successfully.' });
});

app.get('/restart/stream', async (req, res) => {
  restartStream();
  res.send({ message: 'RTSP URL updated and stream restarted successfully.' });
})

app.listen(port, async () => {
  console.log(`Server is running on ${port}`);

  await fetchRTSPUrl();
});

