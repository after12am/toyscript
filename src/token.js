var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.EOF = 'EOF';
Token.NEWLINE = 'NEWLINE';
Token.INDENT = 'INDENT';
Token.IDENT = 'IDENT';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.KEYWORD = 'KEYWORD';

Token.KEYWORDS = [];

['EXTENDS', 'AND', 'OR', 'XOR', 'IN', 'IS', 'NOT', 'RETURN', 'IF', 'ELSE', 'WHILE', 'FOR', 'CONTINUE', 'BREAK', 'CLASS', 'NULL', 'THIS', 'TRUE', 'FALSE'].forEach(function(k) {
    Token.KEYWORDS[k] = k;
});