// Python language implementation

function LangPy(vm) {

    var lang = this;

    lang.vm = vm;

    Lang.call(lang);

    lang.init();
}

LangPy.prototype = Object.create(Lang.prototype);

LangPy.prototype.properties =
    {
        id: 'py',
        exts: ['.py'],
        levels:
        {
            novice: 'Python novice',
//            standard: 'Python standard'
        },
        prompt: '>>>',
        promptCont: '...',
        editorOpts: { mode: 'python', indentUnit: 4 },
        SVG:
        {
            black: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M126.915866,0.0722755491 C62.0835831,0.0722801733 66.1321288,28.1874648 66.1321288,28.1874648 L66.2044043,57.3145115 L128.072276,57.3145115 L128.072276,66.0598532 L41.6307171,66.0598532 C41.6307171,66.0598532 0.144551098,61.3549438 0.144551098,126.771315 C0.144546474,192.187673 36.3546019,189.867871 36.3546019,189.867871 L57.9649915,189.867871 L57.9649915,159.51214 C57.9649915,159.51214 56.8001363,123.302089 93.5968379,123.302089 L154.95878,123.302089 C154.95878,123.302089 189.434218,123.859386 189.434218,89.9830604 L189.434218,33.9695088 C189.434218,33.9695041 194.668541,0.0722755491 126.915866,0.0722755491 L126.915866,0.0722755491 L126.915866,0.0722755491 Z M92.8018069,19.6589497 C98.9572068,19.6589452 103.932242,24.6339846 103.932242,30.7893845 C103.932246,36.9447844 98.9572068,41.9198193 92.8018069,41.9198193 C86.646407,41.9198239 81.6713721,36.9447844 81.6713721,30.7893845 C81.6713674,24.6339846 86.646407,19.6589497 92.8018069,19.6589497 L92.8018069,19.6589497 L92.8018069,19.6589497 Z" fill="black"/><path d="M128.757101,254.126271 C193.589403,254.126271 189.540839,226.011081 189.540839,226.011081 L189.468564,196.884035 L127.600692,196.884035 L127.600692,188.138693 L214.042251,188.138693 C214.042251,188.138693 255.528417,192.843589 255.528417,127.427208 C255.52844,62.0108566 219.318366,64.3306589 219.318366,64.3306589 L197.707976,64.3306589 L197.707976,94.6863832 C197.707976,94.6863832 198.87285,130.896434 162.07613,130.896434 L100.714182,130.896434 C100.714182,130.896434 66.238745,130.339138 66.238745,164.215486 L66.238745,220.229038 C66.238745,220.229038 61.0044225,254.126271 128.757101,254.126271 L128.757101,254.126271 L128.757101,254.126271 Z M162.87116,234.539597 C156.715759,234.539597 151.740726,229.564564 151.740726,223.409162 C151.740726,217.253759 156.715759,212.278727 162.87116,212.278727 C169.026563,212.278727 174.001595,217.253759 174.001595,223.409162 C174.001618,229.564564 169.026563,234.539597 162.87116,234.539597 L162.87116,234.539597 L162.87116,234.539597 Z" fill="black"/></g></svg>',
            white: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M126.915866,0.0722755491 C62.0835831,0.0722801733 66.1321288,28.1874648 66.1321288,28.1874648 L66.2044043,57.3145115 L128.072276,57.3145115 L128.072276,66.0598532 L41.6307171,66.0598532 C41.6307171,66.0598532 0.144551098,61.3549438 0.144551098,126.771315 C0.144546474,192.187673 36.3546019,189.867871 36.3546019,189.867871 L57.9649915,189.867871 L57.9649915,159.51214 C57.9649915,159.51214 56.8001363,123.302089 93.5968379,123.302089 L154.95878,123.302089 C154.95878,123.302089 189.434218,123.859386 189.434218,89.9830604 L189.434218,33.9695088 C189.434218,33.9695041 194.668541,0.0722755491 126.915866,0.0722755491 L126.915866,0.0722755491 L126.915866,0.0722755491 Z M92.8018069,19.6589497 C98.9572068,19.6589452 103.932242,24.6339846 103.932242,30.7893845 C103.932246,36.9447844 98.9572068,41.9198193 92.8018069,41.9198193 C86.646407,41.9198239 81.6713721,36.9447844 81.6713721,30.7893845 C81.6713674,24.6339846 86.646407,19.6589497 92.8018069,19.6589497 L92.8018069,19.6589497 L92.8018069,19.6589497 Z" fill="white"/><path d="M128.757101,254.126271 C193.589403,254.126271 189.540839,226.011081 189.540839,226.011081 L189.468564,196.884035 L127.600692,196.884035 L127.600692,188.138693 L214.042251,188.138693 C214.042251,188.138693 255.528417,192.843589 255.528417,127.427208 C255.52844,62.0108566 219.318366,64.3306589 219.318366,64.3306589 L197.707976,64.3306589 L197.707976,94.6863832 C197.707976,94.6863832 198.87285,130.896434 162.07613,130.896434 L100.714182,130.896434 C100.714182,130.896434 66.238745,130.339138 66.238745,164.215486 L66.238745,220.229038 C66.238745,220.229038 61.0044225,254.126271 128.757101,254.126271 L128.757101,254.126271 L128.757101,254.126271 Z M162.87116,234.539597 C156.715759,234.539597 151.740726,229.564564 151.740726,223.409162 C151.740726,217.253759 156.715759,212.278727 162.87116,212.278727 C169.026563,212.278727 174.001595,217.253759 174.001595,223.409162 C174.001618,229.564564 169.026563,234.539597 162.87116,234.539597 L162.87116,234.539597 L162.87116,234.539597 Z" fill="white"/></g></svg>',
            color: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient x1="12.9593594%" y1="12.0393928%" x2="79.6388325%" y2="78.2008538%" id="linearGradient-1"><stop stop-color="#387EB8" offset="0%"></stop><stop stop-color="#366994" offset="100%"></stop></linearGradient><linearGradient x1="19.127525%" y1="20.5791813%" x2="90.7415328%" y2="88.4290372%" id="linearGradient-2"><stop stop-color="#FFE052" offset="0%"></stop><stop stop-color="#FFC331" offset="100%"></stop></linearGradient></defs><g><path d="M126.915866,0.0722755491 C62.0835831,0.0722801733 66.1321288,28.1874648 66.1321288,28.1874648 L66.2044043,57.3145115 L128.072276,57.3145115 L128.072276,66.0598532 L41.6307171,66.0598532 C41.6307171,66.0598532 0.144551098,61.3549438 0.144551098,126.771315 C0.144546474,192.187673 36.3546019,189.867871 36.3546019,189.867871 L57.9649915,189.867871 L57.9649915,159.51214 C57.9649915,159.51214 56.8001363,123.302089 93.5968379,123.302089 L154.95878,123.302089 C154.95878,123.302089 189.434218,123.859386 189.434218,89.9830604 L189.434218,33.9695088 C189.434218,33.9695041 194.668541,0.0722755491 126.915866,0.0722755491 L126.915866,0.0722755491 L126.915866,0.0722755491 Z M92.8018069,19.6589497 C98.9572068,19.6589452 103.932242,24.6339846 103.932242,30.7893845 C103.932246,36.9447844 98.9572068,41.9198193 92.8018069,41.9198193 C86.646407,41.9198239 81.6713721,36.9447844 81.6713721,30.7893845 C81.6713674,24.6339846 86.646407,19.6589497 92.8018069,19.6589497 L92.8018069,19.6589497 L92.8018069,19.6589497 Z" fill="url(#linearGradient-1)" /><path d="M128.757101,254.126271 C193.589403,254.126271 189.540839,226.011081 189.540839,226.011081 L189.468564,196.884035 L127.600692,196.884035 L127.600692,188.138693 L214.042251,188.138693 C214.042251,188.138693 255.528417,192.843589 255.528417,127.427208 C255.52844,62.0108566 219.318366,64.3306589 219.318366,64.3306589 L197.707976,64.3306589 L197.707976,94.6863832 C197.707976,94.6863832 198.87285,130.896434 162.07613,130.896434 L100.714182,130.896434 C100.714182,130.896434 66.238745,130.339138 66.238745,164.215486 L66.238745,220.229038 C66.238745,220.229038 61.0044225,254.126271 128.757101,254.126271 L128.757101,254.126271 L128.757101,254.126271 Z M162.87116,234.539597 C156.715759,234.539597 151.740726,229.564564 151.740726,223.409162 C151.740726,217.253759 156.715759,212.278727 162.87116,212.278727 C169.026563,212.278727 174.001595,217.253759 174.001595,223.409162 C174.001618,229.564564 169.026563,234.539597 162.87116,234.539597 L162.87116,234.539597 L162.87116,234.539597 Z" fill="url(#linearGradient-2)"/></g></svg>'
        },
        builtinPrograms:
        {
            'sample/hello.py' :
                '# This program prints a famous greeting\n' +
                '\n' +
                'print("Hello world!")\n',

            'sample/sqrt2.py' :
                '# This program computes the square root of 2 without using math.sqrt\n' +
                '\n' +
                'n = 2       # number whose square root is to be computed\n' +
                'approx = n  # first approximation of sqrt(n)\n' +
                '\n' +
                'while True:\n' +
                '    next = (approx + n/approx) / 2  # improve approximation\n' +
                '    if next == approx:              # stop when no improvement\n' +
                '        break\n' +
                '    approx = next\n' +
                '\n' +
                'print(approx)  # print square root of n\n'
        }
    };

