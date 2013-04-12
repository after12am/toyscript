/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2013 Satoshi Okami
 * Released under the MIT license
 */
module.exports = (function() {
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
// src/format.js
if (String.prototype.format == undefined) {
	String.prototype.format = function(arg) {
		
        var rep_fn = undefined;
        
        if (typeof arg == "object") {
            rep_fn = function(m, k) { return arg[k]; }
        } else {
            var args = arguments;
            rep_fn = function(m, k) { return args[parseInt(k)]; }
        }
        
        return this.replace(/\{(\w+)\}/g, rep_fn);
    }
}
// src/lexer.js
var Lexer = function() {
    
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
Lexer.prototype.isWhiteSpace = function(c) {
    return c.match(/^\s$/) && !this.isLineTerminator(c);
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.isLineTerminator = function(c) {
    return c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
}

Lexer.prototype.isDigit = function(c) {
    return c >= "0" && c <= "9";
}

Lexer.prototype.isLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "$";
}

Lexer.prototype.matchAssign = function(op) {
    
    // 4character assignment
    if (op === '>>>=') {
        return true;
    }
    
    // 3character assignment
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return true;
    }
    
    // 2character assignment
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        return true;
    }
    
    // 1character assignment
    if (op === '=') {
        return true;
    }
    
    return false;
}
// src/location.js
var Location = function(line, column) {
    this.line = line;
    this.column = column;
}

Location.prototype.toString = function() {
    return "Line " + this.line + " Column " + this.column;
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
// src/message.js
var Message = function(token, message) {
    this.token = token;
    this.message = message;
};

Message.prototype.toString = function() {
    var data = {
        "location": this.token.location.toString(), 
        "message": this.message
    };
    return "{location} {message}".format(data);
};

Message.UnknownToken = 'Unknown token';
Message.UnexpectedToken = 'Unexpected token';
Message.IllegalIdent = 'Illegal identifier';
Message.UnexpectedString = 'Unexpected string';
Message.IllegalComment = 'Illegal comment';
Message.IllegalBlock = 'Block statement must have one statement at least';
Message.IndentFor = 'Illegal for statement';
Message.IndentWhile = 'Indent while statement';
Message.IllegalContinue = 'Continue statement can not have label';
Message.IllegalContinuePosition = 'Continue statement have to be declared in iteration';
Message.IllegalBreak = 'Break statement can not have label';
Message.IllegalBreakPosition = 'Break statement have to be declared in iteration';
Message.IllegalReturn = 'Return statement has to be contained in function';
Message.IllegalReturnArgument = 'Return argument has to be one';
Message.IllegalRaise = 'Illegal raise statement';
Message.IllegalRaiseArgument =  'Raise argument has to be one';
Message.IllegalExcept = 'Illegal raise statement';
Message.IllegalFinally = 'Illegal finally statement';
Message.IndentSize = 'Indent size may be incorrect';
Message.IllegalIdentifier = 'Illegal identifier';
Message.IllegalArgumentList = 'Illegal arguments';
Message.IllegalPostfixIncrement = 'Postfix increment operator is only for identifier';
Message.IllegalPostfixDecrement = 'Postfix decrement operator is only for identifier';
Message.IllegalPrefixIncrement = 'Prefix increment operator is only for identifier';
Message.IllegalPrefixDecrement = 'Prefix decrement operator is only for identifier';
Message.IllegalMultiplicativeExpression = 'Illegal multiplicative expression';
Message.IllegalShiftExpression = 'Illegal shift expression';
Message.IllegalRelationalExpression = 'Illegal relational expression';
// src/parser.js
// http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/

var Parser = function(tokens, log) {
    this.p = 0;
    this.tokens = tokens;
    this.token = this.tokens[this.p];
    this.indent_size = 4;
    this.indent = 0;
    this.inFunction = false;
    this.inIteration = false;
    this.log = log || new Log();
}

Parser.prototype = new Lexer();
Parser.prototype.consume = function(k) {
    k = k || 1;
    while (k > 0) {
        this.p++;
        if (this.p < this.tokens.length) {
            this.token = this.tokens[this.p];
        } else {
            this.token = new Token(Token.EOF, '', this.tokens[this.tokens.length - 1].location);
        }
        k--;
    }
}

Parser.prototype.match = function(text) {
    return (this.token.text === text);
}

Parser.prototype.matchKind = function(kind) {
    return (this.token.kind === kind);
}

Parser.prototype.expect = function(value, message) {
    if (this.token.text !== value) {
        if (message) throw message;
        var data = {
            "location": this.token.location.toString(), 
            "unexpected": this.token.text,
            "expected": value
        };
        throw "{location} Unexpected token \"{unexpected}\" expecting \"{expected}\"".format(data);
    }
    this.consume();
}

Parser.prototype.expectKind = function(value, message) {
    if (this.token.kind !== kind) {
        if (message) throw message;
        var data = {
            "location": this.token.location.toString(), 
            "unexpected": this.token.kind,
            "expected": value
        };
        throw "{location} Unexpected token \"{unexpected}\" expecting \"{expected}\"".format(data);
    }
    this.consume();
}

/*
    LL(k)
*/
Parser.prototype.lookahead = function(k) {
    if (this.p + k < this.tokens.length) {
        return this.tokens[this.p + k];
    }
    return new Token(Token.EOF, '', this.tokens[this.tokens.length - 1].location);
}

/*
Parser.prototype.lookback = function(k) {
    if (this.p - k >= 0) {
        return this.tokens[this.p - k];
    }
    return this.tokens[0];
}

Parser.prototype.updateIndent = function() {
    if (this.indent_size * this.indent < this.token.text) {
        this.indent++;
    } else if (this.indent_size * this.indent > this.token.text) {
        this.indent--;
    }
}
*/

// alias of Parser.parseProgram
Parser.prototype.parse = function() {
    return this.parseProgram();
}

/*
    14 Program
    
    Program:
        SourceElements
*/
Parser.prototype.parseProgram = function() {
    
    for (var i = 1; i < this.tokens.length; i++) {
        if (this.tokens[i].kind === Token.INDENT) {
            this.indent_size = this.tokens[i].text;
            break;
        }
    }
    this.p = 0;
    return this.parseSourceElements();
}

/*
    14 Program
    
     SourceElements:
        SourceElement
        SourceElements SourceElement
*/
Parser.prototype.parseSourceElements = function() {
    
    var nodes = [];
    
    while (1) {
        // the first token would be Token.Indent. 
        if (this.lookahead(1).kind === Token.EOF) {
            break;
        }
        
        // reset indent
        this.expect(0);
        this.indent = 0;
        nodes.push(this.parseSourceElement());
        
        // line terminator of eof
        if (this.matchKind(Token.NEWLINE)) this.consume();
    }
    
    return nodes;
}

/*
    14 Program
    
    SourceElement:
        Statement
        FunctionDeclaration
*/
Parser.prototype.parseSourceElement = function() {
    
    var statements = this.parseStatement();
    if (statements) {
        return statements;
    }
    
    var statements = this.parseFunctionDeclaration();
    if (statements) {
        return statements;
    }
}

/*
    12 Statements
    
    Statement :
        Block
        EmptyStatement
        ExpressionStatement
        IfStatement
        IterationStatement
        ContinueStatement
        BreakStatement
        ReturnStatement
        RaiseStatement
        TryStatement
*/
Parser.prototype.parseStatement = function() {
    
    // if (this.token.kind === Token.INDENT) {
    //     this.updateIndent();
    //     this.consume();
    //     return this.parseStatement();
    // }
    
    if (this.token.kind === Token.INDENT) {
        this.consume();
        return this.parseStatement();
    }
    
    if (this.matchKind(Token.PUNCTUATOR)) {
        if (this.match(':')) {
            return this.parseBlock();
        }
    }
    
    switch (this.token.kind) {
    case Token.NEWLINE: return this.parseEmptyStatement();
    case Token.KEYWORDS.IF: return this.parseIfStatement();
    case Token.KEYWORDS.WHILE: return this.parseIterationStatement(); 
    case Token.KEYWORDS.FOR: return this.parseIterationStatement();
    case Token.KEYWORDS.CONTINUE: return this.parseContinueStatement();
    case Token.KEYWORDS.BREAK: return this.parseBreakStatement();
    case Token.KEYWORDS.RETURN: return this.parseReturnStatement();
    case Token.KEYWORDS.RAISE: return this.parseRaiseStatement();
    case Token.KEYWORDS.TRY: return this.parseTryStatement();
    case Token.COMMENT: return this.parseComment();
    default: return this.parseExpressionStatement();
    }
}

/*
    12.1 Block
    
    Block:
        : LineTerminator StatementList
*/
Parser.prototype.parseBlock = function() {
    
    this.expect(':');
    
    // for allowing below one liner code
    // example) if a: a = 1
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
    }
    
    var token = this.token;
    this.indent++;
    var exprs = this.parseStatementList();
    this.indent--;
    
    var pass = exprs.reduce(function(p, c) {
        return p || c.type !== Syntax.NEWLINE;
    }, false);
    
    if (!pass) {
        throw new Message(this.token, Message.IllegalBlock).toString();
    }
    
    return {
        type: Syntax.BlockStatement,
        body: exprs
    };
}

/*
    12.1 Block
    
    StatementList:
        Statement
        StatementList Statement
*/
Parser.prototype.parseStatementList = function() {
    
    var exprs = [];
    var indent = this.indent * this.indent_size;
    
    while (1) {
        
        if (this.token.kind === Token.EOF) break;
        if (this.token.kind === Token.NEWLINE) { // ignore newline token
            this.consume();
            continue;
        }
        
        if (this.token.kind === Token.INDENT) {
            if (this.token.text < indent) break;
            if (this.token.text > indent) {
                throw new Message(this.token, Message.IndentSize).toString();
            }
            this.consume();
            continue;
        }
        
        exprs.push(this.parseStatement());
    }
    
    if (exprs.length > 0) {
        exprs[exprs.length - 1].last = true;
    }
    
    return exprs;
}

/*
    12.3 Empty Statement
    
    EmptyStatement :
        LineTerminator
*/
Parser.prototype.parseEmptyStatement = function() {
    
    var token = this.token;
    this.expectKind(Token.NEWLINE);
    
    // If switching to below, ignores newline.
    //return this.parseStatement();
    return {
        type: Syntax.NEWLINE,
        value: token.text
    };
}

/*
    12.4 Expression Statement
    
    ExpressionStatement :
        [lookahead ∉ {:, def} ] Expression ;
*/
Parser.prototype.parseExpressionStatement = function() {
    
    if (this.match('def') || this.match(':')) {
        return;
    }
    return this.parseExpression();
}

/*
    12.5 The if Statement
    
    IfStatement :
        if Expression: Statement else Statement
        if Expression: Statement
*/
Parser.prototype.parseIfStatement = function() {
    
    var alternate = null;
    var indent = this.indent * this.indent_size;
    
    this.expect('if');
    
    var expr = this.parseExpression();
    var exprs = this.parseStatement();
    
    if (this.matchKind(Token.INDENT)) {
        if (!this.match(indent)) {
            throw new Message(this.token, Message.IndentSize).toString();
        }
        this.consume();
    }
    
    if (this.match('else')) {
        this.consume();
        // else if || else
        alternate = this.parseStatement();
    }
    
    return {
        type: Syntax.IfStatement,
        condition: expr,
        statements: exprs,
        alternate: alternate
    };
}

/*
    12.6 Iteration Statements
    
    IterationStatement :
        while Expression: Statement
        for LeftHandSideExpression in Expression: Statement
*/
Parser.prototype.parseIterationStatement = function() {
    
    if (this.match('while')) {
        this.consume();
        try {
            var expr = this.parseExpression();
        } catch (e) {
            throw new Message(this.token, Message.IndentWhile).toString();
        }
        
        this.inIteration = true;
        var body = this.parseStatement();
        this.inIteration = false;
        
        return {
            type: Syntax.WhileStatement,
            condition: expr,
            body: body
        };
    }
    
    if (this.match('for')) {
        this.consume();
        
        var arguments = [];
        while (1) {
            if (this.match('in')) break;
            if (this.match(',')) this.consume();
            arguments.push(this.parseLeftHandSideExpression());
        }
        this.expect('in');
        
        try {
            var right = this.parseExpression();
        } catch (e) {
            throw new Message(this.token, Message.IndentFor).toString();
        }
        
        this.inIteration = true;
        var body = this.parseStatement();
        this.inIteration = false;
        
        return {
            type: Syntax.ForInStatement,
            arguments: arguments,
            right: right,
            body: body
        };
    }
}

/*
    12.7 The continue Statement
    
    ContinueStatement :
        continue
*/
Parser.prototype.parseContinueStatement = function() {
    
    this.consume();
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        throw new Message(this.token, Message.IllegalContinue).toString();
    }
    
    if (!this.inIteration) {
        throw new Message(this.token, Message.IllegalContinuePosition).toString();
    }
    
    return {
        type: Syntax.ContinueStatement
    };
}

