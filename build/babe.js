/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2012 Satoshi Okami
 * Released under the MIT license
 */
var babe = (function() {
var exports = {};

// src/ast.js
// node param must be object
// var AST = function(node) {
//     this.node = node;
//     this.nodes = [];
// }
// 
// // AST.prototype.type = function() {
// //     return this.node.kind;
// // }
// // 
// AST.prototype.add = function(node) {
//     if (typeof node == 'object') this.nodes.concat(node);
//     else this.nodes.push(node);
// }
// 
// AST.prototype.toString = function() {
//     // should be dynamically overridden.
// }
// 
// var Node = AST;
// src/babe.js
exports.tokenize = function(source) {
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    tokens = tokenizer.tokenize();
    return tokens;
}

exports.parse = function(source) {
    var tokens = exports.tokenize(source);
    var nodes = new Parser(tokens).parse();
    return nodes;
}

exports.codegen = function(source) {
    var nodes = exports.parse(source);
    var compiled = new CodeGen(nodes).generate();
    return compiled;
}

exports.compile = function(source) {
    var compiler = new Compiler(source);
    compiler.compile();
    return (!compiler.log.hasErrors);
}

exports.run = function(source) {
    var res = exports.compile(source);
    for (var i in res['log'].messages) {
        console.log(res['log'].messages[i]);
    }
    if (res['error'] === false) {
        eval(res['compiled']);
    }
    return res;
}

exports.interpret = function() {
    return exports.run();
}
// src/codegen.js
var CodeGen = function(nodes, log) {
    this.p = 0;
    this.space = '';
    this.nodes = nodes;
    this.inner_nodes;
    this.log = log || new Log();
}

CodeGen.prototype.generate = function() {
    
}


// src/compiler.js
var Compiler = function(source) {
    this.source = source;
}

Compiler.prototype.compile = function() {
    
    if (typeof this.source !== 'string') {
        console.error('input type is not string.');
        return;
    }
    
    var log = new Log();
    var tokenizer = new Tokenizer(this.source);
    var tokens;
    var nodes;
    var compiled;
    
    if (tokens = tokenizer.tokenize()) {
        if (nodes = new Parser(tokens, log).parse()) {
            compiled = new CodeGen(nodes).generate();
        }
    }
    
    return {
        'source': this.source,
        'tokens': token,
        'nodes': nodes,
        'compiled': compiled,
        'log': log,
        'error': log.hasError()
    }
}
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
// src/parser.js
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
        
        // if (this.token.kind === Token.EOF) {
        //     this.consume();
        //     break;
        // }
        
        if (this.lookahead(1).kind === Token.EOF) {
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
        
        if (this.indent_size * this.indent < this.token.text) {
            this.indent++;
        } else if (this.indent_size * this.indent > this.token.text) {
            this.indent--;
        }
        this.consume();
        return this.parseStatement();
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
            console.log(this.token)
            this.assert('Unknown token ' + this.token);
    }
}

Parser.prototype.parseIfStatement = function() {
    
    var indent = this.indent * this.indent_size;
    
    this.expect('if');
    
    var expr = this.parseExpression();
    this.expect(':');
    var exprs = this.parseBlock();
    var alternate = null;
    
    // expect indent token
    this.expect(indent);
    
    if (this.match('else')) {
        this.consume();
        
        if (this.match(':')) {
            this.consume();
            alternate = this.parseBlock();
        } else {
            alternate = this.parseIfStatement();
        }
    }
    
    return {
        type: Syntax.IfStatement,
        condition: expr,
        statements: exprs,
        alternate: alternate
    };
}

Parser.prototype.parseBlock = function() {
    
    var expr = this.parseStatementList();
    
    
    return expr;
}

Parser.prototype.parseStatementList = function() {
    
    var exprs = [this.parseStatement()];
    var indent = this.indent * this.indent_size;
    
    while (1) {
        
        // ignore newline token
        if (this.token.kind === Token.NEWLINE) {
            this.consume();
        }
        
        if (this.token.kind === Token.INDENT) {
            
            if (this.indent_size * this.indent < this.token.text) {
                this.indent++;
            } else if (this.indent_size * this.indent > this.token.text) {
                this.indent--;
            }
            
            if (this.token.text < indent) {
                break;
            }
        }
        
        exprs.push(this.parseStatement());
    }
    return exprs;
}

Parser.prototype.parseExpression = function() {
    
    var expr = this.parseAssignmentExpression();
    
    // parse function
    if (this.match(',')) {
        expr = {
            type: Syntax.SequenceExpression,
            expressions: [expr]
        };
        
        while (1) {
            if (!this.match(',')) {
                break;
            }
            this.consume();
            expr.expressions.push(this.parseExpression());
        }
    }
    
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
    var ope = this.token.text;
    
    if (ope == 'in') {
        this.consume();
        
        var right = this.parseConditionalExpression();
        
        switch (right.type) {
            case 'ArrayLiteral':
            case 'Identifier':
                break;
            default:
                this.assert('Syntax Error, ' + right.value);
                break;
        }
        
        expr = {
            type: Syntax.ConditionalExpression,
            operator: 'in',
            left: expr,
            right: right
        }
    }
    
    return expr;
}

Parser.prototype.parseLogicalORExpression = function() {
    
    var expr = this.parseLogicalANDExpression();
    var or = this.token.text;
    
    if (or == 'or') {
        this.consume();
        expr = {
            type: Syntax.LogicalExpression,
            operator: 'or',
            left: expr,
            right: this.parseBitwiseORExpression()
        }
    }
    
    return expr;
}


Parser.prototype.parseLogicalANDExpression = function() {
    
    var expr = this.parseBitwiseORExpression();
    var and = this.token.text;
    
    if (and == 'and') {
        this.consume();
        expr = {
            type: Syntax.LogicalExpression,
            operator: 'and',
            left: expr,
            right: this.parseBitwiseORExpression()
        }
    }
    
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
    var ope = this.token.text + this.lookahead(1).text;
    
    if (ope == '==' || ope == '!=' || ope == '!==' || ope == '===') {
        this.consume();
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: ope,
            left: expr,
            right: this.parseRelationalExpression()
        }
    }
    
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
        
        if (this.match('(')) {
            this.consume();
            var expr = this.parseExpression();
            this.expect(')');
            return expr;
        }
    }
    
    this.assert("unexpected token `" + this.token.text + "`");
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
// src/syntax.js
var Syntax = [];
Syntax.NullLiteral = 'NullLiteral';
Syntax.NaNLiteral = 'NaNLiteral';
Syntax.InfinityLiteral = 'InfinityLiteral';
Syntax.BooleanLiteral = 'BooleanLiteral';
Syntax.NumericLiteral = 'NumericLiteral';
Syntax.ArrayLiteral = 'ArrayLiteral';
Syntax.ObjectLiteral = 'ObjectLiteral';
Syntax.StringLiteral = 'StringLiteral';
Syntax.MemberExpression = 'MemberExpression';
Syntax.Identifier = 'Identifier';
Syntax.IfStatement = 'IfStatement';
Syntax.SingleLineComment = 'SingleLineComment';
Syntax.MultiLineComment = 'MultiLineComment';
Syntax.SequenceExpression = 'SequenceExpression';
Syntax.BinaryExpression = 'BinaryExpression';
Syntax.LogicalExpression = 'LogicalExpression';
Syntax.ConditionalExpression = 'ConditionalExpression';
// src/token.js
var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    return this.location.toString() + ' kind:' + this.kind + ' text:' + this.text;
}

