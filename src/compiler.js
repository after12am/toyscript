
var Compiler = function() {
    this.log = new Log();
    this.tokens = [];
    this.script;
}

Compiler.prototype.compile = function(code) {
    
    var tokenizer = new Tokenizer(code);
    
    try {
        this.tokens = tokenizer.tokenize();
    } catch (e) {
        console.error(e);
        return 0;
    }
    
    if (this.tokens.length == 0) {
        return 0;
    }
    
    var code = new Parser(this.tokens, this.log).parse();
    
    this.log.out();
    
    return (!this.log.hasErrors);
}

exports.compile = function(code, options) {
    
    var compiler = new Compiler();
    
    compiler.compile(code);
    
    return (!compiler.log.hasErrors);
}

exports.interpret = function() {
    
}

exports.Compiler = Compiler;