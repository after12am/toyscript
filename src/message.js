var Message = function(location, message, additional) {
    
    if (!(location instanceof Location)) {
        throw 'Unexpected instance. must be instance of Location.';
    }
    
    this.location = location;
    this.message = message;
    this.additional = additional || null;
};

Message.prototype.toString = function() {
    
    if (this.additional) {
        return this.location.toString() + ' ' + this.message + ', ' + this.additional;
    }
    return this.location.toString() + ' ' + this.message;
};

Message.UnknownToken = 'Unknown token';
Message.IllegalIdent = 'Illegal identifier';
Message.UnexpectedString = 'Unexpected string';