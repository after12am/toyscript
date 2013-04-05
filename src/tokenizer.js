var Tokenizer = function(source) {
    this.line = 1;
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
            }
            if (token = this.scanIndent()) {
                tokens.push(token);
            }
            continue;
        }
        
        // ignore white spaces
        if (this.isWhiteSpace(this.c)) {
            this.consume();
            continue;
        }
        
        // ignore semicolon
        if (this.c == ';') {
            this.consume();
            continue;
        }
        
        if (this.isLetter(this.c)) {
            if (token = this.scanIdent()) {
                // don't replace token.kind with keyword when giving text is `true` or `false`.
                if (token.text.toUpperCase() == Token.KEYWORDS.TRUE
                 || token.text.toUpperCase() == Token.KEYWORDS.FALSE) {
                     tokens.push(token);
                     continue;
                }
                if (Token.KEYWORDS[token.text.toUpperCase()]) {
                    token.kind = token.text.toUpperCase();
                }
                tokens.push(token);
                continue;
            }
        }
        
        if (this.isDigit(this.c)) {
            
            if (this.isLetter(this.lookahead(1)) && this.lookahead(1) !== 'EOF') {
                var ss = this.c;
                this.consume();
                var token = this.scanIdent();
                var ss = ss + token.text;
                throw 'Line ' + this.line + ': Unknown token \'' + ss + '\', asserted by tokenizer';
            }
            if (token = this.scanDigit()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.c === '\'' || this.c == '"') {
            if (token = this.scanString(this.c)) {
                tokens.push(token);
                continue;
            }
        }
        
        if (token = this.scanPunctuator()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanAssign()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanOperator()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanComment()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanRegularExpression()) {
            tokens.push(token);
            continue;
        }
        
        throw 'line ' + this.line + ': Unknown token \'' + this.c + '\', asserted by tokenizer';
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line, this.column)));
    
    return tokens;
}

Tokenizer.prototype.scanLineTerminator = function() {
    
    var c = this.c;
    this.line++;
    this.consume();
    
    if ((c + this.lookahead(1)) == '\r\n') {
        c += this.lookahead(1);
        this.consume();
    }
    
    return new Token(Token.NEWLINE, c, new Location(this.line, this.column));
}

Tokenizer.prototype.scanIndent = function() {
    
    var size = 0;
    
    while (this.p < this.source.length) {
        if (this.c == ' ' || this.c == '\t') size++;
        else break;
        this.consume();
    }
    
    return new Token(Token.INDENT, size, new Location(this.line, this.column));
}

Tokenizer.prototype.scanIdent = function() {
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (ident === 'None') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.NONE, ident, new Location(this.line, this.column));
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (ident === 'true') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, ident, new Location(this.line, this.column));
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3) + this.lookahead(4);
    if (ident === 'false') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, ident, new Location(this.line, this.column));
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2);
    if (ident === 'NaN') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.NAN, ident, new Location(this.line, this.column));
    }
    
    var ident = this.c
        + this.lookahead(1) + this.lookahead(2) + this.lookahead(3)
        + this.lookahead(4) + this.lookahead(5) + this.lookahead(6)
        + this.lookahead(7);
    if (ident === 'Infinity') {
        this.consume(); this.consume(); this.consume();
        this.consume(); this.consume(); this.consume();
        this.consume(); this.consume();
        return new Token(Token.INFINITY, ident, new Location(this.line, this.column));
    }
    
    var ident = '';
    
    while (this.c !== Token.EOF) {
        if (this.isLetter(this.c) || this.isDigit(this.c)) {
            ident += this.c;
            this.consume();
        } else {
            break;
        }
    }
    
    return new Token(Token.IDENTIFIER, ident, new Location(this.line, this.column));
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
    
    return new Token(Token.DIGIT, digit, new Location(this.line, this.column));
}

Tokenizer.prototype.scanString = function(delimiter) {
    
    var ss = '';
    this.consume();
    
    while (1) {
        if (this.c === Token.EOF || this.isLineTerminator(this.c)) {
            throw 'Line ' + this.line + ' Column ' + this.column + ': Unexpected token ILLEGAL';
        }
        if (this.c === delimiter) {
            this.consume();
            break;
        }
        ss += this.c;
        this.consume();
    }
    
    return new Token(Token.STRING, ss, new Location(this.line, this.column));
}

Tokenizer.prototype.scanPunctuator = function() {
    
    // 1character punctuator
    
    if (this.c === ':') {
        var c = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, c, new Location(this.line, this.column));
    }
    
    if (this.c === '{' || this.c === '}' || this.c === '(' ||
        this.c === ')' || this.c === '[' || this.c === ']' ||
        this.c === ',' || this.c === '.') {
        var c = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, c, new Location(this.line, this.column));
    }
}

Tokenizer.prototype.scanOperator = function() {
    
    // 3character operator
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '>>>' || op === '<<<') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 2character operator
    var op = this.c + this.lookahead(1);
    if (op === '++' || op === '--' || op === '>>' ||
        op === '<<' || op === '&&' || op === '||') {
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 1character operator
    var op = this.c;
    if (op === '+' || op === '-' || op === '*' ||
        op === '/' || op === '%' || op === '<' ||
        op === '>' || op === '&' || op === '!' ||
        op === '|' || op === '^' || op === '~' ||
        op === '?') {
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
}

Tokenizer.prototype.scanAssign = function() {
    
    // 4character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (op === '>>>=') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 3character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 2character assignment
    var op = this.c + this.lookahead(1);
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=' || op === '<=' ||
        op === '>=') {
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 1character assignment
    var op = this.c;
    if (op === '=') {
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
}

Tokenizer.prototype.scanComment = function() {
    
    var sign = this.c;
    if (sign === '#') {
        this.consume();
        var comment = '';
        while (!(this.c === Token.EOF || this.isLineTerminator(this.c))) {
            comment += this.c;
            this.consume();
        }
        return new Token(Token.SINGLE_LINE_COMMENT, comment, new Location(this.line, this.column));
    }
    
    var sign = this.c + this.lookahead(1);
    if (sign == '/*') {
        this.consume();
        this.consume();
        var comment = '';
        while (this.c + this.lookahead(1) != '*/') {
            if (this.c === Token.EOF) break;
            comment += this.c;
            this.consume();
        }
        this.consume();
        this.consume();
        return new Token(Token.SINGLE_LINE_COMMENT, comment, new Location(this.line, this.column));
    }
}

Tokenizer.prototype.scanRegularExpression = function() {
    // not implemented
}