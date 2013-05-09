var Parser = function(tokens) {
    this.name = 'Parser';
    this.p = 0;
    this.token = tokens[0];
    this.tokens = tokens;
    this.indent = 0;
    this.indent_size = 4; // default of indent size for parsing
    this.ecstack = new EcStack();
    this.state = new State();
}

Parser.prototype.consume = function(k) {
    k = k || 1;
    while (k > 0) {
        this.p++;
        if (this.p < this.tokens.length) this.token = this.tokens[this.p];
        else this.token = new Token(Token.EOF, '', this.tokens[this.tokens.length - 1].location);
        k--;
    }
}

/*
    confirm whether argument matches value of token
*/
Parser.prototype.match = function(text) {
    return (this.token.text === text);
}

/*
    confirm whether argument matches kind of token
*/
Parser.prototype.matchKind = function(kind) {
    return (this.token.kind === kind);
}

/*
    throw error when argument does not match value of token
*/
Parser.prototype.expect = function(value) {
    if (this.token.text !== value) {
        throw new Error("{location} {message} {unexpected} expecting {expected}".format({
            location: this.token.location.toString(), 
            message: Message.UnexpectedToken,
            unexpected: this.token.text,
            expected: value
        }));
    }
    this.consume();
}

/*
    throw error when argument does not match kind of token
*/
Parser.prototype.expectKind = function(value) {
    if (this.token.kind !== value) {
        throw new Error("{location} {message} {unexpected} expecting {expected}".format({
            location: this.token.location.toString(), 
            message: Message.UnexpectedToken,
            unexpected: this.token.kind,
            expected: value
        }));
    }
    this.consume();
}

/*
    LL(k)
*/
Parser.prototype.lookahead = function(k) {
    var len = this.tokens.length;
    var kk = this.p + k;
    if (kk < len) return this.tokens[kk];
    return new Token(Token.EOF, '', this.tokens[len - 1].location);
}

Parser.prototype.lookback = function(k) {
    var kk = this.p - k;
    if (kk >= 0) return this.tokens[kk];
    return this.tokens[0];
}

/*
    14 Program
    
    Program:
        SourceElements
*/
Parser.prototype.parseProgram = function() {
    this.p = 0;
    // update indent size for parsing
    for (var i = 1; i < this.tokens.length; i++) {
        if (this.lookahead(i).kind === Token.INDENT 
         && this.lookahead(i).text > 0) {
            this.indent_size = this.lookahead(i).text;
            break;
        }
    }
    return {
        type: Syntax.Program,
        body: this.parseSourceElements()
    };
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
        /*
            The expected order is <EXPR><EOF>
            
            if a:
                a = 1<EOF>
        */
        if (this.matchKind(Token.EOF)) break;
        if (node = this.parseSourceElement()) {
            if (node.type === Syntax.PassStatement) {
                node.type = Syntax.EmptyStatement;
            }
            nodes.push(node);
        }
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
    
    this.expect(this.indent = 0);
    
    /*
        The expected order is <NEWLINE>|<INDENT>|<EOF>
        
        if a:
            a = 1
        <EOF>
    */
    if (this.matchKind(Token.EOF)) return;
    
    var expr;
    switch (this.token.text) {
    case 'def': expr = this.parseFunctionDeclaration(); break;
    default: expr = this.parseStatement(); break;
    }
    
    /*
        statement(s) is expected to end with new line.
    */
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
    }
    
    return expr;
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
    
    if (this.token.kind === Token.PUNCTUATOR) {
        if (this.match(':')) return this.parseBlock();
    }
    
    /*
        A problem of variable statement have been solved.
        
        a = 1
        def test():
            a = 2
            a = 3
            b = 2
         |
         v
        var a = 1
        function () {
            var a = 2;
            a = 3;
            var b = 2;
        }
    */
    if (this.token.kind === Token.IDENTIFIER) {
        if (!this.ecstack.current[this.token.text]) {
            /*
                a()
                a = 1
                 |
                 v
                a()
                a = 1 // expect: var a = 1
            */
            if (this.lookahead(1).text === '=') {
                return this.parseVariableStatement();
            }
            
            if (this.lookahead(1).kind == Token.NEWLINE) {
                throw new Error("{location} {message}".format({
                    location: this.token.location.toString(),
                    message: Message.IllegalIdentInitialize
                }));
            }
        }
    }
    
    switch (this.token.kind) {
    case Token.COMMENT: return this.parseComment();
    case Token.NEWLINE: return this.parseEmptyStatement();
    case Token.KEYWORDS.PASS: return this.parsePassStatement();
    case Token.KEYWORDS.IF: return this.parseIfStatement();
    case Token.KEYWORDS.WHILE: return this.parseIterationStatement(); 
    case Token.KEYWORDS.FOR: return this.parseIterationStatement();
    case Token.KEYWORDS.CONTINUE: return this.parseContinueStatement();
    case Token.KEYWORDS.BREAK: return this.parseBreakStatement();
    case Token.KEYWORDS.RETURN: return this.parseReturnStatement();
    case Token.KEYWORDS.RAISE: return this.parseRaiseStatement();
    case Token.KEYWORDS.TRY: return this.parseTryStatement();
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
    
    /*
        if a: a = 1
        
        if a:
            a = 1
    */
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
    }
    
    var token = this.token;
    var exprs = [];
    
    if (this.matchKind(Token.INDENT)) {
        this.indent++;
        exprs = this.parseStatementList();
        this.indent--;
    }
    /*
        would parse this:
        
        if a: a = 1
        a = 2
    */
    else {
        exprs = [this.parseStatement()];
    }
    
    /*
        whether exprs has EmptyStatement
    */
    var pass = exprs.reduce(function pass(p, c, i) {
        return p || c.type !== Syntax.EmptyStatement;
    }, false);
    
    if (pass) {
        exprs = exprs.map(function(expr) {
            // pass statement means empty statement in javascript
            if (expr.type === Syntax.PassStatement) {
                expr.type = Syntax.EmptyStatement;
            }
            return expr;
        });
        return {
            type: Syntax.BlockStatement,
            body: exprs
        };
    }
    
    throw new Error("{location} {message}".format({
        location: this.token.location.toString(),
        message: Message.IllegalBlock
    }));
}

