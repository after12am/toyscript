var executable;

/*
    break a stream of token
*/
exports.tokenize = function(source) {
    return new Lexer(source).tokenize();
}

/*
    create abstract syntax tree from tokens
*/
exports.parse = function(source) {
    return new Parser(exports.tokenize(source)).parse();
}

/*
    convenience function of babe.compile()
*/
exports.codegen = function(nodes) {
    return escodegen.generate(nodes);
}

/*
    convert javascript to babescript
*/
exports.compile = function(source) {
    return exports.codegen(exports.parse(source));
}

/*
    execute babescript after compiled
*/
exports.run = function() {
    if (executable) {
        return new Function(executable)();
    }
    throw new Error("has to call after compile. confirm whether compile() have been called");
}

/*
    execute babescript
*/
exports.interpret = function(source) {
    return new Function(exports.compile(source))();
}

/*
    When run on the browser, execute babe code.
    
    <script type="text/babe">
        # something babe code
    </script>
*/
function ready() {
    if (document.readyState === 'complete') {
        // var s = +new Date();
        var elements = document.getElementsByTagName('script');
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('type').match('text/babe')) {
                var code = elements[i].innerHTML;
                var k = + new Lexer().matchLineTerminator(code.substring(0, 1));
                exports.interpret(code.substr(k));
            }
        }
        // console.log(+new Date() - s);
        return;
    }
    setTimeout(ready);
}

try {
    // If run on node.js, thrown the exception.
    if (window) setTimeout(ready);
} catch (e) {}