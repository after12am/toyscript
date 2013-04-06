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
    if (op === '>>>=') {
        return op;
    }
    
    // 3character assignment
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return op;
    }
    
    // 2character assignment
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        return op;
    }
    
    // 1character assignment
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
        throw this.token.location.toString() + ', SyntaxError: Unexpected token ' + this.token.kind + ' \'' + this.token.text + '\'';
    }
    this.consume();
}

Parser.prototype.expectKind = function(kind) {
    if (this.token.kind !== kind) {
        throw this.token.location.toString() + ', SyntaxError: Unexpected token ' + this.token.kind + ' \'' + this.token.text + '\'';
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

Parser.prototype.updateIndent = function() {
    if (this.indent_size * this.indent < this.token.text) {
        this.indent++;
    } else if (this.indent_size * this.indent > this.token.text) {
        this.indent--;
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
    
    // check indent
    this.expect(0);
    
    while (1) {
        
        // the first token would be Token.Indent. 
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
        ThrowStatement -> RaiseStatement
        TryStatement
*/
Parser.prototype.parseStatement = function() {
    
    // syntax check around the indent
    if (this.token.kind === Token.INDENT) {
        this.updateIndent();
        this.consume();
        return this.parseStatement();
    }
    
    if (this.token.kind === Token.NEWLINE) {
        // not implement
        return this.parseEmptyStatement();
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
    
    if (this.match(':')) {console.log(this.token)
        this.consume();
        this.expectKind(Token.NEWLINE);
        return this.parseBlock();
    }
    
    // is this correct to write here?
    if (this.token.kind === Token.SINGLE_LINE_COMMENT) {
        return this.parseComment();
    }
    
    // not implement
    // VariableStatement
    // ExpressionStatement
    
    return this.parseExpression();
}

Parser.prototype.parseEmptyStatement = function() {
    // plays a role of EmptyStatement.
    var token = this.token.text;
    this.consume();
    return {
        type: Syntax.NEWLINE,
        value: token.text
    };
    
    // if you want to ignore newline token, switch upper code to below.
    //return this.parseStatement();
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
            this.updateIndent();
            if (this.token.text < indent) break;
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
    if (exprs.length == 0) {
        throw this.token.location.toString() + ', SyntaxError: No statement';
    }
    
    // expect indent token
    this.expect(indent);
    
    if (this.match('else')) {
        this.consume();
        // else if
        // else
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
        if (this.lookahead(1).kind == Token.EOF 
         || this.lookahead(1).kind == Token.NEWLINE) {
            throw this.token.location.toString() + ', Syntax error';
        }
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
    
    // console.log(this.token, 'at PrimaryExpression');
    // throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
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
    
    // console.log(this.token, 'at MemberExpression');
    // throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
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
    
    // console.log(this.token, 'at NewExpression');
    // throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
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
    // throw 'SyntaxError: Unexpected token \'' + this.token.text + '\'';
    
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