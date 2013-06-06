/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2013 Satoshi Okami
 * Released under the MIT license
 */
module.exports = (function() {
var exports = {};

// src/babe.js
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
// src/compiler.js
var Compiler = function(source) {
    this.name = 'Compiler';
    this.source = source;
}

Compiler.prototype.compile = function() {
    
    if (typeof this.source !== 'string') {
        console.error('input type is not string.');
        return;
    }
    
    var log = new Log();
    var lexer = new Lexer(this.source);
    var tokens;
    var nodes;
    var javascript;
    
    if (tokens = lexer.tokenize()) {
        if (nodes = new Parser(tokens, log).parse()) {
            javascript = escodegen.generate(nodes)
        }
    }
    
    return {
        'source': this.source,
        'tokens': token,
        'nodes': nodes,
        'javascript': javascript,
        'log': log,
        'error': log.hasError()
    }
}
// src/context.js
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
// src/escodegen.js
/*
  Copyright (C) 2012 Michael Ficarra <escodegen.copyright@michael.ficarra.me>
  Copyright (C) 2012 Robert Gust-Bardon <donate@robert.gust-bardon.org>
  Copyright (C) 2012 John Freeman <jfreeman08@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true */
/*global escodegen:true, exports:true, generateStatement:true, process:true, require:true, define:true*/
var escodegen = {};

(function (factory, global) {
    'use strict';
    
    factory((escodegen = {}), global);
    
}(function (exports, global) {
    'use strict';
    
    var SEMICOLON = '';//';';
    
    var Syntax,
        Precedence,
        BinaryPrecedence,
        Regex,
        VisitorKeys,
        VisitorOption,
        SourceNode,
        isArray,
        base,
        indent,
        json,
        renumber,
        hexadecimal,
        quotes,
        escapeless,
        newline,
        space,
        parentheses,
        semicolons,
        safeConcatenation,
        directive,
        extra,
        parse,
        sourceMap;

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DirectiveStatement: 'DirectiveStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    Precedence = {
        Sequence: 0,
        Assignment: 1,
        Conditional: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        BitwiseOR: 5,
        BitwiseXOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        Member: 17,
        Primary: 18
    };

    BinaryPrecedence = {
        '||': Precedence.LogicalOR,
        '&&': Precedence.LogicalAND,
        '|': Precedence.BitwiseOR,
        '^': Precedence.BitwiseXOR,
        '&': Precedence.BitwiseAND,
        '==': Precedence.Equality,
        '!=': Precedence.Equality,
        '===': Precedence.Equality,
        '!==': Precedence.Equality,
        '<': Precedence.Relational,
        '>': Precedence.Relational,
        '<=': Precedence.Relational,
        '>=': Precedence.Relational,
        'in': Precedence.Relational,
        'instanceof': Precedence.Relational,
        '<<': Precedence.BitwiseSHIFT,
        '>>': Precedence.BitwiseSHIFT,
        '>>>': Precedence.BitwiseSHIFT,
        '+': Precedence.Additive,
        '-': Precedence.Additive,
        '*': Precedence.Multiplicative,
        '%': Precedence.Multiplicative,
        '/': Precedence.Multiplicative
    };

    Regex = {
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]')
    };

    function getDefaultOptions() {
        // default options
        return {
            indent: null,
            base: null,
            parse: null,
            comment: false,
            format: {
                indent: {
                    style: '    ',
                    base: 0,
                    adjustMultilineComment: false
                },
                json: false,
                renumber: false,
                hexadecimal: false,
                quotes: 'single',
                escapeless: false,
                compact: false,
                parentheses: true,
                semicolons: true,
                safeConcatenation: false
            },
            sourceMap: null,
            sourceMapWithCode: false,
            directive: false
        };
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; i += 1) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function stringRepeat(str, num) {
        var result = '';

        for (num |= 0; num > 0; num >>>= 1, str += str) {
            if (num & 1) {
                result += str;
            }
        }

        return result;
    }

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }

    // Fallback for the non SourceMap environment
    function SourceNodeMock(line, column, filename, chunk) {
        var result = [];

        function flatten(input) {
            var i, iz;
            if (isArray(input)) {
                for (i = 0, iz = input.length; i < iz; ++i) {
                    flatten(input[i]);
                }
            } else if (input instanceof SourceNodeMock) {
                result.push(input);
            } else if (typeof input === 'string' && input) {
                result.push(input);
            }
        }

        flatten(chunk);
        this.children = result;
    }

    SourceNodeMock.prototype.toString = function toString() {
        var res = '', i, iz, node;
        for (i = 0, iz = this.children.length; i < iz; ++i) {
            node = this.children[i];
            if (node instanceof SourceNodeMock) {
                res += node.toString();
            } else {
                res += node;
            }
        }
        return res;
    };

    SourceNodeMock.prototype.replaceRight = function replaceRight(pattern, replacement) {
        var last = this.children[this.children.length - 1];
        if (last instanceof SourceNodeMock) {
            last.replaceRight(pattern, replacement);
        } else if (typeof last === 'string') {
            this.children[this.children.length - 1] = last.replace(pattern, replacement);
        } else {
            this.children.push(''.replace(pattern, replacement));
        }
        return this;
    };

    SourceNodeMock.prototype.join = function join(sep) {
        var i, iz, result;
        result = [];
        iz = this.children.length;
        if (iz > 0) {
            for (i = 0, iz -= 1; i < iz; ++i) {
                result.push(this.children[i], sep);
            }
            result.push(this.children[iz]);
            this.children = result;
        }
        return this;
    };

    function endsWithLineTerminator(str) {
        var ch = str.charAt(str.length - 1);
        return ch === '\r' || ch === '\n';
    }

    function shallowCopy(obj) {
        var ret = {}, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }

    function deepCopy(obj) {
        var ret = {}, key, val;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                } else {
                    ret[key] = val;
                }
            }
        }
        return ret;
    }

    function updateDeeply(target, override) {
        var key, val;

        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }

        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    } else {
                        target[key] = updateDeeply({}, val);
                    }
                } else {
                    target[key] = val;
                }
            }
        }
        return target;
    }

    function generateNumber(value) {
        var result, point, temp, exponent, pos;

        if (value !== value) {
            throw new Error('Numeric literal whose value is NaN');
        }
        if (value < 0 || (value === 0 && 1 / value < 0)) {
            throw new Error('Numeric literal whose value is negative');
        }

        if (value === 1 / 0) {
            return json ? 'null' : renumber ? '1e400' : '1e+400';
        }

        result = '' + value;
        if (!renumber || result.length < 3) {
            return result;
        }

        point = result.indexOf('.');
        if (!json && result.charAt(0) === '0' && point === 1) {
            point = 0;
            result = result.slice(1);
        }
        temp = result;
        result = result.replace('e+', 'e');
        exponent = 0;
        if ((pos = temp.indexOf('e')) > 0) {
            exponent = +temp.slice(pos + 1);
            temp = temp.slice(0, pos);
        }
        if (point >= 0) {
            exponent -= temp.length - point - 1;
            temp = +(temp.slice(0, point) + temp.slice(point + 1)) + '';
        }
        pos = 0;
        while (temp.charAt(temp.length + pos - 1) === '0') {
            pos -= 1;
        }
        if (pos !== 0) {
            exponent -= pos;
            temp = temp.slice(0, pos);
        }
        if (exponent !== 0) {
            temp += 'e' + exponent;
        }
        if ((temp.length < result.length ||
                    (hexadecimal && value > 1e12 && Math.floor(value) === value && (temp = '0x' + value.toString(16)).length < result.length)) &&
                +temp === value) {
            result = temp;
        }

        return result;
    }

    function escapeAllowedCharacter(ch, next) {
        var code = ch.charCodeAt(0), hex = code.toString(16), result = '\\';

        switch (ch) {
        case '\b':
            result += 'b';
            break;
        case '\f':
            result += 'f';
            break;
        case '\t':
            result += 't';
            break;
        default:
            if (json || code > 0xff) {
                result += 'u' + '0000'.slice(hex.length) + hex;
            } else if (ch === '\u0000' && '0123456789'.indexOf(next) < 0) {
                result += '0';
            } else if (ch === '\v') {
                result += 'v';
            } else {
                result += 'x' + '00'.slice(hex.length) + hex;
            }
            break;
        }

        return result;
    }

    function escapeDisallowedCharacter(ch) {
        var result = '\\';
        switch (ch) {
        case '\\':
            result += '\\';
            break;
        case '\n':
            result += 'n';
            break;
        case '\r':
            result += 'r';
            break;
        case '\u2028':
            result += 'u2028';
            break;
        case '\u2029':
            result += 'u2029';
            break;
        default:
            throw new Error('Incorrectly classified character');
        }

        return result;
    }

    function escapeDirective(str) {
        var i, iz, ch, single, buf, quote;

        buf = str;
        if (typeof buf[0] === 'undefined') {
            buf = stringToArray(buf);
        }

        quote = quotes === 'double' ? '"' : '\'';
        for (i = 0, iz = buf.length; i < iz; i += 1) {
            ch = buf[i];
            if (ch === '\'') {
                quote = '"';
                break;
            } else if (ch === '"') {
                quote = '\'';
                break;
            } else if (ch === '\\') {
                i += 1;
            }
        }

        return quote + str + quote;
    }

    function escapeString(str) {
        var result = '', i, len, ch, next, singleQuotes = 0, doubleQuotes = 0, single;

        if (typeof str[0] === 'undefined') {
            str = stringToArray(str);
        }

        for (i = 0, len = str.length; i < len; i += 1) {
            ch = str[i];
            if (ch === '\'') {
                singleQuotes += 1;
            } else if (ch === '"') {
                doubleQuotes += 1;
            } else if (ch === '/' && json) {
                result += '\\';
            } else if ('\\\n\r\u2028\u2029'.indexOf(ch) >= 0) {
                result += escapeDisallowedCharacter(ch);
                continue;
            } else if ((json && ch < ' ') || !(json || escapeless || (ch >= ' ' && ch <= '~'))) {
                result += escapeAllowedCharacter(ch, str[i + 1]);
                continue;
            }
            result += ch;
        }

        single = !(quotes === 'double' || (quotes === 'auto' && doubleQuotes < singleQuotes));
        str = result;
        result = single ? '\'' : '"';

        if (typeof str[0] === 'undefined') {
            str = stringToArray(str);
        }

        for (i = 0, len = str.length; i < len; i += 1) {
            ch = str[i];
            if ((ch === '\'' && single) || (ch === '"' && !single)) {
                result += '\\';
            }
            result += ch;
        }

        return result + (single ? '\'' : '"');
    }

    function isWhiteSpace(ch) {
        return '\t\v\f \xa0'.indexOf(ch) >= 0 || (ch.charCodeAt(0) >= 0x1680 && '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\ufeff'.indexOf(ch) >= 0);
    }

    function isLineTerminator(ch) {
        return '\n\r\u2028\u2029'.indexOf(ch) >= 0;
    }

    function isIdentifierPart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch >= '0') && (ch <= '9')) ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierPart.test(ch));
    }

    function toSourceNode(generated, node) {
        if (node == null) {
            if (generated instanceof SourceNode) {
                return generated;
            } else {
                node = {};
            }
        }
        if (node.loc == null) {
            return new SourceNode(null, null, sourceMap, generated);
        }
        return new SourceNode(node.loc.start.line, node.loc.start.column, (sourceMap === true ? node.loc.source || null : sourceMap), generated);
    }

    function join(left, right) {
        var leftSource = toSourceNode(left).toString(),
            rightSource = toSourceNode(right).toString(),
            leftChar = leftSource.charAt(leftSource.length - 1),
            rightChar = rightSource.charAt(0);

        if (((leftChar === '+' || leftChar === '-') && leftChar === rightChar) || (isIdentifierPart(leftChar) && isIdentifierPart(rightChar))) {
            return [left, ' ', right];
        } else if (isWhiteSpace(leftChar) || isLineTerminator(leftChar) || isWhiteSpace(rightChar) || isLineTerminator(rightChar)) {
            return [left, right];
        }
        return [left, space, right];
    }

    function addIndent(stmt) {
        return [base, stmt];
    }

    function withIndent(fn) {
        var previousBase, result;
        previousBase = base;
        base += indent;
        result = fn.call(this, base);
        base = previousBase;
        return result;
    }

    function calculateSpaces(str) {
        var i;
        for (i = str.length - 1; i >= 0; i -= 1) {
            if (isLineTerminator(str.charAt(i))) {
                break;
            }
        }
        return (str.length - 1) - i;
    }

    function adjustMultilineComment(value, specialBase) {
        var array, i, len, line, j, ch, spaces, previousBase;

        array = value.split(/\r\n|[\r\n]/);
        spaces = Number.MAX_VALUE;

        // first line doesn't have indentation
        for (i = 1, len = array.length; i < len; i += 1) {
            line = array[i];
            j = 0;
            while (j < line.length && isWhiteSpace(line[j])) {
                j += 1;
            }
            if (spaces > j) {
                spaces = j;
            }
        }

        if (typeof specialBase !== 'undefined') {
            // pattern like
            // {
            //   var t = 20;  /*
            //                 * this is comment
            //                 */
            // }
            previousBase = base;
            if (array[1][spaces] === '*') {
                specialBase += ' ';
            }
            base = specialBase;
        } else {
            if (spaces & 1) {
                // /*
                //  *
                //  */
                // If spaces are odd number, above pattern is considered.
                // We waste 1 space.
                spaces -= 1;
            }
            previousBase = base;
        }

        for (i = 1, len = array.length; i < len; i += 1) {
            array[i] = toSourceNode(addIndent(array[i].slice(spaces))).join('');
        }

        base = previousBase;

        return array.join('\n');
    }

    function generateComment(comment, specialBase) {
        if (comment.type === 'Line') {
            if (endsWithLineTerminator(comment.value)) {
                return '//' + comment.value;
            } else {
                // Always use LineTerminator
                return '//' + comment.value + '\n';
            }
        }
        if (extra.format.indent.adjustMultilineComment && /[\n\r]/.test(comment.value)) {
            return adjustMultilineComment('/*' + comment.value + '*/', specialBase);
        }
        return '/*' + comment.value + '*/';
    }

    function addCommentsToStatement(stmt, result) {
        var i, len, comment, save, node, tailingToStatement, specialBase, fragment;

        if (stmt.leadingComments && stmt.leadingComments.length > 0) {
            save = result;

            comment = stmt.leadingComments[0];
            result = [];
            if (safeConcatenation && stmt.type === Syntax.Program && stmt.body.length === 0) {
                result.push('\n');
            }
            result.push(generateComment(comment));
            if (!endsWithLineTerminator(toSourceNode(result).toString())) {
                result.push('\n');
            }

            for (i = 1, len = stmt.leadingComments.length; i < len; i += 1) {
                comment = stmt.leadingComments[i];
                fragment = [generateComment(comment)];
                if (!endsWithLineTerminator(toSourceNode(fragment).toString())) {
                    fragment.push('\n');
                }
                result.push(addIndent(fragment));
            }

            result.push(addIndent(save));
        }

        if (stmt.trailingComments) {
            tailingToStatement = !endsWithLineTerminator(toSourceNode(result).toString());
            specialBase = stringRepeat(' ', calculateSpaces(toSourceNode([base, result, indent]).toString()));
            for (i = 0, len = stmt.trailingComments.length; i < len; i += 1) {
                comment = stmt.trailingComments[i];
                if (tailingToStatement) {
                    // We assume target like following script
                    //
                    // var t = 20;  /**
                    //               * This is comment of t
                    //               */
                    if (i === 0) {
                        // first case
                        result.push(indent);
                    } else {
                        result.push(specialBase);
                    }
                    result.push(generateComment(comment, specialBase));
                } else {
                    result.push(addIndent(generateComment(comment)));
                }
                if (i !== len - 1 && !endsWithLineTerminator(toSourceNode(result).toString())) {
                    result.push('\n');
                }
            }
        }

        return result;
    }

    function parenthesize(text, current, should) {
        if (current < should) {
            return ['(', text, ')'];
        }
        return text;
    }

    function maybeBlock(stmt, semicolonOptional, functionBody) {
        var result, noLeadingComment;

        noLeadingComment = !extra.comment || !stmt.leadingComments;

        if (stmt.type === Syntax.BlockStatement && noLeadingComment) {
            return [space, generateStatement(stmt, { functionBody: functionBody })];
        }

        if (stmt.type === Syntax.EmptyStatement && noLeadingComment) {
            return SEMICOLON;
        }

        withIndent(function () {
            result = [newline, addIndent(generateStatement(stmt, { semicolonOptional: semicolonOptional, functionBody: functionBody }))];
        });

        return result;
    }

    function maybeBlockSuffix(stmt, result) {
        var ends = endsWithLineTerminator(toSourceNode(result).toString());
        if (stmt.type === Syntax.BlockStatement && (!extra.comment || !stmt.leadingComments) && !ends) {
            return [result, space];
        }
        if (ends) {
            return [result, base];
        }
        return [result, newline, base];
    }

    function generateFunctionBody(node) {
        var result, i, len;
        result = ['('];
        for (i = 0, len = node.params.length; i < len; i += 1) {
            result.push(node.params[i].name);
            if (i + 1 < len) {
                result.push(',' + space);
            }
        }
        result.push(')', maybeBlock(node.body, false, true));
        return result;
    }

    function generateExpression(expr, option) {
        var result, precedence, currentPrecedence, i, len, raw, fragment, multiline, leftChar, leftSource, rightChar, rightSource, allowIn, allowCall, allowUnparenthesizedNew;

        precedence = option.precedence;
        allowIn = option.allowIn;
        allowCall = option.allowCall;

        switch (expr.type) {
        case Syntax.SequenceExpression:
            result = [];
            allowIn |= (Precedence.Sequence < precedence);
            for (i = 0, len = expr.expressions.length; i < len; i += 1) {
                result.push(generateExpression(expr.expressions[i], {
                    precedence: Precedence.Assignment,
                    allowIn: allowIn,
                    allowCall: true
                }));
                if (i + 1 < len) {
                    result.push(',' + space);
                }
            }
            result = parenthesize(result, Precedence.Sequence, precedence);
            break;

        case Syntax.AssignmentExpression:
            allowIn |= (Precedence.Assignment < precedence);
            result = parenthesize(
                [
                    generateExpression(expr.left, {
                        precedence: Precedence.Call,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space + expr.operator + space,
                    generateExpression(expr.right, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    })
                ],
                Precedence.Assignment,
                precedence
            );
            break;

        case Syntax.ConditionalExpression:
            allowIn |= (Precedence.Conditional < precedence);
            result = parenthesize(
                [
                    generateExpression(expr.test, {
                        precedence: Precedence.LogicalOR,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space + '?' + space,
                    generateExpression(expr.consequent, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space + ':' + space,
                    generateExpression(expr.alternate, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    })
                ],
                Precedence.Conditional,
                precedence
            );
            break;

        case Syntax.LogicalExpression:
        case Syntax.BinaryExpression:
            currentPrecedence = BinaryPrecedence[expr.operator];

            allowIn |= (currentPrecedence < precedence);

            result = join(
                generateExpression(expr.left, {
                    precedence: currentPrecedence,
                    allowIn: allowIn,
                    allowCall: true
                }),
                expr.operator
            );

            fragment = generateExpression(expr.right, {
                precedence: currentPrecedence + 1,
                allowIn: allowIn,
                allowCall: true
            });

            if (expr.operator === '/' && fragment.toString().charAt(0) === '/') {
                // If '/' concats with '/', it is interpreted as comment start
                result.push(' ', fragment);
            } else {
                result = join(result, fragment);
            }

            if (expr.operator === 'in' && !allowIn) {
                result = ['(', result, ')'];
            } else {
                result = parenthesize(result, currentPrecedence, precedence);
            }

            break;

        case Syntax.CallExpression:
            result = [generateExpression(expr.callee, {
                precedence: Precedence.Call,
                allowIn: true,
                allowCall: true,
                allowUnparenthesizedNew: false
            })];

            result.push('(');
            for (i = 0, len = expr['arguments'].length; i < len; i += 1) {
                result.push(generateExpression(expr['arguments'][i], {
                    precedence: Precedence.Assignment,
                    allowIn: true,
                    allowCall: true
                }));
                if (i + 1 < len) {
                    result.push(',' + space);
                }
            }
            result.push(')');

            if (!allowCall) {
                result = ['(', result, ')'];
            } else {
                result = parenthesize(result, Precedence.Call, precedence);
            }
            break;

        case Syntax.NewExpression:
            len = expr['arguments'].length;
            allowUnparenthesizedNew = option.allowUnparenthesizedNew === undefined || option.allowUnparenthesizedNew;

            result = join(
                'new',
                generateExpression(expr.callee, {
                    precedence: Precedence.New,
                    allowIn: true,
                    allowCall: false,
                    allowUnparenthesizedNew: allowUnparenthesizedNew && !parentheses && len === 0
                })
            );

            if (!allowUnparenthesizedNew || parentheses || len > 0) {
                result.push('(');
                for (i = 0; i < len; i += 1) {
                    result.push(generateExpression(expr['arguments'][i], {
                        precedence: Precedence.Assignment,
                        allowIn: true,
                        allowCall: true
                    }));
                    if (i + 1 < len) {
                        result.push(',' + space);
                    }
                }
                result.push(')');
            }

            result = parenthesize(result, Precedence.New, precedence);
            break;

        case Syntax.MemberExpression:
            result = [generateExpression(expr.object, {
                precedence: Precedence.Call,
                allowIn: true,
                allowCall: allowCall,
                allowUnparenthesizedNew: false
            })];

            if (expr.computed) {
                result.push('[', generateExpression(expr.property, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: allowCall
                }), ']');
            } else {
                if (expr.object.type === Syntax.Literal && typeof expr.object.value === 'number') {
                    if (result.indexOf('.') < 0) {
                        if (!/[eExX]/.test(result) && !(result.length >= 2 && result[0] === '0')) {
                            result.push('.');
                        }
                    }
                }
                result.push('.' + expr.property.name);
            }

            result = parenthesize(result, Precedence.Member, precedence);
            break;

        case Syntax.UnaryExpression:
            fragment = generateExpression(expr.argument, {
                precedence: Precedence.Unary,
                allowIn: true,
                allowCall: true
            });

            if (space === '') {
                result = join(expr.operator, fragment);
            } else {
                result = [expr.operator];
                if (expr.operator.length > 2) {
                    // delete, void, typeof
                    // get `typeof []`, not `typeof[]`
                    result = join(result, fragment);
                } else {
                    // Prevent inserting spaces between operator and argument if it is unnecessary
                    // like, `!cond`
                    leftSource = toSourceNode(result).toString();
                    leftChar = leftSource.charAt(leftSource.length - 1);
                    rightChar = fragment.toString().charAt(0);

                    if (((leftChar === '+' || leftChar === '-') && leftChar === rightChar) || (isIdentifierPart(leftChar) && isIdentifierPart(rightChar))) {
                        result.push(' ', fragment);
                    } else {
                        result.push(fragment);
                    }
                }
            }
            result = parenthesize(result, Precedence.Unary, precedence);
            break;

        case Syntax.UpdateExpression:
            if (expr.prefix) {
                result = parenthesize(
                    [
                        expr.operator,
                        generateExpression(expr.argument, {
                            precedence: Precedence.Unary,
                            allowIn: true,
                            allowCall: true
                        })
                    ],
                    Precedence.Unary,
                    precedence
                );
            } else {
                result = parenthesize(
                    [
                        generateExpression(expr.argument, {
                            precedence: Precedence.Postfix,
                            allowIn: true,
                            allowCall: true
                        }),
                        expr.operator
                    ],
                    Precedence.Postfix,
                    precedence
                );
            }
            break;

        case Syntax.FunctionExpression:
            result = 'function';
            if (expr.id) {
                result += ' ' + expr.id.name;
            } else {
                result += space;
            }
            result = [result, generateFunctionBody(expr)];
            break;

        case Syntax.ArrayExpression:
            if (!expr.elements.length) {
                result = '[]';
                break;
            }
            multiline = expr.elements.length > 1;
            result = ['[', multiline ? newline : ''];
            withIndent(function (indent) {
                for (i = 0, len = expr.elements.length; i < len; i += 1) {
                    if (!expr.elements[i]) {
                        if (multiline) {
                            result.push(indent);
                        }
                        if (i + 1 === len) {
                            result.push(',');
                        }
                    } else {
                        result.push(multiline ? indent : '', generateExpression(expr.elements[i], {
                            precedence: Precedence.Assignment,
                            allowIn: true,
                            allowCall: true
                        }));
                    }
                    if (i + 1 < len) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });
            if (multiline && !endsWithLineTerminator(toSourceNode(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '', ']');
            break;

        case Syntax.Property:
            if (expr.kind === 'get' || expr.kind === 'set') {
                result = [
                    expr.kind + ' ',
                    generateExpression(expr.key, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    generateFunctionBody(expr.value)
                ];
            } else {
                result = [
                    generateExpression(expr.key, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ':' + space,
                    generateExpression(expr.value, {
                        precedence: Precedence.Assignment,
                        allowIn: true,
                        allowCall: true
                    })
                ];
            }
            break;

        case Syntax.ObjectExpression:
            if (!expr.properties.length) {
                result = '{}';
                break;
            }
            multiline = expr.properties.length > 1;
            result = ['{', multiline ? newline : ''];

            withIndent(function (indent) {
                for (i = 0, len = expr.properties.length; i < len; i += 1) {
                    result.push(multiline ? indent : '', generateExpression(expr.properties[i], {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }));
                    if (i + 1 < len) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });

            if (multiline && !endsWithLineTerminator(toSourceNode(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '', '}');
            break;

        case Syntax.ThisExpression:
            result = 'this';
            break;

        case Syntax.Identifier:
            result = expr.name;
            break;

        case Syntax.Literal:
            if (expr.hasOwnProperty('raw') && parse) {
                try {
                    raw = parse(expr.raw).body[0].expression;
                    if (raw.type === Syntax.Literal) {
                        if (raw.value === expr.value) {
                            result = expr.raw;
                            break;
                        }
                    }
                } catch (e) {
                    // not use raw property
                }
            }

            if (expr.value === null) {
                result = 'null';
                break;
            }

            if (typeof expr.value === 'string') {
                result = escapeString(expr.value);
                break;
            }

            if (typeof expr.value === 'number') {
                result = generateNumber(expr.value);
                break;
            }
            
            result = expr.value.toString();
            break;

        default:
            throw new Error('Unknown expression type: ' + expr.type);
        }

        return toSourceNode(result, expr);
    }

    function generateStatement(stmt, option) {
        var i, len, result, node, allowIn, functionBody, directiveContext, fragment, semicolon;

        allowIn = true;
        semicolon = SEMICOLON;
        functionBody = false;
        directiveContext = false;
        if (option) {
            allowIn = option.allowIn === undefined || option.allowIn;
            if (!semicolons && option.semicolonOptional === true) {
                semicolon = '';
            }
            functionBody = option.functionBody;
            directiveContext = option.directiveContext;
        }

        switch (stmt.type) {
        case Syntax.BlockStatement:
            result = ['{', newline];

            withIndent(function () {
                for (i = 0, len = stmt.body.length; i < len; i += 1) {
                    fragment = addIndent(generateStatement(stmt.body[i], {
                        semicolonOptional: i === len - 1,
                        directiveContext: functionBody
                    }));
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNode(fragment).toString())) {
                        result.push(newline);
                    }
                }
            });

            result.push(addIndent('}'));
            break;

        case Syntax.BreakStatement:
            if (stmt.label) {
                result = 'break ' + stmt.label.name + semicolon;
            } else {
                result = 'break' + semicolon;
            }
            break;

        case Syntax.ContinueStatement:
            if (stmt.label) {
                result = 'continue ' + stmt.label.name + semicolon;
            } else {
                result = 'continue' + semicolon;
            }
            break;

        case Syntax.DirectiveStatement:
            if (stmt.raw) {
                result = stmt.raw + semicolon;
            } else {
                result = escapeDirective(stmt.directive) + semicolon;
            }
            break;

        case Syntax.DoWhileStatement:
            // Because `do 42 while (cond)` is Syntax Error. We need semicolon.
            result = join('do', maybeBlock(stmt.body));
            result = maybeBlockSuffix(stmt.body, result);
            result = join(result, [
                'while' + space + '(',
                generateExpression(stmt.test, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                }),
                ')' + semicolon
            ]);
            break;

        case Syntax.CatchClause:
            withIndent(function () {
                result = [
                    'catch' + space + '(',
                    generateExpression(stmt.param, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            result.push(maybeBlock(stmt.body));
            break;

        case Syntax.DebuggerStatement:
            result = 'debugger' + semicolon;
            break;

        case Syntax.EmptyStatement:
            //result = SEMICOLON;
            break;

        case Syntax.ExpressionStatement:
            result = [generateExpression(stmt.expression, {
                precedence: Precedence.Sequence,
                allowIn: true,
                allowCall: true
            })];
            // 12.4 '{', 'function' is not allowed in this position.
            // wrap expression with parentheses
            if (result.toString().charAt(0) === '{' || (result.toString().slice(0, 8) === 'function' && " (".indexOf(result.toString().charAt(8)) >= 0) || (directive && directiveContext && stmt.expression.type === Syntax.Literal && typeof stmt.expression.value === 'string')) {
                result = ['(', result, ')' + semicolon];
            } else {
                result.push(semicolon);
            }
            break;

        case Syntax.VariableDeclarator:
            if (stmt.init) {
                result = [
                    stmt.id.name + space + '=' + space,
                    generateExpression(stmt.init, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    })
                ];
            } else {
                result = stmt.id.name;
            }
            break;

        case Syntax.VariableDeclaration:
            result = [stmt.kind];
            // special path for
            // var x = function () {
            // };
            if (stmt.declarations.length === 1 && stmt.declarations[0].init &&
                    stmt.declarations[0].init.type === Syntax.FunctionExpression) {
                result.push(' ', generateStatement(stmt.declarations[0], {
                    allowIn: allowIn
                }));
            } else {
                // VariableDeclarator is typed as Statement,
                // but joined with comma (not LineTerminator).
                // So if comment is attached to target node, we should specialize.
                withIndent(function () {
                    node = stmt.declarations[0];
                    if (extra.comment && node.leadingComments) {
                        result.push('\n', addIndent(generateStatement(node, {
                            allowIn: allowIn
                        })));
                    } else {
                        result.push(' ', generateStatement(node, {
                            allowIn: allowIn
                        }));
                    }

                    for (i = 1, len = stmt.declarations.length; i < len; i += 1) {
                        node = stmt.declarations[i];
                        if (extra.comment && node.leadingComments) {
                            result.push(',' + newline, addIndent(generateStatement(node, {
                                allowIn: allowIn
                            })));
                        } else {
                            result.push(',' + space, generateStatement(node, {
                                allowIn: allowIn
                            }));
                        }
                    }
                });
            }
            result.push(semicolon);
            break;

        case Syntax.ThrowStatement:
            result = [join(
                'throw',
                generateExpression(stmt.argument, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                })
            ), semicolon];
            break;

        case Syntax.TryStatement:
            result = ['try', maybeBlock(stmt.block)];
            result = maybeBlockSuffix(stmt.block, result);
            for (i = 0, len = stmt.handlers.length; i < len; i += 1) {
                result = join(result, generateStatement(stmt.handlers[i]));
                if (stmt.finalizer || i + 1 !== len) {
                    result = maybeBlockSuffix(stmt.handlers[i].body, result);
                }
            }
            if (stmt.finalizer) {
                result = join(result, ['finally', maybeBlock(stmt.finalizer)]);
            }
            break;

        case Syntax.SwitchStatement:
            withIndent(function () {
                result = [
                    'switch' + space + '(',
                    generateExpression(stmt.discriminant, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')' + space + '{' + newline
                ];
            });
            if (stmt.cases) {
                for (i = 0, len = stmt.cases.length; i < len; i += 1) {
                    fragment = addIndent(generateStatement(stmt.cases[i], {semicolonOptional: i === len - 1}));
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNode(fragment).toString())) {
                        result.push(newline);
                    }
                }
            }
            result.push(addIndent('}'));
            break;

        case Syntax.SwitchCase:
            withIndent(function () {
                if (stmt.test) {
                    result = [
                        join('case', generateExpression(stmt.test, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true
                        })),
                        ':'
                    ];
                } else {
                    result = ['default:'];
                }

                i = 0;
                len = stmt.consequent.length;
                if (len && stmt.consequent[0].type === Syntax.BlockStatement) {
                    fragment = maybeBlock(stmt.consequent[0]);
                    result.push(fragment);
                    i = 1;
                }

                if (i !== len && !endsWithLineTerminator(toSourceNode(result).toString())) {
                    result.push(newline);
                }

                for (; i < len; i += 1) {
                    fragment = addIndent(generateStatement(stmt.consequent[i], {semicolonOptional: i === len - 1 && semicolon === ''}));
                    result.push(fragment);
                    if (i + 1 !== len && !endsWithLineTerminator(toSourceNode(fragment).toString())) {
                        result.push(newline);
                    }
                }
            });
            break;

        case Syntax.IfStatement:
            withIndent(function () {
                result = [
                    'if' + space + '(',
                    generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            if (stmt.alternate) {
                result.push(maybeBlock(stmt.consequent));
                result = maybeBlockSuffix(stmt.consequent, result);
                if (stmt.alternate.type === Syntax.IfStatement) {
                    result = join(result, ['else ', generateStatement(stmt.alternate, {semicolonOptional: semicolon === ''})]);
                } else {
                    result = join(result, join('else', maybeBlock(stmt.alternate, semicolon === '')));
                }
            } else {
                result.push(maybeBlock(stmt.consequent, semicolon === ''));
            }
            break;

        case Syntax.ForStatement:
            withIndent(function () {
                result = ['for' + space + '('];
                if (stmt.init) {
                    if (stmt.init.type === Syntax.VariableDeclaration) {
                        result.push(generateStatement(stmt.init, {allowIn: false}));
                    } else {
                        result.push(generateExpression(stmt.init, {
                            precedence: Precedence.Sequence,
                            allowIn: false,
                            allowCall: true
                        }), SEMICOLON);
                    }
                } else {
                    result.push(SEMICOLON);
                }

                if (stmt.test) {
                    result.push(space, generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }), SEMICOLON);
                } else {
                    result.push(SEMICOLON);
                }

                if (stmt.update) {
                    result.push(space, generateExpression(stmt.update, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }), ')');
                } else {
                    result.push(')');
                }
            });

            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;

        case Syntax.ForInStatement:
            result = ['for' + space + '('];
            withIndent(function () {
                if (stmt.left.type === Syntax.VariableDeclaration) {
                    withIndent(function () {
                        result.push(stmt.left.kind + ' ', generateStatement(stmt.left.declarations[0], {
                            allowIn: false
                        }));
                    });
                } else {
                    result.push(generateExpression(stmt.left, {
                        precedence: Precedence.Call,
                        allowIn: true,
                        allowCall: true
                    }));
                }

                result = join(result, 'in');
                result = [join(
                    result,
                    generateExpression(stmt.right, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    })
                ), ')'];
            });
            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;

        case Syntax.LabeledStatement:
            result = [stmt.label.name + ':', maybeBlock(stmt.body, semicolon === '')];
            break;

        case Syntax.Program:
            len = stmt.body.length;
            result = [safeConcatenation && len > 0 ? '\n' : ''];
            for (i = 0; i < len; i += 1) {
                fragment = addIndent(
                    generateStatement(stmt.body[i], {
                        semicolonOptional: !safeConcatenation && i === len - 1,
                        directiveContext: true
                    })
                );
                result.push(fragment);
                if (i + 1 < len && !endsWithLineTerminator(toSourceNode(fragment).toString())) {
                    result.push(newline);
                }
            }
            break;

        case Syntax.FunctionDeclaration:
            result = ['function ' + stmt.id.name, generateFunctionBody(stmt)];
            break;

        case Syntax.ReturnStatement:
            if (stmt.argument) {
                result = [join(
                    'return',
                    generateExpression(stmt.argument, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    })
                ), semicolon];
            } else {
                result = ['return' + semicolon];
            }
            break;

        case Syntax.WhileStatement:
            withIndent(function () {
                result = [
                    'while' + space + '(',
                    generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;

        case Syntax.WithStatement:
            withIndent(function () {
                result = [
                    'with' + space + '(',
                    generateExpression(stmt.object, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;
        
        case Syntax.Block:
            result = ["/*" + stmt.value + "*/"];
            break;
        
        case Syntax.Line:
            result = ["//" + stmt.value];
            break;
        
        default:
            throw new Error('Unknown statement type: ' + stmt.type);
        }

        // Attach comments

        if (extra.comment) {
            result = addCommentsToStatement(stmt, result);
        }

        fragment = toSourceNode(result).toString();
        if (stmt.type === Syntax.Program && !safeConcatenation && newline === '' &&  fragment.charAt(fragment.length - 1) === '\n') {
            result = toSourceNode(result).replaceRight(/\s+$/, '');
        }

        return toSourceNode(result, stmt);
    }

    function generate(node, options) {
        var defaultOptions = getDefaultOptions(), result, pair;

        if (options != null) {
            // Obsolete options
            //
            //   `options.indent`
            //   `options.base`
            //
            // Instead of them, we can use `option.format.indent`.
            if (typeof options.indent === 'string') {
                defaultOptions.format.indent.style = options.indent;
            }
            if (typeof options.base === 'number') {
                defaultOptions.format.indent.base = options.base;
            }
            options = updateDeeply(defaultOptions, options);
            indent = options.format.indent.style;
            if (typeof options.base === 'string') {
                base = options.base;
            } else {
                base = stringRepeat(indent, options.format.indent.base);
            }
        } else {
            options = defaultOptions;
            indent = options.format.indent.style;
            base = stringRepeat(indent, options.format.indent.base);
        }
        json = options.format.json;
        renumber = options.format.renumber;
        hexadecimal = json ? false : options.format.hexadecimal;
        quotes = json ? 'double' : options.format.quotes;
        escapeless = options.format.escapeless;
        if (options.format.compact) {
            newline = space = indent = base = '';
        } else {
            newline = '\n';
            space = ' ';
        }
        parentheses = options.format.parentheses;
        semicolons = options.format.semicolons;
        safeConcatenation = options.format.safeConcatenation;
        directive = options.directive;
        parse = json ? null : options.parse;
        sourceMap = options.sourceMap;
        extra = options;

        if (sourceMap) {
            if (typeof process !== 'undefined') {
                // We assume environment is node.js
                SourceNode = require('source-map').SourceNode;
            } else {
                SourceNode = global.sourceMap.SourceNode;
            }
        } else {
            SourceNode = SourceNodeMock;
        }

        switch (node.type) {
        case Syntax.BlockStatement:
        case Syntax.BreakStatement:
        case Syntax.CatchClause:
        case Syntax.ContinueStatement:
        case Syntax.DirectiveStatement:
        case Syntax.DoWhileStatement:
        case Syntax.DebuggerStatement:
        case Syntax.EmptyStatement:
        case Syntax.ExpressionStatement:
        case Syntax.ForStatement:
        case Syntax.ForInStatement:
        case Syntax.FunctionDeclaration:
        case Syntax.IfStatement:
        case Syntax.LabeledStatement:
        case Syntax.Program:
        case Syntax.ReturnStatement:
        case Syntax.SwitchStatement:
        case Syntax.SwitchCase:
        case Syntax.ThrowStatement:
        case Syntax.TryStatement:
        case Syntax.VariableDeclaration:
        case Syntax.VariableDeclarator:
        case Syntax.WhileStatement:
        case Syntax.WithStatement:
            result = generateStatement(node);
            break;

        case Syntax.AssignmentExpression:
        case Syntax.ArrayExpression:
        case Syntax.BinaryExpression:
        case Syntax.CallExpression:
        case Syntax.ConditionalExpression:
        case Syntax.FunctionExpression:
        case Syntax.Identifier:
        case Syntax.Literal:
        case Syntax.LogicalExpression:
        case Syntax.MemberExpression:
        case Syntax.NewExpression:
        case Syntax.ObjectExpression:
        case Syntax.Property:
        case Syntax.SequenceExpression:
        case Syntax.ThisExpression:
        case Syntax.UnaryExpression:
        case Syntax.UpdateExpression:
            result = generateExpression(node, {
                precedence: Precedence.Sequence,
                allowIn: true,
                allowCall: true
            });
            break;

        default:
            throw new Error('Unknown node type: ' + node.type);
        }

        if (!sourceMap) {
            return result.toString();
        }

        pair = result.toStringWithSourceMap({file: options.sourceMap});

        if (options.sourceMapWithCode) {
            return pair;
        }
        return pair.map.toString();
    }

    // simple visitor implementation

    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        ArrayExpression: ['elements'],
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        DebuggerStatement: [],
        EmptyStatement: [],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handlers', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body']
    };

    VisitorOption = {
        Break: 1,
        Skip: 2
    };

    function traverse(top, visitor) {
        var worklist, leavelist, node, ret, current, current2, candidates, candidate, marker = {};

        worklist = [ top ];
        leavelist = [ null ];

        while (worklist.length) {
            node = worklist.pop();

            if (node === marker) {
                node = leavelist.pop();
                if (visitor.leave) {
                    ret = visitor.leave(node, leavelist[leavelist.length - 1]);
                } else {
                    ret = undefined;
                }
                if (ret === VisitorOption.Break) {
                    return;
                }
            } else if (node) {
                if (visitor.enter) {
                    ret = visitor.enter(node, leavelist[leavelist.length - 1]);
                } else {
                    ret = undefined;
                }

                if (ret === VisitorOption.Break) {
                    return;
                }

                worklist.push(marker);
                leavelist.push(node);

                if (ret !== VisitorOption.Skip) {
                    candidates = VisitorKeys[node.type];
                    current = candidates.length;
                    while ((current -= 1) >= 0) {
                        candidate = node[candidates[current]];
                        if (candidate) {
                            if (isArray(candidate)) {
                                current2 = candidate.length;
                                while ((current2 -= 1) >= 0) {
                                    if (candidate[current2]) {
                                        worklist.push(candidate[current2]);
                                    }
                                }
                            } else {
                                worklist.push(candidate);
                            }
                        }
                    }
                }
            }
        }
    }

    // based on LLVM libc++ upper_bound / lower_bound
    // MIT License

    function upperBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                len = diff;
            } else {
                i = current + 1;
                len -= diff + 1;
            }
        }
        return i;
    }

    function lowerBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                i = current + 1;
                len -= diff + 1;
            } else {
                len = diff;
            }
        }
        return i;
    }

    function extendCommentRange(comment, tokens) {
        var target, token;

        target = upperBound(tokens, function search(token) {
            return token.range[0] > comment.range[0];
        });

        comment.extendedRange = [comment.range[0], comment.range[1]];

        if (target !== tokens.length) {
            comment.extendedRange[1] = tokens[target].range[0];
        }

        target -= 1;
        if (target >= 0) {
            if (target < tokens.length) {
                comment.extendedRange[0] = tokens[target].range[1];
            } else if (token.length) {
                comment.extendedRange[1] = tokens[tokens.length - 1].range[0];
            }
        }

        return comment;
    }

    function attachComments(tree, providedComments, tokens) {
        // At first, we should calculate extended comment ranges.
        var comments = [], comment, len, i;

        if (!tree.range) {
            throw new Error('attachComments needs range information');
        }

        // tokens array is empty, we attach comments to tree as 'leadingComments'
        if (!tokens.length) {
            if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                }
                tree.leadingComments = comments;
            }
            return tree;
        }

        for (i = 0, len = providedComments.length; i < len; i += 1) {
            comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
        }

        // This is based on John Freeman's implementation.
        traverse(tree, {
            cursor: 0,
            enter: function (node) {
                var comment;

                while (this.cursor < comments.length) {
                    comment = comments[this.cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                        break;
                    }

                    if (comment.extendedRange[1] === node.range[0]) {
                        if (!node.leadingComments) {
                            node.leadingComments = [];
                        }
                        node.leadingComments.push(comment);
                        comments.splice(this.cursor, 1);
                    } else {
                        this.cursor += 1;
                    }
                }

                // already out of owned node
                if (this.cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[this.cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        traverse(tree, {
            cursor: 0,
            leave: function (node) {
                var comment;

                while (this.cursor < comments.length) {
                    comment = comments[this.cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                        break;
                    }

                    if (node.range[1] === comment.extendedRange[0]) {
                        if (!node.trailingComments) {
                            node.trailingComments = [];
                        }
                        node.trailingComments.push(comment);
                        comments.splice(this.cursor, 1);
                    } else {
                        this.cursor += 1;
                    }
                }

                // already out of owned node
                if (this.cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[this.cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        return tree;
    }
    
    exports.escodegen = {};
    exports.escodegen.version = '0.0.13-dev';
    exports.generate = generate;
    exports.traverse = traverse;
    exports.attachComments = attachComments;
    exports.Syntax = Syntax;
    
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */

// src/format.js
if (String.prototype.format == undefined) {
    String.prototype.format = function(args) {
        /*
            '[{time}] {message}'.format({
                'time': '2013-01-01 00:00:00',
                'message': 'my message'
            })
        */
        if (typeof args == "object") {
            return this.replace(/\{(\w+)\}/g, function(m, k) {
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
// src/lexer.js
var Lexer = function(source) {
    this.name = 'Lexer';
    this.line = 1;
    this.source = source || '';
    this.p = 0;
    this.column = 1;
    this.indent = 0;
    this.indent_size = 4;
    this.c = this.source[this.p];
}

Lexer.prototype.assert = function(message) {
    throw new Error("{0} {1}".format([
        new Location(this.line, this.column).toString(),
        message
    ]));
}

Lexer.prototype.consume = function() {
    if (this.c == '\n' || this.c == '\r') {
        this.column = 1;
    } else {
        this.column++;
    }
    this.p++;
    if (this.p < this.source.length) {
        this.c = this.source[this.p];
    } else {
        this.c = Token.EOF;
    }
}

/*
    LL(k)
*/
Lexer.prototype.lookahead = function(k) {
    var kk = this.p + k;
    if (kk < this.source.length) return this.source[kk];
    return Token.EOF;
}

/*
    7.2 White Space

    WhiteSpace ::
        <TAB>
        <VT>
        <FF>
        <SP>
        <NBSP>
        <USP>
*/
Lexer.prototype.matchWhiteSpace = function(c) {
    return c.match(/^\s$/) && !this.matchLineTerminator(c);
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.matchLineTerminator = function(c) {
    return c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029';
}

/*
    7.8.3 Numeric Literals
    
    DecimalDigit :: one of
        0 1 2 3 4 5 6 7 8 9
*/
Lexer.prototype.matchDigit = function(c) {
    return c >= "0" && c <= "9";
}

/*
    7.8.4 String Literals
    
    one of [a-ZA-Z_$]
*/
Lexer.prototype.matchLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "$";
}

/*
    break a stream of tokens
*/
Lexer.prototype.tokenize = function() {
    
    this.line = 1;
    var tokens = [];
    
    if (token = this.scanIndent()) {
        tokens.push(token);
    }
    
    while (this.p < this.source.length) {
        
        var token;
        
        if (token = this.scanComment()) {
            tokens.push(token);
            continue;
        }
        
        if (this.matchLineTerminator(this.c)) {
            if (token = this.scanLineTerminator()) tokens.push(token);
            if (token = this.scanIndent()) tokens.push(token);
            this.line++;
            continue;
        }
        
        // ignore white spaces
        if (this.matchWhiteSpace(this.c)) {
            this.consume();
            continue;
        }
        
        // ignore semicolon
        if (this.c == ';') {
            this.consume();
            continue;
        }
        
        if (token = this.scanReservedWord()) {
            tokens.push(token);
            continue;
        }
        
        if (this.matchLetter(this.c) && (token = this.scanIdent())) {
            tokens.push(token);
            continue;
        }
        
        if (this.matchDigit(this.c)) {
            if (this.lookahead(1) !== Token.EOF
             && this.matchLetter(this.lookahead(1))) {
                 this.assert(Message.IllegalIdent);
            }
            if (token = this.scanDigit()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.c === "'" || this.c == '"') {
            if (token = this.scanString(this.c)) {
                tokens.push(token);
                continue;
            }
        }
        
        if (token = this.scanPunctuator()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanRegularExpression()) {
            tokens.push(token);
            continue;
        }
        
        this.assert(Message.UnknownToken);
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line, this.column)));
    
    return tokens;
}

/*
    calculate indent size
*/
Lexer.prototype.scanIndent = function() {
    
    this.indent = 0;
    
    while (this.p < this.source.length) {
        if (this.c == ' ') this.indent++;
        else if (this.c == '\t') this.indent += this.indent_size;
        else break;
        this.consume();
    }
    
    return new Token(Token.INDENT, this.indent, new Location(this.line, this.column));
}

/*
    7.3 Line Terminators
    
    LineTerminator ::
        <LF>
        <CR>
        <LS>
        <PS>
*/
Lexer.prototype.scanLineTerminator = function() {
    
    var c = this.c;
    this.consume();
    
    if ((c + this.lookahead(1)) == '\r\n') {
        c += this.lookahead(1);
        this.consume();
    }
    
    // If column is zero, set indent size as column.
    return new Token(Token.NEWLINE, c, new Location(this.line, this.column || (this.indent + 1)));
}

/*
    7.4 Comments
    
    Comment ::
        MultiLineComment
        SingleLineComment
*/
Lexer.prototype.scanComment = function() {
    
    var sign = this.c;
    if (sign === '#') {
        this.consume();
        var comment = '';
        while (!(this.c === Token.EOF || this.matchLineTerminator(this.c))) {
            comment += this.c;
            this.consume();
        }
        var token = new Token(Token.COMMENT, comment, new Location(this.line, this.column));
        token.multiple = false;
        return token
    }
    
    var sign = this.c + this.lookahead(1);
    if (sign == '/*') {
        this.consume();
        this.consume();
        var comment = '';
        while (this.c + this.lookahead(1) != '*/') {
            if (this.c === Token.EOF) this.assert(Message.IllegalComment);
            comment += this.c;
            this.consume();
        }
        this.consume();
        this.consume();
        var token = new Token(Token.COMMENT, comment, new Location(this.line, this.column));
        token.multiple = true;
        return token
    }
}

/*
    7.5.1 Reserved Words
    
    ReservedWord ::
        Keyword
        FutureReservedWord
        NullLiteral
        BooleanLiteral
*/
Lexer.prototype.scanReservedWord = function() {
    
    var token = this.scanKeyword();
    if (token) {
        return token;
    }
    
    var token = this.scanFutureReservedWord();
    if (token) {
        return token;
    }
    
    var reserved = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (reserved === 'None') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.KEYWORDS.NONE, reserved, new Location(this.line, this.column));
    }
    
    var reserved = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (reserved === 'true') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, reserved, new Location(this.line, this.column));
    }
    
    var reserved = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3) + this.lookahead(4);
    if (reserved === 'false') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.BOOLEAN, reserved, new Location(this.line, this.column));
    }
}

/*
    7.5.2 Keywords
    
    Keyword :: one of
        and
        break
        catch
        class
        continue
        delete
        def
        else
        finally
        for
        if
        in
        is
        new
        not
        or
        return
        this
        try
        raise
        void
        while
        xor
*/
Lexer.prototype.scanKeyword = function() {
    
    var keyword = '';
    var p = this.p;
    var c = this.source[this.p];
    
    while (this.c !== Token.EOF) {
        if (this.matchLetter(c) || this.matchDigit(c)) {
            keyword += c;
            c = this.source[++p];
            continue;
        }
        break;
    }
    
    if (Token.KEYWORDS[keyword.toUpperCase()]) {
        var text = Token.KEYWORDS[keyword.toUpperCase()];
        var i = 0;
        while (i < text.length) {
            this.consume();
            i++;
        }
        return new Token(text, keyword, new Location(this.line, this.column));
    }
}

/*
    7.5.3 Future Reserved Words
    
    FutureReservedWord :: one of
*/
Lexer.prototype.scanFutureReservedWord = function() {
    
}

/*
    7.6 Identifier
*/
Lexer.prototype.scanIdent = function() {
    
    var ident = '';
    
    while (this.c !== Token.EOF) {
        if (this.matchLetter(this.c) || this.matchDigit(this.c)) {
            ident += this.c;
            this.consume();
            continue;
        }
        break;
    }
    /*
    if (ident.substring(0, 2) === '__') {
        this.assert(Message.IllegalReservedIdent);
    }
    */
    return new Token(Token.IDENTIFIER, ident, new Location(this.line, this.column));
}

/*
    7.7 Punctuators
    
    Punctuator :: one of
        { } ( ) [ ] . ; , < > <= >= == != === !== 
        + - * % ++ -- << >> >>> & | ^ ! ~ && || ? 
        : = += -= *= %= <<= >>= >>>= &= |= ^=
    
*/
Lexer.prototype.scanPunctuator = function() {
    
    // 1character punctuator
    
    if (this.c === ':') {
        var c = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, c, new Location(this.line, this.column));
    }
    
    if (this.c === '{' || this.c === '}' || this.c === '(' ||
        this.c === ')' || this.c === '[' || this.c === ']' ||
        this.c === ',' || this.c === '.') {
        var c = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, c, new Location(this.line, this.column));
    }
    
    var token = this.scanAssign();
    if (token) {
        return token;
    }
    
    var token = this.scanOperator();
    if (token) {
        return token;
    }
}

Lexer.prototype.scanOperator = function() {
    
    // 3character operator
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '>>>' || op === '<<<') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 2character operator
    var op = this.c + this.lookahead(1);
    if (op === '++' || op === '--' || op === '>>' ||
        op === '<<' || op === '&&' || op === '||') {
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 1character operator
    var op = this.c;
    if (op === '+' || op === '-' || op === '*' ||
        op === '/' || op === '%' || op === '<' ||
        op === '>' || op === '&' || op === '!' ||
        op === '|' || op === '^' || op === '~' ||
        op === '?') {
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
}

/*
    11.13 Assignment Operators
    
    AssignmentOperator : one of
        = *= /= %= += -= <<= >>= >>>= &= ^= |=
*/
Lexer.prototype.scanAssign = function() {
    
    // 4character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (op === '>>>=') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 3character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 2character assignment
    var op = this.c + this.lookahead(1);
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=' || op === '<=' ||
        op === '>=' || op === '==' || op === '!=') {
        this.consume();
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
    
    // 1character assignment
    var op = this.c;
    if (op === '=') {
        this.consume();
        return new Token(Token.PUNCTUATOR, op, new Location(this.line, this.column));
    }
}

/*
    7.8.3 Numeric Literals
    
    NumericLiteral ::
        DecimalLiteral
        HexIntegerLiteral
*/
Lexer.prototype.scanDigit = function() {
    
    var digit = '';
    
    while (this.c !== Token.EOF) {
        if (this.matchDigit(this.c) || this.c === '.') {
            digit += this.c;
            this.consume();
        } else {
            break;
        }
    }
    
    if (digit.match(/\./)) {
        digit = parseFloat(digit, 10);
    } else {
        digit = parseInt(digit, 10);
    }
    
    return new Token(Token.DIGIT, digit, new Location(this.line, this.column));
}

/*
    7.8.4 String Literals
    
    StringLiteral ::
        " DoubleStringCharactersopt "
        ' SingleStringCharactersopt '
*/
Lexer.prototype.scanString = function(delimiter) {
    
    var ss = '', token;
    var location = new Location(this.line, this.column);
    this.consume();
    
    while (1) {
        if (this.c === Token.EOF || this.matchLineTerminator(this.c)) {
            this.assert(Message.UnexpectedString);
        }
        if (this.c === delimiter) {
            this.consume();
            break;
        }
        ss += this.c;
        this.consume();
    }
    
    token = new Token(Token.STRING, ss, new Location(this.line, this.column));
    token.delimiter = delimiter;
    return token;
}

/*
    7.8.5 Regular Expression Literals
*/
Lexer.prototype.scanRegularExpression = function() {
    
}
// src/location.js
var Location = function(line, column) {
    this.name = 'Location';
    this.line = line;
    this.column = column;
}

Location.prototype.toString = function() {
    var data = {
        'line': this.line, 
        'column': this.column
    }
    return "Line {line} Column {column}".format(data);
};
// src/log.js
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
// src/message.js
var Message = {
    UnknownToken:'Unknown token',
    UnexpectedToken:'Unexpected token',
    UnexpectedString:'Unexpected string',
    IllegalReservedIdent:'Variables starting with __ are reserved',
    IllegalIdent:'Identifier can not start with numeric',
    IllegalIdentInitialize: 'Identifier has to be initialized',
    IllegalComment:'Illegal comment',
    IllegalBlock:'Block statement must have one statement at least',
    IllegalFor:'Illegal for statement',
    IllegalWhile:'Illegal while statement',
    IllegalIf:'Illegal if statement',
    IllegalContinue:'Continue statement can not have label',
    IllegalContinuePosition:'Continue statement have to be declared in iteration',
    IllegalBreak:'Break statement can not have label',
    IllegalBreakPosition:'Break statement have to be declared in iteration',
    IllegalReturn:'Return statement has to be contained in function',
    IllegalReturnArgument:'Return argument has to be one',
    IllegalRaise:'Illegal raise statement',
    IllegalRaiseArgument: 'Raise argument has to be one',
    IllegalExcept:'Illegal except statement',
    IllegalFinally:'Illegal finally statement',
    IllegalConditionalExpression:'Illegal conditional expression',
    IllegalIndentSize:'Indent size may be incorrect',
    IllegalArgumentList:'Arguments maybe includes newline',
    IllegalPostfixIncrement:'Postfix increment operator is only for variable',
    IllegalPostfixDecrement:'Postfix decrement operator is only for variable',
    IllegalPrefixIncrement:'Prefix increment operator is only for variable',
    IllegalPrefixDecrement:'Prefix decrement operator is only for variable',
    IllegalMultiplicativeExpression:'Illegal multiplicative expression',
    IllegalShiftExpression:'Illegal shift expression',
    IllegalRelationalExpression:'Illegal relational expression',
    IllegalIsinstance:'arguments of isinstance build-in function has to be two',
    IllegalTypeof:'argument of type build-in function has to be one'
};
// src/parser.js
var Parser = function(tokens) {
    this.name = 'Parser';
    this.p = 0;
    this.token = tokens[0];
    this.tokens = tokens;
    this.indent = 0;
    this.indent_size = 4; // default of indent size for parsing
    this.ecstack = new EcStack();
    this.state = new State();
}

Parser.prototype.consume = function(k) {
    k = k || 1;
    while (k > 0) {
        this.p++;
        if (this.p < this.tokens.length) this.token = this.tokens[this.p];
        else this.token = new Token(Token.EOF, '', this.tokens[this.tokens.length - 1].location);
        k--;
    }
}

/*
    confirm whether argument matches value of token
*/
Parser.prototype.match = function(text) {
    return (this.token.text === text);
}

/*
    confirm whether argument matches kind of token
*/
Parser.prototype.matchKind = function(kind) {
    return (this.token.kind === kind);
}

/*
    throw error when argument does not match value of token
*/
Parser.prototype.expect = function(value) {
    if (this.token.text === value) {
        this.consume();
        return;
    }
    throw new Error("{0} {1} {2} expecting {3}".format([
        this.token.location.toString(), 
        Message.UnexpectedToken,
        this.token.text,
        value
    ]));
}

Parser.prototype.assert = function(message) {
    throw new Error("{0} {1}".format([
        this.token.location.toString(),
        message
    ]));
}

/*
    throw error when argument does not match kind of token
*/
Parser.prototype.expectKind = function(value) {
    if (this.token.kind === value) {
        this.consume();
        return;
    }
    throw new Error("{0} {1} {2} expecting {3}".format([
        this.token.location.toString(), 
        Message.UnexpectedToken,
        this.token.kind,
        value
    ]));
}

/*
    LL(k)
*/
Parser.prototype.lookahead = function(k) {
    var len = this.tokens.length;
    var kk = this.p + k;
    if (kk < len) return this.tokens[kk];
    return new Token(Token.EOF, '', this.tokens[len - 1].location);
}

Parser.prototype.lookback = function(k) {
    var kk = this.p - k;
    if (kk >= 0) return this.tokens[kk];
    return this.tokens[0];
}

/*
    14 Program
    
    Program:
        SourceElements
*/
Parser.prototype.parseProgram = function() {
    this.p = 0;
    this.expect(this.indent = 0);
    // update indent size for parsing
    for (var i = 1; i < this.tokens.length; i++) {
        if (this.lookahead(i).kind === Token.INDENT 
         && this.lookahead(i).text > 0) {
            this.indent_size = this.lookahead(i).text;
            break;
        }
    }
    return {
        type: Syntax.Program,
        body: this.parseSourceElements()
    };
}

/*
    14 Program
    
     SourceElements:
        SourceElement
        SourceElements SourceElement
*/
Parser.prototype.parseSourceElements = function() {
    var nodes = [];
    while (1) {
        /*
            The expected order is <EXPR><EOF>
            
            if a:
                a = 1<EOF>
        */
        if (this.matchKind(Token.EOF)) break;
        if (this.match('class')) {
            node = this.parseClassDeclaration();
            nodes = nodes.concat(node);
        } else if (node = this.parseSourceElement()) {
            if (node.type === Syntax.PassStatement) {
                node.type = Syntax.EmptyStatement;
            }
            nodes.push(node);
        }
        
        if (this.token.kind === Token.INDENT) {
            if (this.state.current.indexOf(State.InFunction) !== -1) {
                break;
            }
            this.expect(0);
        }
    }
    return nodes;
}

/*
    14 Program
    
    SourceElement:
        Statement
        ClassDeclaration
        FunctionDeclaration
*/
Parser.prototype.parseSourceElement = function() {
    /*
        The expected order is <NEWLINE>|<INDENT>|<EOF>
        
        if a:
            a = 1
        <EOF>
    */
    if (this.matchKind(Token.EOF)) return;
    
    var expr;
    switch (this.token.text) {
    case 'def': expr = this.parseFunctionDeclaration(); break;
    default: expr = this.parseStatement(); break;
    }
    
    /*
        statement(s) is expected to end with new line.
    */
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
    }
    
    return expr;
}

/*
    12 Statements
    
    Statement :
        Block
        EmptyStatement
        ExpressionStatement
        IfStatement
        IterationStatement
        ContinueStatement
        BreakStatement
        ReturnStatement
        RaiseStatement
        TryStatement
*/
Parser.prototype.parseStatement = function() {
    
    if (this.token.kind === Token.PUNCTUATOR) {
        if (this.match(':')) return this.parseBlock();
    }
    
    /*
        A problem of variable statement have been solved.
        
        a = 1
        def test():
            a = 2
            a = 3
            b = 2
         |
         v
        var a = 1
        function () {
            var a = 2;
            a = 3;
            var b = 2;
        }
    */
    if (this.token.kind === Token.IDENTIFIER) {
        if (!this.ecstack.current[this.token.text]) {
            /*
                a()
                a = 1
                 |
                 v
                a()
                a = 1 // expect: var a = 1
            */
            if (this.lookahead(1).text === '=') {
                return this.parseVariableStatement();
            }
            
            if (this.lookahead(1).kind == Token.NEWLINE) {
                this.assert(Message.IllegalIdentInitialize);
            }
        }
    }
    
    switch (this.token.kind) {
    case Token.COMMENT: return this.parseComment();
    case Token.NEWLINE: return this.parseEmptyStatement();
    case Token.KEYWORDS.PASS: return this.parsePassStatement();
    case Token.KEYWORDS.IF: return this.parseIfStatement();
    case Token.KEYWORDS.WHILE: return this.parseWhileStatement(); 
    case Token.KEYWORDS.FOR: return this.parseForStatement();
    case Token.KEYWORDS.CONTINUE: return this.parseContinueStatement();
    case Token.KEYWORDS.BREAK: return this.parseBreakStatement();
    case Token.KEYWORDS.RETURN: return this.parseReturnStatement();
    case Token.KEYWORDS.RAISE: return this.parseRaiseStatement();
    case Token.KEYWORDS.TRY: return this.parseTryStatement();
    default: return this.parseExpressionStatement();
    }
}

/*
    12.1 Block
    
    Block:
        : LineTerminator StatementList
*/
Parser.prototype.parseBlock = function() {
    
    this.expect(':');
    
    /*
        if a: a = 1
        
        if a:
            a = 1
    */
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
    }
    
    var token = this.token;
    var exprs = [];
    
    if (this.matchKind(Token.INDENT)) {
        this.indent++;
        exprs = this.parseStatementList();
        this.indent--;
    }
    /*
        would parse this:
        
        if a: a = 1
        a = 2
    */
    else {
        exprs = [this.parseStatement()];
    }
    
    /*
        whether exprs has EmptyStatement
    */
    var pass = exprs.reduce(function pass(p, c, i) {
        return p || c.type !== Syntax.EmptyStatement;
    }, false);
    
    if (pass) {
        exprs = exprs.map(function(expr) {
            // pass statement means empty statement in javascript
            if (expr.type === Syntax.PassStatement) {
                expr.type = Syntax.EmptyStatement;
            }
            return expr;
        });
        return {
            type: Syntax.BlockStatement,
            body: exprs
        };
    }
    
    this.assert(Message.IllegalBlock);
}

/*
    12.1 Block
    
    StatementList:
        Statement
        StatementList Statement
*/
Parser.prototype.parseStatementList = function() {
    
    var exprs = [], expr = null;
    var indent = this.indent * this.indent_size;
    
    while (1) {
        /*
            would parse this:
            
                if a:
                    a = 1
                a = 1
                
                if a: a = 1
                a = 2
                
                if a:
                    a = 1
                    
                    a = 2
                    a = 2
        */
        if (this.matchKind(Token.NEWLINE)) {
            this.consume();
            if (this.lookback(2).kind === Token.INDENT) {
                exprs.push({
                    type: Syntax.PassStatement
                });
            }
        }
        
        if (this.matchKind(Token.EOF)) break;
        if (this.matchKind(Token.INDENT)) {
            if (this.token.text < indent) break;
            if (this.token.text > indent) this.assert(Message.IllegalIndentSize);
            this.consume();
            continue;
        }
        
        if (expr = this.parseSourceElement()) {
            exprs.push(expr);
        }
        
        if (this.matchKind(Token.INDENT)) {
            if (this.token.text < indent) break;
            if (this.token.text > indent) this.assert(Message.IllegalIndentSize);
            this.consume();
            continue;
        }
    }
    
    return exprs;
}

/*
    12.2 Variable statement
    
    VariableStatement :
        var VariableDeclarationList ;
*/
Parser.prototype.parseVariableStatement = function() {
    return {
        type: Syntax.VariableDeclaration,
        declarations: this.parseVariableDeclarationList(),
        kind: 'var'
    };
}

/*
    12.2 Variable statement
    
    VariableDeclarationList :
        VariableDeclaration
        VariableDeclarationList , VariableDeclaration
         |
         v
        VariableDeclaration
*/
Parser.prototype.parseVariableDeclarationList = function() {
    
    var variables = [];
    
    while (1) {
        var v = this.parseVariableDeclaration();
        variables.push(v);
        this.ecstack.current[v.id.name] = v.init;
        if (!this.match(',')
         || this.token.kind === Token.EOF
         || this.token.kind === Token.NEWLINE) break;
        this.consume();
    };
    return variables;
}

/*
    12.2 Variable statement
    
    VariableDeclaration :
        Identifier Initialiseropt
*/
Parser.prototype.parseVariableDeclaration = function() {
    return {
        type: Syntax.VariableDeclarator,
        id: this.parseIdentifier(),
        init: this.parseInitialiser()
    };
}

/*
    12.2 Variable statement
    
    Initialiser :
        = AssignmentExpression
*/
Parser.prototype.parseInitialiser = function() {
    this.expect('=');
    return this.parseAssignmentExpression();
}

/*
    12.3 Empty Statement
    
    EmptyStatement :
        LineTerminator
*/
Parser.prototype.parseEmptyStatement = function() {
    var token = this.token;
    this.expectKind(Token.NEWLINE);
    // empty
    if (this.lookback(2).kind === 'INDENT') {
        return {
            type: Syntax.EmptyStatement
        };
    }
    // new line
    this.consume();
    return this.parseStatement();
}

Parser.prototype.parsePassStatement = function() {
    var token = this.token;
    this.expectKind(Token.KEYWORDS.PASS);
    return {
        type: Syntax.PassStatement
    };
}

/*
    12.4 Expression Statement
    
    ExpressionStatement :
        [lookahead ∉ {:, def} ] Expression ;
*/
Parser.prototype.parseExpressionStatement = function() {
    
    if (this.match('def') || this.match(':')) return;
    
    var expr = this.parseExpression()
    if (expr) {
        if (expr.type === Syntax.AssignmentExpression) {
            this.ecstack.current[expr.left.name] = expr.right;
        }
        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }
}

/*
    12.5 The if Statement
    
    IfStatement :
        if Expression: Statement else Statement
        if Expression: Statement
*/
Parser.prototype.parseIfStatement = function() {
    
    var alternate = null, test, indent, consequent;
    
    indent = this.indent * this.indent_size;
    this.expect('if');
    test = this.parseExpression();
    
    if (!this.match(':')) this.assert(Message.IllegalIf);
    
    consequent = this.parseStatement();
    
    /*
    if (consequent.type === Syntax.ExpressionStatement) {
        if (consequent && !consequent.expression) {
            this.assert(Message.IllegalIf);
        }
    }
    */
    if (this.matchKind(Token.INDENT)) {
        if (!this.match(indent)) {
            this.assert(Message.IllegalIndentSize);
        }
    }
    
    /*
        would parse this
        
        if a:
            a = 1
        a = 1
        
        if a:
            a = 1
        else:
            a = 2
    */
    if (this.lookahead(1).text === 'else') {
        this.consume();
    }
    
    if (this.match('else')) {
        this.consume();
        // else if || else
        alternate = this.parseStatement();
    }
    
    return {
        type: Syntax.IfStatement,
        test: test,
        consequent: consequent,
        alternate: alternate
    };
}

/*
    12.6 Iteration Statements
    
    IterationStatement :
        while Expression: Statement
        for LeftHandSideExpression in Expression: Statement
*/
Parser.prototype.parseWhileStatement = function() {
    var test, body;
    this.consume();
    try {
        test = this.parseExpression();
        this.state.current.push(State.InIteration);
        body = this.parseStatement();
        this.state.pop();
    } catch (e) {
        this.assert(Message.IllegalWhile);
    }
    return {
        type: Syntax.WhileStatement,
        test: test,
        body: body
    };
}

Parser.prototype.parseForStatement = function() {
    
    var exprs = [], left, right, body;
    
    this.consume();
    
    while (!this.match('in')) {
        if (this.match(',')) this.consume();
        exprs.push(this.parseLeftHandSideExpression());
    }
    
    left = exprs[0];
    this.expect('in');
    right = this.parseExpression();
    
    this.state.current.push(State.InIteration);
    body = this.parseStatement()
    this.state.pop();
    
    if (!right || !body) this.assert(Message.IllegalFor);
    
    /*
        rewriting of the tree structure
    */
    if (exprs.length === 1) {
        /*
            would parse this:
            
                for v in [1, 2]:
                    console.log(v)
                
                for v in a = [1, 2]:
                    console.log(v)
                
                a = [1, 2]
                for v in a:
                    console.log(v)
        */
        if (right.type !== Syntax.AssignmentExpression) {
            right = {
                type: Syntax.AssignmentExpression,
                operator: "=",
                left: {
                    type: "Identifier",
                    name: "__arr"
                },
                right: right
            }
        }
        
        left = {
            type: left.type, // may be identifier
            name: '__k'
        };
        
        body.body = exports.parse('{0} = {1}[{2}]'.format(
            exprs[0].name, 
            right.left.name, 
            '__k'
        )).body.concat(body.body);
    }
    /*
        would parse this:
            
            for k, v in a = {'k': 1, 'i': 2}:
                console.log(k, ':', v)
            
            for k, v in {'k': 1, 'i': 2}:
                console.log(k, ':', v)
            
            for v in a = {'k': 1, 'i': 2}:
                console.log(v)
    */
    else if (exprs.length === 2) {
        /*
            part of :
                a = {'arg': 1}
        */
        if (right.type !== Syntax.AssignmentExpression) {
            right = {
                type: Syntax.AssignmentExpression,
                operator: "=",
                left: {
                    type: "Identifier",
                    name: "__obj"
                },
                right: right
            }
        }
        
        body.body = exports.parse('{0} = {1}[{2}]'.format(
            exprs[1].name, 
            right.left.name, 
            exprs[0].name
        )).body.concat(body.body);
    }
    
    return {
        type: Syntax.ForInStatement,
        left: left,
        right: right,
        body: body,
        each: false
    };
}

/*
    12.7 The continue Statement
    
    ContinueStatement :
        continue
*/
Parser.prototype.parseContinueStatement = function() {
    
    this.consume();
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) this.assert(Message.IllegalContinue);
    
    if (this.state.current.indexOf(State.InIteration) === -1) {
        this.assert(Message.IllegalContinuePosition);
    }
    
    return {
        type: Syntax.ContinueStatement
    };
}

/*
    12.8 The break Statement
    
    BreakStatement :
        break
*/
Parser.prototype.parseBreakStatement = function() {
    
    this.consume();
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) this.assert(Message.IllegalBreak);
    
    if (this.state.current.indexOf(State.InIteration) === -1) {
        this.assert(Message.IllegalBreakPosition);
    }
    return {
        type: Syntax.BreakStatement
    };
}

/*
    12.9 The return Statement
    
    ReturnStatement :
    return [LineTerminator 無し] Expressionopt ;
*/
Parser.prototype.parseReturnStatement = function() {
    
    var argument = null;
    this.consume();
    
    if (this.state.current.indexOf(State.InFunction) === -1) {
        this.assert(Message.IllegalReturn);
    }
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        argument = this.parseExpression();
    }
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        this.assert(Message.IllegalReturnArgument);
    }
    
    return {
        type: Syntax.ReturnStatement,
        argument: argument
    };
}

/*
    12.13 The throw statement
    
    RaiseStatement :
        raise [LineTerminator 無し] Expression
*/
Parser.prototype.parseRaiseStatement = function() {
    
    var argument = null;
    this.consume();
    
    if (!(this.token.kind === Token.NEWLINE 
       || this.token.kind === Token.EOF)) {
        argument = this.parseExpression()
    }
    
    if (argument === null) {
        argument = {
            type: "NewExpression",
            callee: {
                type: "Identifier",
                name: "Error"
            },
            arguments: []
        };
    }
    
    return {
        type: Syntax.ThrowStatement,
        argument: argument
    };
}

/*
    12.14 The try statement
    
    TryStatement :
        try Block Catch
        try Block Finally
        try Block Catch Finally
*/
Parser.prototype.parseTryStatement = function() {
    
    var handlers = [], block = null, finalizer = null;
    var indent = this.indent * this.indent_size;
    
    this.expect('try');
    this.ecstack.push([]);
    block = this.parseBlock();
    this.ecstack.pop();
    this.expect(indent);
    
    /*
        Catch :
            catch ( Identifier ) Block
             |
             v
            except Identifieropt: Block
    */
    handlers.push(this.parseExceptStatement());
    this.expect(indent);
    
    /*
        Finally:
            finally: Block
    */
    if (this.match('finally')) {
        this.consume();
        this.ecstack.push([]);
        finalizer = this.parseBlock();
        this.ecstack.pop();
    }
    
    return {
        type: Syntax.TryStatement,
        block: block,
        handlers: handlers,
        finalizer: finalizer
    };
}

/*
    12.14 The try statement
    
    Except :
        except Identifieropt: Block
*/
Parser.prototype.parseExceptStatement = function() {
    
    var param = null, body;
    this.expect('except');
    
    /*
        except:
            except Identifier:
    */
    if (this.match(':')) {
        param = {
            type: Syntax.Identifier,
            name: 'e'
        };
    }
    
    param = param || this.parseIdentifier();
    this.ecstack.push([]);
    body = this.parseBlock();
    this.ecstack.pop();
    
    return {
        type: Syntax.CatchClause,
        param: param,
        guard: null,
        body: body
    };
}

/*
    11.1 Primary Expressions
    
    PrimaryExpression :
        this
        Identifier
        Literal
        ArrayLiteral
        ObjectLiteral
        ( Expression )
*/
Parser.prototype.parsePrimaryExpression = function() {
    
    if (this.token.kind === Token.KEYWORDS.THIS) {
        this.consume();
        return {
            type: Syntax.ThisExpression
        };
    }
    
    if (this.token.kind === Token.IDENTIFIER) {
        return this.parseIdentifier();
    }
    
    if (this.token.kind === Token.KEYWORDS.NONE 
     || this.token.kind === Token.BOOLEAN
     || this.token.kind === Token.DIGIT 
     || this.token.kind === Token.STRING
     // add keywords
     ) {
        return this.parseLiteral();
    }
    
    if (this.token.kind === Token.PUNCTUATOR) {
        if (this.match('[')) return this.parseArrayInitialiser();
        if (this.match('{')) return this.parseObjectInitialiser();
        if (this.match('(')) return this.parseGroupingOperator();
    }
    
    /*
        unexpected token like this:

        // comment
    */
    this.assert(Message.UnexpectedToken + ' ' + this.token.text);
}

/*
    11.1.2 Identifier Reference
*/
Parser.prototype.parseIdentifier = function() {
    var token = this.token;
    this.consume();
    return {
        type: Syntax.Identifier,
        name: token.text 
    };
}

/*
    7.8 Literals
    
    Literal ::
        NullLiteral
        BooleanLiteral
        NumericLiteral
        StringLiteral
*/
Parser.prototype.parseLiteral = function() {
    
    if (this.token.kind === Token.KEYWORDS.NONE) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            value: null
        };
    }
    
    if (this.token.kind === Token.BOOLEAN) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            value: (token.text === 'true')
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            value: token.text
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        var text = token.text;
        this.consume();
        /*
            could use variable inside string
            
            a = 1
            b = 1
            "{a} + {b} = 2"
             |
             v
            var a = 1
            var b = 1
            '1 + 1 = 2'
        */
        if (token.delimiter === '"') {
            var that = this, rep = {};
            var m = token.text.match(/{(.*?)}/g);
            if (m) {
                m.forEach(function(ident) {
                    var k = ident.match(/{(.*)}/)[1];
                    rep[k] = that.ecstack.current[k].value;
                });
                text = text.format(rep);
            }
        }
        return {
            type: Syntax.Literal,
            value: text
        };
    }
    
    // RegExp
}

