/*
    break a stream of token
*/
exports.tokenize = function(source) {
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    tokens = tokenizer.tokenize();
    return tokens;
}

/*
    create abstract syntax tree from tokens
*/
exports.parse = function(source) {
    var tokens = exports.tokenize(source);
    return new Parser(tokens).parse();
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