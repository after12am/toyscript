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
    var nodes;
    var compiled;
    
    if (tokens = tokenizer.tokenize()) {
        if (nodes = new Parser(tokens, log).parse()) {
            compiled = new CodeGen(nodes).generate();
        }
    }
    
    return {
        'source': this.source,
        'tokens': token,
        'nodes': nodes,
        'compiled': compiled,
        'log': log,
        'error': log.hasError()
    }
}