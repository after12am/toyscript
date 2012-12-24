function d(ss) {
    console.log(ss);
}

var source = '\
if a:\r\
    a = 1\r\
';
var nodes = babe.parse(source);
console.log(nodes)