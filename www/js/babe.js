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
    
    for (var i in this.log.messages) {
        
        var message = this.log.messages[i];
        
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

// Operators
var LPAREN = "(";
var RPAREN = ")";
var LBRACKET = "[";
var RBRACKET = "]";
var LBRACE = "{";
var RBRACE = "}";
var COMMA = ",";
var SEMICOLON = ";";
var DOT = ".";
var INC = "++";
var DEC = "--";
var ADD_ASSIGN = "+=";
var SUB_ASSIGN = "-=";
var MUL_ASSIGN = "*=";
var DIV_ASSIGN = "/=";
var MOD_ASSIGN = "%=";
var ADD = "+";
var SUB = "-";
var MUL = "*";
var DIV = "/";
var MOD = "%";
var EQUAL = "=";
var NOT_EQUALE = "!=";
var LESS_EQUALE = "<=";
var GREAT_EQUALE = ">=";
var LESS = "<";
var GREAT = ">";
var ASSIGN = "=";

// Keywords
var AND = "AND";
var OR = "OR";
var XOR = "XOR";
var IN = "IN";
var IS = "IS";
var NOT = "NOT";
var RETURN = "RETURN";
var IF = "IF";
var ELSE = "ELSE";
var WHILE = "WHILE";
var FOR = "FOR";
var CONTINUE = "CONTINUE";
var BREAK = "BREAK";
var CLASS = "CLASS";
var NULL = "NULL";
var THIS = "THIS";
var TRUE = "TRUE";
var FALSE = "FALSE";

// Literals
var IDENT = "IDENT";
var LETTER = "LETTER";
var DIGIT = "DIGIT";
var STRING = "STRING";
var NEWLINE = "NEWLINE";
var END_OF_FILE = "END_OF_FILE";
var SNG_QUOT = "'";
var DBL_QUOT = "\"";


var Keywords = [];

[AND, OR, XOR, IN, IS, NOT, RETURN, IF, ELSE, WHILE, FOR, CONTINUE, BREAK, CLASS, NULL, THIS, TRUE, FALSE].forEach(function(c) {
    Keywords[c] = c;
});

var chars = [];

['_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ].forEach (function(c) {
    chars[c] = LETTER;
});

['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach (function(c) {
    chars[c] = DIGIT;
});

var ops = {'(': 'LPAREN', ')': 'RPAREN', '[': 'LBRACKET', ']': 'RBRACKET', '{': 'LBRACE', '}': 'RBRACE', ',': 'COMMA', ';': 'SEMICOLON', '.': 'DOT', '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD', '=': 'EQUAL', '\'': 'SNG_QUOT', '"': 'DBL_QUOT', '<': 'LESS', '>': 'GREAT', '=': 'ASSIGN'};
for (var c in ops) {
    chars[c] = ops[c];
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
            tokens.push(new Token(new Location(line), NEWLINE, c));
            line++;
        }
        
        if (this.isWhiteSpace(c)) {
            continue;
        }
        
        switch (chars[c]) {
            case LETTER:
                var token = new Token(new Location(line), IDENT, c);
                for (var c = this.nextChar(); chars[c] == LETTER; c = this.nextChar()) {
                    token.append(c);
                }
                if (Keywords[token.text.toUpperCase()]) {
                    token.kind = token.text.toUpperCase();
                }
                this.index--;
                tokens.push(token);
                break;
            case DIGIT:
                var token = new Token(new Location(line), DIGIT, c);
                for (var c = this.nextChar(); chars[c] == DIGIT; c = this.nextChar()) {
                    token.append(c);
                }
                this.index--;
                tokens.push(token);
                break;
            case SNG_QUOT:
                var token = new Token(new Location(line), STRING, '');
                for (var c = this.nextChar(); chars[c] != SNG_QUOT && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    this.log.error(new Location(line), 'closing single quotation is missing');
                    line++;
                }
                tokens.push(token);
                break;
            case DBL_QUOT:
                var token = new Token(new Location(line), STRING, '');
                for (var c = this.nextChar(); chars[c] != DBL_QUOT && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    this.log.error(new Location(line), 'closing double quotation is missing');
                    line++;
                }
                tokens.push(token);
                break;
            default:
                var token = new Token(new Location(line), chars[c], c);
                if (token.kind) {
                    for (var c = this.nextChar(); chars[c] == token.kind; c = this.nextChar()) {
                        token.append(c);
                    }
                    this.index--;
                } else {
                    this.log.error(new Location(line), 'undefined token');
                }
                tokens.push(token);
                break;
        }
    }
    
    tokens.push(new Token(new Location(line), END_OF_FILE));
    
    return tokens;
}

Tokenizer.prototype.nextChar = function() {
    return this.source[this.index++];
}

Tokenizer.prototype.isWhiteSpace = function(char) {
    return char.match(/\s/);
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
        if (tokens[i].kind != NEWLINE) {
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