Lang.prototype.register(LangPy);

LangPy.prototype.init = function () {
    var lang = this;
    lang.rt = new lang.RunTime();
};

LangPy.prototype.RunTime = function () {

    var rt = this;

    rt.ast = null;
    rt.msg = '';
    rt.cont = null;
    rt.ctx = null;
    rt.stepCount = 0;
    rt.rte = null;
};

LangPy.prototype.compile = function (source, container, reboot) {

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

    function attach_to_container(ast, container) {
        if (typeof ast === 'object') {
            if (Object.prototype.hasOwnProperty.call(ast, '_fields')) {
                ast.container = container;
                ast.lineno += container.start_line0;
                ast.end_lineno += container.start_line0;
                for (var i in ast._fields) {
                    attach_to_container(ast[ast._fields[i]], container);
                }
            } else if (ast instanceof Array) {
                ast.forEach(function (a) { attach_to_container(a, container); });
            }
        }

    }

    function syntaxError(start_line0,
                         start_column0,
                         end_line0,
                         end_column0,
                         msg) {

        var loc = lang.relativeLocation(container,
                                        start_line0,
                                        start_column0,
                                        end_line0,
                                        end_column0);

        lang.vm.syntaxError(loc, 'syntax error', msg);
    }

    var lang = this;
    var ast = pyinterp.parse(source,
                             '<unknown>',
                             'exec',
                             {
                                 syntaxError: syntaxError
                             });

    attach_to_container(ast, container);

    var code = pyinterp.comp(ast);

    if (code === null) // empty program?
        return null;

    var execution_point = lang.initRunTimeState(code, reboot);

    return execution_point;
};

