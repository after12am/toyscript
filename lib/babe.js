/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2012 Satoshi Okami
 * Released under the MIT license
 */
var babe = (function() {
var exports = {};

// src/compiler.js
exports.appName = 'babe';

var Compiler = function() {
    
}

Compiler.prototype.compile = function(source) {
    
    if (typeof source !== 'string') {
        console.error('[bebe] input type is not string.');
        return 0;
    }
    
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    
    tokenizer.tokenize();
    
    
    
    /*
    var tokenizer = new Tokenizer(source);
    
    try {
        tokens = tokenizer.tokenize();
    } catch (e) {
        console.error(e);
        return 0;
    }
    
    if (tokens.length == 0) {
        return 0;
    }
    
    var source = new Parser(tokens, this.log).parse();
    
    this.log.out();
    
    return (!this.log.hasErrors);
    */
}

exports.tokenize = function(source) {
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    tokens = tokenizer.tokenize();
    return tokens;
}

exports.compile = function(source, options) {
    var compiler = new Compiler();
    compiler.compile(source);
    return (!compiler.log.hasErrors);
}

exports.interpret = function() {
    
}

exports.Compiler = Compiler;
// src/lexer.js
var Lexer = function(source) {
    this.source = source || '';
    this.p = 0;
    this.c = this.source[this.p];
}

Lexer.prototype.consume = function() {
    this.p++;
    if (this.p < this.source.length) {
        this.c = this.source[this.p];
    } else {
        this.c = Token.EOF;
    }
}

Lexer.prototype.nextChar = function() {
    return this.lookahead(1);
}

Lexer.prototype.lookahead = function(k) {
    if (this.p + k < this.source.length) {
        return this.source[this.p + k];
    } else {
        return Token.EOF;
    }
}

Lexer.prototype.expect = function(c) {
    if (this.c === c) {
        consume();
    } else {
        throw exports.appName + ': expecting' + c + '; found ' + this.c;
    }
}

Lexer.prototype.isWhiteSpace = function(c) {
    return c.match(/\s/);
}

Lexer.prototype.isDigit = function(c) {
    return c >= "0" && c <= "9";
}

Lexer.prototype.isLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_";
}

Lexer.prototype.isLineTerminator = function(c) {
    return c == '\n' || c == '\r';// || c == '\r\n';
}
// src/location.js
var Location = function(line) {
    this.line = line;
}

Location.prototype.toString = function() {
    return "on line " + this.line;
};
// src/log.js
var Log = function() {
    this.messages = [];
};

Log.prototype.log = function(text, line) {
    this.messages.push({
        type: 'log',
        text: text,
        line: line
    });
};

Log.prototype.info = function(text, line) {
    this.messages.push({
        type: 'info',
        text: text,
        line: line
    });
};

Log.prototype.debug = function(text, line) {
    this.messages.push({
        type: 'debug',
        text: text,
        line: line
    });
};

Log.prototype.warn = function(text, line) {
    this.messages.push({
        type: 'warn',
        text: text,
        line: line
    });
};

Log.prototype.error = function(text, line) {
    this.messages.push({
        type: 'error',
        text: text,
        line: line
    });
};

Log.prototype.hasError = function() {
    for (var i in this.messages) {
        if (this.messages[i]['type'] == 'error') {
            return true;
        }
    }
    return false;
};
// src/token.js
var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.EOF = 'EOF';
Token.NEWLINE = 'NEWLINE';
Token.INDENT = 'INDENT';
Token.IDENT = 'IDENT';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.KEYWORD = 'KEYWORD';

Token.KEYWORDS = [];

['EXTENDS', 'AND', 'OR', 'XOR', 'IN', 'IS', 'NOT', 'RETURN', 'IF', 'ELSE', 'WHILE', 'FOR', 'CONTINUE', 'BREAK', 'CLASS', 'NULL', 'THIS', 'TRUE', 'FALSE'].forEach(function(k) {
    Token.KEYWORDS[k] = k;
});
// src/tokenizer.js
var Tokenizer = function(source) {
    this.line;
    Lexer.call(this, source);
}

Tokenizer.prototype = new Lexer();

Tokenizer.prototype.tokenize = function() {
    
    this.line = 1;
    var tokens = [];
    
    if (token = this.scanIndent()) {
        tokens.push(token);
    }
    
    while (this.p < this.source.length) {
        
        var token;
        
        if (this.c == '\n' || this.c == '\r') {
            if (token = this.scanLineTerminator()) {
                tokens.push(token);
                if (token = this.scanIndent()) {
                    tokens.push(token);
                }
                continue;
            }
        }
        
        // ignore white spaces
        if (this.isWhiteSpace(this.c)) {
            this.consume();
            continue;
        }
        
        if (this.c == Token.EOF) {
            break;
        }
        
        if (this.isLetter(this.c)) {
            if (token = this.scanIdent()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.isDigit(this.c)) {
            if (token = this.scanDigit()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.c === '\'' || this.c == '"') {
            var deli = this.c;
            if (token = this.scanString(deli)) {
                tokens.push(token);
                continue;
            }
        }
        
        if (token = this.scanPunctuator()) {
            tokens.push(token);
            continue;
        }
        
        throw exports.appName + ': unexpecting ' + this.c;
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line)));
    return tokens;
}

Tokenizer.prototype.scanLineTerminator = function() {
    
    var c1 = this.c;
    var c2 = this.nextChar();
    
    
    this.line++;
    this.consume();
    if ((c1 + c2) == '\r\n') {
        this.consume();
        return new Token(Token.NEWLINE, c1 + c2, new Location(this.line));
    }
    return new Token(Token.NEWLINE, c1, new Location(this.line));
}

Tokenizer.prototype.scanIndent = function() {
    
    var size = 0;
    
    while (this.p < this.source.length) {
        if (this.c == ' ' || this.c == '\t') size++;
        else break;
        this.consume();
    }
    
    return new Token(Token.INDENT, size, new Location(this.line));
}

Tokenizer.prototype.scanIdent = function() {
    
    var ident = '';
    
    while (this.c !== Token.EOF) {
        if (this.isLetter(this.c) || this.isDigit(this.c)) {
            ident += this.c;
            this.consume();
        } else {
            break;
        }
    }
    
    if (Token.KEYWORDS[ident.toUpperCase()]) {
        return new Token(Token.KEYWORD, ident, new Location(this.line));
    }
    
    return new Token(Token.IDENT, ident, new Location(this.line));
}

Tokenizer.prototype.scanDigit = function() {
    
    var digit = '';
    
    while (this.c !== Token.EOF) {
        if (this.isDigit(this.c)) {
            digit += this.c;
            this.consume();
        } else {
            break;
        }
    }
    
    return new Token(Token.DIGIT, digit, new Location(this.line));
}

Tokenizer.prototype.scanString = function(delimiter) {
    
    var ss = '';
    
    this.consume();
    while (this.c !== Token.EOF && !this.isLineTerminator(this.c) && this.c !== delimiter) {
        ss += this.c;
        this.consume();
    }
    
    if (this.c === delimiter) {
        this.consume();
    } else {
        throw exports.appName + ': on line ' + this.line + ': Unexpected token ILLEGAL';
    }
    
    return new Token(Token.STRING, ss, new Location(this.line));
}

Tokenizer.prototype.scanPunctuator = function() {
    
    var punctuator;
    
    if ("{}()[]:,.".indexOf(this.c) !== -1) {
        punctuator = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, punctuator, new Location(this.line));
    }
    
    if (token = this.scanAssign()) {
        return token;
    }
    
    if (token = this.scanOperator()) {
        return token;
    }
}

Tokenizer.prototype.scanOperator = function() {
    
    // 2character operator
    var op = this.c + this.lookahead(1);
    if (op === '++' || op === '--' || op === '>>' ||
        op === '<<' || op === '&&' || op === '||') {
        this.consume();
        return new Token(Token.OPERATOR, op, new Location(this.line));
    }
    
    // 1character operator
    var op = this.c;
    if (op === '+' || op === '-' || op === '*' ||
        op === '/' || op === '%' || op === '<' ||
        op === '>' || op === '&' || op === '!' ||
        op === '|' || op === '^' || op === '~' ||
        op === '?') {
        this.consume();
        return new Token(Token.OPERATOR, op, new Location(this.line));
    }
}

Tokenizer.prototype.scanAssign = function() {
    
    var op = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (op === '>>>=') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    var op = this.c + this.lookahead(1);
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    var op = this.c;
    if (op === '=') {
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    return false;
}
return exports;
})();
