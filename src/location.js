var Location = function(line, column) {
    this.line = line;
    this.column = column;
}

Location.prototype.toString = function() {
    return "Line " + this.line + " Column " + this.column;
};