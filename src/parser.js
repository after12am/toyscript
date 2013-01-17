// http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/

var Parser = function(tokens, log) {
    this.p = 0;
    this.tokens = tokens;
    this.token = this.tokens[this.p];
    this.indent_size;
    this.indent = 0;
    this.log = log || new Log();
    this.nodes = [];
}

Parser.prototype.consume = function() {
    this.p++;
    if (this.p < this.tokens.length) {
        this.token = this.tokens[this.p];
    } else {
        this.token = new Token(Token.EOF);
    }
}

Parser.prototype.lookahead = function(k) {
    if (this.p + k < this.tokens.length) {
        return this.tokens[this.p + k];
    } else {
        return new Token(Token.EOF);
    }
}

Parser.prototype.lookback = function(k) {
    if (this.p - k > 0) {
        return this.tokens[this.p - k];
    } else {
        return new Token(Token.EOF);
    }
}

Parser.prototype.expect = function(text) {
    if (this.token.text !== text) {
        this.assert('line ' + this.token.location.line + ': Unexpected error, expected \'' + text + '\', but giving \'' + this.token.text + '\'');
    }
    this.consume();
}

Parser.prototype.match = function(text) {
    return (this.token.text == text);
}

Parser.prototype.assert = function(message) {
    throw message;
}

Parser.prototype.matchAssign = function() {
    
    // 4character assignment
    var op = this.token.text + this.lookahead(1).text + this.lookahead(2).text + this.lookahead(3).text;
    if (op === '>>>=') {
        return op;
    }
    
    // 3character assignment
    var op = this.token.text + this.lookahead(1).text + this.lookahead(2).text;
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return op;
    }
    
    // 2character assignment
    var op = this.token.text + this.lookahead(1).text;
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        return op;
    }
    
    // 1character assignment
    var op = this.token.text;
    if (op === '=') {
        return op;
    }
}

Parser.prototype.parse = function() {
    
    // set indent size
    for (var i = 0; i < this.tokens.length; i++) {
        if (this.tokens[i].kind === Token.INDENT) {
            if (this.tokens[i].text > 0) {
                this.indent_size = this.tokens[i].text;
                break;
            }
        }
    }
    
    return this.parseProgram();
}

Parser.prototype.parseProgram = function() {
    
    this.p = 0;
    
    while (1) {
        
        if (this.token.kind === Token.EOF) {
            this.consume();
            break;
        }
        
        var node = this.parseSourceElement();
        if (node) {
            this.indent = 0;
            this.nodes.push(node);
        }
    }
    
    return this.nodes;
}

Parser.prototype.parseSourceElement = function() {
    
    if (this.token.kind === Token.NEWLINE) {
        this.consume();
        return;
    }
    
    if (this.token.kind === Token.INDENT) {
        this.expect(0);
        return;
    }
    
    if (node = this.parseStatement()) {
        return node;
    }
    
    if (node = this.parseFunction()) {
        return node;
    }
    
    this.assert('Unexpected token, ' + this.token.toString());
}

Parser.prototype.parseStatement = function() {
    
    // ignore newline token
    if (this.token.kind === Token.NEWLINE) {
        this.consume();
        return this.parseStatement();
    }
    
    // syntax check around indent
    if (this.token.kind === Token.INDENT) {
        if (this.indent_size * this.indent !== this.token.text) {
            this.assert('error around indent');
        } else {
            this.consume();
            return this.parseStatement();
        }
    }
    
    // syntax check around ident
    if (this.token.kind === Token.IDENT) {
        // ident statement only
        if (this.lookahead(1).kind == Token.EOF || this.lookahead(1).kind == Token.NEWLINE) {
            this.assert(this.token.toString() + ' Syntax error');
        }
    }
    
    switch (this.token.kind) {
        case Token.COLON:
            return this.parseBlock();
        case Token.KEYWORDS.IF:
            return this.parseIfStatement();
        case Token.IDENT:
        case Token.BOOLEAN:
        case Token.PUNCTUATOR:
            return this.parseVariableStatement();
        case Token.SINGLE_LINE_COMMENT:
            return this.parseComment();
        default:
            this.assert('Unknown token ' + this.token);
    }
}

Parser.prototype.parseIfStatement = function() {
    
    this.expect('if');
    
    var expr = this.parseExpression();
    
    this.indent++;
    
    var exprs = this.parseStatement();
    
    this.indent--;
    
    return {
        type: Syntax.IfStatement,
        condition: expr,
        statements: exprs,
        alternate: null
    };
}

Parser.prototype.parseBlock = function() {
    
    var expr = this.parseStatementList();
    
    return expr;
}

Parser.prototype.parseStatementList = function() {
    
    var expr;
    
    
    
    return expr;
}

Parser.prototype.parseExpression = function() {
    
    var expr = this.parseAssignmentExpression();
    
    return expr;
}

Parser.prototype.parseAssignmentExpression = function() {
    
    var expr = this.parseConditionalExpression();
    
    if (operator = this.matchAssign()) {
        
        for (var i = 0; i < operator.length; i++) {
            this.consume();
        }
        
        return {
            type: Syntax.Identifier,
            operator: operator,
            left: expr,
            right: this.parseAssignmentExpression()
        };
    }
    
    return expr;
}

