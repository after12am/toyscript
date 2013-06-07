var Token = function(kind, text, location) {
    this.name = 'Token';
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    return "{0} kind:{1} text:{2}".format([
        this.location.toString(), 
        this.kind, 
        this.text
    ]);
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
Token.KEYWORDS.PASS = 'pass';
Token.KEYWORDS.RETURN = 'return';
Token.KEYWORDS.THIS = 'this';
Token.KEYWORDS.TRY = 'try';
Token.KEYWORDS.RAISE = 'raise';
Token.KEYWORDS.VOID = 'void';
Token.KEYWORDS.WHILE = 'while';
Token.KEYWORDS.XOR = 'xor';
Token.KEYWORDS.NONE = 'none';
Token.KEYWORDS.VAR = 'var';