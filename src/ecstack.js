var EcStack = function() {
    Array.call(this, arguments);
    this.current = null;
    this.push([]); // push global context
}

EcStack.prototype = Object.create(Array.prototype);
EcStack.prototype.push = function() {
    Array.prototype.push.call(this, arguments);
    this.current = this[this.length - 1][0];
}

EcStack.prototype.pop = function() {
    if (this.length <= 1) throw new Error("no current context");
    Array.prototype.pop.call(this);
    this.current = this[this.length - 1][0];
}

EcStack.prototype.find = function(name) {
    for (var i = 0; i < this.length; i++) {
        for (var j = 0; j < this.length; j++) {
            if (this[i][j] && this[i][j][name]) return this[i][j][name];
        }
    }
    return false;
}

/*
    Go back in ancestor, and find identifier
*/
/*
EcStack.prototype.findIdent = function(subtree, idents) {
    idents = idents || [];
    for (var i in subtree) {
        var tree = subtree[i];
        if (typeof tree === 'object') {
            if (tree.type === Syntax.Identifier
             && this.current[tree.name] === undefined
             && idents.indexOf(tree.name) === -1) {
                idents.push(tree.name);
            }
            this.findIdent(tree, idents);
        }
    }
    return idents;
}*/