/*
    11.1.4 Array Initialiser
    
    ArrayLiteral :
        [ Elisionopt ]
        [ ElementList ]
        [ ElementList , Elisionopt ] <- ban
*/
Parser.prototype.parseArrayInitialiser = function() {
    this.expect('[');
    var eles = this.parseElementList();
    this.expect(']');
    return {
        type: Syntax.ArrayExpression,
        elements: eles
    };
}

/*
    11.1.4 Array Initialiser
    
    ElementList :
        Elisionopt AssignmentExpression
        ElementList , Elisionopt AssignmentExpression
            |
            V
        AssignmentExpression
        ElementList, AssignmentExpression
*/
Parser.prototype.parseElementList = function() {
    var elements = [];
    while (!this.match(']')) {
        if (this.match(',')) this.consume();
        /*
            we can parse source program 
            even if new line token has appeared in array initializers.
            
            a = [
                1,
                2
            ]
        */
        if (this.token.kind === Token.NEWLINE
         || this.token.kind === Token.INDENT) { // ignore newline token
            this.consume();
            continue;
        }
        elements.push(this.parseAssignmentExpression());
    }
    return elements;
}

/*
    11.1.4 Array Initialiser
    
    Elision :
        ,
        Elision ,
*/
Parser.prototype.parseElision = function() {
    // not implemented
}

