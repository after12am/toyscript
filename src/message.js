var Message = function(token, message, additional) {
    this.token = token;
    this.message = message;
    this.additional = additional || null;
};

Message.prototype.toString = function() {
    
    if (this.additional) {
        return this.token.location.toString() + ' ' + this.message + ' ' + this.additional;
    }
    return this.token.location.toString() + ' ' + this.message;
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
Message.IllegalExcept = 'Illegal raise statement';
Message.IllegalFinally = 'Illegal finally statement';
Message.IndentSize = 'Indent size may be incorrect';
Message.IllegalIdentifier = 'Illegal identifier';