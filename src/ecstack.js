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
    var ret = false;
    for (var i = this.length - 1; i >= 0; i--) {
        for (var j = this[i].length - 1; j >= 0; j--) {
            if (this[i][j][name]) {
                ret = this[i][j][name];
                break;
            }
        }
        if (ret) break;
    }
    return ret;
}