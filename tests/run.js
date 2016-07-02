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

function summary() {
    var len = passed.length + failed.length;
    var format = passed.length === len ? "[%s/%s]".info : "[%s/%s]".error;
    console.log(sprintf("\n"+format, passed.length, len));
}

function run(testcase) {
    var no = passed.length + failed.length + 1;
    var res;
    var data = fs.readFileSync(testcase, 'utf8');
    
    var m = data.match(/^\/\+\n([\s\S.]*)\n\+\/\n([\s\S.]*)/);
    if (!m) {
        console.log(sprintf("%2s. %s => code not found".error, no, testcase));
        failed.push(testcase);
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
        console.log(sprintf("%2s. %s => success".verbose, no, testcase));
        passed.push(testcase);
    } else {
        console.log(sprintf("%2s. %s => failure".error, no, testcase));
        console.log("\n============ expect ============".error);
        console.log(expect.toString().error);
        console.log("\n============ actual ============".error);
        console.log((res ? res : 'undefined').error, "\n");
        failed.push(testcase);
        throw "error has occured";
    }
}

console.log('\nrunning test...\n')

function accepts(filename) {
    return filename.match(/^test\.(.+)\.tys$/);
}

fs.readdirSync('tests/').filter(accepts).map(function(filename) {
  return 'tests/' + filename;
}).map(run);

summary();

// process.stdin.resume();