/*
    11.1.5 Object Initialiser
    
    ObjectLiteral :
        { }
        { PropertyNameAndValueList }
*/
Parser.prototype.parseObjectInitialiser = function() {
    this.expect('{');
    var props = this.parsePropertyNameAndValueList()
    this.expect('}');
    return {
        type: Syntax.ObjectExpression,
        properties: props
    };
}

/*
    11.1.5 Object Initialiser
    
    PropertyNameAndValueList :
        PropertyName : AssignmentExpression
        PropertyNameAndValueList , PropertyName : AssignmentExpression
*/
Parser.prototype.parsePropertyNameAndValueList = function() {
    
    var props = [];
    
    while (!this.match('}')) {
        if (this.match(',')) this.consume();
        var key = this.parsePropertyName();
        this.expect(':');
        
        if (key.type === Syntax.Identifier) {
            props.push({
                type: Syntax.Property,
                key: key,
                value: this.parseAssignmentExpression(),
                kind: 'init'
            });
        }
        
        if (key.type === Syntax.Literal) {
            props.push({
                type: Syntax.Property,
                key: {
                    type: key.type,
                    value: key.name
                },
                value: this.parseAssignmentExpression(),
                raw: 'init'
            });
        }
    }
    
    return props;
}

/*
    11.1.5 Object Initialiser
    
    PropertyName :
        Identifier
        StringLiteral
        NumericLiteral
*/
Parser.prototype.parsePropertyName = function() {
    
    if (this.token.kind === Token.IDENTIFIER) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Identifier,
            name: token.text 
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            name: token.text
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Literal,
            name: token.text
        };
    }
}

