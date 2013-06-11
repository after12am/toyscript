var Location = function(line, column) {
    this.name = 'Location';
    this.line = line;
    this.column = column;
}

Location.prototype.toString = function() {
    return "Line {0} Column {1}".format([
        this.line, 
        this.column
    ]);
};