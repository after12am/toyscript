var Tokenizer = function(source) {
    this.line = 1;
    this.source = source || '';
    this.p = 0;
    this.column = 1;
    this.indent = 0;
    this.indent_size = 4;
    this.c = this.source[this.p];
    Lexer.call(this);
}

Tokenizer.prototype = new Lexer();
Tokenizer.prototype.consume = function() {
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

Tokenizer.prototype.lookahead = function(k) {
    if (this.p + k < this.source.length) {
        return this.source[this.p + k];
    } else {
        return Token.EOF;
    }
}

Tokenizer.prototype.tokenize = function() {
    
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
        
        if (this.matchLetter(this.c)) {
            if (token = this.scanIdent()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.matchDigit(this.c)) {
            if (this.matchLetter(this.lookahead(1)) && this.lookahead(1) !== 'EOF') {
                var ss = this.c;
                this.consume();
                var ident = this.scanIdent();
                var token = new Token('', ss + ident.text, new Location(this.line, this.column));
                throw new Message(token, Message.IllegalIdent).toString();
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
        
        var token = new Token('', this.c, new Location(this.line, this.column));
        throw new Message(token, Message.UnknownToken).toString();
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line, this.column)));
    
    return tokens;
}

Tokenizer.prototype.scanIndent = function() {
    
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
Tokenizer.prototype.scanLineTerminator = function() {
    
    var c = this.c;
    this.line++;
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
Tokenizer.prototype.scanComment = function() {
    
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
            if (this.c === Token.EOF) {
                var token = new Token('', this.c, new Location(this.line, this.column || 1));
                throw new Message(token, Message.IllegalComment).toString();
            }
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
Tokenizer.prototype.scanReservedWord = function() {
    
    var token = this.scanKeyword();
    if (token) {
        return token;
    }
    
    var token = this.scanFutureReservedWord();
    if (token) {
        return token;
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (ident === 'None') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.KEYWORDS.NONE, ident, new Location(this.line, this.column));
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
Tokenizer.prototype.scanKeyword = function() {
    
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
Tokenizer.prototype.scanFutureReservedWord = function() {
    
}

/*
    7.6 Identifier
*/
Tokenizer.prototype.scanIdent = function() {
    
    var ident = '';
    
    while (this.c !== Token.EOF) {
        if (this.matchLetter(this.c) || this.matchDigit(this.c)) {
            ident += this.c;
            this.consume();
            continue;
        }
        break;
    }
    
    return new Token(Token.IDENTIFIER, ident, new Location(this.line, this.column));
}

/*
    7.7 Punctuators
    
    Punctuator :: one of
        { } ( ) [ ] . ; , < > <= >= == != === !== 
        + - * % ++ -- << >> >>> & | ^ ! ~ && || ? 
        : = += -= *= %= <<= >>= >>>= &= |= ^=
    
*/
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
    
    var token = this.scanAssign();
    if (token) {
        return token;
    }
    
    var token = this.scanOperator();
    if (token) {
        return token;
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

/*
    11.13 Assignment Operators
    
    AssignmentOperator : one of
        = *= /= %= += -= <<= >>= >>>= &= ^= |=
*/
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
Tokenizer.prototype.scanDigit = function() {
    
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
Tokenizer.prototype.scanString = function(delimiter) {
    
    var ss = '';
    var location = new Location(this.line, this.column);
    this.consume();
    
    while (1) {
        if (this.c === Token.EOF || this.matchLineTerminator(this.c)) {
            var token = new Token('', this.c, new Location(this.line, this.column));
            throw new Message(token, Message.UnexpectedString).toString();
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

/*
    7.8.5 Regular Expression Literals
*/
Tokenizer.prototype.scanRegularExpression = function() {
    
}