/*
    11.1.6 The Grouping Operator
    
    ( Expression )
*/
Parser.prototype.parseGroupingOperator = function() {
    this.expect('(');
    var expr = this.parseExpression();
    this.expect(')');
    return expr;
}

/*
    11.2 Left-Hand-Side Expressions
    
    MemberExpression :
        PrimaryExpression
        FunctionExpression
        MemberExpression [ Expression ]
        MemberExpression . Identifier
        new MemberExpression Arguments
*/
Parser.prototype.parseMemberExpression = function(allow_call) {
    if (this.match('new')) return this.parseNewExpression();
    var expr = this.parseFunctionExpression() || this.parsePrimaryExpression();
    while (1) {
        if (this.token.kind === Token.EOF
         || this.token.kind === Token.NEWLINE) break;
        
        if (this.match('[')) {
            expr = this.parseComputedMember(expr);
            continue;
        }
        
        if (this.match('.')) {
            expr = this.parseNonComputedMember(expr);
            continue;
        }
        
        if (allow_call && this.match('(')) {
            expr = this.parseCallMember(expr);
            continue;
        }
        
        break;
    }
    return expr;
}

Parser.prototype.parseComputedMember = function(object) {
    this.expect('[');
    var expr = this.parseExpression();
    this.expect(']');
    return {
        type: Syntax.MemberExpression,
        computed: true,
        object: object,
        property: expr
    };
}

