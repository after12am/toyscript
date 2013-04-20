var Lexer = function() {
    this.name = 'Lexer';
}

/*
    7.2 White Space

    WhiteSpace ::
        <TAB>
        <VT>
        <FF>
        <SP>
        <NBSP>
        <USP>
*/
Lexer.prototype.matchWhiteSpace = function(c) {
    return c.match(/^\s$/) && !this.matchLineTerminator(c);
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.matchLineTerminator = function(c) {
    return c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
}

/*
    7.8.3 Numeric Literals
    
    DecimalDigit :: one of
        0 1 2 3 4 5 6 7 8 9
*/
Lexer.prototype.matchDigit = function(c) {
    return c >= "0" && c <= "9";
}

/*
    7.8.4 String Literals
    
    one of [a-ZA-Z_$]
*/
Lexer.prototype.matchLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "$";
}