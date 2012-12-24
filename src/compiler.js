var Compiler = function(source) {
    this.source = source;
}

Compiler.prototype.compile = function() {
    
    if (typeof this.source !== 'string') {
        console.error('input type is not string.');
        return;
    }
    
    var log = new Log();
    var tokenizer = new Tokenizer(this.source);
    var tokens;
    var ast;
    var compiled;
    
    if (tokens = tokenizer.tokenize()) {
        if (ast = new Parser(tokens, log).parse()) {
            compiled = new CodeGen(ast).generate();
        }
    }
    
    return {
        'source': this.source,
        'tokens': token,
        'ast': ast,
        'compiled': compiled,
        'log': log,
        'error': log.hasError()
    }
}

exports.tokenize = function(source) {
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    tokens = tokenizer.tokenize();
    return tokens;
}

exports.parse = function(source) {
    var tokens = exports.tokenize(source);
    var ast = new Parser(tokens).parse();
    return ast;
}

exports.codegen = function(source) {
    var ast = exports.parse(source);
    var compiled = new CodeGen(ast).generate();
    return compiled;
}

exports.compile = function(source) {
    var compiler = new Compiler(source);
    compiler.compile();
    return (!compiler.log.hasErrors);
}

exports.run = function(source) {
    var res = exports.compile(source);
    for (var i in res['log'].messages) {
        console.log(res['log'].messages[i]);
    }
    if (res['error'] === false) {
        eval(res['compiled']);
    }
    return res;
}

exports.interpret = function() {
    return exports.run();
}