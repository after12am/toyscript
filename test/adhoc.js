var fs = require('fs');
var babe = require('../build/node-babe');

var source = fs.readFileSync('source.babe.js', 'utf8');

try {
    console.log("\n\n\n\n\n");
    console.log("\n========== nodes ===========");
    var nodes = babe.parse(source);
    console.log(nodes);
    
    console.log("\n========= codegen ==========");
    var script = babe.codegen(nodes);
    console.log(script);
    
    console.log("\n=========== eval ===========");
    console.log('result: ', eval(script));
    
} catch (e) {
    console.log(e);
}

console.log('\n\n');
process.stdin.resume();