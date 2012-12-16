/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2012 Satoshi Okami
 * Released under the MIT license
 */
var babe = (function() {
var exports = {};

// src/log.js

var Message = function(type, line, text) {
    this.type = type;
    this.line = line;
    this.text = text;
}

var Log = function() {
    this.messages = [];
    this.hasErrors = false;
};

Log.prototype.log = function(location, text) {
    this.messages.push(new Message('log', location.line, text));
};

Log.prototype.info = function(location, text) {
    this.messages.push(new Message('info', location.line, text));
};

Log.prototype.debug = function(location, text) {
    this.messages.push(new Message('debug', location.line, text));
};

Log.prototype.warn = function(location, text) {
    this.messages.push(new Message('warn', location.line, text));
};

Log.prototype.error = function(location, text) {
    this.messages.push(new Message('error', location.line, text));
    this.hasErrors = true;
};

Log.prototype.out = function() {
    
    for (var i in this.messages) {
        
        var message = this.messages[i];
        
        switch (message.type) {
            case 'info':
                console.log('line ' + message.line + ': ' + message.text);
                break;
            case 'debug':
                console.debug('line ' + message.line + ': ' + message.text);
                break;
            case 'error':
                console.error('line ' + message.line + ': ' + message.text);
                break;
            case 'warn':
                console.warn('line ' + message.line + ': ' + message.text);
                break;
            case 'log':
                console.log('line ' + message.line + ': ' + message.text);
                break;
        }
    }
}
// src/token.js

var Keywords = [];

['AND', 'OR', 'XOR', 'IN', 'IS', 'NOT', 'RETURN', 'IF', 'ELSE', 'WHILE', 'FOR', 'CONTINUE', 'BREAK', 'CLASS', 'NULL', 'THIS', 'TRUE', 'FALSE'].forEach(function(c) {
    Keywords[c] = c;
});

var chars1 = [];

['_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ].forEach (function(c) {
    chars1[c] = 'LETTER';
});

['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach (function(c) {
    chars1[c] = 'DIGIT';
});

var symbols = {'(': 'LPAREN', ')': 'RPAREN', '[': 'LBRACKET', ']': 'RBRACKET', '{': 'LBRACE', '}': 'RBRACE', ',': 'COMMA', ';': 'SEMICOLON', '.': 'DOT', '\'': 'SNG_QUOT', '"': 'DBL_QUOT'};
for (var c in symbols) {
    chars1[c] = symbols[c];
}

var operator1 = {'+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD', '<': 'LESS', '>': 'GREAT', '=': 'ASSIGN'};
for (var c in operator1) {
    chars1[c] = operator1[c];
}

var chars2 = [];

var operator2 = {'++': 'INC', '--': 'DEC', '+=': 'ADD_ASSIGN', '-=': 'SUB_ASSIGN', '*=': 'MUL_ASSIGN', '/=': 'DIV_ASSIGN', '%=': 'MOD_ASSIGN', '!=': 'NOT_EQUALE', '<=': 'LESS_EQUALE', '>=': 'GREAT_EQUALE', '==': 'EQUAL'};
for (var c in operator2) {
    chars2[c] = operator2[c];
}

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

var Tokenizer = function(source, log) {
    this.index = 0;
    this.source = source;
    this.log = log;
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
        
        switch (chars1[c]) {
            case 'LETTER':
                var token = new Token(new Location(line), 'IDENT', c);
                for (var c = this.nextChar(); chars1[c] == 'LETTER'; c = this.nextChar()) {
                    token.append(c);
                }
                if (Keywords[token.text.toUpperCase()]) {
                    token.kind = token.text.toUpperCase();
                }
                this.index--;
                tokens.push(token);
                break;
            case 'DIGIT':
                var token = new Token(new Location(line), 'DIGIT', c);
                for (var c = this.nextChar(); chars1[c] == 'DIGIT'; c = this.nextChar()) {
                    token.append(c);
                }
                this.index--;
                tokens.push(token);
                break;
            case 'SNG_QUOT':
                var token = new Token(new Location(line), 'STRING', '');
                for (var c = this.nextChar(); chars1[c] != 'SNG_QUOT' && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    this.log.error(new Location(line), 'closing single quotation is missing');
                    line++;
                }
                tokens.push(token);
                break;
            case 'DBL_QUOT':
                var token = new Token(new Location(line), 'STRING', '');
                for (var c = this.nextChar(); chars1[c] != 'DBL_QUOT' && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    this.log.error(new Location(line), 'closing double quotation is missing');
                    line++;
                }
                tokens.push(token);
                break;
            default:
                var token = new Token(new Location(line), chars1[c], c);
                if (token.kind) {
                    if (operator1[token.text]) {
                        var c2 = token.text + this.nextChar();
                        if (operator2[c2]) {
                            token.kind = operator2[c2];
                            token.text = c2;
                        } else {
                            this.index--;
                        }
                    } else {
                        for (var c = this.nextChar(); chars1[c] == token.kind; c = this.nextChar()) {
                            token.append(c);
                        }
                        this.index--;
                    }
                } else {
                    var c2 = token.text + this.nextChar();
                    // in case of '!='
                    if (operator2[c2]) {
                        token.kind = operator2[c2];
                        token.text = c2;
                    } else {
                        this.index--;
                        this.log.error(new Location(line), 'undefined token: ' + c);
                    }
                }
                tokens.push(token);
                break;
        }
    }
    
    tokens.push(new Token(new Location(line), 'END_OF_FILE'));
    return tokens;
}

Tokenizer.prototype.nextChar = function() {
    return this.source[this.index++];
}

Tokenizer.prototype.isWhiteSpace = function(c) {
    return c.match(/\s/);
}
// src/parser.js

var Parser = function() {
    
}

Parser.prototype.parse = function(tokens) {
    
}
// src/compiler.js

var Compiler = function() {
    this.log = new Log();
    this.script;
}

Compiler.prototype.compile = function(code) {
    
    var res = false;
    
    // source -> tokens
    var tokenizer = new Tokenizer(code, this.log);
    var tokens = tokenizer.tokenize();
    
    for (var i in tokens) {
        if (tokens[i].kind != 'NEWLINE') {
            console.log(tokens[i].location.toString() + "\t" + tokens[i].kind + "\t\t" + tokens[i].text);
        }
    }
    
    if (this.log.hasErrors == false) {
        // tokens -> javascript
        if (tokens && tokens.length > 0) {
            // parse tokens
            // new Parser().parse(this.tokens);
        }
    }
    
    this.log.out();
}

exports.compile = function(code, options) {
    
    var compiler = new Compiler();
    
    compiler.compile(code);
    
    return (!compiler.log.hasErrors);
}
return exports;
})();