/*
    12.8 The break Statement
    
    BreakStatement :
        break
*/
Parser.prototype.parseBreakStatement = function() {
    
    this.consume();
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        throw new Message(this.token, Message.IllegalBreak).toString();
    }
    
    if (!this.inIteration) {
        throw new Message(this.token, Message.IllegalBreakPosition).toString();
    }
    
    return {
        type: Syntax.BreakStatement
    };
}

/*
    12.9 The return Statement
    
    ReturnStatement :
    return [LineTerminator 無し] Expressionopt ;
*/
Parser.prototype.parseReturnStatement = function() {
    
    this.consume();
    if (!this.inFunction) {
        throw new Message(this.token, Message.IllegalReturn).toString();
    }
    
    var argument = null;
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        argument = this.parseExpression();
    }
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        throw new Message(this.token, Message.IllegalReturnArgument).toString();
    }
    
    return {
        type: Syntax.ReturnStatement,
        argument: argument
    };
}

/*
    12.13 The throw statement
    
    RaiseStatement :
        raise [LineTerminator 無し] Expression
*/
Parser.prototype.parseRaiseStatement = function() {
    
    var argument = null;
    this.consume();
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        argument = this.parseExpression()
    }
    
    return {
        type: Syntax.RaiseStatement,
        argument: argument
    };
}