Parser.prototype.parseNonComputedMember = function(object) {
    this.expect('.');
    var expr = this.parseIdentifier();
    return {
        type: Syntax.MemberExpression,
        computed: false,
        object: object,
        property: expr
    };
}

Parser.prototype.parseCallMember = function(object) {
    return {
        type: Syntax.CallExpression,
        callee: object,
        arguments: this.parseArguments()
    };
}

/*
    11.2.2 The new Operator
    
    NewExpression :
        MemberExpression
        new NewExpression
*/
Parser.prototype.parseNewExpression = function() {
    if (this.match('new')) {
        this.consume();
        return {
            type: Syntax.NewExpression,
            callee: this.parseNewExpression(),
            arguments: this.parseArguments()
        };
    }
    return this.parseMemberExpression();
}

/*
    11.2.4 Argument Lists
    
    Arguments:
        ( )
        ( ArgumentList )
    
*/
Parser.prototype.parseArguments = function() {
    this.expect('(');
    var arguments = this.parseArgumentList();
    this.expect(')');
    return arguments;
}

/*
    11.2.4 Argument Lists
    
    ArgumentList:
        AssignmentExpression
        ArgumentList , AssignmentExpression
*/
Parser.prototype.parseArgumentList = function() {
    var arguments = [];
    while (!this.match(')')) {
        arguments.push(this.parseAssignmentExpression());
        if (this.match(')')) break;
        if (this.match(',')) {
            this.consume();
            continue;
        }
        this.assert(Message.IllegalArgumentList);
    }
    return arguments;
}

