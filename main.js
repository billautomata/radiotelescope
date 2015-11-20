var net = require('net');
var spawn = require('child_process').spawn
var xmlrpc = require('xmlrpc')

var xmlrpc_client = xmlrpc.createClient({ host: 'localhost', port: 8080, path: '/'})

var gnuradio = spawn('python2.7', ['top_block.py']);
gnuradio.on('close', function (code, signal) {
  console.log('child process terminated due to receipt of signal ' + signal);
});
gnuradio.on('error', function (err) {
  console.log('error starting gnuradio')
  console.log(err)
})
gnuradio.stdout.on('data', function (d) {
    console.log('msg', d.toString())
  })
  // send SIGHUP to process
  // gnuradio.kill('SIGHUP');

var vec_len = 8192
var byte_size = 4
var b = new Buffer(vec_len * byte_size)
var c_idx = 0

var client = new net.Socket();

setTimeout(function () {
  client.connect(10001, '127.0.0.1', function () {
    console.log('Connected to TCP connection');
  });
  xmlrpc_client.methodCall('get_test', [ ], function(error,v) { console.log(error,v) } )
}, 5000)

client.on('error', function (d) {
  console.log('network error!')
  console.log(d)
  gnuradio.kill('SIGHUP');
  process.exit(0)
})

client.on('data', function (data) {
  // console.log('Received: ' + data.length);

  for (var i = 0; i < data.length; i++) {
    b[c_idx] = data[i]
    c_idx += 1
    if (c_idx >= b.length) {
      c_idx = 0
      console.log(b.readFloatLE(1425 * byte_size).toFixed(2),
        b.readFloatLE(1426 * byte_size).toFixed(2),
        b.readFloatLE(1427 * byte_size).toFixed(2),
        b.readFloatLE(1428 * byte_size).toFixed(2),
        b.readFloatLE(1429 * byte_size).toFixed(2))
    }
  }

});

client.on('close', function () {
  // client.connect()
  console.log('Connection closed');
});
