var Lexer = function() {
    
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
Lexer.prototype.isWhiteSpace = function(c) {
    return c.match(/^\s$/) && !this.isLineTerminator(c);
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.isLineTerminator = function(c) {
    return c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
}

Lexer.prototype.isDigit = function(c) {
    return c >= "0" && c <= "9";
}

Lexer.prototype.isLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "$";
}

Lexer.prototype.matchAssign = function(op) {
    
    // 4character assignment
    if (op === '>>>=') {
        return true;
    }
    
    // 3character assignment
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return true;
    }
    
    // 2character assignment
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=' || op === '<=' ||
        op === '>=' || op === '==' || op === '!=') {
        return true;
    }
    
    // 1character assignment
    if (op === '=') {
        return true;
    }
    
    return false;
}