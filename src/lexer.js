var Lexer = function(source) {
    this.name = 'Lexer';
    this.line = 1;
    this.source = source || '';
    this.p = 0;
    this.column = 1;
    this.indent = 0;
    this.indent_size = 4;
    this.c = this.source[this.p];
}

Lexer.prototype.assert = function(message) {
    throw new Error("{0} {1}".format([
        new Location(this.line, this.column).toString(),
        message
    ]));
}

Lexer.prototype.consume = function() {
    if (this.c == '\n' || this.c == '\r') {
        this.column = 1;
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

/*
    LL(k)
*/
Lexer.prototype.lookahead = function(k) {
    var kk = this.p + k;
    if (kk < this.source.length) return this.source[kk];
    return Token.EOF;
}

/*
    7.2 White Space

    WhiteSpace ::
        <TAB>
        <VT>
        <FF>
        <SP>
        <NBSP>
        <USP>
*/
Lexer.prototype.matchWhiteSpace = function(c) {
    return c.match(/^\s$/) && !this.matchLineTerminator(c);
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.matchLineTerminator = function(c) {
    return c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
}

/*
    7.8.3 Numeric Literals
    
    DecimalDigit :: one of
        0 1 2 3 4 5 6 7 8 9
*/
Lexer.prototype.matchDigit = function(c) {
    return c >= "0" && c <= "9";
}

/*
    7.8.4 String Literals
    
    one of [a-ZA-Z_$]
*/
Lexer.prototype.matchLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "$";
}

/*
    break a stream of tokens
*/
Lexer.prototype.tokenize = function() {
    
    this.line = 1;
    var tokens = [];
    
    if (token = this.scanIndent()) {
        tokens.push(token);
    }
    
    while (this.p < this.source.length) {
        
        var token;
        
        if (token = this.scanComment()) {
            tokens.push(token);
            continue;
        }
        
        if (this.matchLineTerminator(this.c)) {
            if (token = this.scanLineTerminator()) tokens.push(token);
            if (token = this.scanIndent()) tokens.push(token);
            this.line++;
            continue;
        }
        
        // ignore white spaces
        if (this.matchWhiteSpace(this.c)) {
            this.consume();
            continue;
        }
        
        // ignore semicolon
        if (this.c == ';') {
            this.consume();
            continue;
        }
        
        if (token = this.scanReservedWord()) {
            tokens.push(token);
            continue;
        }
        
        if (this.matchLetter(this.c) && (token = this.scanIdent())) {
            tokens.push(token);
            continue;
        }
        
        if (this.matchDigit(this.c)) {
            if (this.lookahead(1) !== Token.EOF
             && this.matchLetter(this.lookahead(1))) {
                 this.assert(Message.IllegalIdent);
            }
            if (token = this.scanDigit()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.c === "'" || this.c == '"') {
            if (token = this.scanString(this.c)) {
                tokens.push(token);
                continue;
            }
        }
        
        if (token = this.scanPunctuator()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanRegularExpression()) {
            tokens.push(token);
            continue;
        }
        
        this.assert(Message.UnknownToken);
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line, this.column)));
    
    return tokens;
}

/*
    calculate indent size
*/
Lexer.prototype.scanIndent = function() {
    
    this.indent = 0;
    
    while (this.p < this.source.length) {
        if (this.c == ' ') this.indent++;
        else if (this.c == '\t') this.indent += this.indent_size;
        else break;
        this.consume();
    }
    
    return new Token(Token.INDENT, this.indent, new Location(this.line, this.column));
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.scanLineTerminator = function() {
    
    var c = this.c;
    this.consume();
    
    if ((c + this.lookahead(1)) == '\r\n') {
        c += this.lookahead(1);
        this.consume();
    }
    
    // If column is zero, set indent size as column.
    return new Token(Token.NEWLINE, c, new Location(this.line, this.column || (this.indent + 1)));
}

/*
    7.4 Comments
    
    Comment ::
        MultiLineComment
        SingleLineComment
*/
Lexer.prototype.scanComment = function() {
    
    var sign = this.c;
    if (sign === '#') {
        this.consume();
        var comment = '';
        while (!(this.c === Token.EOF || this.matchLineTerminator(this.c))) {
            comment += this.c;
            this.consume();
        }
        var token = new Token(Token.COMMENT, comment, new Location(this.line, this.column));
        token.multiple = false;
        return token
    }
    
    var sign = this.c + this.lookahead(1);
    if (sign == '/*') {
        this.consume();
        this.consume();
        var comment = '';
        while (this.c + this.lookahead(1) != '*/') {
            if (this.c === Token.EOF) this.assert(Message.IllegalComment);
            comment += this.c;
            this.consume();
        }
        this.consume();
        this.consume();
        var token = new Token(Token.COMMENT, comment, new Location(this.line, this.column));
        token.multiple = true;
        return token
    }
}

/*
    7.5.1 Reserved Words
    
    ReservedWord ::
        Keyword
        FutureReservedWord
        NullLiteral
        BooleanLiteral
*/
Lexer.prototype.scanReservedWord = function() {
    
    var token = this.scanKeyword();
    if (token) {
        return token;
    }
    
    var token = this.scanFutureReservedWord();
    if (token) {
        return token;
    }
    
    var reserved = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (reserved === 'None') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.KEYWORDS.NONE, reserved, new Location(this.line, this.column));
    }
    
    var reserved = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (reserved === 'true') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, reserved, new Location(this.line, this.column));
    }
    
    var reserved = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3) + this.lookahead(4);
    if (reserved === 'false') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, reserved, new Location(this.line, this.column));
    }
}

