// JavaScript language implementation

function LangJs(vm) {

    var lang = this;

    lang.vm = vm;

    Lang.call(lang);

    lang.init();
}

LangJs.prototype = Object.create(Lang.prototype);

LangJs.prototype.properties =
    {
        id: 'js',
        exts: ['.js'],
        levels:
        {
            novice: 'JavaScript novice',
            standard: 'JavaScript standard'
        },
        prompt: '>',
        promptCont: '',
        editorOpts: { mode: 'javascript', indentUnit: 4 },
        SVG:
        {
            black: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="m 16,0 l 224,0 a 16,16 0 0 1 16,16 l 0,224 a 16,16 0 0 1 -16,16 l -224,0 a 16,16 0 0 1 -16,-16 l 0,-224 a 16,16 0 0 1 16,-16 m -16,0 m 67.312,213.932 19.591,-11.856 C 90.682,208.777 94.121,214.447 102.367,214.447 c 7.905,0 12.889,-3.092 12.889,-15.120 l 0,-81.798 24.057,0 0,82.138 c 0,24.917 -14.606,36.259 -35.915,36.259 -19.245,0 -30.416,-9.967 -36.087,-21.996 m 81.270,0 19.589,-11.342 c 5.157,8.421 11.858,14.607 23.715,14.607 9.968,0 16.325,-4.984 16.325,-11.858 0,-8.248 -6.530,-11.170 -17.528,-15.980 l -6.013,-2.579 c -17.357,-7.388 -28.871,-16.667 -28.871,-36.258 0,-18.043 13.747,-31.792 35.228,-31.792 15.294,0 26.292,5.328 34.196,19.247 l -18.731,12.028 c -4.124,-7.388 -8.591,-10.310 -15.465,-10.310 -7.046,0 -11.514,4.468 -11.514,10.310 0,7.218 4.468,10.139 14.778,14.608 l 6.014,2.577 c 20.450,8.764 31.963,17.700 31.963,37.804 0,21.653 -17.012,33.510 -39.867,33.510 -22.340,0 -36.775,-10.653 -43.819,-24.573" fill="black" fill-rule="evenodd"/></g></svg>',
            white: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="m 16,0 l 224,0 a 16,16 0 0 1 16,16 l 0,224 a 16,16 0 0 1 -16,16 l -224,0 a 16,16 0 0 1 -16,-16 l 0,-224 a 16,16 0 0 1 16,-16 m -16,0 m 67.312,213.932 19.591,-11.856 C 90.682,208.777 94.121,214.447 102.367,214.447 c 7.905,0 12.889,-3.092 12.889,-15.120 l 0,-81.798 24.057,0 0,82.138 c 0,24.917 -14.606,36.259 -35.915,36.259 -19.245,0 -30.416,-9.967 -36.087,-21.996 m 81.270,0 19.589,-11.342 c 5.157,8.421 11.858,14.607 23.715,14.607 9.968,0 16.325,-4.984 16.325,-11.858 0,-8.248 -6.530,-11.170 -17.528,-15.980 l -6.013,-2.579 c -17.357,-7.388 -28.871,-16.667 -28.871,-36.258 0,-18.043 13.747,-31.792 35.228,-31.792 15.294,0 26.292,5.328 34.196,19.247 l -18.731,12.028 c -4.124,-7.388 -8.591,-10.310 -15.465,-10.310 -7.046,0 -11.514,4.468 -11.514,10.310 0,7.218 4.468,10.139 14.778,14.608 l 6.014,2.577 c 20.450,8.764 31.963,17.700 31.963,37.804 0,21.653 -17.012,33.510 -39.867,33.510 -22.340,0 -36.775,-10.653 -43.819,-24.573" fill="white" fill-rule="evenodd"/></g></svg>',
            color: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="m 16,0 l 224,0 a 16,16 0 0 1 16,16 l 0,224 a 16,16 0 0 1 -16,16 l -224,0 a 16,16 0 0 1 -16,-16 l 0,-224 a 16,16 0 0 1 16,-16 m -16,0" fill="#EEE070"/><path d="m 67.312,213.932 19.591,-11.856 C 90.682,208.777 94.121,214.447 102.367,214.447 c 7.905,0 12.889,-3.092 12.889,-15.120 l 0,-81.798 24.057,0 0,82.138 c 0,24.917 -14.606,36.259 -35.915,36.259 -19.245,0 -30.416,-9.967 -36.087,-21.996 m 81.270,0 19.589,-11.342 c 5.157,8.421 11.858,14.607 23.715,14.607 9.968,0 16.325,-4.984 16.325,-11.858 0,-8.248 -6.530,-11.170 -17.528,-15.980 l -6.013,-2.579 c -17.357,-7.388 -28.871,-16.667 -28.871,-36.258 0,-18.043 13.747,-31.792 35.228,-31.792 15.294,0 26.292,5.328 34.196,19.247 l -18.731,12.028 c -4.124,-7.388 -8.591,-10.310 -15.465,-10.310 -7.046,0 -11.514,4.468 -11.514,10.310 0,7.218 4.468,10.139 14.778,14.608 l 6.014,2.577 c 20.450,8.764 31.963,17.700 31.963,37.804 0,21.653 -17.012,33.510 -39.867,33.510 -22.340,0 -36.775,-10.653 -43.819,-24.573" fill="black"/></g></svg>'
        },
        builtinPrograms:
        {
            'sample/hello.js' :
                '// This program prints a famous greeting\n' +
                '\n' +
                'print("Hello world!");\n',

            'sample/sqrt2.js' :
                '// This program computes the square root of 2 without using Math.sqrt\n' +
                '\n' +
                'var n = 2;       // number whose square root is to be computed\n' +
                'var approx = n;  // first approximation of sqrt(n)\n' +
                '\n' +
                'for (;;) {\n' +
                '    next = (approx + n/approx) / 2;  // improve approximation\n' +
                '    if (next == approx)              // stop when no improvement\n' +
                '        break;\n' +
                '}\n' +
                '\n' +
                'print(approx);  // print square root of n\n'
        }
    };