LangPy.prototype.startExecution = function (cont) {

    var lang = this;

    console.log('LangPy.startExecution');

    lang.rt.stepCount = 0;
    lang.rt.ast = null;
    lang.rt.msg = '';
    lang.rt.cont = function () {
                       return cont(lang.rt.rte,
                                   function () {
                                       lang.rt.cont = null; // end execution
                                       return null;
                                   });
                   };
//    lang.rt.cont = cont;
    lang.rt.ctx = null;
};

LangPy.prototype.continueExecution = function (steps) {

    var lang = this;

    console.log('LangPy.continueExecution steps='+steps);

    if (steps > 0 && lang.rt.cont) {

        var limit = lang.rt.stepCount + steps;

        while (lang.rt.stepCount < limit && lang.rt.cont) {
            var state = lang.rt.cont();
            if (!state) {
                lang.rt.cont = null;
                break;
            }
            lang.rt.stepCount++;
            lang.rt.ast = state[0];
            lang.rt.msg = state[1];
            lang.rt.cont = state[2];
            lang.rt.ctx = state[3];
        }
    }
};

LangPy.prototype.getStepCount = function () {
    var lang = this;
    return lang.rt.stepCount;
};

LangPy.prototype.isExecuting = function () {
    var lang = this;
    return lang.rt.cont !== null;
};

LangPy.prototype.isEndedWithResult = function () {
    var lang = this;
    return true;
};

LangPy.prototype.getResult = function () {
    var lang = this;
    return lang.rt.msg;
};

LangPy.prototype.getError = function () {
    var lang = this;
    return '***some error***';
};

LangPy.prototype.getLocation = function () {

    var lang = this;
    var ast = lang.rt.ast;

    return lang.absoluteLocation(ast.container,
                                 ast.lineno-1,
                                 ast.col_offset,
                                 ast.end_lineno-1,
                                 ast.end_col_offset);
};

LangPy.prototype.stopExecution = function () {

    var lang = this;

    lang.rt.cont = null;
};

LangPy.prototype.executionStateHTML = function () {

    var lang = this;
    var result = lang.rt.msg;
    var resultHTML = '' === result
                    ? '<i>no value</i>'
                    : lang.printedRepresentation(result, 'HTML');

    return '<div class="cb-exec-point-bubble-value">' +
           resultHTML +
           '</div>' +
           '<div class="cb-exec-point-bubble-context">' +
           '***unknown context***' +
           '</div>';
};

LangPy.prototype.printedRepresentation = function (obj, format) {

    var lang = this;

    if (format === void 0) {
        format = 'plain';
    }

    return lang.objectRepresentation(obj, format, 80).text;
};

LangPy.prototype.objectRepresentation = function (obj, format, limit) {

    var lang = this;

    var xform = function (str) {
        var text;
        if (format === 'HTML') {
            text = escape_HTML(str);
        } else {
            text = str;
        }
        return { text: text, len: str.length };
    };
    return xform(obj);
};

//-----------------------------------------------------------------------------

LangPy.prototype.initRunTimeState = function (code, reboot) {

    var lang = this;
    // default 'trace' option to false
    var options = { trace: false };

    console.log('LangPy.initRunTimeState reboot='+reboot);

    if (!lang.rt.rte || reboot) {
        lang.rt.rte = pyinterp.fresh_rte(options);
        lang.rt.rte.vm = lang.vm;
    }

    return pyinterp.prepare_execution(code, lang.rt.rte);
};

function print_stdout(msg, rte) {
    console.log("PRINTING TO STDOUT");
    console.log(msg);
    rte.vm.replAddTranscript(msg, 'cb-repl-output');
};
