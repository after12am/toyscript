var Location = function(line, column) {
    this.name = 'Location';
    this.line = line;
    this.column = column;
}

Location.prototype.toString = function() {
    return "Line {line} Column {column}".format([
        this.line, 
        this.column
    ]);
};