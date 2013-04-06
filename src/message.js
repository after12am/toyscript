var Message = function(token, message, additional) {
    this.token = token;
    this.message = message;
    this.additional = additional || null;
};

Message.prototype.toString = function() {
    
    if (this.additional) {
        return this.token.location.toString() + ' ' + this.message + ', ' + this.additional;
    }
    return this.token.location.toString() + ' ' + this.message;
};

Message.UnknownToken = 'Unknown token';
Message.IllegalIdent = 'Illegal identifier';
Message.UnexpectedString = 'Unexpected string';
Message.IllegalComment = 'Illegal comment';