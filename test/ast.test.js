module('property');

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
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value, 'null', nodes[0].right.type + ' is ok');
});

test("a = 1",function(){
    var source = 'a = 1';
    
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value, 1, nodes[0].right.type + ' is ok');
});

test("a = \"aa\"",function(){
    var source = 'a = "aa"';
    
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value,'aa', nodes[0].right.type + ' is ok');
});

test("a = NaN",function(){
    var source = 'a = NaN';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value,'NaN', nodes[0].right.type + ' is ok');
});

test("a = Infinity",function(){
    var source = 'a = Infinity';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value,'Infinity', nodes[0].right.type + ' is ok');
});

var source = 'a = true';
var nodes = babe.parse(source);
test("a = true",function(){
    var source = 'a = true';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value,'true', nodes[0].right.type + ' is ok');
});

test("a = false",function(){
    var source = 'a = false';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.value,'false', nodes[0].right.type + ' is ok');
});

test("expected indent error occured",function(){
    try {
        var source = '\
        a = 1\
        ';
        var nodes = babe.parse(source);
        console.log(nodes)
        ok(0, 'unexpected');
    } catch (e) {
        ok(1, 'expected indent error occured');
    }
});

test("a = []",function(){
    var source = 'a = []';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    ok(nodes[0].right.elements, [], nodes[0].right.type + ' is ok');
});

test("a = [1, 2]",function(){
    var source = 'a = [1, 2]';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.elements[0].value, 1, nodes[0].right.type + ' is ok');
    equal(nodes[0].right.elements[1].value, 2, nodes[0].right.type + ' is ok');
});

test("a = {}",function(){
    var source = 'a = {}';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.properties.length, 0, nodes[0].right.type + ' is ok');
});

test("a = {\"a\":1, \"b\":2}",function(){
    var source = 'a = {"a":1, "b":2}';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.properties[0].left.value, 'a', nodes[0].right.type + ' is ok');
    equal(nodes[0].right.properties[0].right.value, '1', nodes[0].right.type + ' is ok');
    equal(nodes[0].right.properties[1].left.value, 'b', nodes[0].right.type + ' is ok');
    equal(nodes[0].right.properties[1].right.value, '2', nodes[0].right.type + ' is ok');
});

test("a = {} a['b'] = 1",function(){
var source = '\
a = {}\
a["b"] = 1\
';
    var nodes = babe.parse(source);
    equal(nodes[0].left.value, 'a', nodes[0].left.type + ' is ok');
    equal(nodes[0].operator, '=', nodes[0].type + ' is ok');
    equal(nodes[0].right.properties.length, 0, nodes[0].type + ' is ok');
    equal(nodes[1].left.member.value, 'a', nodes[0].right.type + ' is ok');
    equal(nodes[1].left.expr.value, 'b', nodes[0].right.type + ' is ok');
    equal(nodes[1].operator, '=', nodes[0].right.type + ' is ok');
    equal(nodes[1].right.value, '1', nodes[0].right.type + ' is ok');
});

test("a = {1, 2}",function(){
    try {
        var source = 'a = {1, 2}';
        var nodes = babe.parse(source);
        ok(0, 'unexpected');
    } catch (e) {
        ok(1, 'expected error has occured');
    }
});

test("a = ",function(){
    try {
        var source = 'a = ';
        var nodes = babe.parse(source);
        ok(0, 'unexpected');
    } catch (e) {
        ok(1, 'expected error has occured');
    }
});

test("a = {'b':1} a.b = 1",function(){
var source = '\
a = {"b":1}\
a.b = 1\
';
    try {
        var nodes = babe.parse(source);
        ok(0, 'unexpected');
    } catch (e) {
        ok(1, 'expected error has occured');
    }
});

module('comment');

test("# comment",function(){
    var source = '# comment';
    var nodes = babe.parse(source);
    equal(nodes[0].value, ' comment', nodes[0].type + ' is ok');
});

test("/* comment */",function(){
var source = '\
/*\n\
    comment\n\
*/';
    var nodes = babe.parse(source);
    equal(nodes[0].value, '\n\
    comment\n\
', nodes[0].type + ' is ok');
});

module('conditions');

test("if",function(){
var source = "\
if a:\n\
    a = 2\n\
    b = 2\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].alternate === null);
    ok(nodes[0].condition.value === 'a');
    ok(nodes[0].statements.length === 2);
    ok(nodes[0].statements[0].left.value == 'a');
    ok(nodes[0].statements[0].right.value == 2);
    ok(nodes[0].statements[1].left.value == 'b');
    ok(nodes[0].statements[1].right.value == 2);
});

test("else",function(){
var source = "\
if a:\n\
    a = 2\n\
    b = 2\n\
else:\n\
    c = 2\n\
    d = 2\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].condition.value === 'a');
    ok(nodes[0].statements.length === 2);
    ok(nodes[0].statements[0].left.value == 'a');
    ok(nodes[0].statements[0].right.value == 2);
    ok(nodes[0].statements[1].left.value == 'b');
    ok(nodes[0].statements[1].right.value == 2);
    ok(nodes[0].alternate[0].left.value == 'c');
    ok(nodes[0].alternate[0].right.value == 2);
    ok(nodes[0].alternate[1].left.value == 'd');
    ok(nodes[0].alternate[1].right.value == 2);
});

test("if equal condition",function(){
var source = "\
if a == 1:\n\
    a = 2\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].condition.left.value === 'a');
    ok(nodes[0].condition.operator === '==');
    ok(nodes[0].condition.right.value === '1');
    ok(nodes[0].condition.type === 'BinaryExpression');
});

test("else if",function(){
var source = "\
if a:\n\
    a = 2\n\
else if b == 1:\n\
    c = 2\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].alternate.condition.left.value === 'b');
    ok(nodes[0].alternate.condition.operator === '==');
    ok(nodes[0].alternate.condition.right.value === '1');
    ok(nodes[0].alternate.condition.type === 'BinaryExpression');
    ok(nodes[0].alternate.statements[0].left.value === 'c');
    ok(nodes[0].alternate.statements[0].operator === '=');
    ok(nodes[0].alternate.statements[0].right.value === '2');
});

test("if condition and",function(){
var source = "\
if a and 1:\n\
    a = 0\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].condition.left.value === 'a');
    ok(nodes[0].condition.operator === 'and');
    ok(nodes[0].condition.right.value === '1');
    ok(nodes[0].condition.type === 'LogicalExpression');
});

test("if condition or",function(){
var source = "\
if a or 1:\n\
    a = 0\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].condition.left.value === 'a');
    ok(nodes[0].condition.operator === 'or');
    ok(nodes[0].condition.right.value === '1');
    ok(nodes[0].condition.type === 'LogicalExpression');
});

test("if condition in",function(){
var source = "\
if a in 1:\n\
    a = 0\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].condition.left.value === 'a');
    ok(nodes[0].condition.operator === 'in');
    ok(nodes[0].condition.right.value === '1');
    ok(nodes[0].condition.type === 'ConditionalExpression');
});

test("if condition in",function(){
var source = "\
if a in 1:\n\
    a = 0\n\
";
    var nodes = babe.parse(source);
    ok(nodes[0].condition.left.value === 'a');
    ok(nodes[0].condition.operator === 'in');
    ok(nodes[0].condition.right.value === '1');
    ok(nodes[0].condition.type === 'ConditionalExpression');
});