/*
    12.1 Block
    
    StatementList:
        Statement
        StatementList Statement
*/
Parser.prototype.parseStatementList = function() {
    
    var exprs = [], expr = null;
    var indent = this.indent * this.indent_size;
    
    while (1) {
        /*
            would parse this:
            
                if a:
                    a = 1
                a = 1
                
                if a: a = 1
                a = 2
                
                if a:
                    a = 1
                    
                    a = 2
                    a = 2
        */
        if (this.matchKind(Token.NEWLINE)) {
            this.consume();
            if (this.lookback(2).kind === Token.INDENT) {
                exprs.push({
                    type: Syntax.PassStatement
                });
            }
        }
        
        if (this.matchKind(Token.EOF)) break;
        if (this.matchKind(Token.INDENT)) {
            if (this.token.text < indent) break;
            if (this.token.text > indent) {
                throw new Error("{location} {message}".format({
                    location: this.token.location.toString(),
                    message: Message.IllegalIndentSize
                }));
            }
            this.consume();
            continue;
        }
        
        if (expr = this.parseStatement()) {
            exprs.push(expr);
        }
    }
    
    return exprs;
}

/*
    12.2 Variable statement
    
    VariableStatement :
        var VariableDeclarationList ;
*/
Parser.prototype.parseVariableStatement = function() {
    return {
        type: Syntax.VariableDeclaration,
        declarations: this.parseVariableDeclarationList(),
        kind: 'var'
    };
}

/*
    12.2 Variable statement
    
    VariableDeclarationList :
        VariableDeclaration
        VariableDeclarationList , VariableDeclaration
         |
         v
        VariableDeclaration
*/
Parser.prototype.parseVariableDeclarationList = function() {
    
    var variables = [];
    
    while (1) {
        var v = this.parseVariableDeclaration();
        variables.push(v);
        this.ecstack.current[v.id.name] = v.init;
        if (!this.match(',')
         || this.token.kind === Token.EOF
         || this.token.kind === Token.NEWLINE) break;
        this.consume();
    };
    return variables;
}

/*
    12.2 Variable statement
    
    VariableDeclaration :
        Identifier Initialiseropt
*/
Parser.prototype.parseVariableDeclaration = function() {
    return {
        type: Syntax.VariableDeclarator,
        id: this.parseIdentifier(),
        init: this.parseInitialiser()
    };
}