/*
    11.2.5 Function Expressions
    
    FunctionExpression :
        function Identifieropt ( FormalParameterListopt ) { FunctionBody }
         |
         v
        ( expression ): ReturnStatement
*/
Parser.prototype.parseFunctionExpression = function() {
    
    /*
        lambda expression
            
            (2): x * x
             |
             v
            (function (x) {
            	return x * x;
            })(2);
            
            (2, 2): x * y
             |
             v
            (function (x, y) {
            	return x * y;
            })(2, 2);
    */
    if (this.match('(')) {
        var k = 1;
        while (this.lookahead(k).text !== ')') {
            if (this.lookahead(k).kind === Token.NEWLINE
             || this.lookahead(k).kind === Token.EOF) break;
            k++;
        }
        
        if (this.lookahead(++k).text === ':') {
            this.expect('(');
            var arguments = [];
            while (!this.match(')')) {
                if (this.match(',')) this.consume();
                arguments.push(this.parsePrimaryExpression());
            }
            this.expect(')');
            
            this.ecstack.push([]);
            this.state.push([State.InFunction]);
            var body = this.parseStatement();
            this.state.pop();
            var idents = [], ecstack = this.ecstack;
            
            // walk the subtree and find identifier node
            (function walk(subtree) {
                for (var i in subtree) {
                    if (typeof subtree[i] !== 'object') continue;
                    if (subtree[i].type === Syntax.Identifier
                     && idents.indexOf(subtree[i].name) === -1
                     && ecstack.current[subtree[i].name] === undefined) {
                        idents.push(subtree[i].name);
                    }
                    walk(subtree[i]);
                }
            })(body.body);
            this.ecstack.pop();
            
            var params = idents.map(function(ident) {
                return {
                    type: Syntax.Identifier,
                    name: ident
                }
            });
            
            /*
                would parse lambda that has multiple statement
                
                (2):
                    a = x * x
                    b = a + 1
                    b + 2
                 |
                 v
                (function () {
                    var a = x * x
                    var b = a + 1
                    return b + 2
                }(2))
            */
            body.body.push({
                type: Syntax.ReturnStatement,
                argument: body.body.pop().expression
            });
            
            return {
                type: Syntax.CallExpression,
                callee: {
                    type: Syntax.FunctionExpression,
                    id: null,
                    params: params,
                    defaults: [],
                    body: body,
                    rest: null,
                    generator: false,
                    expression: false
                },
                arguments: arguments
            }
        }
    }
}

