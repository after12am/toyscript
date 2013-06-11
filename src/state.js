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

State.prototype.inClass = function() {
    return this.current.indexOf(State.InIteration) > -1;
}

State.prototype.inFunction = function() {
    return this.current.indexOf(State.InFunction) > -1;
}

State.prototype.inIteration = function() {
    return this.current.indexOf(State.InIteration) > -1;
}

State.InClass = 0;
State.InFunction = 1;
State.InIteration = 2;