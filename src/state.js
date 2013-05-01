var State = function() {
    Array.call(this, arguments);
    this.current = null;
    this.push([]);
}

State.prototype = Object.create(Array.prototype);
State.prototype.push = function() {
    Array.prototype.push.call(this, arguments);
    this.current = this[this.length - 1][0];
}

State.prototype.pop = function() {
    if (this.length > 1) {
        Array.prototype.pop.call(this);
        this.current = this[this.length - 1][0];
    }
}

State.InFunction = 0;
State.InIteration = 1;