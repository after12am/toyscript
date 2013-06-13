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

function complete() {
    var elements = document.getElementsByTagName('script');
    for (var i = 0; i < elements.length; i++) {
        var e = elements[i];
        if (e.type && e.type.match('text/babe')) {
            if (code = e.innerHTML) exports.interpret(code);
            if (e.src) {
                var xhr　= new XMLHttpRequest();
                xhr.open('GET', e.src, true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        exports.interpret(xhr.responseText);
                    }
                }
                xhr.send();
            }
        }
    }
}

function ready() {
    if (document.readyState === 'complete') complete();
    else setTimeout(ready);
}

if (this.window) setTimeout(ready);