
var Location = function(line) {
    this.line = line;
}

Location.prototype.toString = function() {
    return "on line " + this.line;
};

var Token = function(location, kind, text) {
    this.location = location;
    this.kind = kind;
    this.text = text;
}

Token.prototype.append = function(text) {
    this.text += text;
}

var Tokenizer = function(source) {
    
    var that = this;
    
    this.index = 0;
    this.source = source;
    this.ope1;
    this.ope2;
    this.ope3;
    this.keywords = [];
    this.symbols = [];
    this.ch1 = [];
    this.ch2 = [];
    this.ch3 = [];
    
    ['AND', 'OR', 'XOR', 'IN', 'IS', 'NOT', 'RETURN', 'IF', 'ELSE', 'WHILE', 'FOR', 'CONTINUE', 'BREAK', 'CLASS', 'NULL', 'THIS', 'TRUE', 'FALSE'].forEach(function(c) {
        that.keywords[c] = c;
    });
    
    ['_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ].forEach (function(c) {
        that.ch1[c] = 'LETTER';
    });
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach (function(c) {
        that.ch1[c] = 'DIGIT';
    });
    
    for (var c in this.symbols = {'(': 'LPAREN', ')': 'RPAREN', '[': 'LBRACKET', ']': 'RBRACKET', '{': 'LBRACE', '}': 'RBRACE', ',': 'COMMA', ';': 'SEMICOLON', '.': 'DOT', '\'': 'SNG_QUOT', '"': 'DBL_QUOT'}) {
        this.ch1[c] = this.symbols[c];
    }
    
    for (var c in this.ope1 = {'+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD', '<': 'LESS', '>': 'GREAT', '=': 'ASSIGN', '!': 'NOT'}) {
        this.ch1[c] = this.ope1[c];
    }
    
    for (var c in this.ope2 = {'++': 'INC', '--': 'DEC', '+=': 'ADD_ASSIGN', '-=': 'SUB_ASSIGN', '*=': 'MUL_ASSIGN', '/=': 'DIV_ASSIGN', '%=': 'MOD_ASSIGN', '!=': 'NOT_EQUALE', '<=': 'LESS_EQUALE', '>=': 'GREAT_EQUALE', '==': 'EQUAL'}) {
        this.ch2[c] = this.ope2[c];
    }
    
    for (var c in this.ope3 = {}) {
        /* unimplemented function */
        this.ch3[c] = this.ope3[c];
    }
}

Tokenizer.prototype.tokenize = function() {
    
    var tokens = [];
    var line = 1;
    
    for (this.index = 0; this.index < this.source.length;) {
        
        var c = this.nextChar();
        
        if (c == '\n') {
            tokens.push(new Token(new Location(line), 'NEWLINE', c));
            line++;
        }
        
        if (this.isWhiteSpace(c)) {
            continue;
        }
        
        var token = new Token(new Location(line));
        
        switch (this.ch1[c]) {
            case 'LETTER':
                token.kind = 'IDENT';
                token.text = c;
                for (var c = this.nextChar(); this.ch1[c] == 'LETTER'; c = this.nextChar()) {
                    token.append(c);
                }
                if (this.keywords[token.text.toUpperCase()]) {
                    token.kind = token.text.toUpperCase();
                }
                this.index--;
                break;
            case 'DIGIT':
                token.kind = 'DIGIT';
                token.text = c;
                for (var c = this.nextChar(); this.ch1[c] == 'DIGIT'; c = this.nextChar()) {
                    token.append(c);
                }
                this.index--;
                break;
            case 'SNG_QUOT':
                token.kind = 'STRING';
                token.text = '';
                for (var c = this.nextChar(); this.ch1[c] != 'SNG_QUOT' && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    throw new Location(line).toString() + ": closing single quotation is missing.";
                    line++;
                }
                break;
            case 'DBL_QUOT':
                token.kind = 'STRING';
                token.text = '';
                for (var c = this.nextChar(); this.ch1[c] != 'DBL_QUOT' && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    throw new Location(line).toString() + ": closing double quotation is missing.";
                    line++;
                }
                break;
            case 'ADD':
            case 'SUB':
            case 'MUL':
            case 'DIV':
            case 'MOD':
            case 'LESS':
            case 'GREAT':
            case 'ASSIGN':
            case 'NOT':
                token.kind = this.ch1[c];
                token.text = c;
                if (this.ope2[token.text + this.lookahead()]) {
                    token.kind = this.ope2[token.text + this.lookahead()];
                    token.text = token.text + this.lookahead();
                    this.index++;
                }
                break;
            case 'LPAREN':
            case 'RPAREN':
            case 'LBRACKET':
            case 'RBRACKET':
            case 'LBRACE':
            case 'RBRACE':
            case 'COMMA':
            case 'SEMICOLON':
            case 'DOT':
                token.kind = this.ch1[c];
                token.text = c;
                for (var c = this.nextChar(); this.ch1[c] == token.kind; c = this.nextChar()) {
                    token.append(c);
                }
                this.index--;
                break;
            default:
                // unexpected token
                this.index++;
                break;
        }
        
        if (token.kind) {
            tokens.push(token);
        } else {
            throw new Location(line).toString() + ": unexpected token '" + c + "'";
        }
    }
    tokens.push(new Token(new Location(line), 'END_OF_FILE', c));
    return tokens;
}

Tokenizer.prototype.isWhiteSpace = function(c) {
    return c.match(/\s/);
}

Tokenizer.prototype.nextChar = function() {
    return this.source[this.index++];
}

Tokenizer.prototype.lookahead = function() {
    if (this.index < this.source.length) {
        return this.source[this.index];
    }
    return '';
}