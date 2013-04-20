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
    var lexer = new Lexer(this.source);
    var tokens;
    var nodes;
    var javascript;
    
    if (tokens = lexer.tokenize()) {
        if (nodes = new Parser(tokens, log).parse()) {
            javascript = escodegen.generate(nodes)
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