//----------------------------------------
// TOKEN LIST
//----------------------------------------
Token.EOF = 'EOF';
Token.NEWLINE = 'NEWLINE';
Token.NONE = 'NONE';
Token.NAN = 'NAN';
Token.BOOLEAN = 'BOOLEAN';
Token.INFINITY = 'INFINITY';
Token.INDENT = 'INDENT';
Token.IDENT = 'IDENT';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.COLON = 'COLON';
Token.KEYWORD = 'KEYWORD';
Token.SINGLE_LINE_COMMENT = 'SINGLE_LINE_COMMENT';
Token.MULTI_LINE_COMMENT = 'MULTI_LINE_COMMENT';

//----------------------------------------
// KEYWORD LIST
//----------------------------------------
Token.KEYWORDS = [];
Token.KEYWORDS.TYPEOF = 'TYPEOF';
Token.KEYWORDS.INSTANCEOF = 'INSTANCEOF';
Token.KEYWORDS.DELETE = 'DELETE';
Token.KEYWORDS.NEW = 'NEW';
Token.KEYWORDS.TRY = 'TRY';
Token.KEYWORDS.CATCH = 'CATCH';
Token.KEYWORDS.THROW = 'THROW';
Token.KEYWORDS.EXTENDS = 'EXTENDS';
Token.KEYWORDS.AND = 'AND';
Token.KEYWORDS.OR = 'OR';
Token.KEYWORDS.XOR = 'XOR';
Token.KEYWORDS.IN = 'IN';
Token.KEYWORDS.IS = 'IS';
Token.KEYWORDS.NOT = 'NOT';
Token.KEYWORDS.RETURN = 'RETURN';
Token.KEYWORDS.IF = 'IF';
Token.KEYWORDS.ELIF = 'ELIF';
Token.KEYWORDS.ELSE = 'ELSE';
Token.KEYWORDS.WHILE = 'WHILE';
Token.KEYWORDS.FOR = 'FOR';
Token.KEYWORDS.CONTINUE = 'CONTINUE';
Token.KEYWORDS.BREAK = 'BREAK';
Token.KEYWORDS.CLASS = 'CLASS';
Token.KEYWORDS.NULL = 'NULL';
Token.KEYWORDS.THIS = 'THIS';
Token.KEYWORDS.TRUE = 'TRUE';
Token.KEYWORDS.FALSE = 'FALSE';