/*
    12.2 Variable statement
    
    Initialiser :
        = AssignmentExpression
*/
Parser.prototype.parseInitialiser = function() {
    this.expect('=');
    return this.parseAssignmentExpression();
}

/*
    12.3 Empty Statement
    
    EmptyStatement :
        LineTerminator
*/
Parser.prototype.parseEmptyStatement = function() {
    var token = this.token;
    this.expectKind(Token.NEWLINE);
    // empty
    if (this.lookback(2).kind === 'INDENT') {
        return {
            type: Syntax.EmptyStatement
        };
    }
    // new line
    this.consume();
    return this.parseStatement();
}

Parser.prototype.parsePassStatement = function() {
    var token = this.token;
    this.expectKind(Token.KEYWORDS.PASS);
    return {
        type: Syntax.PassStatement
    };
}

/*
    12.4 Expression Statement
    
    ExpressionStatement :
        [lookahead ∉ {:, def} ] Expression ;
*/
Parser.prototype.parseExpressionStatement = function() {
    
    if (this.match('def') || this.match(':')) return;
    
    var expr = this.parseExpression()
    if (expr) {
        if (expr.type === Syntax.AssignmentExpression) {
            this.ecstack.current[expr.left.name] = expr.right;
        }
        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }
}

/*
    12.5 The if Statement
    
    IfStatement :
        if Expression: Statement else Statement
        if Expression: Statement
*/
Parser.prototype.parseIfStatement = function() {
    
    var alternate = null, test, indent, consequent;
    
    indent = this.indent * this.indent_size;
    this.expect('if');
    test = this.parseExpression();
    
    if (!this.match(':')) {
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalIf
        }));
    }
    
    consequent = this.parseStatement();
    
    /*
    if (consequent.type === Syntax.ExpressionStatement) {
        if (consequent && !consequent.expression) {
            throw new Error("{location} {message}".format({
                location: this.token.location.toString(),
                message: Message.IllegalIf
            }));
        }
    }
    */
    if (this.matchKind(Token.INDENT)) {
        if (!this.match(indent)) {
            throw new Error("{location} {message}".format({
                location: this.token.location.toString(),
                message: Message.IllegalIndentSize
            }));
        }
    }
    
    /*
        would parse this
        
        if a:
            a = 1
        a = 1
        
        if a:
            a = 1
        else:
            a = 2
    */
    if (this.lookahead(1).text === 'else') {
        this.consume();
    }
    
    if (this.match('else')) {
        this.consume();
        // else if || else
        alternate = this.parseStatement();
    }
    
    return {
        type: Syntax.IfStatement,
        test: test,
        consequent: consequent,
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
            var test = this.parseExpression();
        } catch (e) {
            throw new Error("{location} {message}".format({
                location: this.token.location.toString(),
                message: Message.IllegalWhile
            }));
        }
        
        this.state.current.push(State.InIteration);
        var body = this.parseStatement();
        this.state.pop();
        
        return {
            type: Syntax.WhileStatement,
            test: test,
            body: body
        };
    }
    
    if (this.match('for')) {
        this.consume();
        
        var exprs = [], left, right, body;;
        while (!this.match('in')) {
            if (this.match(',')) this.consume();
            exprs.push(this.parseLeftHandSideExpression());
        }
        
        left = exprs[0];
        this.expect('in');
        right = this.parseExpression();
        this.state.current.push(State.InIteration);
        body = this.parseStatement()
        this.state.pop();
        
        if (!right || !body) {
            throw new Error("{location} {message}".format({
                location: this.token.location.toString(),
                message: Message.IllegalFor
            }));
        }
        
        /*
            rewriting of the tree structure
        */
        if (exprs.length === 1) {
            /*
                would parse this:
                
                    for v in [1, 2]:
                        console.log(v)
                    
                    for v in a = [1, 2]:
                        console.log(v)
                    
                    a = [1, 2]
                    for v in a:
                        console.log(v)
            */
            if (right.type !== Syntax.AssignmentExpression) {
                right = {
                    type: Syntax.AssignmentExpression,
                    operator: "=",
                    left: {
                        type: "Identifier",
                        name: "__arr"
                    },
                    right: right
                }
            }
            
            left = {
                type: left.type, // may be identifier
                name: '__k'
            };
            
            body.body = exports.parse('{0} = {1}[{2}]'.format(
                exprs[0].name, 
                right.left.name, 
                '__k'
            )).body.concat(body.body);
        }
        /*
            would parse this:
                
                for k, v in a = {'k': 1, 'i': 2}:
                    console.log(k, ':', v)
                
                for k, v in {'k': 1, 'i': 2}:
                    console.log(k, ':', v)
                
                for v in a = {'k': 1, 'i': 2}:
                    console.log(v)
        */
        else if (exprs.length === 2) {
            /*
                part of :
                    a = {'arg': 1}
            */
            if (right.type !== Syntax.AssignmentExpression) {
                right = {
                    type: Syntax.AssignmentExpression,
                    operator: "=",
                    left: {
                        type: "Identifier",
                        name: "__obj"
                    },
                    right: right
                }
            }
            
            body.body = exports.parse('{0} = {1}[{2}]'.format(
                exprs[1].name, 
                right.left.name, 
                exprs[0].name
            )).body.concat(body.body);
        }
        
        return {
            type: Syntax.ForInStatement,
            left: left,
            right: right,
            body: body,
            each: false
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
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalContinue
        }));
    }
    
    if (this.state.current.indexOf(State.InIteration) === -1) {
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalContinuePosition
        }));
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
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalBreak
        }));
    }
    
    if (this.state.current.indexOf(State.InIteration) === -1) {
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalBreakPosition
        }));
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
    
    var argument = null;
    this.consume();
    
    if (this.state.current.indexOf(State.InFunction) === -1) {
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalReturn
        }));
    }
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        argument = this.parseExpression();
    }
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalReturnArgument
        }));
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
    
    if (argument === null) {
        argument = {
            type: "NewExpression",
            callee: {
                type: "Identifier",
                name: "Error"
            },
            arguments: []
        };
    }
    
    return {
        type: Syntax.ThrowStatement,
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
    
    var handlers = [], block = null, finalizer = null;
    var indent = this.indent * this.indent_size;
    
    this.expect('try');
    this.ecstack.push([]);
    block = this.parseBlock();
    this.ecstack.pop();
    this.expect(indent);
    
    /*
        Catch :
            catch ( Identifier ) Block
             |
             v
            except Identifieropt: Block
    */
    handlers.push(this.parseExceptStatement());
    this.expect(indent);
    
    /*
        Finally:
            finally: Block
    */
    if (this.match('finally')) {
        this.consume();
        this.ecstack.push([]);
        finalizer = this.parseBlock();
        this.ecstack.pop();
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
    
    var param = null, body;
    this.expect('except');
    
    /*
        except:
            except Identifier:
    */
    if (this.match(':')) {
        param = {
            type: Syntax.Identifier,
            name: 'e'
        };
    }
    
    param = param || this.parseIdentifier();
    this.ecstack.push([]);
    body = this.parseBlock();
    this.ecstack.pop();
    
    return {
        type: Syntax.CatchClause,
        param: param,
        guard: null,
        body: body
    };
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
     || this.token.kind === Token.STRING
     // add keywords
     ) {
        return this.parseLiteral();
    }
    
    if (this.token.kind === Token.PUNCTUATOR) {
        if (this.match('[')) return this.parseArrayInitialiser();
        if (this.match('{')) return this.parseObjectInitialiser();
        if (this.match('(')) return this.parseGroupingOperator();
    }
    
    /*
        unexpected token like this:

        // comment
    */
    throw new Error("{location} {message} {token}".format({
        location: this.token.location.toString(),
        message: Message.UnexpectedToken,
        token: this.token.text
    }));
}

