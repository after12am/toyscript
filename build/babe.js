/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2013 Satoshi Okami
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
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_";
}

Lexer.prototype.isLineTerminator = function(c) {
    return c == '\n' || c == '\r';// || c == '\r\n';
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

Parser.prototype.match = function(text) {
    return (this.token.text == text);
}

Parser.prototype.matchAssign = function() {
    
    var op = this.token.text;
    
    // 4character assignment
    // var op = this.token.text + this.lookahead(1).text + this.lookahead(2).text + this.lookahead(3).text;
    if (op === '>>>=') {
        return op;
    }
    
    // 3character assignment
    // var op = this.token.text + this.lookahead(1).text + this.lookahead(2).text;
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return op;
    }
    
    // 2character assignment
    // var op = this.token.text + this.lookahead(1).text;
    
    //console.log(op)
    
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        return op;
    }
    
    // 1character assignment
    // var op = this.token.text;
    if (op === '=') {
        return op;
    }
}

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

Parser.prototype.expect = function(text) {
    if (this.token.text !== text) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    this.consume();
}

Parser.prototype.lookahead = function(k) {
    if (this.p + k < this.tokens.length) {
        return this.tokens[this.p + k];
    } else {
        return new Token(Token.EOF, '', this.tokens[this.tokens.length - 1].location);
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

/*
    Program:
        SourceElements
*/
Parser.prototype.parseProgram = function() {
    this.p = 0;
    return this.parseSourceElements();
}

/*
    SourceElements:
        SourceElement
        SourceElements SourceElement
*/
Parser.prototype.parseSourceElements = function() {
    
    this.expect(0);
    
    while (1) {
        
        if (this.token.kind === Token.EOF) {
            this.consume();
            break;
        }
        
        var e = this.parseSourceElement();
        if (e) {
            this.indent = 0;
            this.nodes.push(e);
        }
    }
    
    return this.nodes;
}

/*
    SourceElement:
        Statement
        FunctionDeclaration
*/
Parser.prototype.parseSourceElement = function() {
    
    var statement;
    
    // delete
    // if (this.token.kind === Token.NEWLINE) {
    //     this.consume();
    // }
    
    if (statement = this.parseStatement()) {
        return statement;
    }
    
    // if (statement = this.parseFunctionDeclaration()) {
    //     return statement;
    // }
}

Parser.prototype.parseFunctionDeclaration = function() {
    
}

/*
    Statement:
        Block
        VariableStatement
        EmptyStatement
        ExpressionStatement
        IfStatement
        IterationStatement
        ContinueStatement
        BreakStatement
        ReturnStatement
        ThrowStatement
        TryStatement
*/
Parser.prototype.parseStatement = function() {
    
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
    
    if (this.token.kind === Token.NEWLINE) {
        var expr = {
            type: Syntax.NEWLINE,
            value: this.token.text
        };
        this.consume();
        // also plays a role of EmptyStatement by not ignoring newline.
        return expr;
        // ignore newline
        //return this.parseStatement();
    }
    
    // syntax check around ident
    if (this.token.kind === Token.IDENTIFIER) {
        // ident statement only
        if (this.lookahead(1).kind == Token.EOF 
         || this.lookahead(1).kind == Token.NEWLINE) {
            throw this.token.location.toString() + ', Syntax error';
        }
    }
    
    if (this.token.kind === Token.KEYWORDS.IF) {
        return this.parseIfStatement();
    }
    
    if (this.token.kind === Token.KEYWORDS.WHILE 
     || this.token.kind === Token.KEYWORDS.FOR) {
        return this.parseIterationStatement();
    }
    
    if (this.token.kind === Token.KEYWORDS.CONTINUE) {
        return this.parseContinueStatement();
    }
    
    if (this.token.kind === Token.KEYWORDS.BREAK) {
        return this.parseBreakStatement();
    }
    
    if (this.token.kind === Token.KEYWORDS.RETURN) {
        return this.parseReturnStatement();
    }
    
    if (this.token.kind === Token.KEYWORDS.RAISE) {
        return this.parseRaiseStatement();
    }
    
    if (this.token.kind === Token.KEYWORDS.TRY) {
        return this.parseTryStatement();
    }
    
    
    if (this.match(':')) {
        this.consume();
        // expect newline
        this.consume();
        return this.parseBlock();
    }
    
    
    
    
    switch (this.token.kind) {
        // case Token.IDENTIFIER:
        // case Token.BOOLEAN:
        // case Token.PUNCTUATOR:
        //     return this.parseVariableStatement();
        case Token.SINGLE_LINE_COMMENT:
            return this.parseComment();
        default:
            //console.log(this.token)
            //throw 'Unknown token ' + this.token;
    }
    
    var expr = this.parseExpression();
    if (expr) {
        return expr;
    }
    
    
}

/*
    Block:
        { StatementList }
*/
Parser.prototype.parseBlock = function() {
    return this.parseStatementList();
}

/*
    StatementList:
        Statement
        StatementList Statement
*/
Parser.prototype.parseStatementList = function() {
    
    var exprs = [this.parseStatement()];
    var indent = this.indent * this.indent_size;
    
    while (1) {
        
        // ignore newline token
        if (this.token.kind === Token.NEWLINE) {
            this.consume();
        }
        
        if (this.token.kind === Token.EOF) {
            break;
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
            this.consume();
        }
        
        if (expr = this.parseStatement()) {
            exprs.push(expr);
        }
    }
    
    return exprs;
}

/*
    IfStatement:
        if ( Expression ) Statement else Statement
        if ( Expression ) Statement
*/
Parser.prototype.parseIfStatement = function() {
    
    var alternate = null;
    var indent = this.indent * this.indent_size;
    
    this.expect('if');
    
    var expr = this.parseExpression();
    if (!expr) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    
    var exprs = this.parseStatement();
    if (!exprs[0]) {
        throw this.token.location.toString() + ', SyntaxError: No statement';
    }
    
    if (this.token.kind !== Token.EOF) {
        // expect indent token
        this.expect(indent);
        if (this.match('else')) {
            this.consume();
            // else statement
            if (this.match(':')) {
                return {
                    type: Syntax.IfStatement,
                    statements: this.parseStatement()
                };
            }
            if (this.match('if')) {
                alternate = this.parseStatement();
            }
        }
    }
    
    return {
        type: Syntax.IfStatement,
        condition: expr,
        statements: exprs,
        alternate: alternate
    };
}

/*
    IterationStatement:
        while ( Expression ) Statement
        for ( LeftHandSideExpression in Expression ) Statement
*/
Parser.prototype.parseIterationStatement = function() {
    
    if (this.match('while')) {
        
        // consume while keyword
        this.consume();
        
        var expr = this.parseExpression();
        if (!expr) {
            throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
        }
        
        var exprs = this.parseStatement();
        if (!exprs[0]) {
            throw this.token.location.toString() + ', SyntaxError: No statement';
        }
        
        return {
            type: Syntax.WhileStatement,
            condition: expr,
            statements: exprs
        };
    }
    
    if (this.match('for')) {
        
        // consume for keyword
        this.consume();
        
        if (this.lookahead(1).text !== 'in') {
            throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
        }
        
        var left = this.parseExpression();
        if (!left) {
            throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
        }
        
        this.expect('in');
        
        var expr = this.parseExpression();
        if (!expr) {
            throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
        }
        
        var exprs = this.parseStatement();
        if (!exprs[0]) {
            throw this.token.location.toString() + ', SyntaxError: No statement';
        }
        
        return {
            type: Syntax.ForInStatement,
            left: left,
            right: expr,
            statements: exprs
        };
    }
}

/*
    ContinueStatement:
        continue
*/
Parser.prototype.parseContinueStatement = function() {
    this.consume();
    return {
        type: Syntax.ContinueStatement
    };
}

/*
    BreakStatement:
        break
*/
Parser.prototype.parseBreakStatement = function() {
    this.consume();
    return {
        type: Syntax.BreakStatement
    };
}

/*
    ReturnStatement:
        return Expression
*/
Parser.prototype.parseReturnStatement = function() {
    this.consume();
    var expr = this.parseExpression();
    if (!expr) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    return {
        type: Syntax.ReturnStatement,
        expr: expr
    };
}

/*
    RaiseStatement:
        raise Expression
*/
Parser.prototype.parseRaiseStatement = function() {
    this.consume();
    var expr = this.parseExpression();
    if (!expr) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    return {
        type: Syntax.RaiseStatement,
        expr: expr
    };
}

/*
    TryStatement:
        try Block except
        try Block finally
        try Block except finally
*/
Parser.prototype.parseTryStatement = function() {
    
    this.consume();
    
    var except;
    var indent = this.indent * this.indent_size;
    
    var exprs = this.parseStatement();
    if (!exprs[0]) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    
    if (this.indent_size * this.indent !== this.token.text) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    this.consume();
    
    if (this.match('except')) {
        except = this.parseExceptStatement();
    }
    
    if (!except) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    
    if (this.lookahead(1).text === 'finally') {
        
        if (this.indent_size * this.indent !== this.token.text) {
            throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
        }
        
        this.consume();
        
        if (this.match('finally')) {
            
            var fin = this.parseFinallyStatement();
            if (!fin) {
                throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
            }
            
            return {
                type: Syntax.TryStatement,
                try: exprs,
                except: except,
                fin: fin
            };
        }
    }
    
    return {
        type: Syntax.TryStatement,
        try: exprs,
        except: except
    };
}

/*
    Except:
        except (Identifier) Block
*/
Parser.prototype.parseExceptStatement = function() {
    this.consume();
    if (this.token.kind !== Token.IDENTIFIER) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token \'' + this.token.text + '\'';
    }
    return {
        type: Syntax.ExceptStatement,
        expr: this.parseInitialiser(),
        statements: this.parseStatement()
    };
}

/*
    Finally:
        finally Block
*/
Parser.prototype.parseFinallyStatement = function() {
    this.consume();
    return {
        type: Syntax.FinallyStatement,
        statements: this.parseStatement()
    };
}

/*
    VariableStatement:
        var VariableDeclarationList ;
*/
Parser.prototype.parseVariableStatement = function() {
    
    var expr = this.parseVariableDeclarationList();
    
    // not implemented
    
    return expr;
}

/*
    VariableDeclarationList:
        VariableDeclaration
        VariableDeclarationList , VariableDeclaration
*/
Parser.prototype.parseVariableDeclarationList = function() {
    
    var expr = this.parseVariableDeclaration();
    
    // not implemented
    
    return expr;
}

/*
    VariableDeclaration:
        Identifier Initialiser
*/
Parser.prototype.parseVariableDeclaration = function() {
    
    var expr = this.parseInitialiser();
    
    // not implemented
    
    return expr;
}

Parser.prototype.parseInitialiser = function() {
    
    var expr = this.parseAssignmentExpression();
    
    // not implemented
    
    return expr;
}

/*
    Expressions
    	AssignmentExpression
        Expression , AssignmentExpression
*/
Parser.prototype.parseExpression = function() {
    
    var expr = this.parseAssignmentExpression();
    if (expr) {
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
    
    this.expect('(');
    var expr = this.parseExpression();
    this.expect(')');
    
    return expr;
}

/*
    PrimaryExpression:
        this
        Identifier
        Literal
        ArrayLiteral
        ObjectLiteral
        ( Expression )
*/
Parser.prototype.parsePrimaryExpression = function() {
    
    if (this.token.kind === Token.KEYWORDS.THIS) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.This,
            value: token.text 
        };
    }
    
    if (this.token.kind === Token.IDENTIFIER) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Identifier,
            value: token.text 
        };
    }
    
    if (this.token.kind === Token.NONE || this.token.kind === Token.BOOLEAN
     || this.token.kind === Token.DIGIT || this.token.kind === Token.STRING) {
        return this.parseLiteral();
    }
    
    if (this.token.kind === Token.PUNCTUATOR) {
        
        if (this.match('[')) {
            return this.parseArrayLiteral();
        }
        
        if (this.match('{')) {
            return this.parseObjectLiteral();
        }
        
        if (this.match('(')) {
            // consume() should not be written in here.
            //this.consume();
            var expr = this.parseExpression();
            // consume() should not be written in here.
            //this.expect(')');
            // return expr;
            return {
                type: Syntax.Grouping,
                expr: expr
            };
        }
    }
    
    console.log(this.token, 'at PrimaryExpression');
    throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
}

