var Lexer = function(source) {
    this.source = source || '';
    this.p = 0;
    this.column = 1;
    this.c = this.source[this.p];
}

Lexer.prototype.consume = function() {
    if (this.c == '\n' || this.c == '\r') {
        this.column = 0;
    } else {
        this.column++;
    }
    this.p++;
    if (this.p < this.source.length) {
        this.c = this.source[this.p];
    } else {
        this.c = Token.EOF;
    }
}

Lexer.prototype.lookahead = function(k) {
    if (this.p + k < this.source.length) {
        return this.source[this.p + k];
    } else {
        return Token.EOF;
    }
}

// issue: change to class method from instance method 

Lexer.prototype.isWhiteSpace = function(c) {
    return c.match(/\s/);
}

Lexer.prototype.isDigit = function(c) {
    return c >= "0" && c <= "9";
}

Lexer.prototype.isLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "$";
}

Lexer.prototype.isLineTerminator = function(c) {
    return c == '\n' || c == '\r';// || c == '\r\n';
}