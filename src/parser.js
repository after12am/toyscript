
var Expression = function(location) {
    this.location = location;
}

var NewExpression = function(location) {
    Expression.call(this, location);
}
NewExpression.prototype = new Expression();
NewExpression.prototype.toString = function() {
    return '\n';
}

var Parser = function(tokens, log) {
    
    this.index = 0;
    this.log = log;
    this.tokens = tokens;
    this.context = [];
}

Parser.prototype.parse = function() {
    
    while (this.index < this.tokens.length) {
        
        if (!this.tokens[this.index]) {
            break;
        }
        
        switch (this.tokens[this.index].kind) {
            
            case 'NEWLINE':
                this.parseNewExpression();
                break;
            
            default:
                console.log(this.tokens[this.index])
                this.index++;
                break;
        }
        
    }
}

Parser.prototype.parseNewExpression = function() {
    this.index++;
    return new NewExpression();
}
