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
    if (this.token.text === value) {
        this.consume();
        return;
    }
    throw new Error("{0} {1} {2} expecting {3}".format([
        this.token.location.toString(), 
        Message.UnexpectedToken,
        this.token.text,
        value
    ]));
}

Parser.prototype.assert = function(message) {
    throw new Error("{0} {1}".format([
        this.token.location.toString(),
        message
    ]));
}

/*
    throw error when argument does not match kind of token
*/
Parser.prototype.expectKind = function(value) {
    if (this.token.kind === value) {
        this.consume();
        return;
    }
    throw new Error("{0} {1} {2} expecting {3}".format([
        this.token.location.toString(), 
        Message.UnexpectedToken,
        this.token.kind,
        value
    ]));
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
    this.expect(this.indent = 0);
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
        if (this.matchKind(Token.INDENT)) {
            if (this.state.current.indexOf(State.InFunction) !== -1) break;
            this.expect(0);
        }
        
        if (this.match('class')) {
            node = this.parseClassDeclaration();
            nodes = nodes.concat(node);
            continue;
        }
        
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
        ClassDeclaration
        FunctionDeclaration
*/
Parser.prototype.parseSourceElement = function() {
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
    if (this.matchKind(Token.NEWLINE)) this.consume();
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
                this.assert(Message.IllegalIdentInitialize);
            }
        }
    }
    
    switch (this.token.kind) {
    case Token.COMMENT: return this.parseComment();
    case Token.NEWLINE: return this.parseEmptyStatement();
    case Token.KEYWORDS.PASS: return this.parsePassStatement();
    case Token.KEYWORDS.IF: return this.parseIfStatement();
    case Token.KEYWORDS.WHILE: return this.parseWhileStatement(); 
    case Token.KEYWORDS.FOR: return this.parseForStatement();
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
    
    var token = this.token;
    var exprs = [];
    
    /*
        if a: a = 1
        
        if a:
            a = 1
        
        if a: a = 1
        a = 2
    */
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
        this.indent++;
        exprs = this.parseStatementList();
        this.indent--;
    } else {
        exprs = [this.parseStatement()];
    }
    
    /*
        whether exprs has EmptyStatement
    */
    var pass = exprs.reduce(function pass(p, c, i) {
        return p || c.type !== Syntax.EmptyStatement;
    }, false);
    
    if (!pass) this.assert(Message.IllegalBlock);
    
    return {
        type: Syntax.BlockStatement,
        body: exprs.map(function(expr) {
            if (expr.type === Syntax.PassStatement) {
                expr.type = Syntax.EmptyStatement;
            }
            return expr;
        })
    };
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
        if (this.matchKind(Token.EOF)
         || this.matchKind(Token.NEWLINE)) break;
        if (this.matchKind(Token.INDENT)) {
            if (this.token.text < indent) break;
            if (this.token.text > indent) this.assert(Message.IllegalIndentSize);
            this.consume();
        }
        exprs.push(this.parseSourceElement());
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
    
    if (this.match('def')) return;
    if (this.match(':')) return;
    
    if (expr = this.parseExpression()) {
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
    
    this.expect('if');
    
    var test = this.parseExpression();
    var alternate = null, consequent;
    
    if (!this.match(':')) this.assert(Message.IllegalIf);
    
    consequent = this.parseStatement();
    if (this.matchKind(Token.INDENT)) {
        if (!this.match(this.indent * this.indent_size)) {
            this.assert(Message.IllegalIndentSize);
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
    if (this.lookahead(1).text === 'else') this.consume();
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
Parser.prototype.parseWhileStatement = function() {
    
    this.expect('while');
    
    var test = this.parseExpression(), body;
    
    try {
        this.state.current.push(State.InIteration);
        body = this.parseStatement();
        this.state.pop();
    } catch (e) {
        this.assert(Message.IllegalWhile);
    }
    
    return {
        type: Syntax.WhileStatement,
        test: test,
        body: body
    };
}

Parser.prototype.parseForStatement = function() {
    
    this.expect('for');
    
    var exprs = [], left, right, body;
    
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
    
    if (!right || !body) this.assert(Message.IllegalFor);
    
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
    if (exprs.length === 2) {
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

/*
    12.7 The continue Statement
    
    ContinueStatement :
        continue
*/
Parser.prototype.parseContinueStatement = function() {
    this.expect('continue');
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) this.assert(Message.IllegalContinue);
    if (!this.state.inIteration()) this.assert(Message.IllegalContinuePosition);
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
    this.expect('break');
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) this.assert(Message.IllegalBreak);
    if (!this.state.inIteration()) this.assert(Message.IllegalBreakPosition);
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
    
    this.expect('return');
    var argument = null;
    
    if (this.state.current.indexOf(State.InFunction) === -1) this.assert(Message.IllegalReturn);
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) argument = this.parseExpression();
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) this.assert(Message.IllegalReturnArgument);
    
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
    
    this.expect('raise');
    var argument = null;
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) argument = this.parseExpression()
    
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
    
    this.expect('try');
    
    var handlers = [], block = null, finalizer = null;
    
    this.ecstack.push([]);
    block = this.parseBlock();
    this.ecstack.pop();
    this.expect(this.indent * this.indent_size);
    
    /*
        Catch :
            except Identifieropt: Block
    */
    handlers.push(this.parseExceptStatement());
    this.expect(this.indent * this.indent_size);
    
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
    
    this.expect('except');
    var param, body;
    
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
    this.assert(Message.UnexpectedToken + ' ' + this.token.text);
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
        if (token.delimiter === '"') {
            // "{a} + {b} = 2" -> '1 + 1 = 2'
            // "{this.name}" -> 'babe'
            text = (function(text, ecstack) {
                var m, rep = {};
                var m = text.match(/{(.*?)}/g);
                if (m) {
                    for (var i = 0; i < m.length; i++) {   
                        var k = m[i].match(/{(this)?\.?(.*)}/);
                        if (k[1]) {
                            if (ref = ecstack.find(k[2])) {
                                rep['{0}.{1}'.format(k[1], k[2])] = ref.value;
                            }
                        }
                        if (k[2]) {
                            if (ecstack.current[k[2]]) {
                                rep[k[2]] = ecstack.current[k[2]].value;
                            }
                        }
                    }
                }
                return text.format(rep);
            })(text, this.ecstack);
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
    var elements = this.parseElementList();
    this.expect(']');
    return {
        type: Syntax.ArrayExpression,
        elements: elements
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
    var properties = this.parsePropertyNameAndValueList()
    this.expect('}');
    return {
        type: Syntax.ObjectExpression,
        properties: properties
    };
}

/*
    11.1.5 Object Initialiser
    
    PropertyNameAndValueList :
        PropertyName : AssignmentExpression
        PropertyNameAndValueList , PropertyName : AssignmentExpression
*/
Parser.prototype.parsePropertyNameAndValueList = function() {
    var list = [];
    while (!this.match('}')) {
        if (this.match(',')
         || this.matchKind(Token.INDENT)
         || this.matchKind(Token.NEWLINE)
         || this.matchKind(Token.EOF)) {
             this.consume();
             continue;
        }
        var k = this.parsePropertyName();
        this.expect(':');
        var v = this.parseAssignmentExpression();
        list.push({
            type: Syntax.Property,
            key: k,
            value: v,
            raw: 'init'
        });
    }
    return list;
}

/*
    11.1.5 Object Initialiser
    
    PropertyName :
        Identifier
        StringLiteral
        NumericLiteral
*/
Parser.prototype.parsePropertyName = function() {
    var token = this.token;
    if (this.token.kind === Token.IDENTIFIER) {
        this.consume();
        return {
            type: Syntax.Identifier,
            value: token.text 
        };
    }
    if (this.token.kind === Token.STRING) {
        this.consume();
        return {
            type: Syntax.Literal,
            value: token.text
        };
    }
    if (this.token.kind === Token.DIGIT) {
        this.consume();
        return {
            type: Syntax.Literal,
            value: token.text
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
        if (this.match('[')) expr = this.parseComputedMember(expr);
        else if (this.match('.')) expr = this.parseNonComputedMember(expr);
        else if (this.match('(') && allow_call) expr = this.parseCallMember(expr);
        else break;
    }
    
    return expr;
}

Parser.prototype.parseComputedMember = function(object) {
    var expr;
    this.expect('[');
    expr = this.parseExpression();
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
    return {
        type: Syntax.MemberExpression,
        computed: false,
        object: object,
        property: this.parseIdentifier()
    };
}

Parser.prototype.parseCallMember = function(object) {
    return {
        type: Syntax.CallExpression,
        callee: object,
        arguments: this.parseArguments()
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
        this.assert(Message.IllegalArgumentList);
    }
    return arguments;
}

/*
    11.2.5 Function Expressions
    
    FunctionExpression :
        ( expression ): ExpressionStatement
*/
Parser.prototype.parseFunctionExpression = function() {
    /*
        lambda expression
            
            (x = 1): x * x
             |
             v
            (function (x) {
                x = x || 1
            	return x * x
            })
    */
    if (this.match('(')) {
        var k = 1;
        while (this.lookahead(k).text !== ')') {
            if (this.lookahead(k).kind === Token.NEWLINE
             || this.lookahead(k).kind === Token.EOF) break;
            k++;
        }
        
        if (this.lookahead(++k).text === ':') {
            var body, arguments = this.parseFormalParameterList();
            this.expect(':');
            
            this.ecstack.push([]);
            this.state.push([State.InFunction]);
            
            body = this.parseExpressionStatement();
            body = arguments.init.concat(body);
            body.push({
                type: Syntax.ReturnStatement,
                argument: body.pop().expression
            });
            
            this.state.pop();
            this.ecstack.pop();
            
            return {
                type: Syntax.FunctionExpression,
                id: null,
                params: arguments.params,
                defaults: [],
                body: {
                    type: Syntax.BlockStatement,
                    body: body
                },
                rest: null,
                generator: false,
                expression: false
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
    var token = this.token;
    
    // postfix increment operator
    if (this.match('++') || this.match('--')) {
        this.consume();
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
    
    var token = this.token;
    
    if (this.matchKind(Token.PUNCTUATOR)) {
        // 11.4.4 - 11.4.5
        if (this.match('++') || this.match('--')) {
            this.consume();
            return {
                type: Syntax.UpdateExpression,
                operator: token.text,
                argument: this.parseUnaryExpression(),
                prefix: true
            };
        }

        // 11.4.6 - 11.4.9
        if (this.match('+') || this.match('-') || this.match('~') || this.match('!')) {
            this.consume();
            return {
                type: Syntax.UnaryExpression,
                operator: token.text,
                argument: this.parseUnaryExpression()
            };
        }
    }
    
    if (this.matchKind('delete') || this.matchKind('typeof') || this.matchKind('not')) {
        // 11.4.1
        if (this.match('delete')) {
            this.consume();
            return {
                type: Syntax.UnaryExpression,
                operator: token.text,
                argument: this.parseUnaryExpression()
            };
        }
        
        // 11.4.3
        if (this.match('typeof')) {
            this.consume();
            return {
                type: Syntax.UnaryExpression,
                operator: 'typeof',
                argument: this.parseUnaryExpression()
            };
        }
        
        // 11.4.9
        if (this.match('not')) {
            this.consume();
            return {
                type: Syntax.UnaryExpression,
                operator: '!',
                argument: this.parseUnaryExpression()
            };
        }
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
    var token = this.token;
    
    // 11.5.1 - 11.5.3
    while (this.match('/') || this.match('*') || this.match('%')) {
        this.consume();
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
    var token = this.token;
    
    // 11.6.1 - 11.6.2
    while (this.match('+') || this.match('-')) {
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
    var token = this.token;
    
    while (this.match('<<') || this.match('>>') || this.match('>>>')) {
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
    
    var operators = ['<', '>', '<=', '>=', 'instanceof', 'in'];
    var expr = this.parseShiftExpression();
    
    // 11.8.1, 11.8.2, 11.8.3, 11.8.4, 11.8.6, 11.8.7
    while (operators.indexOf(this.token.text) > -1) {
        
        var token = this.token;
        this.consume();
        var right = this.parseAssignmentExpression();
        
        if (token.text === 'in') {
            /*
                not "a" in {"a": 1}:
            */
            if (expr.operator === '!' && right.type === Syntax.ObjectExpression) {
                expr.argument = {
                    type: Syntax.BinaryExpression,
                    operator: token.text,
                    left: expr.argument,
                    right: right
                };
                continue;
            }
            
            /*
                if 1 in [1, 2, 3]:
                if not 0 in [1, 2, 3]:
            */
            if (right.type === Syntax.ArrayExpression
             || right.type === Syntax.Identifier) {
                
                if (right.type === Syntax.Identifier) {
                    // When identifier is not defined, raise ReferenceError
                    var reference = this.ecstack.find(right.name)
                    if (reference.type !== Syntax.ArrayExpression) {
                        this.assert(Message.IllegalRelationalExpression);
                    }
                    if (!reference) {
                        this.assert(Message.ReferenceError.format(right.name));
                    }
                }
                 
                var argument = expr, operator = '!==';
                if (argument.operator === '!') {
                    argument = expr.argument;
                    operator = '===';
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
                        arguments: [argument]
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
                continue;
            }
        }
        
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: right
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
        EqualityExpression is RelationalExpression
        EqualityExpression is not RelationalExpression
*/
Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
    // 11.9.1 - 11.9.2
    while (this.match('==') || this.match('!=') || this.match('is')) {
        var operator = this.token.text;
        this.consume();
        if (operator === 'is') {
            operator = '==';
            // is not expression
            if (this.match('not')) {
                this.consume();
                operator = '!=';
            }
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
    var token = this.token;
    
    while (this.match('&')) {
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
    var token = this.token;
    
    while (this.match('^')) {
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
    var token = this.token;
    
    while (this.match('|')) {
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
        LogicalORExpression if LogicalORExpression else LogicalORExpression
*/
Parser.prototype.parseConditionalExpression = function() {
    
    var consequent = this.parseLogicalORExpression();
    var expr;
    
    if (this.match('if')) {
        this.consume();
        expr = this.parseLogicalORExpression();
        this.expect('else');
        return {
            type: Syntax.ConditionalExpression,
            test: expr,
            consequent: consequent,
            alternate: this.parseLogicalORExpression()
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
    var token = this.token;
    
    if (this.matchAssign(token.text)) {
        this.consume();
        expr = {
            type: Syntax.AssignmentExpression,
            operator: token.text,
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
    
    var token = this.token;
    this.consume();
    
    // multi line comment
    if (token.multiple) {
        return {
            type: Syntax.Block,
            // range: [start, end],
            value: token.text
        }
    }
    
    // single line comment
    return {
        type: Syntax.Line,
        // range: [start, end],
        value: token.text
    }
}

/*
    13 Function Definition
    
    FunctionDeclaration :
        def Identifier ( FormalParameterListopt ) : FunctionBody 
*/
Parser.prototype.parseFunctionDeclaration = function() {
    this.expect('def');
    var id, params, body;
    
    id = this.parseIdentifier();
    params = this.parseFormalParameterList();
    
    body = this.parseFunctionBody();
    body = body.shift();
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
        AssignmentExpression
        FormalParameterList , AssignmentExpression
*/
Parser.prototype.parseFormalParameterList = function() {
    var params = [], init = [];
    this.expect('(');
    while (!this.match(')')) {
        if (this.match(',')) this.consume();
        var param = this.parsePrimaryExpression();
        if (param.type !== Syntax.Identifier) this.assert(Message.IllegalArgument);
        if (this.match('=')) {
            this.consume();
            init.push(this.parseDefaultArgument(
                param, 
                this.parsePrimaryExpression()
            ));
        }
        params.push(param);
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
    var body;
    
    this.ecstack.push([]);
    this.state.push([State.InFunction]);
    
    body = this.parseSourceElements();
    
    this.state.pop();
    this.ecstack.pop();
    
    return body
}

/*
    13 Class Definition
    
    ClassDeclaration :
        class Identifier ( FormalParameterListopt )opt : ClassBody 
*/
Parser.prototype.parseClassDeclaration = function() {
    this.expect('class');
    var id = this.parseIdentifier();
    var body, inherit;
    
    if (this.match('(')) {
        this.consume();
        inherit = this.parseInheritDeclaration(id);
        this.expect(')');
    }
    
    body = this.parseClassBody(id);
    
    if (inherit) {
        var head = body.shift();
        body.unshift(inherit);
        body.unshift(head);
    }
    
    return body;
}

Parser.prototype.parseClassBody = function(cls) {
    this.expect(':');
    
    this.indent++;
    
    var declarations = [], variables = [];
    var constructor = this.parseClassConstructorDeclaration(cls, true);
    
    while (1) {
        if (this.matchKind(Token.EOF)) break;
        if (this.matchKind(Token.NEWLINE)) {
            this.consume();
            continue;
        }
        
        if (this.matchKind(Token.INDENT)) {
            if (this.lookahead(1).kind !== Token.NEWLINE
             && this.token.text < this.indent * this.indent_size) break;
            this.consume();
            continue;
        }
        
        // member variable
        if (this.lookahead(1).text === '=') {
            var code = 'this.{0}'.format(
                exports.codegen(this.parseAssignmentExpression())
            );
            variables.push(exports.parse(code).body[0]);
            continue;
        }
        
        // method
        if (this.lookahead(1).text === '(') {
            if (this.match('constructor')) {
                constructor = this.parseClassConstructorDeclaration(cls);
                continue;
            }
            declarations.push(this.parseClassFunctionDeclaration(cls));
            continue;
        }
        
        break; // avoid infinite loop
    }
    
    constructor.declarations[0].init.body.body = variables.concat(constructor.declarations[0].init.body.body);
    declarations.unshift(constructor);
    declarations.push({
        type: Syntax.EmptyStatement
    });
    
    this.indent--;
        
    return declarations;
}

Parser.prototype.parseClassConstructorDeclaration = function(cls, init) {
    var that = this, id, params = [];
    var body = {
        type: Syntax.BlockStatement,
        body: []
    };
    if (!init) {
        id = this.parseIdentifier();
        params = this.parseFormalParameterList();
        body = this.parseFunctionBody().shift();
        body.body = params.init.concat(body.body);
        params = params.params;
        body.body.forEach(function(expr) {
            if (expr
             && expr.expression
             && expr.expression.left
             && expr.expression.left.object
             && expr.expression.left.object.type === Syntax.ThisExpression) {
                that.ecstack.current[expr.expression.left.property.name] = expr.expression.right;
            }
        });
    }
    return {
        type: Syntax.VariableDeclaration,
        declarations: [{
            type: Syntax.VariableDeclarator,
            id: cls,
            init: {
                type: Syntax.FunctionExpression,
                id: null,
                params: params,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false
            }
        }],
        kind: 'var'
    };
}

Parser.prototype.parseInheritDeclaration = function(cls) {
    var id = this.parseIdentifier();
    return {
        type: Syntax.ExpressionStatement,
        expression: {
            type: Syntax.AssignmentExpression,
            operator: '=',
            left: {
                type: Syntax.MemberExpression,
                computed: false,
                object: cls,
                property: {
                    type: Syntax.Identifier,
                    name: 'prototype'
                }
            },
            right: {
                type: Syntax.CallExpression,
                callee: {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: {
                        type: Syntax.Identifier,
                        name: 'Object'
                    },
                    property: {
                        type: Syntax.Identifier,
                        name: 'create'
                    }
                },
                arguments: [
                    {
                        type: Syntax.MemberExpression,
                        computed: false,
                        object: id,
                        property: {
                            type: Syntax.Identifier,
                            name: 'prototype'
                        }
                    }
                ]
            }
        }
    }
}

Parser.prototype.parseClassFunctionDeclaration = function(cls) {
    var id = this.parseIdentifier();
    var params = this.parseFormalParameterList();
    var body = this.parseFunctionBody().shift();
    body.body = params.init.concat(body.body);
    return {
        type: Syntax.ExpressionStatement,
        expression: {
            type: Syntax.AssignmentExpression,
            operator: '=',
            left: {
                type: Syntax.MemberExpression,
                computed: false,
                object: {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: cls,
                    property: {
                        type: Syntax.Identifier,
                        name: 'prototype'
                    }
                },
                property: id
            },
            right: {
                type: Syntax.FunctionExpression,
                id: null,
                params: params.params,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false
            }
        }
    }
}

/*
    alias of Parser.parseProgram
*/
Parser.prototype.parse = Parser.prototype.parseProgram;