/*
    12.14 The try statement
    
    TryStatement :
        try Block Catch
        try Block Finally
        try Block Catch Finally
*/
Parser.prototype.parseTryStatement = function() {
    
    var indent = this.indent * this.indent_size;
    var handlers = [];
    var finalizer = null;
    
    this.expect('try');
    var block = this.parseBlock();
    this.expect(indent);
    
    while (this.match('except')) {
        handlers.push(this.parseExceptStatement());
        this.expect(indent);
    }
    
    if (this.match('finally')) {
        finalizer = this.parseFinallyStatement();
    }
    
    return {
        type: Syntax.TryStatement,
        block: block,
        handlers: handlers,
        finalizer: finalizer
    };
}

/*
    12.14 The try statement
    
    Except :
        except Identifieropt: Block
*/
Parser.prototype.parseExceptStatement = function() {
    
    var param = null;
    this.expect('except');
    if (!this.match(':')) {
        param = this.parseIdentifier();
    }
    
    return {
        type: Syntax.ExceptStatement,
        param: param,
        body: this.parseBlock()
    };
}

/*
    12.14 The try statement
    
    Finally:
        finally Block
*/
Parser.prototype.parseFinallyStatement = function() {
    
    this.consume();
    if (!this.match(':')) {
        throw new Message(this.token, Message.IllegalFinally).toString();
    }
    
    return {
        type: Syntax.FinallyStatement,
        body: this.parseBlock()
    };
}

/*
    VariableStatement :
        var VariableDeclarationList ;
*/
Parser.prototype.parseVariableStatement = function() {
    return this.parseVariableDeclarationList();
}

/*
    VariableDeclarationList :
        VariableDeclaration
        VariableDeclarationList , VariableDeclaration
*/
Parser.prototype.parseVariableDeclarationList = function() {
    return this.parseVariableDeclaration();
}

/*
    VariableDeclaration :
        Identifier Initialiser
*/
Parser.prototype.parseVariableDeclaration = function() {
    return this.parseInitialiser();
}

Parser.prototype.parseInitialiser = function() {
    return this.parseAssignmentExpression();
}

