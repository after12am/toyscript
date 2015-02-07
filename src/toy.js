var executable;

/*
    break a stream of token
*/
exports.tokenize = function(source) {
    return new Lexer(source).tokenize();
}

/*
    create abstract syntax tree from tokens
*/
exports.parse = function(source) {
    return new Parser(exports.tokenize(source)).parse();
}

/*
    convenience function of toy.compile()
*/
exports.codegen = function(nodes) {
    return escodegen.generate(nodes);
}

/*
    convert javascript to toyscript
*/
exports.compile = function(source) {
    return exports.codegen(exports.parse(source));
}

/*
    execute toyscript after compiled
*/
exports.run = function() {
    if (executable) {
        return new Function(executable)();
    }
    throw new Error("has to call after compile. confirm whether compile() have been called");
}

/*
    execute toyscript
*/
exports.interpret = function(source) {
    return new Function(exports.compile(source))();
}