/*
    Literal:
        NoneLiteral
        BooleanLiteral
        NumericLiteral
        StringLiteral
*/
Parser.prototype.parseLiteral = function() {
    
    if (this.token.kind === Token.NONE) {
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
    ArrayLiteral:
        [ ]
        [ ElementList ]
*/
Parser.prototype.parseArrayLiteral = function() {
    
    this.expect('[');
    var eles = this.parseElementList();
    this.expect(']');
    
    return {
        type: Syntax.ArrayLiteral,
        elements: eles
    };
}

/*
    ElementList:
        AssignmentExpression
        ElementList AssignmentExpression
*/
Parser.prototype.parseElementList = function() {
    
    var eles = [];
    
    while (!this.match(']')) {
        if (this.match(',')) {
            this.consume();
            continue;
        }
        eles.push(this.parseAssignmentExpression());
    }
    return eles;
}

/*
    ObjectLiteral:
        { }
        { PropertyNameAndValueList }
*/
Parser.prototype.parseObjectLiteral = function() {
    
    this.expect('{');
    var props = this.parsePropertyNameAndValueList()
    this.expect('}');
    
    return {
        type: Syntax.ObjectLiteral,
        properties: props
    };
}

/*
    PropertyNameAndValueList:
        PropertyName : AssignmentExpression
        PropertyNameAndValueList , PropertyName
*/
Parser.prototype.parsePropertyNameAndValueList = function() {
    
    var props = [];
    
    while (!this.match('}')) {
        if (this.match(',')) {
            this.consume();
            continue;
        }
        
        var name = this.parsePropertyName();
        this.expect(':');
        
        props.push({
            type: Syntax.Property,
            left: name,
            right: this.parseAssignmentExpression()
        });
    }
    return props;
}

/*
    PropertyName:
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
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NumericLiteral,
            value: token.text
        };
    }
}

/*
    MemberExpression:
        PrimaryExpression
        FunctionExpression
        MemberExpression [ Expression ]
        MemberExpression . Identifier
        new MemberExpression Arguments
*/
Parser.prototype.parseMemberExpression = function() {
    
    var expr = this.parsePrimaryExpression();
    if (expr) {
        // member expression of List
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
        
        // member expression of Object
        if (this.match('.')) {
            this.consume();
            if (this.token.kind === Token.IDENTIFIER) {
                return {
                    type: Syntax.MemberExpression,
                    member: expr,
                    expr: this.parseInitialiser()
                };
            }
            console.log(this.token, 'at MemberExpression');
            throw 'Unexpected token ILLEGAL';
        }
        
        if (this.match('(')) {
            return {
                callee: expr,
                arguments: this.parseArguments()
            };
        }
        
        return expr;
    }
    
    
    
    // not implement
    // FunctionExpression
    
    if (this.match('new')) {
        this.consume();
        return {
            type: Syntax.NewExpression,
            callee: this.parseMemberExpression(),
            arguments: this.parseArguments()
        };
    }
    
    console.log(this.token, 'at MemberExpression');
    throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
}

/*
    NewExpression:
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
    
    var expr = this.parseMemberExpression();
    if (expr) {
        return expr;
    }
    
    console.log(this.token, 'at NewExpression');
    throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
}

/*
    CallExpression:
        MemberExpression Arguments
        CallExpression Arguments
        CallExpression [ Expression ]
        CallExpression . Identifier
*/
Parser.prototype.parseCallExpression = function() {
    
    console.log(this.token, 'at CallExpression')
    throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
    
    return {
        type: Syntax.CallExpression,
        callee: this.parseMemberExpression(),
        arguments: this.parseArguments()
    }
}

/*
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
    ArgumentList:
        AssignmentExpression
        ArgumentList , AssignmentExpression
*/
Parser.prototype.parseArgumentList = function() {
    
    var arguments = [];
    
    while (!this.match(')')) {
        arguments.push(this.parseAssignmentExpression());
        if (!this.match(')')) {
            this.expect(',');
        }
    }
    return arguments;
}

/*
    LeftHandSideExpression:
        NewExpression
        CallExpression
*/
Parser.prototype.parseLeftHandSideExpression = function() {
    
    var expr = this.parseNewExpression();
    if (expr) {
        return expr;
    }
    
    var expr = this.parseCallExpression();
    if (expr) {
        return expr;
    }
}

/*
    PostfixExpression:
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
        
        // not implemented
        // [LineTerminator 無し]
        
        return {
            type: Syntax.PostfixExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    return expr;
}

/*
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
    
    if (/*this.match('typeof') || this.match('void') || */this.match('delete')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            expr: expr,
            operator: token.text
        };
    }
    
    // prefix increment operator
    if (this.match('++') || this.match('--')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.PrefixExpression,
            expr: this.parseUnaryExpression(),
            operator: token.text
        };
    }
    
    if (this.match('+') || this.match('-') || this.match('~') || this.match('!')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            expr: expr,
            operator: token.text
        };
    }
    
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
    MultiplicativeExpression:
        UnaryExpression
        MultiplicativeExpression * UnaryExpression
        MultiplicativeExpression / UnaryExpression
        MultiplicativeExpression % UnaryExpression
