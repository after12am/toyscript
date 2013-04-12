if (String.prototype.format == undefined) {
    String.prototype.format = function(args) {
        var func;
        if (typeof args == "object") {
            func = function(m, k) { return args[k]; }
        } else {
            var args = arguments;
            func = function(m, k) { return args[parseInt(k)]; }
        }
        return this.replace(/\{(\w+)\}/g, func);
    }
}