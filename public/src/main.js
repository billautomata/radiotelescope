console.log(Date.now())
console.log('lol')

window.socket.on('fft_data', function (d) {
  // console.log(d.length)
  var k = []
  for (var i = 1420; i < 1440; i++) {
    k.push(d[i])
  }
  console.log(k.join(' '))
})