Lang.prototype.register(LangJs);

LangJs.prototype.init = function () {
    var lang = this;
    lang.rt = new lang.RunTime();
};

LangJs.prototype.RunTime = function () {

    var rt = this;

    rt.globalObject = {};
    rt.rte = null;
};

LangJs.prototype.hasGlobal = function (id) {
    var lang = this;
    return Object.prototype.hasOwnProperty.call(lang.rt.globalObject, id);
};

LangJs.prototype.getGlobal = function (id) {
    var lang = this;
    return lang.rt.globalObject[id];
};

LangJs.prototype.setGlobal = function (id, val) {
    var lang = this;
    lang.rt.globalObject[id] = val;
};

LangJs.prototype.compile = function (source, container, reboot) {

    // Parameters:
    //
    //   source     a string containing the code to compile
    //
    //   container  a Container object indicating where the code is
    //              located (a file/REPL, the starting line, etc)
    //
    //   reboot     a boolean indicating if, when the code is executed,
    //              the execution state of the program should be
    //              reset (reboot == false is useful for REPL evaluation)

    var lang = this;
    var code = jev.compile(source,
                           container,
                           {
                               error: function (loc, kind, msg) {
                                   lang.vm.syntaxError(loc, kind, msg);
                               },
                               detectEmpty: true,
                               language: lang.vm.level, //TODO: fix
                               filterAST: function (ast, source) {
                                   return lang.vm.filterAST(ast, source);
                               }
                           });

    if (code === null) // empty program?
        return null;

    return function (rte, cont) {
               lang.initRunTimeState(reboot);
               return code(rte, cont);
           };
};

LangJs.prototype.startExecution = function (code) {

    var lang = this;

    lang.rt.rte = jev.runSetup(code, {globalObject: lang.rt.globalObject});
};

