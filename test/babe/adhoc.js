var fs = require('fs');
var babe = require('../babe');

var source = fs.readFileSync('source.babe.js', 'utf8');

try {
    var nodes = babe.parse(source);
    console.log('result: ', nodes);
    console.log(babe.escodegen.generate(nodes, {comment: true}));
    
} catch (e) {
    console.log(e);
}

console.log('\n\n');
process.stdin.resume();