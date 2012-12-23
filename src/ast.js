var AST = function(token) {
    this.token = token;
    this.children = [];
}

AST.prototype.nodeKind = function() {
    return this.token.kind;
}

AST.prototype.add = function(ast) {
    this.children.push(ast);
}

AST.prototype.toString = function() {
    // should dynamically be overridden.
}