LangJs.prototype.continueExecution = function (steps) {

    var lang = this;

    lang.rt.rte.step(steps);
};

LangJs.prototype.getStepCount = function () {
    var lang = this;
    return lang.rt.rte.step_count;
};

LangJs.prototype.isExecuting = function () {
    var lang = this;
    return (lang.rt.rte !== null) && !lang.rt.rte.finished();
};

LangJs.prototype.isEndedWithResult = function () {
    var lang = this;
    return lang.rt.rte.error === null;
};

LangJs.prototype.getResult = function () {
    var lang = this;
    return lang.rt.rte.result;
};

LangJs.prototype.getError = function () {
    var lang = this;
    return String(lang.rt.rte.error);
};

LangJs.prototype.getLocation = function () {
    var lang = this;
    return lang.rt.rte.ast.loc;
};

LangJs.prototype.stopExecution = function () {
    var lang = this;
    lang.rt.rte = null;
};

LangJs.prototype.executionStateHTML = function () {

    var lang = this;
    var result = lang.getResult();
    var resultHTML = (result === void 0)
                     ? '<i>no value</i>'
                     : lang.printedRepresentation(result, 'HTML');

    var contextHTML = lang.contextHTML();

    if (contextHTML === '') {
        return '<div class="cb-exec-point-bubble-value-no-context">' +
               resultHTML +
               '</div>';
    } else {
        return '<div class="cb-exec-point-bubble-value">' +
               resultHTML +
               '</div>' +
               '<div class="cb-exec-point-bubble-context">' +
               contextHTML +
               '</div>';
    }
};

LangJs.prototype.contextHTML = function () {

    var lang = this;
    var rte = lang.rt.rte;
    var frm = rte.frame;
    var cte = frm.cte;
    var result = [];
    var seen = {};

    var add = function (id, val) {
        if (!Object.prototype.hasOwnProperty.call(seen, id)) {
            if (val !== void 0) { // don't show undefined variables
                result.push('<div class="cb-exec-point-bubble-binding"><span class="cb-code-font">' + id + '</span>: ' + lang.printedRepresentation(val, 'HTML') + '</div>');
            }
            seen[id] = true;
        }
    };

    while (cte !== null) {
        Object.getOwnPropertyNames(cte.params).forEach(function (id) {
            var i = cte.params[id];
            add(id, frm.params[i]);
        });
        Object.getOwnPropertyNames(cte.locals).forEach(function (id) {
            if (cte.parent !== null) {
                var i = cte.locals[id];
                add(id, frm.locals[i]);
            } else {
                if (!lang.wellKnownGlobal(id)) {
                    add(id, rte.glo[id]);
                }
            }
        });
        if (cte.callee !== null) {
            add(cte.callee, frm.callee);
        }
        cte = cte.parent;
        frm = frm.parent;
    }

    return result.join('');
};

LangJs.prototype.printedRepresentation_old = function (x) {

    var lang = this;

    //TODO: avoid infinite loops for circular data!
    //TODO: avoid printing wider than page!
    //TODO: emit HTML markup, so that objects with a toHTML method can be represented specially (such as images)

    if (typeof x === "string") {
        var chars = [];
        chars.push("\"");
        for (var i=0; i<x.length; i++) {
            var c = x.charAt(i);
            if (c === "\"") {
                chars.push("\\\"");
            } else if (c === "\\") {
                chars.push("\\\\");
            } else if (c === "\n") {
                chars.push("\\n");
            } else {
                var n = x.charCodeAt(i);
                if (n <= 31 || n >= 256) {
                    chars.push("\\u" + (n+65536).toString(16).slice(1));
                } else {
                    chars.push(c);
                }
            }
        }
        chars.push("\"");
        return chars.join("");
    } else if (typeof x === "object") {
        if (x === null) {
            return "null";
        } else if (x instanceof Array) {
            var a = [];
            for (var i=0; i<x.length; i++)
                a.push(lang.printedRepresentation(x[i]));
            return "[" + a.join(", ") + "]";
        } else {
            var a = [];
            for (var p in x)
                a.push(lang.printedRepresentation(p)+": "+lang.printedRepresentation(x[p]));
            return "{" + a.join(", ") + "}";
        }
    } else if (typeof x === "undefined") {
        return "undefined";
    } else {
        return String(x);
    }
};

