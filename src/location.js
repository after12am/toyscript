var Location = function(line, column) {
    this.line = line;
    this.column = column;
}

Location.prototype.toString = function() {
    var data = {
        'line': this.line, 
        'column': this.column
    }
    return "Line {line} Column {column}".format(data);
};