/*
    11.1.2 Identifier Reference
*/
Parser.prototype.parseIdentifier = function() {
    var token = this.token;
    this.consume();
    return {
        type: Syntax.Identifier,
        name: token.text 
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
            type: Syntax.Literal,
            value: null
        };
    }
    
    if (this.token.kind === Token.BOOLEAN) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            value: (token.text === 'true')
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            value: token.text
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        var text = token.text;
        this.consume();
        /*
            could use variable inside string
            
            a = 1
            b = 1
            "{a} + {b} = 2"
             |
             v
            var a = 1
            var b = 1
            '1 + 1 = 2'
        */
        if (token.delimiter === '"') {
            var that = this, rep = {};
            var m = token.text.match(/{(.*?)}/g);
            if (m) {
                m.forEach(function(ident) {
                    var k = ident.match(/{(.*)}/)[1];
                    rep[k] = that.ecstack.current[k].value;
                });
                text = text.format(rep);
            }
        }
        return {
            type: Syntax.Literal,
            value: text
        };
    }
    
    // RegExp
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
        /*
            we can parse source program 
            even if new line token has appeared in array initializers.
            
            a = [
                1,
                2
            ]
        */
        if (this.token.kind === Token.NEWLINE
         || this.token.kind === Token.INDENT) { // ignore newline token
            this.consume();
            continue;
        }
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
        if (this.match(',')) this.consume();
        var key = this.parsePropertyName();
        this.expect(':');
        
        if (key.type === Syntax.Identifier) {
            props.push({
                type: Syntax.Property,
                key: key,
                value: this.parseAssignmentExpression(),
                kind: 'init'
            });
        }
        
        if (key.type === Syntax.Literal) {
            props.push({
                type: Syntax.Property,
                key: {
                    type: key.type,
                    value: key.name
                },
                value: this.parseAssignmentExpression(),
                raw: 'init'
            });
        }
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
            type: Syntax.Literal,
            name: token.text
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
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
Parser.prototype.parseMemberExpression = function(allow_call) {
    if (this.match('new')) return this.parseNewExpression();
    var expr = this.parseFunctionExpression() || this.parsePrimaryExpression();
    while (1) {
        if (this.token.kind === Token.EOF
         || this.token.kind === Token.NEWLINE) break;
        
        if (this.match('[')) {
            expr = this.parseComputedMember(expr);
            continue;
        }
        
        if (this.match('.')) {
            expr = this.parseNonComputedMember(expr);
            continue;
        }
        
        if (allow_call && this.match('(')) {
            expr = this.parseCallMember(expr);
            continue;
        }
        
        break;
    }
    return expr;
}

