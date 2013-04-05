var fs = require('fs');
var babe = require('../babe');

var source = fs.readFileSync('source.babe.js', 'utf8');

try {
    var nodes = babe.parse(source);
    console.log('result: ', nodes)
} catch (e) {
    console.log(e)
}

console.log('\n\n')
process.stdin.resume();