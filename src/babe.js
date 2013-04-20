/*
    break a stream of token
*/
exports.tokenize = function(source) {
    return new Tokenizer(source).tokenize();
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
    throw new Error('not implemented');
}

/*
    execute babescript
*/
exports.interpret = function(source) {
    throw new Error('not implemented');
}

/*
    alias of babe.interpret()
*/
exports.run = exports.interpret;