*/
Parser.prototype.parseMultiplicativeExpression = function() {
    
    var expr = this.parseUnaryExpression();
    
    if (this.match('/') || this.match('*') || this.match('%')) {
        var token = this.token;
        this.consume();
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
    AdditiveExpression:
        MultiplicativeExpression
        AdditiveExpression + MultiplicativeExpression
        AdditiveExpression - MultiplicativeExpression
*/
Parser.prototype.parseAdditiveExpression = function() {
    
    var expr = this.parseMultiplicativeExpression();
    
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
    ShiftExpression:
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
    RelationalExpression:
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
    
    if (this.match('<') || this.match('>')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.RelationalExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    if (this.match('<=') || this.match('>=')) {
        var token = this.token;
        this.consume();
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
    EqualityExpression:
        RelationalExpression
        EqualityExpression == RelationalExpression
        EqualityExpression != RelationalExpression
        EqualityExpression === RelationalExpression
        EqualityExpression !== RelationalExpression
*/
Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
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
    EqualityExpression:
        BitwiseANDExpression & EqualityExpression
*/
Parser.prototype.parseBitwiseANDExpression = function() {
    
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
    BitwiseXORExpression:
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
    BitwiseORExpression:
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
    LogicalANDExpression:
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
    LogicalORExpression:
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
    ConditionalExpression:
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
    AssignmentExpression:
        ConditionalExpression
        LeftHandSideExpression AssignmentOperator AssignmentExpression
*/
Parser.prototype.parseAssignmentExpression = function() {
    
    var expr = this.parseConditionalExpression();
    
    // AssignmentOperator
    if (assign = this.matchAssign()) {
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

Parser.prototype.parseFunctionExpression = function() {
    
    // not implement
}
// src/syntax.js
var Syntax = [];
Syntax.NoneLiteral = 'NoneLiteral';
Syntax.BooleanLiteral = 'BooleanLiteral';
Syntax.NumericLiteral = 'NumericLiteral';
Syntax.ArrayLiteral = 'ArrayLiteral';
Syntax.ObjectLiteral = 'ObjectLiteral';
Syntax.Property = 'Property';
Syntax.Grouping = 'Grouping';
Syntax.StringLiteral = 'StringLiteral';
Syntax.This = 'This';
Syntax.MemberExpression = 'MemberExpression';
Syntax.Identifier = 'Identifier';
Syntax.IfStatement = 'IfStatement';
Syntax.WhileStatement = 'WhileStatement';
Syntax.ForInStatement = 'ForInStatement';
Syntax.ContinueStatement = 'ContinueStatement';
Syntax.BreakStatement = 'BreakStatement';
Syntax.ReturnStatement = 'ReturnStatement';
Syntax.RaiseStatement = 'RaiseStatement';
Syntax.TryStatement = 'TryStatement';
Syntax.ExceptStatement = 'ExceptStatement';
Syntax.FinallyStatement = 'FinallyStatement';
Syntax.SingleLineComment = 'SingleLineComment';
Syntax.MultiLineComment = 'MultiLineComment';
Syntax.SequenceExpression = 'SequenceExpression';
Syntax.EqualityExpression = 'EqualityExpression';
Syntax.RelationalExpression = 'RelationalExpression';
Syntax.BinaryExpression = 'BinaryExpression';
Syntax.LogicalExpression = 'LogicalExpression';
Syntax.ConditionalExpression = 'ConditionalExpression';
Syntax.Period = 'Period';
Syntax.NEWLINE = 'NEWLINE';
// Syntax.NaNLiteral = 'NaNLiteral';
// Syntax.InfinityLiteral = 'InfinityLiteral';
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
Token.INDENT = 'INDENT';
Token.IDENTIFIER = 'IDENTIFIER';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.COLON = 'COLON';
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
Token.KEYWORDS.RAISE = 'RAISE';
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
//Token.KEYWORDS.NULL = 'NULL';
Token.KEYWORDS.THIS = 'THIS';
Token.KEYWORDS.TRUE = 'TRUE';
Token.KEYWORDS.FALSE = 'FALSE';


Token.NONE = 'NONE';
Token.NAN = 'NAN';
Token.BOOLEAN = 'BOOLEAN';
Token.INFINITY = 'INFINITY';
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
return exports;
})();
