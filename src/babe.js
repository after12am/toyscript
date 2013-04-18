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
    var nodes = new Parser(tokens).parse();
    return nodes;
}

/*
    convenience function of babe.compile()
*/
exports.codegen = function(source) {
    var nodes = exports.parse(source);
    var javascript = escodegen.generate(nodes)
    return javascript;
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