// src/tokenizer.js
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
        
        if (token = this.scanAssign()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanComment()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanOperator()) {
            tokens.push(token);
            continue;
        }
        
        throw 'line ' + this.line + ': Unknown token \'' + this.c + '\', asserted by tokenizer';
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line)));
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
    return new Token(Token.NEWLINE, c, new Location(this.line));
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
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (ident === 'None') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.NONE, ident, new Location(this.line));
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (ident === 'true') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, ident, new Location(this.line));
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3) + this.lookahead(4);
    if (ident === 'false') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, ident, new Location(this.line));
    }
    
    var ident = this.c + this.lookahead(1) + this.lookahead(2);
    if (ident === 'NaN') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.NAN, ident, new Location(this.line));
    }
    
    var ident = this.c
        + this.lookahead(1) + this.lookahead(2) + this.lookahead(3)
        + this.lookahead(4) + this.lookahead(5) + this.lookahead(6)
        + this.lookahead(7);
    if (ident === 'Infinity') {
        this.consume(); this.consume(); this.consume();
        this.consume(); this.consume(); this.consume();
        this.consume(); this.consume();
        return new Token(Token.INFINITY, ident, new Location(this.line));
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
    
    while (1) {
        if (this.c === Token.EOF || this.isLineTerminator(this.c)) {
            throw ': on line ' + this.line + ': Unexpected token ILLEGAL';
        }
        if (this.c === delimiter) {
            this.consume();
            break;
        }
        ss += this.c;
        this.consume();
    }
    return new Token(Token.STRING, ss, new Location(this.line));
}

Tokenizer.prototype.scanPunctuator = function() {
    
    // 1character punctuator
    
    if (this.c === ':') {
        var c = this.c;
        this.consume();
        return new Token(Token.COLON, c, new Location(this.line));
    }
    
    if (this.c === '{' || this.c === '}' || this.c === '(' ||
        this.c === ')' || this.c === '[' || this.c === ']' ||
        this.c === ',' || this.c === '.') {
        var c = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, c, new Location(this.line));
    }
}

Tokenizer.prototype.scanOperator = function() {
    
    // 3character operator
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '>>>' || op === '<<<') {
        this.consume();
        this.consume();
        return new Token(Token.OPERATOR, op, new Location(this.line));
    }
    
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
    
    // 4character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (op === '>>>=') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    // 3character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    // 2character assignment
    var op = this.c + this.lookahead(1);
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    // 1character assignment
    var op = this.c;
    if (op === '=') {
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    return false;
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
        return new Token(Token.SINGLE_LINE_COMMENT, comment, new Location(this.line));
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
        return new Token(Token.SINGLE_LINE_COMMENT, comment, new Location(this.line));
    }
}
return exports;
})();