/*
    7.5.2 Keywords
    
    Keyword :: one of
        and
        break
        catch
        class
        continue
        delete
        def
        else
        finally
        for
        if
        in
        is
        new
        not
        or
        return
        this
        try
        raise
        void
        while
        xor
*/
Lexer.prototype.scanKeyword = function() {
    
    var keyword = '';
    var p = this.p;
    var c = this.source[this.p];
    
    while (this.c !== Token.EOF) {
        if (this.matchLetter(c) || this.matchDigit(c)) {
            keyword += c;
            c = this.source[++p];
            continue;
        }
        break;
    }
    
    if (Token.KEYWORDS[keyword.toUpperCase()]) {
        var text = Token.KEYWORDS[keyword.toUpperCase()];
        var i = 0;
        while (i < text.length) {
            this.consume();
            i++;
        }
        return new Token(text, keyword, new Location(this.line, this.column));
    }
}

/*
    7.5.3 Future Reserved Words
    
    FutureReservedWord :: one of
*/
Lexer.prototype.scanFutureReservedWord = function() {
    
}

/*
    7.6 Identifier
*/
Lexer.prototype.scanIdent = function() {
    
    var ident = '';
    
    while (this.c !== Token.EOF) {
        if (this.matchLetter(this.c) || this.matchDigit(this.c)) {
            ident += this.c;
            this.consume();
            continue;
        }
        break;
    }
    /*
    if (ident.substring(0, 2) === '__') {
        this.assert(Message.IllegalReservedIdent);
    }
    */
    return new Token(Token.IDENTIFIER, ident, new Location(this.line, this.column));
}

/*
    7.7 Punctuators
    
    Punctuator :: one of
        { } ( ) [ ] . ; , < > <= >= == != === !== 
        + - * % ++ -- << >> >>> & | ^ ! ~ && || ? 
        : = += -= *= %= <<= >>= >>>= &= |= ^=
    
*/
Lexer.prototype.scanPunctuator = function() {
    
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
    
    var token = this.scanAssign();
    if (token) {
        return token;
    }
    
    var token = this.scanOperator();
    if (token) {
        return token;
    }
}

Lexer.prototype.scanOperator = function() {
    
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

/*
    11.13 Assignment Operators
    
    AssignmentOperator : one of
        = *= /= %= += -= <<= >>= >>>= &= ^= |=
*/
Lexer.prototype.scanAssign = function() {
    
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
        op === '>=' || op === '==' || op === '!=') {
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

/*
    7.8.3 Numeric Literals
    
    NumericLiteral ::
        DecimalLiteral
        HexIntegerLiteral
*/
Lexer.prototype.scanDigit = function() {
    
    var digit = '';
    
    while (this.c !== Token.EOF) {
        if (this.matchDigit(this.c) || this.c === '.') {
            digit += this.c;
            this.consume();
        } else {
            break;
        }
    }
    
    if (digit.match(/\./)) {
        digit = parseFloat(digit, 10);
    } else {
        digit = parseInt(digit, 10);
    }
    
    return new Token(Token.DIGIT, digit, new Location(this.line, this.column));
}

/*
    7.8.4 String Literals
    
    StringLiteral ::
        " DoubleStringCharactersopt "
        ' SingleStringCharactersopt '
*/
Lexer.prototype.scanString = function(delimiter) {
    
    var ss = '', token;
    var location = new Location(this.line, this.column);
    this.consume();
    
    while (1) {
        if (this.c === Token.EOF || this.matchLineTerminator(this.c)) {
            this.assert(Message.UnexpectedString);
        }
        if (this.c === delimiter) {
            this.consume();
            break;
        }
        ss += this.c;
        this.consume();
    }
    
    token = new Token(Token.STRING, ss, new Location(this.line, this.column));
    token.delimiter = delimiter;
    return token;
}

/*
    7.8.5 Regular Expression Literals
*/
Lexer.prototype.scanRegularExpression = function() {
    
}