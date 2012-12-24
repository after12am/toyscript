module('LineTerminator');

test("\r",function(){
    var source = '\r';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, source);
});

test("\n",function(){
    var source = '\n';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, source);
});

test("\r\n",function(){
    var source = '\r\n';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, source);
});


module('INDENT');

test("ok",function(){
    var source = '    ';
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, 4);
});

test("ok",function(){
    var source = '\r\
    ';
    
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, 0);
    equal(tokens[2].text, 4);
});

test("ok",function(){
    var source = '\r\
    class test {\r\
        \r\
    }\r';
    
    var tokens = babe.tokenize(source);
    equal(tokens[0].text, 0);
    equal(tokens[2].text, 4);
    equal(tokens[7].text, 8);
    equal(tokens[9].text, 4);
    equal(tokens[11].text, 0);
});

module("IDENT");

test("Begin with a lowercase letter",function(){
    var source = "ident";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'IDENT');
    equal(tokens[1].text, source);
});

test("Begin with a uppercase letter",function(){
    var source = "IDENT";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'IDENT');
    equal(tokens[1].text, source);
});

test("Begin with a underbar letter",function(){
    var source = "_ident";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'IDENT');
    equal(tokens[1].text, source);
});

test("a-zA-Z0-9 letters are available",function(){
    var source = "_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var tokens = babe.tokenize(source);
    equal(tokens[1].kind, 'IDENT');
    equal(tokens[1].text, source);
});

test("In case of beginning with 0, banned",function(){
    var source = "0";
    var tokens = babe.tokenize(source);
    equal(tokens[0].kind, 'INDENT');
    equal(tokens[1].kind, 'DIGIT');
});

test("In case of beginning with 1, banned",function(){
    var source = "1";
    var tokens = babe.tokenize(source);
    equal(tokens[0].kind, 'INDENT');
    equal(tokens[1].kind, 'DIGIT');
});

module('SINGLE QUAT');

test("error check",function(){
    var source = "'";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});


test("test",function(){
    var source = "'test";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "'test\r\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "'test\n\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "'test\r\n\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "'test'";
    var tokens = babe.tokenize(source);
    equal("'" + tokens[1].text + "'", source);
});

module('DOUBLE QUAT');

test("error check",function(){
    var source = "\"";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});


test("test",function(){
    var source = "\"test";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "\"test\r\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "\"test\n\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "\"test\r\n\
    ";
    try {
        var tokens = babe.tokenize(source);
        ok(0, 'error has not occured');
    } catch (e) {
        ok(1, 'error occured');
    }
});

test("test",function(){
    var source = "\"test\"";
    var tokens = babe.tokenize(source);
    equal("\"" + tokens[1].text + "\"", source);
});

module('PUNCTUATOR');

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