Parser.prototype.parseComputedMember = function(object) {
    this.expect('[');
    var expr = this.parseExpression();
    this.expect(']');
    return {
        type: Syntax.MemberExpression,
        computed: true,
        object: object,
        property: expr
    };
}

Parser.prototype.parseNonComputedMember = function(object) {
    this.expect('.');
    var expr = this.parseIdentifier();
    return {
        type: Syntax.MemberExpression,
        computed: false,
        object: object,
        property: expr
    };
}

Parser.prototype.parseCallMember = function(object) {
    return {
        type: Syntax.CallExpression,
        callee: object,
        'arguments': this.parseArguments()
    };
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
        return {
            type: Syntax.NewExpression,
            callee: this.parseNewExpression(),
            arguments: this.parseArguments()
        };
    }
    return this.parseMemberExpression();
}

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
        arguments.push(this.parseAssignmentExpression());
        if (this.match(')')) break;
        if (this.match(',')) {
            this.consume();
            continue;
        }
        throw new Error("{location} {message}".format({
            location: this.token.location.toString(),
            message: Message.IllegalArgumentList
        }));
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
    
    /*
        lambda expression
            
            (2): x * x
             |
             v
            (function (x) {
            	return x * x;
            })(2);
            
            (2, 2): x * y
             |
             v
            (function (x, y) {
            	return x * y;
            })(2, 2);
    */
    if (this.match('(')) {
        var k = 1;
        while (this.lookahead(k).text !== ')') {
            if (this.lookahead(k).kind === Token.NEWLINE
             || this.lookahead(k).kind === Token.EOF) break;
            k++;
        }
        
        if (this.lookahead(++k).text === ':') {
            this.expect('(');
            var arguments = [];
            while (!this.match(')')) {
                if (this.match(',')) this.consume();
                arguments.push(this.parsePrimaryExpression());
            }
            this.expect(')');
            
            this.ecstack.push([]);
            this.state.push([State.InFunction]);
            var body = this.parseStatement();
            this.state.pop();
            var idents = [], ecstack = this.ecstack;
            
            // walk the subtree and find identifier node
            (function walk(subtree) {
                for (var i in subtree) {
                    if (typeof subtree[i] !== 'object') continue;
                    if (subtree[i].type === Syntax.Identifier
                     && idents.indexOf(subtree[i].name) === -1
                     && ecstack.current[subtree[i].name] === undefined) {
                        idents.push(subtree[i].name);
                    }
                    walk(subtree[i]);
                }
            })(body.body);
            this.ecstack.pop();
            
            var params = idents.map(function(ident) {
                return {
                    type: Syntax.Identifier,
                    name: ident
                }
            });
            
            /*
                would parse lambda that has multiple statement
                
                (2):
                    a = x * x
                    b = a + 1
                    b + 2
                 |
                 v
                (function () {
                    var a = x * x
                    var b = a + 1
                    return b + 2
                }(2))
            */
            body.body.push({
                type: Syntax.ReturnStatement,
                argument: body.body.pop().expression
            });
            
            return {
                type: Syntax.CallExpression,
                callee: {
                    type: Syntax.FunctionExpression,
                    id: null,
                    params: params,
                    defaults: [],
                    body: body,
                    rest: null,
                    generator: false,
                    expression: false
                },
                arguments: arguments
            }
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
    if (this.match('new')) return this.parseNewExpression();
    return this.parseMemberExpression(true);
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
            if (token.text === '++') {
                throw new Error("{location} {message}".format({
                    location: this.token.location.toString(),
                    message: Message.IllegalPostfixIncrement
                }));
            }
            if (token.text === '--') {
                throw new Error("{location} {message}".format({
                    location: this.token.location.toString(),
                    message: Message.IllegalPostfixDecrement
                }));
            }
        }
        return {
            type: Syntax.UpdateExpression,
            operator: token.text,
            argument: expr,
            prefix: false
        };
    }
    return expr;
}

