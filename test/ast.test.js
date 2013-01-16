function d(ss) {
    console.log(ss);
}

module('definition of property');

test("a",function(){
    try {
        var source = 'a';
        var nodes = babe.parse(source);
        ok(0, 'Variable declaration　error has not occuerd.');
    } catch(e) {
        ok(1, 'Variable declaration　error has occuerd.');
    }
});

test("a = None",function(){
    var source = 'a = None';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name, 'null', nodes[0].right.type + ' is ok');
});

test("a = 1",function(){
    var source = 'a = 1';
    
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name, 1, nodes[0].right.type + ' is ok');
});

test("a = \"aa\"",function(){
    var source = 'a = "aa"';
    
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name,'aa', nodes[0].right.type + ' is ok');
});

test("a = NaN",function(){
    var source = 'a = NaN';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name,'NaN', nodes[0].right.type + ' is ok');
});

test("a = Infinity",function(){
    var source = 'a = Infinity';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name,'Infinity', nodes[0].right.type + ' is ok');
});

var source = 'a = true';
var nodes = babe.parse(source);
test("a = true",function(){
    var source = 'a = true';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name,'true', nodes[0].right.type + ' is ok');
});

test("a = false",function(){
    var source = 'a = false';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name,'false', nodes[0].right.type + ' is ok');
});

test("expected indent error occured",function(){
    try {
        var source = '\
        a = 1\
        ';
        var nodes = babe.parse(source);
    } catch (e) {
        ok(1, 'expected indent error occured');
    }
});

test("a = []",function(){
    var source = 'a = []';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    ok(nodes[0].right.name, [], nodes[0].right.type + ' is ok');
});

test("a = [1, 2]",function(){
    var source = 'a = [1, 2]';
    var nodes = babe.parse(source);
    equal(nodes[0].left.name, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.name[0].name, 1, nodes[0].right.type + ' is ok');
    equal(nodes[0].right.name[1].name, 2, nodes[0].right.type + ' is ok');
});
