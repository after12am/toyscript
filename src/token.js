var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    return this.location.toString() + ' kind:' + this.kind + ' text:' + this.text;
}

/*
    Token of internal definition
*/
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
Token.KEYWORDS.RETURN = 'return';
Token.KEYWORDS.THIS = 'this';
Token.KEYWORDS.TRY = 'try';
Token.KEYWORDS.RAISE = 'raise';
Token.KEYWORDS.VOID = 'void';
Token.KEYWORDS.WHILE = 'while';
Token.KEYWORDS.XOR = 'xor';
Token.KEYWORDS.NONE = 'none';
