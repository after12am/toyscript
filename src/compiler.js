exports.appName = 'babe';

var Compiler = function() {
    
}

Compiler.prototype.compile = function(source) {
    
    if (typeof source !== 'string') {
        console.error('[bebe] input type is not string.');
        return 0;
    }
    
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    
    tokenizer.tokenize();
    
    
    
    /*
    var tokenizer = new Tokenizer(source);
    
    try {
        tokens = tokenizer.tokenize();
    } catch (e) {
        console.error(e);
        return 0;
    }
    
    if (tokens.length == 0) {
        return 0;
    }
    
    var source = new Parser(tokens, this.log).parse();
    
    this.log.out();
    
    return (!this.log.hasErrors);
    */
}

exports.tokenize = function(source) {
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    tokens = tokenizer.tokenize();
    return tokens;
}

exports.compile = function(source, options) {
    var compiler = new Compiler();
    compiler.compile(source);
    return (!compiler.log.hasErrors);
}

exports.interpret = function() {
    
}

exports.Compiler = Compiler;