Parser.prototype.parseConditionalExpression = function() {
    
    var expr = this.parseLogicalORExpression();
    
    return expr;
}

Parser.prototype.parseLogicalORExpression = function() {
    
    var expr = this.parseLogicalANDExpression();
    
    return expr;
}


Parser.prototype.parseLogicalANDExpression = function() {
    
    var expr = this.parseBitwiseORExpression();
    
    return expr;
}

Parser.prototype.parseBitwiseORExpression = function() {
    
    var expr = this.parseBitwiseXORExpression();
    
    return expr;
}

Parser.prototype.parseBitwiseXORExpression = function() {
    
    var expr = this.parseBitwiseANDExpression();
    
    return expr;
}

Parser.prototype.parseBitwiseANDExpression = function() {
    
    var expr = this.parseEqualityExpression();
    
    return expr;
}

Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
    return expr;
}

Parser.prototype.parseRelationalExpression = function() {
    
    var expr = this.parseShiftExpression();
    
    return expr;
}

Parser.prototype.parseShiftExpression = function() {
    
    var expr = this.parseAdditiveExpression();
    
    return expr;
}

Parser.prototype.parseAdditiveExpression = function() {
    
    var expr = this.parseMultiplicativeExpression();
    
    return expr;
}

Parser.prototype.parseMultiplicativeExpression = function() {
    
    var expr = this.parseUnaryExpression();
    
    return expr;
}

Parser.prototype.parseUnaryExpression = function() {
    
    var expr = this.parsePostfixExpression();
    
    return expr;
}

Parser.prototype.parsePostfixExpression = function() {
    
    var expr = this.parseLeftHandSideExpression();
    
    return expr;
}

Parser.prototype.parseLeftHandSideExpression = function() {
    
    var expr = this.parseNewExpression();
    
    return expr;
}

Parser.prototype.parseNewExpression = function() {
    
    var expr = this.parseMemberExpression();
    
    return expr;
}

Parser.prototype.parseMemberExpression = function() {
    
    var expr = this.parsePrimaryExpression();
    
    // parse list member
    if (this.match('[')) {
        var member = expr;
        this.consume();
        expr = this.parseExpression();
        this.expect(']');
        
        return {
            type: Syntax.MemberExpression,
            member: member,
            expr: expr
        };
    }
    
    return expr;
}

Parser.prototype.parsePrimaryExpression = function() {
    
    if (this.token.kind === Token.IDENT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Identifier,
            value: token.text 
        };
    }
    
    if (this.token.kind === Token.NONE) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NullLiteral,
            value: 'null'
        };
    }
    
    if (this.token.kind === Token.NAN) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NaNLiteral,
            value: 'NaN'
        };
    }
    
    if (this.token.kind === Token.INFINITY) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.InfinityLiteral,
            value: 'Infinity'
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NumericLiteral,
            value: token.text
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.StringLiteral,
            value: token.text
        };
    }
    
    if (this.token.kind === Token.BOOLEAN) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BooleanLiteral,
            value: token.text
        };
    }
    
    if (this.token.kind === Token.PUNCTUATOR) {
        
        if (this.match('[')) {
            return this.parseArrayLiteral();
        }
        
        if (this.match('{')) {
            return this.parseObjectLiteral();
        }
    }
}

Parser.prototype.parseArrayLiteral = function() {
    
    var elements = [];
    
    this.expect('[');
    
    while (!this.match(']')) {
        if (this.match(',')) {
            this.consume();
            continue;
        }
        elements.push(this.parseAssignmentExpression());
    }
    
    this.expect(']');
    
    return {
        type: Syntax.ArrayLiteral,
        elements: elements
    };
}

Parser.prototype.parseObjectLiteral = function() {
    
    var properties = [];
    
    this.expect('{');
    
    while (!this.match('}')) {
        if (this.match(',')) {
            this.consume();
            continue;
        }
        properties.push(this.parsePropertyNameAndValueList());
    }
    
    this.expect('}');
    
    return {
        type: Syntax.ObjectLiteral,
        properties: properties
    };
}

Parser.prototype.parsePropertyNameAndValueList = function() {
    
    var value = this.parsePropertyName();
    this.expect(':');
    
    return {
        type: Syntax.ObjectLiteral,
        left: value,
        right: this.parseAssignmentExpression()
    };
}

Parser.prototype.parsePropertyName = function() {
    
    if (this.token.kind === Token.IDENT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Identifier,
            value: token.text 
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NumericLiteral,
            value: token.text
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.StringLiteral,
            value: token.text
        };
    }
    
    this.assert('Unexpected PropertyName, ' + this.token.toString());
}



Parser.prototype.parseVariableStatement = function() {
    
    var expr = this.parseAssignmentExpression();
    
    return expr;
}

Parser.prototype.parseAssignmentOperator = function() {
    
}

Parser.prototype.parseFunction = function() {
    
}

Parser.prototype.parseComment = function() {
    
    // single line comment
    if (this.token.kind === Token.SINGLE_LINE_COMMENT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.SingleLineComment,
            value: token.text
        }
    }
    
    // multi line comment
    if (this.token.kind === Token.MULTI_LINE_COMMENT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.MultiLineComment,
            value: token.text
        }
    }
}