/*
    11.1 Primary Expressions
    
    PrimaryExpression :
        this
        Identifier
        Literal
        ArrayLiteral
        ObjectLiteral
        ( Expression )
*/
Parser.prototype.parsePrimaryExpression = function() {
    
    if (this.token.kind === Token.KEYWORDS.THIS) {
        this.consume();
        return {
            type: Syntax.ThisExpression
        };
    }
    
    if (this.token.kind === Token.IDENTIFIER) {
        return this.parseIdentifier();
    }
    
    if (this.token.kind === Token.KEYWORDS.NONE 
     || this.token.kind === Token.BOOLEAN
     || this.token.kind === Token.DIGIT 
     || this.token.kind === Token.STRING) {
        return this.parseLiteral();
    }
    
    if (this.token.kind === Token.PUNCTUATOR) {
        if (this.match('[')) return this.parseArrayInitialiser();
        if (this.match('{')) return this.parseObjectInitialiser();
        if (this.match('(')) return this.parseGroupingOperator();
    }
    
    throw new Message(this.token, Message.UnexpectedToken, '\'' + this.token.text + '\'').toString();
}

/*
    11.1.2 Identifier Reference
*/
Parser.prototype.parseIdentifier = function() {
    
    // if (this.lookahead(1).kind == Token.EOF 
    //  || this.lookahead(1).kind == Token.NEWLINE) {
    //     if (this.lookback(1).kind !== Token.PUNCTUATOR) {
    //         throw new Message(this.token, Message.IllegalIdentifier).toString();
    //     }
    // }
    
    var token = this.token;
    this.consume();
    return {
        type: Syntax.Identifier,
        value: token.text 
    };
}

/*
    7.8 Literals
    
    Literal ::
        NullLiteral
        BooleanLiteral
        NumericLiteral
        StringLiteral
*/
Parser.prototype.parseLiteral = function() {
    
    if (this.token.kind === Token.KEYWORDS.NONE) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NoneLiteral,
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
}

/*
    11.1.4 Array Initialiser
    
    ArrayLiteral :
        [ Elisionopt ]
        [ ElementList ]
        [ ElementList , Elisionopt ] <- ban
*/
Parser.prototype.parseArrayInitialiser = function() {
    this.expect('[');
    var eles = this.parseElementList();
    this.expect(']');
    return {
        type: Syntax.ArrayExpression,
        elements: eles
    };
}

/*
    11.1.4 Array Initialiser
    
    ElementList :
        Elisionopt AssignmentExpression
        ElementList , Elisionopt AssignmentExpression
            |
            V
        AssignmentExpression
        ElementList, AssignmentExpression
*/
Parser.prototype.parseElementList = function() {
    var elements = [];
    while (!this.match(']')) {
        if (this.match(',')) this.consume();
        elements.push(this.parseAssignmentExpression());
    }
    return elements;
}

/*
    11.1.4 Array Initialiser
    
    Elision :
        ,
        Elision ,
*/
Parser.prototype.parseElision = function() {
    // not implemented
}

/*
    11.1.5 Object Initialiser
    
    ObjectLiteral :
        { }
        { PropertyNameAndValueList }
*/
Parser.prototype.parseObjectInitialiser = function() {
    this.expect('{');
    var props = this.parsePropertyNameAndValueList()
    this.expect('}');
    return {
        type: Syntax.ObjectExpression,
        properties: props
    };
}

/*
    11.1.5 Object Initialiser
    
    PropertyNameAndValueList :
        PropertyName : AssignmentExpression
        PropertyNameAndValueList , PropertyName : AssignmentExpression
*/
Parser.prototype.parsePropertyNameAndValueList = function() {
    var props = [];
    while (!this.match('}')) {
        if (this.match(',')) {
            this.consume();
        }
        var name = this.parsePropertyName();
        this.expect(':');
        props.push({
            type: Syntax.Property,
            name: name,
            value: this.parseAssignmentExpression()
        });
    }
    return props;
}

/*
    11.1.5 Object Initialiser
    
    PropertyName :
        Identifier
        StringLiteral
        NumericLiteral
*/
Parser.prototype.parsePropertyName = function() {
    
    if (this.token.kind === Token.IDENTIFIER) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Identifier,
            name: token.text 
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.StringLiteral,
            name: token.text
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NumericLiteral,
            name: token.text
        };
    }
}

/*
    11.1.6 The Grouping Operator
    
    ( Expression )
*/
Parser.prototype.parseGroupingOperator = function() {
    this.expect('(');
    var expr = this.parseExpression();
    this.expect(')');
    return {
        type: Syntax.GroupingExpression,
        expr: expr
    };
}

/*
    11.2 Left-Hand-Side Expressions
    
    MemberExpression :
        PrimaryExpression
        FunctionExpression
        MemberExpression [ Expression ]
        MemberExpression . Identifier
        new MemberExpression Arguments
*/
Parser.prototype.parseLeftHandSideExpressions = function() {
    
    var expr = this.parseFunctionExpression() || this.parsePrimaryExpression();
    
    if (this.match('[')) {
        return {
            type: Syntax.MemberExpression,
            object: expr,
            member: this.parseMemberExpression(),
        };
    }
    
    if (this.match('.')) {
        return {
            type: Syntax.MemberExpression,
            object: expr,
            member: this.parseMemberExpression(),
        };
    }
    
    if (this.match('(')) {
        return {
            type: Syntax.MemberExpression,
            callee: expr,
            arguments: this.parseArguments()
        };
    }
    
    return expr;
}

