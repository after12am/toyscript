
var Console = function(log) {
    this.log = log;
}

Console.prototype.out = function() {
    
    for (var i in this.log.messages) {
        
        var message = this.log.messages[i];
        
        switch (message.type) {
            case 'info':
                console.log('line ' + message.line + ': ' + message.text);
                break;
            case 'debug':
                console.debug('line ' + message.line + ': ' + message.text);
                break;
            case 'error':
                console.error('line ' + message.line + ': ' + message.text);
                break;
            case 'warn':
                console.warn('line ' + message.line + ': ' + message.text);
                break;
            case 'log':
                console.log('line ' + message.line + ': ' + message.text);
                break;
        }
    }
}