/*
    11.2 Left-Hand-Side Expressions
    
    LeftHandSideExpression :
        NewExpression
        CallExpression
*/
Parser.prototype.parseLeftHandSideExpression = function() {
    if (this.match('new')) return this.parseNewExpression();
    return this.parseMemberExpression(true);
}

/*
    11.3 Postfix Expressions
    
    PostfixExpression :
        LeftHandSideExpression
        LeftHandSideExpression [LineTerminator 無し] ++
        LeftHandSideExpression [LineTerminator 無し] --
*/
Parser.prototype.parsePostfixExpression = function() {
    var expr = this.parseLeftHandSideExpression();
    // postfix increment operator
    if (this.match('++') || this.match('--')) {
        var token = this.token;
        this.consume();
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            if (token.text === '++') this.assert(Message.IllegalPostfixIncrement);
            if (token.text === '--') this.assert(Message.IllegalPostfixDecrement);
        }
        return {
            type: Syntax.UpdateExpression,
            operator: token.text,
            argument: expr,
            prefix: false
        };
    }
    return expr;
}

/*
    11.4 Unary Operators
    
    UnaryExpression:
        delete UnaryExpression
        void UnaryExpression
        ++ UnaryExpression
        -- UnaryExpression
        + UnaryExpression
        - UnaryExpression
        ~ UnaryExpression
        ! UnaryExpression
        not UnaryExpression
        PostfixExpression
*/
Parser.prototype.parseUnaryExpression = function() {
    
    // 11.4.1 - 11.4.3
    if (this.match('void') || this.match('delete')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            operator: token.text,
            argument: expr
        };
    }
    
    // 11.4.4 - 11.4.5
    if (this.match('++') || this.match('--')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
            if (token.text === '++') this.assert(Message.IllegalPrefixIncrement);
            if (token.text === '--') this.assert(Message.IllegalPrefixDecrement);
        }
        return {
            type: Syntax.UpdateExpression,
            operator: token.text,
            argument: expr,
            prefix: true
        };
    }
    
    // 11.4.6 - 11.4.9
    if (this.match('+') || this.match('-') || this.match('~') || this.match('!')) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.UnaryExpression,
            operator: token.text,
            argument: this.parseUnaryExpression()
        };
    }
    
    // 11.4.9
    if (this.match('not')) {
        var token = this.token;
        this.consume();
        var expr = this.parseUnaryExpression();
        return {
            type: Syntax.UnaryExpression,
            operator: '!',
            argument: expr
        };
    }
    
    return this.parsePostfixExpression();
}

/*
    11.5 Multiplicative Operators
    
    MultiplicativeExpression :
        UnaryExpression
        MultiplicativeExpression * UnaryExpression
        MultiplicativeExpression / UnaryExpression
        MultiplicativeExpression % UnaryExpression
*/
Parser.prototype.parseMultiplicativeExpression = function() {
    var expr = this.parseUnaryExpression();
    // 11.5.1 - 11.5.3
    while (this.match('/') || this.match('*') || this.match('%')) {
        var token = this.token;
        this.consume();
        if (expr.type === Syntax.ObjectExpression
         || expr.type === Syntax.ArrayExpression) {
             this.assert(Message.IllegalMultiplicativeExpression);
        }
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseUnaryExpression()
        };
    }
    return expr;
}

/*
    11.6 Additive Operators
    
    AdditiveExpression :
        MultiplicativeExpression
        AdditiveExpression + MultiplicativeExpression
        AdditiveExpression - MultiplicativeExpression
*/
Parser.prototype.parseAdditiveExpression = function() {
    var expr = this.parseMultiplicativeExpression();
    // 11.6.1 - 11.6.2
    while (this.match('+') || this.match('-')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseMultiplicativeExpression()
        };
    }
    return expr;
}

/*
    11.7 Bitwise Shift Operators
    
    ShiftExpression :
        AdditiveExpression
        ShiftExpression << AdditiveExpression
        ShiftExpression >> AdditiveExpression
        ShiftExpression >>> AdditiveExpression
*/
Parser.prototype.parseShiftExpression = function() {
    var expr = this.parseAdditiveExpression();
    while (this.match('<<') || this.match('>>') || this.match('>>>')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseAdditiveExpression()
        };
    }
    return expr;
}

/*
    11.8 Relational Operators
    
    RelationalExpression :
        ShiftExpression
        RelationalExpression < ShiftExpression
        RelationalExpression > ShiftExpression
        RelationalExpression <= ShiftExpression
        RelationalExpression >= ShiftExpression
        RelationalExpression instanceof ShiftExpression
        RelationalExpression in ShiftExpression
        RelationalExpression typeof ShiftExpression
*/
Parser.prototype.parseRelationalExpression = function() {
    
    var expr = this.parseShiftExpression();
    
    // 11.8.1, 11.8.2, 11.8.3, 11.8.4, 11.8.6, 11.8.7
    while (this.match('<') || this.match('>') 
        || this.match('<=') || this.match('>=') 
        || this.match('instanceof')
        || this.match('in')
        || this.match('typeof')) {
        
        var right;
        var in_operator = this.match('in');
        var token = this.token;
        this.consume();
        
        /*
            if "a" in a = {"a": 1}:
                console.log('found')
        */
        if (in_operator && this.lookahead(1).text === '=') {
            right = this.parseAssignmentExpression();
        } else {
            right = this.parseRelationalExpression();
        }
        
        /*
            if not "a" in {"a": 1}:
                console.log('not found')
        */
        if (in_operator 
         && expr.type === Syntax.UnaryExpression 
         && right.type === Syntax.ObjectExpression) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: "!",
                argument: {
                    type: Syntax.BinaryExpression,
                    operator: token.text,
                    left: expr.argument,
                    right: right
                }
            }
        }
        /*
            if 1 in [1, 2, 3]:
                console.log('found')
            
            if not 0 in [1, 2, 3]:
                console.log('not found')
        */
        else if (in_operator && right.type === Syntax.ArrayExpression) {
            var operator = '!==';
            if (expr.type === Syntax.UnaryExpression) {
                operator = '===';
                expr = expr.argument;
            }
            
            expr = {
                type: Syntax.BinaryExpression,
                operator: operator,
                left: {
                    type: Syntax.CallExpression,
                    callee: {
                        type: Syntax.MemberExpression,
                        computed: false,
                        object: right,
                        property: {
                            type: Syntax.Identifier,
                            name: "indexOf"
                        }
                    },
                    arguments: [expr]
                },
                right: {
                    type: Syntax.UnaryExpression,
                    operator: "-",
                    argument: {
                        type: Syntax.Literal,
                        value: 1,
                        raw: "1"
                    }
                }
            };
        }
        /*
            b = [2]
            if 0 in b:
                console.log(1)
        */
        else if (in_operator 
              && right.type === Syntax.Identifier 
              && this.ecstack.current[right.name].type === Syntax.ArrayExpression) {
            
            var operator = '!==';
            if (expr.type === Syntax.UnaryExpression
             && expr.operator === '!') {
                operator = '===';
                expr = expr.argument;
            }
            
            expr = {
                type: Syntax.BinaryExpression,
                operator: operator,
                left: {
                    type: Syntax.CallExpression,
                    callee: {
                        type: Syntax.MemberExpression,
                        computed: false,
                        object: right,
                        property: {
                            type: Syntax.Identifier,
                            name: "indexOf"
                        }
                    },
                    arguments: [expr]
                },
                right: {
                    type: Syntax.UnaryExpression,
                    operator: "-",
                    argument: {
                        type: Syntax.Literal,
                        value: 1,
                        raw: "1"
                    }
                }
            };
        }
        /*
            if "text" typeof "string":
                console.log("this is string")
        */
        else if (token.text === 'typeof') {
            /*
                ShiftExpression :: one of 

                    Undefined	"undefined"
                    Null	"object"
                    Boolean	"boolean"
                    Number	"number"
                    String	"string"
                    Object (native and doesn't implement [[Call]])	"object"
                    Object (native and implements [[Call]])	"function"
                    Object (host)	Implementation-dependent
            */

            expr = {
                type: Syntax.BinaryExpression,
                operator: '===',
                left: {
                    type: Syntax.UnaryExpression,
                    operator: 'typeof',
                    argument: expr
                },
                right: right
            };
        }
        else {
            expr = {
                type: Syntax.BinaryExpression,
                operator: token.text,
                left: expr,
                right: right
            };
        }
    }
    
    return expr;
}

/*
    11.9 Equality Operators
    
    EqualityExpression :
        RelationalExpression
        EqualityExpression == RelationalExpression
        EqualityExpression != RelationalExpression
        EqualityExpression === RelationalExpression
        EqualityExpression !== RelationalExpression
        EqualityExpression is RelationalExpression
        EqualityExpression is not RelationalExpression
*/
Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
    // 11.9.1 - 11.9.2
    while (this.match('==') || this.match('!=') || this.match('is')) {
        var token = this.token, operator;
        this.consume();
        switch (token.text) {
        case 'is':
            operator = '==';
            // is not expression
            if (this.match('not')) {
                this.consume();
                operator = '!=';
            }
            break;
        default:
            operator = token.text;
            break;
        }
        expr = {
            type: Syntax.BinaryExpression,
            operator: operator,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    // 11.9.4 - 11.9.5
    while (this.match('===') || this.match('!==')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseShiftExpression()
        };
    }
    
    return expr;
}

/*
    11.10 Binary Bitwise Operators
    
    EqualityExpression :
        BitwiseANDExpression & EqualityExpression
*/
Parser.prototype.parseBitwiseANDExpression = function() {
    var expr = this.parseEqualityExpression();
    while (this.match('&')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseEqualityExpression()
        };
    }
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    BitwiseXORExpression :
        BitwiseANDExpression
        BitwiseXORExpression ^ BitwiseANDExpression
*/
Parser.prototype.parseBitwiseXORExpression = function() {
    var expr = this.parseBitwiseANDExpression();
    while (this.match('^')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: '^',
            left: expr,
            right: this.parseBitwiseANDExpression()
        };
    }
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    BitwiseORExpression :
        BitwiseXORExpression
        BitwiseORExpression | BitwiseXORExpression
