var sprintf = require('sprintf').sprintf;

QUnit.module('Line Terminator');

test("\\r",function(){
    var source = '\r';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, source, "\\r");
});

test("\\n",function(){
    var source = '\n';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, source, "\\n");
});

test("\\r\\n",function(){
    var source = '\r\n';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, source, "\\r\\n");
});

QUnit.module('INDENT');

test("line",function(){
    var source = '    ';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, 4, 'indent size is valid');
});

test("multiple lines",function(){
    var source = '\r\
    ';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, 0, 'indent size is valid');
    equal(tokens[2].text, 4, 'indent size is valid');
});

test("multiple lines",function(){
    var source = '\r\
    class test {\r\
        \r\
    }\r';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, 0, 'indent size is valid');
    equal(tokens[2].text, 4, 'indent size is valid');
    equal(tokens[7].text, 8, 'indent size is valid');
    equal(tokens[9].text, 4, 'indent size is valid');
    equal(tokens[11].text, 0, 'indent size is valid');
});

QUnit.module("IDENT");

test("ok if beginning with a lowercase letter",function(){
    var source = "ident";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, 'ok if beginning with a lowercase letter');
});

test("ok if beginning with a uppercase letter",function(){
    var source = "IDENT";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, 'ok if beginning with a uppercase letter');
});

test("ok if beginning with a underbar letter",function(){
    var source = "_ident";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source);
});

test("ok if using a-zA-Z0-9 letters",function(){
    var source = "_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, 'available letters are a-zA-Z0-9');
});

test("banned if beginning with 0",function(){
    var source = "0";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 1",function(){
    var source = "1";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 2",function(){
    var source = "2";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 3",function(){
    var source = "3";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 4",function(){
    var source = "4";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 5",function(){
    var source = "5";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 6",function(){
    var source = "6";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 7",function(){
    var source = "7";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 8",function(){
    var source = "8";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

test("banned if beginning with 9",function(){
    var source = "9";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'DIGIT', "banned if beginning with digit");
});

QUnit.module('STRING');

test("missing single quotation",function(){
    try {
        var source = "'";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("missing single quotation",function(){
    try {
        var source = "'test";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\r",function(){
    try {
        var source = "'test\r";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\n",function(){
    try {
        var source = "'test\n";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\r\\n",function(){
    try {
        var source = "'test\r\n";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\r",function(){
    try {
        var source = "'test\r'";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("string with single quotation",function(){
    var source = "'test'";
    var tokens = babe.tokenize(source);
    equal(sprintf("'%s'", tokens[1].text), source);
});

test("missing double quotation",function(){
    var source = "\"";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, e);
    }
});


test("missing double quotation",function(){
    var source = "\"test";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\r",function(){
    var source = "\"test\r\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\n",function(){
    var source = "\"test\n\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\r\\n",function(){
    var source = "\"test\r\n\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, e);
    }
});

test("string with a line break:\\r",function(){
    try {
        var source = "\"test\r\"";
        var tokens = babe.tokenize(source);
        ok(0, 'failed');
    } catch (e) {
        ok(1, e);
    }
});

test("string with double quotation",function(){
    var source = "\"test\"";
    var tokens = babe.tokenize(source);
    equal(sprintf("\"%s\"", tokens[1].text), source);
});

QUnit.module('PUNCTUATOR');

test("1 punctuator",function(){
    var source = '{';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '}';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '(';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = ')';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '[';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = ']';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = ':';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = ',';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '.';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '+';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '-';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '*';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '/';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '%';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '<';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '>';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '&';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '!';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '|';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '^';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '~';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '?';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
});

test("2 punctuator",function(){
    var source = '*=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '/=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '%=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '+=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '-=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '&=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '^=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '|=';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '++';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '--';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '>>';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '<<';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '&&';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = '||';
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
});

test("3 punctuator",function(){
    var source = "<<=";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = ">>=";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = "!==";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = "===";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = ">>>";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
    
    var source = "<<<";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
});

test("4 punctuator",function(){
    var source = ">>>=";
    var tokens = babe.tokenize(source);
    equal(tokens[1].text, source, source);
});
