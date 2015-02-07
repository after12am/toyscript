var sprintf = require('sprintf').sprintf;
var fs = require('fs');
var toyscript = require('../build/node-toyscript');
var colors = require('colors');

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

var passed = [];
var failed = [];

//

function summary() {
    var len = passed.length + failed.length;
    var format = passed.length === len ? "[%s/%s]".info : "[%s/%s]".error;
    console.log(sprintf("\n"+format, passed.length, len));
}

function run(test) {
    var no = passed.length + failed.length + 1;
    var res;
    var data = fs.readFileSync(test, 'utf8');
    var m = data.match(/^\/\+\n([\s\S.]*)\n\+\/\n([\s\S.]*)/);
    if (!m) {
        console.log(sprintf("%2s. %s => code not found".error, no, test));
        failed.push(test);
        return;
    }
    var expect = m[1];
    var code = m[2];
    
    try {
        res = toyscript.compile(code);
    } catch (e) {
        res = e.toString();
    }
    
    if (res === expect) {
        console.log(sprintf("%2s. %s => success".verbose, no, test));
        passed.push(test);
    } else {
        console.log(sprintf("%2s. %s => failure".error, no, test));
        console.log("\n============ expect ============".error);
        console.log(expect.toString().error);
        console.log("\n============ actual ============".error);
        console.log((res ? res : 'undefined').error, "\n");
        failed.push(test);
    }
}

console.log('\nrunning test...\n')

fs.readdirSync('./').filter(function(f) {
    return f.match(/^test\.(.+)\.typ$/);
}).map(run);

summary();

process.stdin.resume();