LangJs.prototype.printedRepresentation = function (obj, format) {

    var lang = this;

    if (format === void 0) {
        format = 'plain';
    }

    return lang.objectRepresentation(obj, format, 80).text;
};

LangJs.prototype.objectRepresentation = function (obj, format, limit) {

    var lang = this;
    var string_key_required = function (key) {

        return !((Scanner.prototype.is_identifier(key) &&
                  !Scanner.prototype.is_keyword(key)) ||
                 (''+key === ''+(+key) &&
                  +key >= 0));

    };

    var xform = function (str) {
        var text;
        if (format === 'HTML') {
            text = escape_HTML(str);
        } else {
            text = str;
        }
        return { text: text, len: str.length };
    };

    if (typeof obj === 'object') {

        if (obj === null) {

            return xform('null');

        } else if ('obj_repr' in obj) {

            return obj.obj_repr(format, limit);

        } else if (obj instanceof Array) {

            var a = ['['];
            var len = 1;

            for (var i=0; i<obj.length; i++) {
                if (i > 0) {
                    a.push(', ');
                    len += 2;
                }
                var r = lang.objectRepresentation(obj[i], format, limit-len-1);
                if (len + r.len + 1 > limit) {
                    a.push('...');
                    len += 3;
                    break;
                } else {
                    a.push(r.text);
                    len += r.len;
                }
            }

            a.push(']');
            len += 1;

            return { text: a.join(''), len: len };

        } else {

            var a = ['{'];
            var len = 1;
            var i = 0;

            for (var p in obj) {
                if (i++ > 0) {
                    a.push(', ');
                    len += 2;
                }
                var r1;
                if (string_key_required(p)) {
                    r1 = lang.objectRepresentation(p, format, limit);
                } else {
                    r1 = xform(''+p);
                }
                var r2 = lang.objectRepresentation(obj[p], format, limit-len-r1.len-3);
                if (len + r1.len + r2.len + 3 > limit) {
                    a.push('...');
                    len += 3;
                    break;
                } else {
                    a.push(r1.text);
                    a.push(': ');
                    a.push(r2.text);
                    len += r1.len + 2 + r2.len;
                }
            }

            a.push('}');
            len += 1;

            return { text: a.join(''), len: len };

        }
    } else if (typeof obj === 'string') {

        var delim = '"';
        var chars = [];
        chars.push(delim);
        for (var i=0; i<obj.length; i++) {
            var c = obj.charAt(i);
            if (c === delim) {
                chars.push('\\'+delim);
            } else if (c === '\\') {
                chars.push('\\\\');
            } else if (c === '\n') {
                chars.push('\\n');
            } else {
                var n = obj.charCodeAt(i);
                if (n <= 31 || n >= 256) {
                    chars.push('\\u' + (n+65536).toString(16).slice(1));
                } else {
                    chars.push(c);
                }
            }
        }
        chars.push(delim);

        return xform(chars.join(''));

    } else if (typeof obj === 'undefined') {

        return xform('undefined');

    } else {

        return xform(String(obj));

    }
};

//-----------------------------------------------------------------------------

LangJs.prototype.initRunTimeState = function (reboot) {

    var lang = this;

    if (reboot) lang.initGlobals();
    lang.initBuiltins();
};

LangJs.prototype.initGlobals = function () {

    var lang = this;
    var globalObject = lang.rt.globalObject;

    Object.getOwnPropertyNames(globalObject).forEach(
        function (id) {
            if (!lang.wellKnownGlobal(id)) {
                delete globalObject[id];
            }
        });
};

