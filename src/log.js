
var Message = function(type, line, text) {
    this.type = type;
    this.line = line;
    this.text = text;
}

var Log = function() {
    this.messages = [];
    this.hasErrors = false;
};

Log.prototype.log = function(location, text) {
    this.messages.push(new Message('log', location.line, text));
};

Log.prototype.info = function(location, text) {
    this.messages.push(new Message('info', location.line, text));
};

Log.prototype.debug = function(location, text) {
    this.messages.push(new Message('debug', location.line, text));
};

Log.prototype.warn = function(location, text) {
    this.messages.push(new Message('warn', location.line, text));
};

Log.prototype.error = function(location, text) {
    this.messages.push(new Message('error', location.line, text));
    this.hasErrors = true;
};