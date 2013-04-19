var Compiler = function(source) {
    this.name = 'Compiler';
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
    var javascript;
    
    if (tokens = tokenizer.tokenize()) {
        if (nodes = new Parser(tokens, log).parse()) {
            javascript = exports.escodegen.generate(nodes)
        }
    }
    
    return {
        'source': this.source,
        'tokens': token,
        'nodes': nodes,
        'javascript': javascript,
        'log': log,
        'error': log.hasError()
    }
}