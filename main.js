var net = require('net')
var spawn = require('child_process').spawn
var xmlrpc = require('xmlrpc')
var fs = require('fs')
var http = require('http')
var https = require('https')
var express = require('express')
var io

spawn('killall', ['Python'])

///////////////////////////////////////////////////////////////////////////////
/// setup webserver
var port = 8000;
var options = {
  key: fs.readFileSync('./nginx.key'),
  cert: fs.readFileSync('./nginx.crt'),
  requestCert: false,
  rejectUnauthorized: false
};

var app = express();
var server

if(process.env.HTTPS && process.env.HTTPS === '1'){
  server = https.createServer(options, app).listen(port, function(){
    console.log("Express _SECURE_ server listening on port " + port);
  });
} else {
  server = http.createServer(app).listen(port, function(){
    console.log("Express server listening on port " + port);
  });
  io = require('socket.io')(server)
}

// app.get('/', function (req, res) {
//     res.writeHead(200);
//     res.end("hello world\n");
// });

app.use(express.static(__dirname + '/public'))

var sockets = []

io.on('connection', function(socket){

  console.log('a user connected');
  sockets.push(socket)

  console.log(sockets.length, 'users total')

  socket.on('disconnect', function(){
    sockets = sockets.filter(function(s){ return s !== socket })
  })
});

///////////////////////////////////////////////////////////////////////////////
/// launch GNURADIO

var script_name = 'fft_to_tcp.py'

if(process.env.FILE && process.env.FILE === '1'){
  script_name = 'file_fft_to_tcp_nogui.py'
  console.log('script named changed')
}

var gnuradio = spawn('python2.7', [script_name])
gnuradio.on('close', function (code, signal) {
  console.log('child process terminated due to receipt of signal ' + signal + ',' + code)
})
gnuradio.on('error', function (err) {
  console.log('error starting gnuradio')
  console.log(err)
})
gnuradio.stdout.on('data', function (d) {
  console.log('msg', d.toString())
})

///////////////////////////////////////////////////////////////////////////////
// initial network connections from node < -- > GNURADIO
var xmlrpc_client = xmlrpc.createClient({
  host: 'localhost',
  port: 8080,
  path: '/'
})

var client = new net.Socket()
var iq_client = new net.Socket()

var vec_len = 8192
var byte_size = 4
var b = new Buffer(vec_len * byte_size)
var c_idx = 0

function start_connections(){
  iq_client.connect(10002, '127.0.0.1', function () {
    console.log('iq stream connected')
    client.connect(10001, '127.0.0.1', function () {
      console.log('fft stream connected')

      xmlrpc_client.methodCall('get_veclen', [], function (error, v) {
        console.log('done getting vector length')
        // console.log(error, v)

        xmlrpc_client.methodCall('Start', [], function (error, v) {
          console.log('done sending start.')
          // console.log(error, v)
        })
      })
    })
  })
  // xmlrpc_client.methodCall('get_test', [], function (error, v) {
  //   console.log(error, v)
  // })
}

setTimeout(start_connections, 5000)

///////////////////////////////////////////////////////////////////////////////
// network events & signal processing

var send_array = []
var copy_idx

client.on('data', function (data) {

  for (var i = 0; i < data.length; i++) {

    b[c_idx] = data[i]
    c_idx += 1

    if (c_idx >= b.length) {
      c_idx = 0

      var s = []
      for (var z = 1425; z < 1435; z++) {
        s.push(b.readFloatLE(z * byte_size).toFixed(2))
      }
      // console.log(s.join(' '))

      if(sockets.length > 0){
        send_array = []
        for(copy_idx = 0; copy_idx < vec_len; copy_idx+=1){
          send_array.push(b.readFloatLE(copy_idx * byte_size).toFixed(4))
        }
        sockets.forEach(function(s){
          s.emit('fft_data', send_array)
        })
      }
    }
  }
})

iq_client.on('data', function (d) {
  // console.log([d.length, 'iq data length'].join('\t'))
})

///////////////////////////////////////////////////////////////////////////////
// error and close events
iq_client.on('error', function (d) { console.log('iq stream error')})
iq_client.on('close', function (d) { console.log('iq stream closed')})

client.on('error', function (d) {
  console.log('fft stream network error!')
  console.log(d)
  gnuradio.kill('SIGHUP')
  process.exit(0)
})

client.on('close', function () {
  gnuradio.kill('SIGHUP')
  process.exit(0)
  console.log('Connection closed with fft stream')
})