/*
    11.2 Left-Hand-Side Expressions
    
    MemberExpression :
        PrimaryExpression
        FunctionExpression
        MemberExpression [ Expression ]
        MemberExpression . Identifier
        new MemberExpression Arguments
*/
Parser.prototype.parseMemberExpression = function() {
    
    if (this.match('[')) {
        this.consume();
        
        var object = {
            type: Syntax.MemberExpression,
            object: this.parseExpression(),
            syntax: 'bracket'
        };
        
        this.expect(']');
        
        if (this.match('[') || this.match('.') || this.match('(')) {
            object.member = this.parseMemberExpression();
        }
        
        return object;
    }
    
    if (this.match('.')) {
        this.consume();
        
        var object = {
            type: Syntax.MemberExpression,
            object: this.parseIdentifier(),
            syntax: 'dot'
        };
        
        if (this.match('[') || this.match('.') || this.match('(')) {
            object.member = this.parseMemberExpression();
        }
        
        return object;
    }
    
    if (this.match('(')) {
        
        var object = {
            type: Syntax.MemberExpression,
            callee: null,
            arguments: this.parseArguments(),
            syntax: 'parenthesis'
        };
        
        if (this.match('[') || this.match('.') || this.match('(')) {
            object.member = this.parseMemberExpression();
        }
        
        return object;
    }
}

/*
    11.2.2 The new Operator
    
    NewExpression :
        MemberExpression
        new NewExpression
*/
Parser.prototype.parseNewExpression = function() {
    
    if (this.match('new')) {
        this.consume();
        var expr = this.parseNewExpression();
        return {
            type: Syntax.NewExpression,
            callee: expr['callee'],
            arguments: expr['arguments']
        };
    }
    
    return this.parseLeftHandSideExpressions();
}

/*
    11.2.3 Function Calls
    
    CallExpression :
        MemberExpression Arguments
        CallExpression Arguments
        CallExpression [ Expression ]
        CallExpression . Identifier
*/
/*
Parser.prototype.parseCallExpression = function() {
    
    if (this.match('[')) {
        return {
            type: Syntax.CallExpression,
            object: expr,
            member: this.parseCallMember(),
        };
    }
    
    if (this.match('.')) {
        return {
            type: Syntax.CallExpression,
            object: expr,
            member: this.parseCallMember(),
        };
    }
    
    if (this.match('(')) {
        return {
            type: Syntax.CallExpression,
            callee: expr,
            arguments: this.parseArguments()
        };
    }
    
    return expr;
}

Parser.prototype.parseCallMember = function() {
    
    if (this.match('[')) {
        this.consume();
        
        var object = {
            type: Syntax.CallExpression,
            object: this.parseExpression(),
            syntax: 'bracket'
        };
        
        this.expect(']');
        
        if (this.match('[') || this.match('.') || this.match('(')) {
            object.member = this.parseCallMember();
        }
        
        return object;
    }
    
    if (this.match('.')) {
        this.consume();
        
        var object = {
            type: Syntax.CallExpression,
            object: this.parseExpression(),
            syntax: 'dot'
        };
        
        if (this.match('[') || this.match('.') || this.match('(')) {
            object.member = this.parseCallMember();
        }
        
        return object;
    }
    
    if (this.match('(')) {
        
        var object = {
            type: Syntax.CallExpression,
            callee: null,
            arguments: this.parseArguments(),
            syntax: 'parenthesis'
        };
        
        if (this.match('[') || this.match('.') || this.match('(')) {
            object.member = this.parseCallMember();
        }
        
        return object;
    }
}
*/

/*
    11.2.4 Argument Lists
    
    Arguments:
        ( )
        ( ArgumentList )
    
*/
Parser.prototype.parseArguments = function() {
    
    this.expect('(');
    var arguments = this.parseArgumentList();
    this.expect(')');
    
    return arguments;
}

/*
    11.2.4 Argument Lists
    
    ArgumentList:
        AssignmentExpression
        ArgumentList , AssignmentExpression
*/
Parser.prototype.parseArgumentList = function() {
    
    var arguments = [];
    
    while (!this.match(')')) {
        
        if (this.matchKind(Token.NEWLINE)
         || this.matchKind(Token.EOF)) {
             throw new Message(this.token, Message.IllegalArgumentList).toString();
        }
        
        arguments.push(this.parseAssignmentExpression());
        if (this.match(')')) break;
        
        this.expect(',');
    }
    
    return arguments;
}

/*
    11.2.5 Function Expressions
    
    FunctionExpression :
        function Identifieropt ( FormalParameterListopt ) { FunctionBody }
         |
         v
        ( expression ): ReturnStatement
*/
Parser.prototype.parseFunctionExpression = function() {
    
    // lambda expression
    // (2): x * x
    if (this.match('(')) {
        
        var k = 1;
        while (this.lookahead(k++).text === ')') {
            if (this.lookahead(k).kind === Token.NEWLINE
             || this.lookahead(k).kind === Token.EOF) break;
        }
        
        if (this.lookahead(++k).text === ':') {
            var params = this.parseFormalParameterList();
            this.expect(':');
            
            this.inFunction = true;
            var body = this.parseExpression();
            this.inFunction = false;
            
            return {
                type: Syntax.FunctionExpression,
                id: null,
                params: params,
                body: body
            };
        }
    }
}

/*
    11.2 Left-Hand-Side Expressions
    
    LeftHandSideExpression :
        NewExpression
        CallExpression
*/
Parser.prototype.parseLeftHandSideExpression = function() {
    return this.parseNewExpression();// || this.parseCallExpression();
}