/*
    11.4 Unary Operators
    
    UnaryExpression:
        delete UnaryExpression
        void UnaryExpression
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
    if (this.match('void') || this.match('delete')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            operator: token.text,
            argument: expr
        };
    }
    
    // 11.4.4 - 11.4.5
    if (this.match('++') || this.match('--')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            if (token.text === '++') {
                throw new Error("{location} {message}".format({
                    location: this.token.location.toString(),
                    message: Message.IllegalPrefixIncrement
                }));
            }
            if (token.text === '--') {
                throw new Error("{location} {message}".format({
                    location: this.token.location.toString(),
                    message: Message.IllegalPrefixDecrement
                }));
            }
        }
        return {
            type: Syntax.UpdateExpression,
            operator: token.text,
            argument: expr,
            prefix: true
        };
    }
    
    // 11.4.6 - 11.4.9
    if (this.match('+') || this.match('-') || this.match('~') || this.match('!')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.UnaryExpression,
            operator: token.text,
            argument: this.parseUnaryExpression()
        };
    }
    
    // 11.4.9
    if (this.match('not')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            operator: '!',
            argument: expr
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
    while (this.match('/') || this.match('*') || this.match('%')) {
        var token = this.token;
        this.consume();
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
             throw new Error("{location} {message}".format({
                 location: this.token.location.toString(),
                 message: Message.IllegalMultiplicativeExpression
             }));
        }
        expr = {
            type: Syntax.BinaryExpression,
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
    while (this.match('+') || this.match('-')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseMultiplicativeExpression()
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
    while (this.match('<<') || this.match('>>') || this.match('>>>')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseAdditiveExpression()
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
        RelationalExpression typeof ShiftExpression
*/
Parser.prototype.parseRelationalExpression = function() {
    
    var expr = this.parseShiftExpression();
    
    // 11.8.1, 11.8.2, 11.8.3, 11.8.4, 11.8.6, 11.8.7
    while (this.match('<') || this.match('>') 
        || this.match('<=') || this.match('>=') 
        || this.match('instanceof')
        || this.match('in')
        || this.match('typeof')) {
        
        var right;
        var in_operator = this.match('in');
        var token = this.token;
        this.consume();
        
        /*
            if "a" in a = {"a": 1}:
                console.log('found')
        */
        if (in_operator && this.lookahead(1).text === '=') {
            right = this.parseAssignmentExpression();
        } else {
            right = this.parseRelationalExpression();
        }
        
        /*
            if not "a" in {"a": 1}:
                console.log('not found')
        */
        if (in_operator 
         && expr.type === Syntax.UnaryExpression 
         && right.type === Syntax.ObjectExpression) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: "!",
                argument: {
                    type: Syntax.BinaryExpression,
                    operator: token.text,
                    left: expr.argument,
                    right: right
                }
            }
        }
        /*
            if 1 in [1, 2, 3]:
                console.log('found')
            
            if not 0 in [1, 2, 3]:
                console.log('not found')
        */
        else if (in_operator && right.type === Syntax.ArrayExpression) {
            var operator = '!==';
            if (expr.type === Syntax.UnaryExpression) {
                operator = '===';
                expr = expr.argument;
            }
            
            expr = {
                type: Syntax.BinaryExpression,
                operator: operator,
                left: {
                    type: Syntax.CallExpression,
                    callee: {
                        type: Syntax.MemberExpression,
                        computed: false,
                        object: right,
                        property: {
                            type: Syntax.Identifier,
                            name: "indexOf"
                        }
                    },
                    arguments: [expr]
                },
                right: {
                    type: Syntax.UnaryExpression,
                    operator: "-",
                    argument: {
                        type: Syntax.Literal,
                        value: 1,
                        raw: "1"
                    }
                }
            };
        }
        /*
            b = [2]
            if 0 in b:
                console.log(1)
        */
        else if (in_operator 
              && right.type === Syntax.Identifier 
              && this.ecstack.current[right.name].type === Syntax.ArrayExpression) {
            
            var operator = '!==';
            if (expr.type === Syntax.UnaryExpression
             && expr.operator === '!') {
                operator = '===';
                expr = expr.argument;
            }
            
            expr = {
                type: Syntax.BinaryExpression,
                operator: operator,
                left: {
                    type: Syntax.CallExpression,
                    callee: {
                        type: Syntax.MemberExpression,
                        computed: false,
                        object: right,
                        property: {
                            type: Syntax.Identifier,
                            name: "indexOf"
                        }
                    },
                    arguments: [expr]
                },
                right: {
                    type: Syntax.UnaryExpression,
                    operator: "-",
                    argument: {
                        type: Syntax.Literal,
                        value: 1,
                        raw: "1"
                    }
                }
            };
        }
        /*
            if "text" typeof "string":
                console.log("this is string")
        */
        else if (token.text === 'typeof') {
            /*
                ShiftExpression :: one of 

                    Undefined	"undefined"
                    Null	"object"
                    Boolean	"boolean"
                    Number	"number"
                    String	"string"
                    Object (native and doesn't implement [[Call]])	"object"
                    Object (native and implements [[Call]])	"function"
                    Object (host)	Implementation-dependent
            */

            expr = {
                type: Syntax.BinaryExpression,
                operator: '===',
                left: {
                    type: Syntax.UnaryExpression,
                    operator: 'typeof',
                    argument: expr
                },
                right: right
            };
        }
        else {
            expr = {
                type: Syntax.BinaryExpression,
                operator: token.text,
                left: expr,
                right: right
            };
        }
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
        EqualityExpression is RelationalExpression
        EqualityExpression is not RelationalExpression
