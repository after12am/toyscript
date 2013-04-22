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
    convenience function of babe.compile()
*/
exports.codegen = function(nodes) {
    return escodegen.generate(nodes);
}

/*
    convert javascript to babescript
*/
exports.compile = function(source) {
    return exports.codegen(exports.parse(source));
}

/*
    execute babescript after compiled
*/
exports.run = function() {
    if (executable) {
        return eval(executable);
    }
    throw new Error("has to call after compile. confirm whether compile() have been called");
}

/*
    execute babescript
*/
exports.interpret = function(source) {
    return eval(exports.compile(source));
}