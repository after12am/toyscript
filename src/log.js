var Log = function() {
    this.name = 'Log';
    this.messages = [];
};

Log.prototype.log = function(location, message) {
    this.messages.push({
        type: 'log',
        text: text,
        location: location
    });
};

Log.prototype.info = function(location, message) {
    this.messages.push({
        type: 'info',
        text: text,
        location: location
    });
};

Log.prototype.debug = function(location, message) {
    this.messages.push({
        type: 'debug',
        text: text,
        location: location
    });
};

Log.prototype.warn = function(location, message) {
    this.messages.push({
        type: 'warn',
        text: text,
        location: location
    });
};

Log.prototype.error = function(location, message) {
    this.messages.push({
        type: 'error',
        text: text,
        location: location
    });
};

Log.prototype.hasError = function() {
    for (var i in this.messages) {
        if (this.messages[i]['type'] == 'error') {
            return true;
        }
    }
    return false;
};