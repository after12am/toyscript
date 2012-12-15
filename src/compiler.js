
var Compiler = function() {
    this.log = new Log();
    this.script;
}

Compiler.prototype.compile = function(code) {
    
    var res = false;
    
    // source -> tokens
    var tokenizer = new Tokenizer(code, this.log);
    var tokens = tokenizer.tokenize();
    
    if (this.log.hasErrors == false) {
        // tokens -> javascript
        if (tokens && tokens.length > 0) {
            // parse tokens
            // new Parser().parse(this.tokens);
            new Console(this.log).out();
        }
    }
    
    new Console(this.log).out();
}

exports.compile = function(code, options) {
    
    var compiler = new Compiler();
    
    compiler.compile(code);
    
    return (!compiler.log.hasErrors);
}