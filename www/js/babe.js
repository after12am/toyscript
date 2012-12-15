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
// src/token.js

var KEYWORDS = [
    "AND",
    "OR",
    "IN",
    "NOT",
    "RETURN",
    "IF",
    "ELSE",
    "WHILE",
    "FOR",
    "CONTINUE",
    "BREAK",
    "CLASS",
    "NULL",
    "THIS",
    "TRUE",
    "FALSE",
    "DIGIT",
    "IDENT",
    "COMMENT",
    "EOF",
    "END_LIST"
];

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
var SINGLE_QUOT = "'";
var DOUBLE_QUOT = "\"";
var LESS = "<";
var GREAT = ">";
var ASSIGN = "=";
var ERROR = "ERROR";
var LETTER = "LETTER";
var DIGIT = "DIGIT";
var STRING = "STRING";
var IDENT = "IDENT";

var TokenKind = [];
TokenKind[LPAREN] = LPAREN;
TokenKind[RPAREN] = RPAREN;
TokenKind[LBRACKET] = LBRACKET;
TokenKind[RBRACKET] = RBRACKET;
TokenKind[LBRACE] = LBRACE;
TokenKind[RBRACE] = RBRACE;
TokenKind[COMMA] = COMMA;
TokenKind[SEMICOLON] = SEMICOLON;
TokenKind[DOT] = DOT;
TokenKind[INC] = INC;
TokenKind[DEC] = DEC;
TokenKind[ADD_ASSIGN] = ADD_ASSIGN;
TokenKind[SUB_ASSIGN] = SUB_ASSIGN;
TokenKind[MUL_ASSIGN] = MUL_ASSIGN;
TokenKind[DIV_ASSIGN] = DIV_ASSIGN;
TokenKind[MOD_ASSIGN] = MOD_ASSIGN;
TokenKind[ADD] = ADD;
TokenKind[SUB] = SUB;
TokenKind[MUL] = MUL;
TokenKind[DIV] = DIV;
TokenKind[MOD] = MOD;
TokenKind[EQUAL] = EQUAL;
TokenKind[NOT_EQUALE] = NOT_EQUALE;
TokenKind[LESS_EQUALE] = LESS_EQUALE;
TokenKind[GREAT_EQUALE] = GREAT_EQUALE;
TokenKind[SINGLE_QUOT] = SINGLE_QUOT;
TokenKind[DOUBLE_QUOT] = DOUBLE_QUOT;
TokenKind[LESS] = LESS;
TokenKind[GREAT] = GREAT;
TokenKind[ASSIGN] = ASSIGN;
TokenKind['_'] = LETTER;
TokenKind['a'] = LETTER;
TokenKind['b'] = LETTER;
TokenKind['c'] = LETTER;
TokenKind['d'] = LETTER;
TokenKind['e'] = LETTER;
TokenKind['f'] = LETTER;
TokenKind['g'] = LETTER;
TokenKind['h'] = LETTER;
TokenKind['i'] = LETTER;
TokenKind['j'] = LETTER;
TokenKind['k'] = LETTER;
TokenKind['l'] = LETTER;
TokenKind['m'] = LETTER;
TokenKind['n'] = LETTER;
TokenKind['o'] = LETTER;
TokenKind['p'] = LETTER;
TokenKind['q'] = LETTER;
TokenKind['r'] = LETTER;
TokenKind['s'] = LETTER;
TokenKind['t'] = LETTER;
TokenKind['u'] = LETTER;
TokenKind['v'] = LETTER;
TokenKind['w'] = LETTER;
TokenKind['x'] = LETTER;
TokenKind['y'] = LETTER;
TokenKind['z'] = LETTER;
TokenKind['A'] = LETTER;
TokenKind['B'] = LETTER;
TokenKind['C'] = LETTER;
TokenKind['D'] = LETTER;
TokenKind['E'] = LETTER;
TokenKind['F'] = LETTER;
TokenKind['G'] = LETTER;
TokenKind['H'] = LETTER;
TokenKind['I'] = LETTER;
TokenKind['J'] = LETTER;
TokenKind['K'] = LETTER;
TokenKind['L'] = LETTER;
TokenKind['M'] = LETTER;
TokenKind['N'] = LETTER;
TokenKind['O'] = LETTER;
TokenKind['P'] = LETTER;
TokenKind['Q'] = LETTER;
TokenKind['R'] = LETTER;
TokenKind['S'] = LETTER;
TokenKind['T'] = LETTER;
TokenKind['U'] = LETTER;
TokenKind['V'] = LETTER;
TokenKind['W'] = LETTER;
TokenKind['X'] = LETTER;
TokenKind['Y'] = LETTER;
TokenKind['Z'] = LETTER;
TokenKind['0'] = DIGIT;
TokenKind['1'] = DIGIT;
TokenKind['2'] = DIGIT;
TokenKind['3'] = DIGIT;
TokenKind['4'] = DIGIT;
TokenKind['5'] = DIGIT;
TokenKind['6'] = DIGIT;
TokenKind['7'] = DIGIT;
TokenKind['8'] = DIGIT;
TokenKind['9'] = DIGIT;

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
            line++;
        }
        
        if (this.isWhiteSpace(c)) {
            continue;
        }
        
        switch (TokenKind[c]) {
            case LETTER:
                var token = new Token(new Location(line), IDENT, c);
                for (var c = this.nextChar(); TokenKind[c] == LETTER; c = this.nextChar()) {
                    token.append(c);
                }
                for (var i in KEYWORDS) {
                    if (KEYWORDS[i] == token.text.toUpperCase()) {
                        token.kind = token.text.toUpperCase();
                    }
                }
                this.index--;
                break;
            case DIGIT:
                var token = new Token(new Location(line), DIGIT, c);
                for (var c = this.nextChar(); TokenKind[c] == DIGIT; c = this.nextChar()) {
                    token.append(c);
                }
                this.index--;
                break;
            case SINGLE_QUOT:
                var token = new Token(new Location(line), STRING, '');
                for (var c = this.nextChar(); TokenKind[c] != SINGLE_QUOT && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    this.log.error(new Location(line), 'closing single quotation is missing');
                    line++;
                }
                break;
            case DOUBLE_QUOT:
                var token = new Token(new Location(line), STRING, '');
                for (var c = this.nextChar(); TokenKind[c] != DOUBLE_QUOT && c != '\n'; c = this.nextChar()) {
                    token.append(c);
                }
                if (c == '\n') {
                    this.log.error(new Location(line), 'closing double quotation is missing');
                    line++;
                }
                break;
            default:
                var kind = TokenKind[c];
                var token = new Token(new Location(line), kind, c);
                for (var c = this.nextChar(); TokenKind[c] == kind; c = this.nextChar()) {
                    token.append(c);
                }
                this.index--;
                break;
        }
        
        tokens.push(token);
    }
    
    for (var i in tokens) {
        console.log(tokens[i]);
    }
    
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
// src/console.js

var Console = function(log) {
    this.log = log;
}

Console.prototype.out = function() {
    
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
return exports;
})();
