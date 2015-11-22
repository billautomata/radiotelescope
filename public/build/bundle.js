(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1]);
