const Stream = require('node-rtsp-stream-jsmpeg');
const stream = new Stream({
  name: 'cameraStream',
  url: 'rtsp://1.tcp.jp.ngrok.io:20051/',
  wsPort: 9999,
});

stream.start()
