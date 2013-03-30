var babe = require('../babe');

var source = 'a = 1';
var nodes = babe.parse(source);
console.log(nodes)


process.stdin.resume();