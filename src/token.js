var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    return this.location.toString() + ' kind:' + this.kind + ' text:' + this.text;
}

//----------------------------------------
// TOKEN LIST
//----------------------------------------
Token.EOF = 'EOF';
Token.NEWLINE = 'NEWLINE';
Token.NONE = 'NONE';
Token.NAN = 'NAN';
Token.BOOLEAN = 'BOOLEAN';
Token.INFINITY = 'INFINITY';
Token.INDENT = 'INDENT';
Token.IDENT = 'IDENT';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.COLON = 'COLON';
Token.KEYWORD = 'KEYWORD';
Token.SINGLE_LINE_COMMENT = 'SINGLE_LINE_COMMENT';
Token.MULTI_LINE_COMMENT = 'MULTI_LINE_COMMENT';

//----------------------------------------
// KEYWORD LIST
//----------------------------------------
Token.KEYWORDS = [];
Token.KEYWORDS.TYPEOF = 'TYPEOF';
Token.KEYWORDS.INSTANCEOF = 'INSTANCEOF';
Token.KEYWORDS.DELETE = 'DELETE';
Token.KEYWORDS.NEW = 'NEW';
Token.KEYWORDS.TRY = 'TRY';
Token.KEYWORDS.CATCH = 'CATCH';
Token.KEYWORDS.THROW = 'THROW';
Token.KEYWORDS.EXTENDS = 'EXTENDS';
Token.KEYWORDS.AND = 'AND';
Token.KEYWORDS.OR = 'OR';
Token.KEYWORDS.XOR = 'XOR';
Token.KEYWORDS.IN = 'IN';
Token.KEYWORDS.IS = 'IS';
Token.KEYWORDS.NOT = 'NOT';
Token.KEYWORDS.RETURN = 'RETURN';
Token.KEYWORDS.IF = 'IF';
Token.KEYWORDS.ELIF = 'ELIF';
Token.KEYWORDS.ELSE = 'ELSE';
Token.KEYWORDS.WHILE = 'WHILE';
Token.KEYWORDS.FOR = 'FOR';
Token.KEYWORDS.CONTINUE = 'CONTINUE';
Token.KEYWORDS.BREAK = 'BREAK';
Token.KEYWORDS.CLASS = 'CLASS';
Token.KEYWORDS.NULL = 'NULL';
Token.KEYWORDS.THIS = 'THIS';
Token.KEYWORDS.TRUE = 'TRUE';
Token.KEYWORDS.FALSE = 'FALSE';