LangJs.prototype.wellKnownGlobal = function (id) {
    return Object.prototype.hasOwnProperty.call(LangJs.prototype.wellKnownGlobals, id);
};

LangJs.prototype.wellKnownGlobals = (function () {
var wellKnownGlobals = {};
wellKnownGlobals['NaN'] = true;
wellKnownGlobals['Infinity'] = true;
wellKnownGlobals['undefined'] = true;
wellKnownGlobals['parseInt'] = true;
wellKnownGlobals['parseFloat'] = true;
wellKnownGlobals['isNaN'] = true;
wellKnownGlobals['isFinite'] = true;
wellKnownGlobals['decodeURI'] = true;
wellKnownGlobals['encodeURI'] = true;
wellKnownGlobals['decodeURIComponent'] = true;
wellKnownGlobals['encodeURIComponent'] = true;
wellKnownGlobals['Object'] = true;
wellKnownGlobals['Function'] = true;
wellKnownGlobals['Array'] = true;
wellKnownGlobals['String'] = true;
wellKnownGlobals['Boolean'] = true;
wellKnownGlobals['Number'] = true;
wellKnownGlobals['Date'] = true;
wellKnownGlobals['RegExp'] = true;
wellKnownGlobals['Error'] = true;
wellKnownGlobals['EvalError'] = true;
wellKnownGlobals['RangeError'] = true;
wellKnownGlobals['ReferenceError'] = true;
wellKnownGlobals['SyntaxError'] = true;
wellKnownGlobals['TypeError'] = true;
wellKnownGlobals['URIError'] = true;
wellKnownGlobals['Math'] = true;
wellKnownGlobals['JSON'] = true;
wellKnownGlobals['document'] = true;
wellKnownGlobals['print'] = true;
wellKnownGlobals['alert'] = true;
wellKnownGlobals['prompt'] = true;
wellKnownGlobals['confirm'] = true;
wellKnownGlobals['load'] = true;
wellKnownGlobals['pause'] = true;
wellKnownGlobals['assert'] = true;
wellKnownGlobals['setScreenMode'] = true;
wellKnownGlobals['getScreenWidth'] = true;
wellKnownGlobals['getScreenHeight'] = true;
wellKnownGlobals['setPixel'] = true;
wellKnownGlobals['fillRectangle'] = true;
wellKnownGlobals['exportScreen'] = true;
wellKnownGlobals['getMouse'] = true;
wellKnownGlobals['cs'] = true;
wellKnownGlobals['pu'] = true;
wellKnownGlobals['pd'] = true;
wellKnownGlobals['st'] = true;
wellKnownGlobals['ht'] = true;
wellKnownGlobals['fd'] = true;
wellKnownGlobals['bk'] = true;
wellKnownGlobals['mv'] = true;
wellKnownGlobals['lt'] = true;
wellKnownGlobals['rt'] = true;
wellKnownGlobals['setpc'] = true;
wellKnownGlobals['setpw'] = true;
wellKnownGlobals['drawtext'] = true;
wellKnownGlobals['setTimeout'] = true;
wellKnownGlobals['clearTimeout'] = true;
wellKnownGlobals['readFile'] = true;
wellKnownGlobals['writeFile'] = true;
return wellKnownGlobals;
})();

//-----------------------------------------------------------------------------

function abort_fn_body(rte, result, msg) {

    vm.ui.stepDelay = 0;
    rte.step_limit = rte.step_count; // exit trampoline

    if (msg !== void 0) {
        vm.stop(msg);
    } else {
        vm.enterMode(vm.modeStepping());
    }

    return return_fn_body(rte, result);
}

function return_fn_body(rte, result) {

    var cont = rte.stack.cont;

    rte.frame = rte.stack.frame;
    rte.stack = rte.stack.stack;

    return cont(rte, result);
}

//-----------------------------------------------------------------------------
