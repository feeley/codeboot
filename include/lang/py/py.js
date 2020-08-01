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
        ext: '.py',
        levels: ['novice', 'standard'],
        prompt: '>>>',
        promptCont: '...',
        editorOpts: { mode: 'python', indentUnit: 4 },
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
    rt.stepCount = 0;
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
                ast.lineno += container.start_line-1;
                ast.end_lineno += container.start_line-1;
                for (var i in ast._fields) {
                    attach_to_container(ast[ast._fields[i]], container);
                }
            } else if (ast instanceof Array) {
                ast.forEach(function (a) { attach_to_container(a, container); });
            }
        }

    }

    console.log('LangPy.compile');

    var lang = this;
    var ast = pyinterp.parse(source);

    attach_to_container(ast, container);

    var code = pyinterp.comp(ast);

    if (code === null) // empty program?
        return null;

    return function (rte, cont) {
               var rte = lang.initRunTimeState(reboot);
               return code(rte, cont);
           };
};

LangPy.prototype.startExecution = function (code) {

    var lang = this;

    console.log('LangPy.startExecution');

    lang.rt.stepCount = 0;
    lang.rt.ast = null;
    lang.rt.msg = '';
    lang.rt.cont = function () {
                       return code(null, // no rte yet
                                   function () {
                                       lang.rt.cont = null; // end execution
                                       return null;
                                   });
                   };
};

LangPy.prototype.continueExecution = function (steps) {

    var lang = this;

    console.log('LangPy.continueExecution steps='+steps);

    if (steps > 0 && lang.rt.cont !== null) {

        var limit = lang.rt.stepCount + steps;

        while (lang.rt.stepCount < limit && lang.rt.cont !== null) {
            var state = lang.rt.cont();
            if (state === null) break;
            lang.rt.stepCount++;
            lang.rt.ast = state.ast;
            lang.rt.msg = state.msg;
            lang.rt.cont = state.cont;
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

    return { container: ast.container,
             start_pos: line_and_column_to_position(ast.lineno-1, ast.col_offset),
             end_pos: line_and_column_to_position(ast.end_lineno-1, ast.end_col_offset)
           };
};

LangPy.prototype.stopExecution = function () {

    var lang = this;

    lang.rt.cont = null;
};

LangPy.prototype.executionStateHTML = function () {

    var lang = this;

    return '<div class="cb-exec-point-bubble-value">' +
           lang.rt.msg +
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
    var text = String(obj);

    return { text: text, len: text.length };
};

//-----------------------------------------------------------------------------

LangPy.prototype.initRunTimeState = function (reboot) {

    var lang = this;

    console.log('LangPy.initRunTimeState reboot='+reboot);

    return pyinterp.run();  // method should be renamed...
};