/*
    11.3 Postfix Expressions
    
    PostfixExpression :
        LeftHandSideExpression
        LeftHandSideExpression [LineTerminator 無し] ++
        LeftHandSideExpression [LineTerminator 無し] --
*/
Parser.prototype.parsePostfixExpression = function() {
    
    var expr = this.parseLeftHandSideExpression();
    
    // postfix increment operator
    if (this.match('++') || this.match('--')) {
        var token = this.token;
        this.consume();
        
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            if (token.text === '++') throw new Message(this.token, Message.IllegalPostfixIncrement).toString();
            if (token.text === '--') throw new Message(this.token, Message.IllegalPostfixDecrement).toString();
        }
        
        return {
            type: Syntax.PostfixExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    return expr;
}

/*
    11.4 Unary Operators
    
    UnaryExpression:
        delete UnaryExpression
        void UnaryExpression
        typeof UnaryExpression
        ++ UnaryExpression
        -- UnaryExpression
        + UnaryExpression
        - UnaryExpression
        ~ UnaryExpression
        ! UnaryExpression
        not UnaryExpression
        PostfixExpression
*/
Parser.prototype.parseUnaryExpression = function() {
    
    // 11.4.1 - 11.4.3
    if (/*this.match('typeof') || */this.match('void') || this.match('delete')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    // 11.4.4 - 11.4.5
    if (this.match('++') || this.match('--')) {
        var token = this.token;
        this.consume();
        
        var expr = this.parseUnaryExpression();
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            if (token.text === '++') throw new Message(this.token, Message.IllegalPrefixIncrement).toString();
            if (token.text === '--') throw new Message(this.token, Message.IllegalPrefixDecrement).toString();
        }
        
        return {
            type: Syntax.PrefixExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    // 11.4.6 - 11.4.9
    if (this.match('+') || this.match('-') || this.match('~') || this.match('!')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        // may have to handle exception here
        // example, {} + {}, {} - {}
        return {
            type: Syntax.UnaryExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    // 11.4.9
    if (this.match('not')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    return this.parsePostfixExpression();
}

/*
    11.5 Multiplicative Operators
    
    MultiplicativeExpression :
        UnaryExpression
        MultiplicativeExpression * UnaryExpression
        MultiplicativeExpression / UnaryExpression
        MultiplicativeExpression % UnaryExpression
*/
Parser.prototype.parseMultiplicativeExpression = function() {
    
    var expr = this.parseUnaryExpression();
    
    // 11.5.1 - 11.5.3
    if (this.match('/') || this.match('*') || this.match('%')) {
        var token = this.token;
        this.consume();
        
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            throw new Message(this.token, Message.IllegalMultiplicativeExpression).toString();
        }
        
        return {
            type: Syntax.MultiplicativeExpression,
            operator: token.text,
            left: expr,
            right: this.parseUnaryExpression()
        };
    }
    
    return expr;
}

/*
    11.6 Additive Operators
    
    AdditiveExpression :
        MultiplicativeExpression
        AdditiveExpression + MultiplicativeExpression
        AdditiveExpression - MultiplicativeExpression
*/
Parser.prototype.parseAdditiveExpression = function() {
    
    var expr = this.parseMultiplicativeExpression();
    
    // 11.6.1 - 11.6.2
    if (this.match('+') || this.match('-')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.AdditiveExpression,
            operator: token.text,
            left: expr,
            right: this.parseUnaryExpression()
        };
    }
    
    return expr;
}

/*
    11.7 Bitwise Shift Operators
    
    ShiftExpression :
        AdditiveExpression
        ShiftExpression << AdditiveExpression
        ShiftExpression >> AdditiveExpression
        ShiftExpression >>> AdditiveExpression
*/
Parser.prototype.parseShiftExpression = function() {
    
    var expr = this.parseAdditiveExpression();
    
    if (this.match('<<') || this.match('>>')) {
        var token = this.token;
        this.consume();
        
        /*
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            throw new Message(this.token, Message.IllegalShiftExpression).toString();
        }*/
        
        return {
            type: Syntax.ShiftExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    if (this.match('>>>')) {
        var token = this.token;
        this.consume();
        
        /*
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            throw new Message(this.token, Message.IllegalShiftExpression).toString();
        }*/
        
        return {
            type: Syntax.ShiftExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    return expr;
}

/*
    11.8 Relational Operators
    
    RelationalExpression :
        ShiftExpression
        RelationalExpression < ShiftExpression
        RelationalExpression > ShiftExpression
        RelationalExpression <= ShiftExpression
        RelationalExpression >= ShiftExpression
        RelationalExpression instanceof ShiftExpression
        RelationalExpression in ShiftExpression
*/
Parser.prototype.parseRelationalExpression = function() {
    
    var expr = this.parseShiftExpression();
    
    // 11.8.1 - 11.8.2
    if (this.match('<') || this.match('>')) {
        var token = this.token;
        this.consume();
        
        /*
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            throw new Message(this.token, Message.IllegalRelationalExpression).toString();
        }*/
        
        return {
            type: Syntax.RelationalExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    // 11.8.3 - 11.8.4
    if (this.match('<=') || this.match('>=')) {
        var token = this.token;
        this.consume();
        
        /*
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            throw new Message(this.token, Message.IllegalRelationalExpression).toString();
        }*/
        
        return {
            type: Syntax.RelationalExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    /*
    if (this.match('instanceof')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.RelationalExpression,
            operator: token.text,
            expr: expr,
        };
    }
    */
    
    // 11.8.7
    if (this.match('in')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.RelationalExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    return expr;
}

/*
    11.9 Equality Operators
    
    EqualityExpression :
        RelationalExpression
        EqualityExpression == RelationalExpression
        EqualityExpression != RelationalExpression
        EqualityExpression === RelationalExpression
        EqualityExpression !== RelationalExpression
*/
Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
    // 11.9.1 - 11.9.2
    if (this.match('==') || this.match('!=')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.EqualityOperator,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    // 11.9.4 - 11.9.5
    if (this.match('===') || this.match('!==')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.EqualityOperator,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    return expr;
}

/*
    11.10 Binary Bitwise Operators
    
    EqualityExpression :
        BitwiseANDExpression & EqualityExpression
*/
Parser.prototype.parseBitwiseANDExpression = function() {
    
    var token = this.token;
    var expr = this.parseEqualityExpression();
    
    if (this.match('&')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BitwiseBitwiseOperator,
            operator: token.text,
            left: expr,
            right: this.parseEqualityExpression()
        };
    }
    
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    BitwiseXORExpression :
        BitwiseANDExpression
        BitwiseXORExpression ^ BitwiseANDExpression
*/
Parser.prototype.parseBitwiseXORExpression = function() {
    
    var expr = this.parseBitwiseANDExpression();
    
    if (this.match('^')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BitwiseBitwiseOperator,
            operator: token.text,
            left: expr,
            right: this.parseBitwiseANDExpression()
        };
    }
    
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    BitwiseORExpression :
        BitwiseXORExpression
        BitwiseORExpression | BitwiseXORExpression
*/
Parser.prototype.parseBitwiseORExpression = function() {
    
    var expr = this.parseBitwiseXORExpression();
    
    if (this.match('|')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BitwiseBitwiseOperator,
            operator: token.text,
            left: expr,
            right: this.parseBitwiseXORExpression()
        };
    }
    
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    LogicalANDExpression :
        BitwiseORExpression
        LogicalANDExpression && BitwiseORExpression
*/
Parser.prototype.parseLogicalANDExpression = function() {
    
    var expr = this.parseBitwiseORExpression();
    
    if (this.match('and')) {
        this.consume();
        expr = {
            type: Syntax.BinaryLogicalOperator,
            operator: 'and',
            left: expr,
            right: this.parseBitwiseORExpression()
        }
    }
    
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    LogicalORExpression :
        LogicalANDExpression
        LogicalORExpression || LogicalANDExpression
*/
Parser.prototype.parseLogicalORExpression = function() {
    
    var expr = this.parseLogicalANDExpression();
    var or = this.token.text;
    
    if (or == 'or') {
        this.consume();
        expr = {
            type: Syntax.BinaryLogicalOperator,
            operator: 'or',
            left: expr,
            right: this.parseBitwiseORExpression()
        }
    }
    
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    ConditionalExpression :
        LogicalORExpression
        LogicalORExpression ? AssignmentExpression : AssignmentExpression
*/
Parser.prototype.parseConditionalExpression = function() {
    
    var expr = this.parseLogicalORExpression();
    
    if (this.match('?')) {
        this.consume();
        var primary = this.parseAssignmentExpression();
        this.expect(':');
        return {
            type: Syntax.ConditionalOperator,
            condition: expr,
            primary: primary,
            alternate: this.parseAssignmentExpression()
        };
    }
    
    return expr;
}

/*
    11.13 Assignment Operators
    
    AssignmentExpression:
        ConditionalExpression
        LeftHandSideExpression AssignmentOperator AssignmentExpression
*/
Parser.prototype.parseAssignmentExpression = function() {
    
    var expr = this.parseConditionalExpression();
    
    // AssignmentOperator
    if (this.matchAssign(this.token.text)) {
        var assign = this.token.text;
        this.consume();
        
        // not implement
        // LeftHandSideExpression
        // var expr = this.parseLeftHandSideExpression();
        
        expr = {
            type: Syntax.AssignmentOperator,
            operator: assign,
            left: expr,
            right: this.parseAssignmentExpression()
        };
    }
    
    return expr;
}

/*
    11.14 Comma Operator ( , )
    
    Expressions
    	AssignmentExpression
        Expression , AssignmentExpression
*/
Parser.prototype.parseExpression = function() {
    
    var expr = this.parseAssignmentExpression();
    
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
            expr.expressions.push(this.parseAssignmentExpression());
        }
    }
    
    return expr;
}

/*
    7.4 Comments
*/
Parser.prototype.parseComment = function() {
    
    // multi line comment
    if (this.token.multiple) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Comment,
            value: token.text,
            multiple: true
        }
    }
    // single line comment
    else {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Comment,
            value: token.text,
            multiple: false
        }
    }
}




/*
    13 Function Definition
    
    FunctionDeclaration :
        function Identifier ( FormalParameterListopt ) { FunctionBody }
*/
Parser.prototype.parseFunctionDeclaration = function() {
    this.expect('def');
    var id = this.parseIdentifier();
    var params = this.parseFormalParameterList();
    this.inFunction = true;
    var body = this.parseFunctionBody();
    this.inFunction = false;
    return {
        type: Syntax.FunctionDeclaration,
        id: id,
        params: params,
        body: body
    };
}

/*
    13 Function Definition
    
    FormalParameterList :
        Identifier
        FormalParameterList , Identifier
*/
Parser.prototype.parseFormalParameterList = function() {
    
    this.expect('(');
    
    var params = [];
    while (!this.match(')')) {
        if (this.match(',')) {
            this.consume();
        }
        params.push(this.parseInitialiser());
    }
    
    this.expect(')');
    return params;
}

/*
    13 Function Definition
    
    FunctionBody :
        SourceElements
*/
Parser.prototype.parseFunctionBody = function() {
    return this.parseBlock();
}

// src/syntax.js
var Syntax = [];
Syntax.BlockStatement = 'BlockStatement';
Syntax.IfStatement = 'IfStatement';
Syntax.WhileStatement = 'WhileStatement';
Syntax.ForStatement = 'ForStatement';
Syntax.ContinueStatement = 'ContinueStatement';
Syntax.BreakStatement = 'BreakStatement';
Syntax.ReturnStatement = 'ReturnStatement';
Syntax.RaiseStatement = 'RaiseStatement';
Syntax.TryStatement = 'TryStatement';
Syntax.ExceptStatement = 'ExceptStatement';
Syntax.FinallyStatement = 'FinallyStatement';
Syntax.ThisExpression = 'ThisExpression';
Syntax.NoneLiteral = 'NoneLiteral';
Syntax.BooleanLiteral = 'BooleanLiteral';
Syntax.NumericLiteral = 'NumericLiteral';
Syntax.StringLiteral = 'StringLiteral';
Syntax.ArrayExpression = 'ArrayExpression';
Syntax.ObjectExpression = 'ObjectExpression';
Syntax.Property = 'Property';
Syntax.Identifier = 'Identifier';
Syntax.GroupingExpression = 'GroupingExpression';
Syntax.MemberExpression = 'MemberExpression';
Syntax.CallExpression = 'CallExpression';
Syntax.Comment = 'Comment';
Syntax.SequenceExpression = 'SequenceExpression';
Syntax.EqualityExpression = 'EqualityExpression';
Syntax.BinaryExpression = 'BinaryExpression';
Syntax.LogicalExpression = 'LogicalExpression';
Syntax.ConditionalExpression = 'ConditionalExpression';
Syntax.NewExpression = 'NewExpression';
Syntax.PostfixExpression = 'PostfixExpression';
Syntax.PrefixExpression = 'PrefixExpression';
Syntax.UnaryExpression = 'UnaryExpression';
Syntax.AdditiveExpression = 'AdditiveExpression';
Syntax.MultiplicativeExpression = 'MultiplicativeExpression';
Syntax.ShiftExpression = 'ShiftExpression';
Syntax.RelationalExpression = 'RelationalExpression';
Syntax.EqualityOperator =  'EqualityOperator';
Syntax.BitwiseBitwiseOperator = 'BitwiseBitwiseOperator';
Syntax.BinaryLogicalOperator = 'BinaryLogicalOperator';
Syntax.ConditionalOperator = 'ConditionalOperator';
Syntax.AssignmentOperator = 'AssignmentOperator';
Syntax.FunctionDeclaration = 'FunctionDeclaration';
Syntax.NEWLINE = 'NewLine';
// Syntax.NaNLiteral = 'NaNLiteral';
// Syntax.InfinityLiteral = 'InfinityLiteral';
// src/token.js
var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    var data = {
        "location": this.location.toString(), 
        "kind": this.kind, 
        "message": this.text
    };
    return "{location} kind:{kind} text:{message}".format(data);
}

/*
    Tokens
*/
Token.EOF = '<END>';
Token.NEWLINE = 'NEWLINE';
Token.INDENT = 'INDENT';
Token.IDENTIFIER = 'IDENTIFIER';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.COLON = 'COLON';
Token.COMMENT = 'COMMENT';
Token.BOOLEAN = 'BOOLEAN';

/*
    Keywords
*/
Token.KEYWORDS = [];
Token.KEYWORDS.AND = 'and';
Token.KEYWORDS.BREAK = 'break';
Token.KEYWORDS.CATCH = 'catch';
Token.KEYWORDS.CLASS = 'class';
Token.KEYWORDS.CONTINUE = 'continue';
Token.KEYWORDS.DELETE = 'delete';
Token.KEYWORDS.ELSE = 'else';
Token.KEYWORDS.DEF = 'def';
Token.KEYWORDS.FINALLY = 'finally';
Token.KEYWORDS.FOR = 'for';
Token.KEYWORDS.IF = 'if';
Token.KEYWORDS.IN = 'in';
Token.KEYWORDS.IS = 'is';
Token.KEYWORDS.NEW = 'new';
Token.KEYWORDS.NOT = 'not';
Token.KEYWORDS.OR = 'or';
Token.KEYWORDS.RETURN = 'return';
Token.KEYWORDS.THIS = 'this';
Token.KEYWORDS.TRY = 'try';
Token.KEYWORDS.RAISE = 'raise';
Token.KEYWORDS.VOID = 'void';
Token.KEYWORDS.WHILE = 'while';
Token.KEYWORDS.XOR = 'xor';
Token.KEYWORDS.NONE = 'none';
// src/tokenizer.js
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
        if (this.isWhiteSpace(this.c)) {
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
        
        if (this.isLetter(this.c)) {
            if (token = this.scanIdent()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.isDigit(this.c)) {
            if (this.isLetter(this.lookahead(1)) && this.lookahead(1) !== 'EOF') {
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
    
    http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/7_Lexical_Conventions.html#Comment
*/
Tokenizer.prototype.scanComment = function() {
    
    var sign = this.c;
    if (sign === '#') {
        this.consume();
        var comment = '';
        while (!(this.c === Token.EOF || this.isLineTerminator(this.c))) {
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
        if (this.isLetter(c) || this.isDigit(c)) {
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
        if (this.isLetter(this.c) || this.isDigit(this.c)) {
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
        op === '>=' || op === '==') {
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
*/
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

/*
    7.8.4 String Literals
*/
Tokenizer.prototype.scanString = function(delimiter) {
    
    var ss = '';
    var location = new Location(this.line, this.column);
    this.consume();
    
    while (1) {
        if (this.c === Token.EOF || this.isLineTerminator(this.c)) {
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
return exports;
})();
