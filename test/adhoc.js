var fs = require('fs');
var babe = require('../build/node-babe');
var source = fs.readFileSync('source.babe.js', 'utf8');
var nodes, script;

try {
    console.log("\n\n\n\n\n");
    console.log("\n========== nodes ===========");
    nodes = babe.parse(source);
    console.log(nodes.body[0]);
    
    console.log("\n========= codegen ==========");
    script = babe.codegen(nodes);
    console.log(script);
    
    console.log("\n=========== eval ===========");
    console.log('result: ', eval(script));
    
} catch (e) {
    console.log(e);
}

console.log('\n\n');
//process.stdin.resume();