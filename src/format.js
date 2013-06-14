if (String.prototype.format == undefined) {
    String.prototype.format = function(args) {
        /*
            '[{time}] {message}'.format({
                'time': '2013-01-01 00:00:00',
                'message': 'my message'
            })
        */
        if (typeof args == "object") {
            return this.replace(/\{([\w\.]+)\}/g, function(m, k) {
                return args[k];
            });
        }
        /*
            '[{0}] {1}'.format('2013-01-01 00:00:00', 'my message')
        */
        var args = Array.prototype.slice.apply(arguments);
        return ss = args.reduce(function(p, c, i){
            return p.replace('{i}'.replace('i', i), args[i]);
        }, this.toString());
    }
}