*/
Parser.prototype.parseBitwiseORExpression = function() {
    var expr = this.parseBitwiseXORExpression();
    while (this.match('|')) {
        var token = this.token;
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: token.text,
            left: expr,
            right: this.parseBitwiseXORExpression()
        };
    }
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    LogicalANDExpression :
        BitwiseORExpression
        LogicalANDExpression and BitwiseORExpression
*/
Parser.prototype.parseLogicalANDExpression = function() {
    var expr = this.parseBitwiseORExpression();
    while (this.match('and')) {
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: '&&',
            left: expr,
            right: this.parseBitwiseORExpression()
        }
    }
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    LogicalORExpression :
        LogicalANDExpression
        LogicalORExpression or LogicalANDExpression
*/
Parser.prototype.parseLogicalORExpression = function() {
    var expr = this.parseLogicalANDExpression();
    while (this.match('or')) {
        this.consume();
        expr = {
            type: Syntax.BinaryExpression,
            operator: '||',
            left: expr,
            right: this.parseBitwiseORExpression()
        }
    }
    return expr;
}

/*
    11.11 Binary Logical Operators
    
    ConditionalExpression :
        LogicalORExpression
        LogicalORExpression ? AssignmentExpression : AssignmentExpression
         |
         v
        LogicalORExpression
        LogicalORExpression if LogicalORExpression else LogicalORExpression
*/
Parser.prototype.parseConditionalExpression = function() {
    var consequent = this.parseLogicalORExpression();
    if (this.match('if')) {
        this.consume();
        var expr = this.parseLogicalORExpression();
        this.expect('else');
        var alternate = this.parseLogicalORExpression();
        if (!alternate) {
            this.assert(Message.IllegalConditionalExpression);
        }
        return {
            type: Syntax.ConditionalExpression,
            test: expr,
            consequent: consequent,
            alternate: alternate
        };
    }
    return consequent;
}

/*
    11.13 Assignment Operators
    
    AssignmentExpression:
        ConditionalExpression
        LeftHandSideExpression AssignmentOperator AssignmentExpression
*/
Parser.prototype.parseAssignmentExpression = function() {
    var expr = this.parseConditionalExpression();
    if (this.matchAssign(this.token.text)) {
        var assign = this.token.text;
        this.consume();
        expr = {
            type: Syntax.AssignmentExpression,
            operator: assign,
            left: expr,
            right: this.parseAssignmentExpression()
        };
    }
    return expr;
}

/*
    11.13 Assignment Operators
    
    AssignmentOperator : one of
        = *= /= %= += -= <<= >>= >>>= &= ^= |=
*/
Parser.prototype.matchAssign = function(op) {
    
    // 4character assignment
    if (op === '>>>=') {
        return true;
    }
    
    // 3character assignment
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return true;
    }
    
    // 2character assignment
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=' || op === '<=' ||
        op === '>=' || op === '==' || op === '!=') {
        return true;
    }
    
    // 1character assignment
    if (op === '=') {
        return true;
    }
    
    return false;
}

/*
    11.14 Comma Operator ( , )
    
    Expressions
    	AssignmentExpression
        Expression , AssignmentExpression
*/
Parser.prototype.parseExpression = function() {
    var expr = this.parseAssignmentExpression();
    if (this.match(',')) {
        expr = {
            type: Syntax.SequenceExpression,
            expressions: [expr]
        };
        while (1) {
            if (!this.match(',')) break;
            this.consume();
            expr.expressions.push(this.parseAssignmentExpression());
        }
    }
    return expr;
}

/*
    7.4 Comments
    
    Comment ::
        MultiLineComment
        SingleLineComment
*/
Parser.prototype.parseComment = function() {
    
    // multi line comment
    if (this.token.multiple) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Block,
            // range: [start, end],
            value: token.text
        }
    }
    // single line comment
    else {
        var token = this.token;
        this.consume();
        
        return {
            type: Syntax.Line,
            // range: [start, end],
            value: token.text
        }
    }
}

/*
    13 Function Definition
    
    FunctionDeclaration :
        function Identifier ( FormalParameterListopt ) { FunctionBody }
*/
Parser.prototype.parseFunctionDeclaration = function() {
    this.expect('def');
    var id = this.parseIdentifier();
    var params = this.parseFormalParameterList();
    var body = this.parseFunctionBody()[0];
    
    if (body.body.length === 1 
     && body.body[0].type === Syntax.EmptyStatement) {
        body.body = [];
    }
    body.body = params.init.concat(body.body);
    return {
        type: Syntax.FunctionDeclaration,
        id: id,
        params: params.params,
        body: body
    };
}

/*
    13 Function Definition
    
    FormalParameterList :
        Identifier
        FormalParameterList , Identifier
         |
         v
        AssignmentExpression
        FormalParameterList , AssignmentExpression
*/
Parser.prototype.parseFormalParameterList = function() {
    var params = [], init = [];
    this.expect('(');
    while (!this.match(')')) {
        if (this.match(',')) this.consume();
        params.push(this.parseIdentifier());
        if (this.match('=')) {
            this.consume();
            init.push(this.parseDefaultArgument(
                params[params.length - 1], 
                this.parsePrimaryExpression()
            ));
        }
    }
    this.expect(')');
    return {
        params: params,
        init: init
    };
}

/*
    Default Argument
*/
Parser.prototype.parseDefaultArgument = function(left, right) {
    return {
        type: Syntax.ExpressionStatement,
        expression: {
            type: Syntax.AssignmentExpression,
            operator: "=",
            left: left,
            right: {
                type: Syntax.LogicalExpression,
                operator: "||",
                left: left,
                right: right
            }
        }
    };
}

/*
    13 Function Definition
    
    FunctionBody :
        SourceElements
*/
Parser.prototype.parseFunctionBody = function() {
    var body;
    this.ecstack.push([]);
    this.state.push([State.InFunction]);
    body = this.parseSourceElements();
    this.state.pop();
    this.ecstack.pop();
    return body
}

/*
    13 Class Definition
    
    ClassDeclaration :
        class Identifier ( FormalParameterListopt )opt : ClassBody 
*/
Parser.prototype.parseClassDeclaration = function() {
    
    var id, body, inherit;
    
    this.expect('class');
    id = this.parseIdentifier();
    
    if (this.match('(')) {
        this.consume();
        inherit = this.parseInheritDeclaration(id);
        this.expect(')');
    }
    this.expect(':');
    
    if (this.matchKind(Token.NEWLINE)) {
        this.consume();
    }
    
    this.indent++;
    body = this.parseClassBody(id, inherit);
    this.indent--;
    
    body.push({
        type: Syntax.EmptyStatement
    });
    
    
    return body;
}

Parser.prototype.parseClassBody = function(cls, inherit) {
    
    var declarations = [], variables = [], indent = this.token.text;
    var constructor = this.parseClassConstructorDeclaration(cls, true);
    
    while (1) {
        if (this.matchKind(Token.EOF)) break;
        if (this.matchKind(Token.NEWLINE)) {
            this.consume();
            continue;
        }
        
        if (this.matchKind(Token.INDENT)) {
            this.consume();
            continue;
        }
        
        // member variable
        if (this.lookahead(1).text === '=') {
            var code = 'this.{0}'.format(
                exports.codegen(this.parseAssignmentExpression())
            );
            variables.push(exports.parse(code).body[0]);
            continue;
        }
        
        // method
        if (this.lookahead(1).text === '(') {
            if (this.match('constructor')) {
                constructor = this.parseClassConstructorDeclaration(cls);
                continue;
            }
            declarations.push({ type: Syntax.EmptyStatement });
            declarations.push(this.parseClassFunctionDeclaration(cls));
            continue;
        }
        break; // avoid infinite loop
    }
    
    constructor.declarations[0].init.body.body = variables.concat(constructor.declarations[0].init.body.body);
    if (constructor.declarations[0].init.body.body.length === 0) {
        constructor.declarations[0].init.body.body.push({
            type: Syntax.EmptyStatement
        });
    }
    
    if (inherit) {
        declarations.shift();
        declarations.unshift(inherit);
        declarations.unshift({
            type: Syntax.EmptyStatement
        });
    }
    
    declarations.unshift(constructor);
    return declarations;
}

Parser.prototype.parseClassConstructorDeclaration = function(cls, init) {
    init = init || false;
    
    var id, params = [];
    var body = {
        type: Syntax.BlockStatement,
        body: []
    };
    
    if (!init) {
        id = this.parseIdentifier();
        params = this.parseFormalParameterList();
        body = this.parseFunctionBody().shift();
        body.body = params.init.concat(body.body);
        params = params.params;
    }
    
    return {
        type: Syntax.VariableDeclaration,
        declarations: [{
            type: Syntax.VariableDeclarator,
            id: cls,
            init: {
                type: Syntax.FunctionExpression,
                id: null,
                params: params,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false
            }
        }],
        kind: 'var'
    };
}

Parser.prototype.parseInheritDeclaration = function(cls) {
    var id = this.parseIdentifier();
    return {
        type: Syntax.ExpressionStatement,
        expression: {
            type: Syntax.AssignmentExpression,
            operator: '=',
            left: {
                type: Syntax.MemberExpression,
                computed: false,
                object: cls,
                property: {
                    type: Syntax.Identifier,
                    name: 'prototype'
                }
            },
            right: {
                type: Syntax.CallExpression,
                callee: {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: {
                        type: Syntax.Identifier,
                        name: 'Object'
                    },
                    property: {
                        type: Syntax.Identifier,
                        name: 'create'
                    }
                },
                arguments: [
                    {
                        type: Syntax.MemberExpression,
                        computed: false,
                        object: id,
                        property: {
                            type: Syntax.Identifier,
                            name: 'prototype'
                        }
                    }
                ]
            }
        }
    }
}

Parser.prototype.parseClassFunctionDeclaration = function(cls) {
    var id = this.parseIdentifier();
    var params = this.parseFormalParameterList();
    var body = this.parseFunctionBody().shift();
    body.body = params.init.concat(body.body);
    return {
        type: Syntax.ExpressionStatement,
        expression: {
            type: Syntax.AssignmentExpression,
            operator: '=',
            left: {
                type: Syntax.MemberExpression,
                computed: false,
                object: {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: cls,
                    property: {
                        type: Syntax.Identifier,
                        name: 'prototype'
                    }
                },
                property: id
            },
            right: {
                type: Syntax.FunctionExpression,
                id: null,
                params: params.params,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false
            }
        }
    }
}

/*
    alias of Parser.parseProgram
*/
Parser.prototype.parse = Parser.prototype.parseProgram;
// src/state.js
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
// src/syntax.js
Syntax = escodegen.Syntax;
Syntax.PassStatement = 'PassStatement';
Syntax.Block = 'Block';
Syntax.Line = 'Line';
// src/token.js
var Token = function(kind, text, location) {
    this.name = 'Token';
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    var data = {
        "location": this.location.toString(), 
        "kind": this.kind, 
        "message": this.text
    };
    return "{location} kind:{kind} text:{message}".format(data);
}

/*
    Tokens
*/
Token.EOF = '<END>';
Token.NEWLINE = 'NEWLINE';
Token.INDENT = 'INDENT';
Token.IDENTIFIER = 'IDENTIFIER';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.COLON = 'COLON';
Token.COMMENT = 'COMMENT';
Token.BOOLEAN = 'BOOLEAN';

/*
    Keywords
*/
Token.KEYWORDS = [];
Token.KEYWORDS.AND = 'and';
Token.KEYWORDS.BREAK = 'break';
Token.KEYWORDS.CATCH = 'catch';
Token.KEYWORDS.CLASS = 'class';
Token.KEYWORDS.CONTINUE = 'continue';
Token.KEYWORDS.DELETE = 'delete';
Token.KEYWORDS.ELSE = 'else';
Token.KEYWORDS.DEF = 'def';
Token.KEYWORDS.FINALLY = 'finally';
Token.KEYWORDS.FOR = 'for';
Token.KEYWORDS.IF = 'if';
Token.KEYWORDS.IN = 'in';
Token.KEYWORDS.IS = 'is';
Token.KEYWORDS.NEW = 'new';
Token.KEYWORDS.NOT = 'not';
Token.KEYWORDS.OR = 'or';
Token.KEYWORDS.PASS = 'pass';
Token.KEYWORDS.RETURN = 'return';
Token.KEYWORDS.THIS = 'this';
Token.KEYWORDS.TRY = 'try';
Token.KEYWORDS.RAISE = 'raise';
Token.KEYWORDS.VOID = 'void';
Token.KEYWORDS.WHILE = 'while';
Token.KEYWORDS.XOR = 'xor';
Token.KEYWORDS.NONE = 'none';
Token.KEYWORDS.VAR = 'var';
// src/trace.js
function trace(s){
  mylog = [];
  function getIndent(num){
    var ind = [];
    while(num){
      ind.push('  ');
      num--;
    }
    return ind.join('');
  }
  function addLog(txt, defaultIndent){
    var cnt = defaultIndent;
    //array
    if((typeof txt == 'object') && (txt instanceof Array)){
      cnt++;
      mylog.push('[');
      for(var i = 0; i < txt.length; i++){
        mylog.push('\r\n' + getIndent(cnt));
        addLog(txt[i], cnt);
        if(i != txt.length - 1){
          mylog.push(',');
        }
      }
      mylog.push('\r\n' + getIndent(cnt - 1) + ']');
    //object
    }else if((typeof txt == 'object')){
      cnt++;
      mylog.push('{');
      for(var i in txt){
        mylog.push('\r\n' + getIndent(cnt) + i + ':');
        addLog(txt[i], cnt);
        mylog.push(',');
      }
      mylog.pop();
      mylog.push('\r\n' + getIndent(cnt - 1) + '}');
    }else{
      mylog.push(txt);
    }
  }
  addLog(s, 0);
  console.log(mylog.join(''));

  //Firebugが入っていなかったらこっち
  //alert(mylog.join(''));
};
return exports;
})();
