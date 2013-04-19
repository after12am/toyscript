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
Message.IllegalIf = 'Illegal if statement';
Message.IllegalContinue = 'Continue statement can not have label';
Message.IllegalContinuePosition = 'Continue statement have to be declared in iteration';
Message.IllegalBreak = 'Break statement can not have label';
Message.IllegalBreakPosition = 'Break statement have to be declared in iteration';
Message.IllegalReturn = 'Return statement has to be contained in function';
Message.IllegalReturnArgument = 'Return argument has to be one';
Message.IllegalRaise = 'Illegal raise statement';
Message.IllegalRaiseArgument =  'Raise argument has to be one';
Message.IllegalExcept = 'Illegal except statement';
Message.IllegalFinally = 'Illegal finally statement';
Message.IllegalConditionalExpression = 'Illegal conditional expression';
Message.IndentSize = 'Indent size may be incorrect';
Message.IllegalIdentifier = 'Illegal identifier';
Message.IllegalArgumentList = 'Arguments maybe includes newline';
Message.IllegalPostfixIncrement = 'Postfix increment operator is only for identifier';
Message.IllegalPostfixDecrement = 'Postfix decrement operator is only for identifier';
Message.IllegalPrefixIncrement = 'Prefix increment operator is only for identifier';
Message.IllegalPrefixDecrement = 'Prefix decrement operator is only for identifier';
Message.IllegalMultiplicativeExpression = 'Illegal multiplicative expression';
Message.IllegalShiftExpression = 'Illegal shift expression';
Message.IllegalRelationalExpression = 'Illegal relational expression';
Message.IllegalIsinstance = 'arguments of isinstance build-in function has to be two';
Message.IllegalTypeof = 'argument of type build-in function has to be one';