*/
Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
    // 11.9.1 - 11.9.2
    while (this.match('==') || this.match('!=') || this.match('is')) {
        var token = this.token, operator;
        this.consume();
        switch (token.text) {
        case 'is':
            operator = '==';
            // is not expression
            if (this.match('not')) {
                this.consume();
                operator = '!=';
            }
            break;
        default:
            operator = token.text;
            break;
        }
        expr = {
            type: Syntax.BinaryExpression,
            operator: operator,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    // 11.9.4 - 11.9.5
    while (this.match('===') || this.match('!==')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
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
    var expr = this.parseEqualityExpression();
    while (this.match('&')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
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
    while (this.match('^')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: '^',
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
    while (this.match('|')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
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
        LogicalANDExpression and BitwiseORExpression
*/
Parser.prototype.parseLogicalANDExpression = function() {
    var expr = this.parseBitwiseORExpression();
    while (this.match('and')) {
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: '&&',
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
        LogicalORExpression or LogicalANDExpression
*/
Parser.prototype.parseLogicalORExpression = function() {
    var expr = this.parseLogicalANDExpression();
    while (this.match('or')) {
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: '||',
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
         |
         v
        LogicalORExpression
        LogicalORExpression if LogicalORExpression else LogicalORExpression
*/
Parser.prototype.parseConditionalExpression = function() {
    var consequent = this.parseLogicalORExpression();
    if (this.match('if')) {
        this.consume();
        var expr = this.parseLogicalORExpression();
        this.expect('else');
        var alternate = this.parseLogicalORExpression();
        if (!alternate) {
            throw new Error("{location} {message}".format({
                location: this.token.location.toString(),
                message: Message.IllegalConditionalExpression
            }));
        }
        return {
            type: Syntax.ConditionalExpression,
            test: expr,
            consequent: consequent,
            alternate: alternate
        };
    }
    return consequent;
}

/*
    11.13 Assignment Operators
    
    AssignmentExpression:
        ConditionalExpression
        LeftHandSideExpression AssignmentOperator AssignmentExpression
*/
Parser.prototype.parseAssignmentExpression = function() {
    var expr = this.parseConditionalExpression();
    if (this.matchAssign(this.token.text)) {
        var assign = this.token.text;
        this.consume();
        expr = {
            type: Syntax.AssignmentExpression,
            operator: assign,
            left: expr,
            right: this.parseAssignmentExpression()
        };
    }
    return expr;
}

/*
    11.13 Assignment Operators
    
    AssignmentOperator : one of
        = *= /= %= += -= <<= >>= >>>= &= ^= |=
*/
Parser.prototype.matchAssign = function(op) {
    
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
        op === '^=' || op === '|=' || op === '<=' ||
        op === '>=' || op === '==' || op === '!=') {
        return true;
    }
    
    // 1character assignment
    if (op === '=') {
        return true;
    }
    
    return false;
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
            if (!this.match(',')) break;
            this.consume();
            expr.expressions.push(this.parseAssignmentExpression());
        }
    }
    return expr;
}

/*
    7.4 Comments
    
    Comment ::
        MultiLineComment
        SingleLineComment
*/
Parser.prototype.parseComment = function() {
    
    // multi line comment
    if (this.token.multiple) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Block,
            // range: [start, end],
            value: token.text
        }
    }
    // single line comment
    else {
        var token = this.token;
        this.consume();
        
        return {
            type: Syntax.Line,
            // range: [start, end],
            value: token.text
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
    var body = this.parseFunctionBody();
    if (body.body.length === 1 
     && body.body[0].type === Syntax.EmptyStatement) {
        body.body = [];
    }
    body.body = params.init.concat(body.body);
    return {
        type: Syntax.FunctionDeclaration,
        id: id,
        params: params.params,
        body: body
    };
}

/*
    13 Function Definition
    
    FormalParameterList :
        Identifier
        FormalParameterList , Identifier
         |
         v
        AssignmentExpression
        FormalParameterList , AssignmentExpression
*/
Parser.prototype.parseFormalParameterList = function() {
    var params = [], init = [];
    this.expect('(');
    while (!this.match(')')) {
        if (this.match(',')) this.consume();
        params.push(this.parseIdentifier());
        if (this.match('=')) {
            this.consume();
            init.push(this.parseDefaultArgument(
                params[params.length - 1], 
                this.parsePrimaryExpression()
            ));
        }
    }
    this.expect(')');
    return {
        params: params,
        init: init
    };
}

/*
    Default Argument
*/
Parser.prototype.parseDefaultArgument = function(left, right) {
    return {
        type: Syntax.ExpressionStatement,
        expression: {
            type: Syntax.AssignmentExpression,
            operator: "=",
            left: left,
            right: {
                type: Syntax.LogicalExpression,
                operator: "||",
                left: left,
                right: right
            }
        }
    };
}

/*
    13 Function Definition
    
    FunctionBody :
        SourceElements
*/
Parser.prototype.parseFunctionBody = function() {
    this.ecstack.push([]);
    this.state.push([State.InFunction]);
    var body = this.parseBlock();
    this.state.pop();
    this.ecstack.pop();
    return body;
}

/*
    alias of Parser.parseProgram
*/
Parser.prototype.parse = Parser.prototype.parseProgram;