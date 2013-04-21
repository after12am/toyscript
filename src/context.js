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