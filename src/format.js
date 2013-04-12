if (String.prototype.format == undefined) {
	String.prototype.format = function(arg) {
		
        var rep_fn = undefined;
        
        if (typeof arg == "object") {
            rep_fn = function(m, k) { return arg[k]; }
        } else {
            var args = arguments;
            rep_fn = function(m, k) { return args[parseInt(k)]; }
        }
        
        return this.replace(/\{(\w+)\}/g, rep_fn);
    }
}