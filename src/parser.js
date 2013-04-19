// http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/
// https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
// https://github.com/mozilla/sweet.js
// http://esprima.org/demo/parse.html

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

Parser.prototype = Object.create(Lexer.prototype);
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
Parser.prototype.expect = function(value, message) {
    if (this.token.text !== value) {
        if (message) {
            var data = {
                "location": this.token.location.toString(), 
                "message": message
            };
            throw "{location} {message}".format(data);
        }
        
        var data = {
            "location": this.token.location.toString(), 
            "unexpected": this.token.text,
            "expected": value
        };
        throw "{location} Unexpected token \"{unexpected}\" expecting \"{expected}\"".format(data);
    }
    this.consume();
}

/*
    throw error when argument does not match kind of token
*/
Parser.prototype.expectKind = function(value, message) {
    if (this.token.kind !== value) {
        if (message) {
            var data = {
                "location": this.token.location.toString(), 
                "message": message
            };
            throw "{location} {message}".format(data);
        }
        
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
    return this.parseStatement() || this.parseFunctionDeclaration();
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
        if (this.match(':')) {
            return this.parseBlock();
        }
    }
    
    switch (this.token.kind) {
    case Token.COMMENT: return this.parseComment();
    case Token.NEWLINE: return this.parseEmptyStatement();
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
    
    throw new Message(this.token, Message.UnexpectedToken + ' \'{token}\''.format(this.token.text)).toString();
}

/*
    12.1 Block
    
    Block:
        : LineTerminator StatementList
*/
Parser.prototype.parseBlock = function() {
    
    var passed = function(p, c) {
        return p || c.type !== Syntax.NEWLINE;
    }
    
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
    
    var pass = exprs.reduce(passed, false);
    if (pass) {
        return {
            type: Syntax.BlockStatement,
            body: exprs
        };
    }
    
    throw new Message(this.token, Message.IllegalBlock).toString();
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
    if (this.match('def') || this.match(':')) return;
    return {
        type: Syntax.ExpressionStatement,
        expression: this.parseExpression()
    };
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
    var test = this.parseExpression();
    var consequent = this.parseStatement();
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
            throw new Message(this.token, Message.IndentWhile).toString();
        }
        
        this.inIteration = true;
        var body = this.parseStatement();
        this.inIteration = false;
        
        return {
            type: Syntax.WhileStatement,
            test: test,
            body: body
        };
    }
    
    if (this.match('for')) {
        this.consume();
        
        var left = null;
        while (1) {
            if (this.match('in')) break;
            if (this.match(',')) this.consume();
            left = this.parseLeftHandSideExpression();
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
    
    var indent = this.indent * this.indent_size;
    var handlers = [];
    var finalizer = null;
    
    this.expect('try');
    var block = this.parseBlock();
    this.expect(indent);
    
    while (this.match('except')) {
        
        handlers.push(this.parseExceptStatement());
        
        if (this.token.kind === Token.EOF
         || this.token.kind === Token.NEWLINE) break;
        
        this.expect(indent);
    }
    
    /*
        Finally:
            finally Block
    */
    if (this.match('finally')) {
        this.consume();
        finalizer = this.parseBlock();
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
    if (this.match(':')) {
        // think about except:
        param = {
            type: Syntax.Identifier,
            name: 'e'
        };
    }
    return {
        type: Syntax.CatchClause,
        param: param || this.parseIdentifier(),
        guard: null,
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
    
    //throw new Message(this.token, Message.UnexpectedToken, '\'' + this.token.text + '\'').toString();
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
        this.consume();
        return {
            type: Syntax.Literal,
            value: token.text
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
    
    if (this.match('new')) {
        return this.parseNewExpression();
    }
    
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
    
    // 11.4.3 The typeof Operator
    if (object.name === 'type') {
        var argument = this.parseArguments();
        if (argument.length !== 1) {
            throw new Message(this.token, Message.IllegalTypeof).toString();
        }
        return {
            type: Syntax.UnaryExpression,
            operator: 'typeof',
            argument: argument[0]
        };
    }
    
    // 11.8.6 The instanceof operator
    if (object.name === 'isinstance') {
        var arguments = this.parseArguments();
        if (arguments.length !== 2) {
            throw new Message(this.token, Message.IllegalIsinstance).toString();
        }
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BinaryExpression,
            operator: 'instanceof',
            left: arguments[0],
            right: arguments[1]
        };
    }
    
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
        throw new Message(this.token, Message.IllegalArgumentList).toString();
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
            if (token.text === '++') throw new Message(this.token, Message.IllegalPostfixIncrement).toString();
            if (token.text === '--') throw new Message(this.token, Message.IllegalPostfixDecrement).toString();
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
            if (token.text === '++') throw new Message(this.token, Message.IllegalPrefixIncrement).toString();
            if (token.text === '--') throw new Message(this.token, Message.IllegalPrefixDecrement).toString();
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
        var expr = this.parseUnaryExpression();
        // may have to handle exception here
        // example, {} + {}, {} - {}
        return {
            type: Syntax.UnaryExpression,
            operator: token.text,
            argument: expr
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
    if (this.match('/') || this.match('*') || this.match('%')) {
        var token = this.token;
        this.consume();
        
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            throw new Message(this.token, Message.IllegalMultiplicativeExpression).toString();
        }
        
        return {
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
    if (this.match('+') || this.match('-')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BinaryExpression,
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
            type: Syntax.BinaryExpression,
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
            type: Syntax.BinaryExpression,
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
            type: Syntax.BinaryExpression,
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
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    // 11.8.7
    if (this.match('in')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.BinaryExpression,
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
            type: Syntax.BinaryExpression,
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
    
    var token = this.token;
    var expr = this.parseEqualityExpression();
    
    if (this.match('&')) {
        var token = this.token;
        this.consume();
        return {
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
    
    if (this.match('^')) {
        var token = this.token;
        this.consume();
        return {
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
    
    if (this.match('|')) {
        var token = this.token;
        this.consume();
        return {
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
        LogicalANDExpression && BitwiseORExpression
*/
Parser.prototype.parseLogicalANDExpression = function() {
    
    var expr = this.parseBitwiseORExpression();
    
    if (this.match('and')) {
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
        LogicalORExpression || LogicalANDExpression
*/
Parser.prototype.parseLogicalORExpression = function() {
    
    var expr = this.parseLogicalANDExpression();
    var or = this.token.text;
    
    if (this.match('or')) {
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
*/
Parser.prototype.parseConditionalExpression = function() {
    
    var expr = this.parseLogicalORExpression();
    
    if (this.match('?')) {
        this.consume();
        var consequent = this.parseAssignmentExpression();
        this.expect(':');
        return {
            type: Syntax.ConditionalExpression,
            test: expr,
            consequent: consequent,
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
            type: Syntax.AssignmentExpression,
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

/*
    alias of Parser.parseProgram
*/
Parser.prototype.parse = Parser.prototype.parseProgram;