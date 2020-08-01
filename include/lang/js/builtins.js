// JavaScript builtins

function importFromHost(global) {

    var hostGlobalObject = (function () { return this; }());

    if (global in hostGlobalObject) {
        cb.setGlobal(global, hostGlobalObject[global]);
    }
}

function exportToHost(global) {

    var hostGlobalObject = (function () { return this; }());

    hostGlobalObject[global] = function () {
        var fn = cb.getGlobal(global);
        return fn.apply(hostGlobalObject, arguments);
    };
}

exportToHost('clic');
exportToHost('init');

function importStandardFromHost() {

    importFromHost('NaN');
    importFromHost('Infinity');
    importFromHost('undefined');
    importFromHost('parseInt');
    importFromHost('parseFloat');
    importFromHost('isNaN');
    importFromHost('isFinite');
    importFromHost('decodeURI');
    importFromHost('encodeURI');
    importFromHost('decodeURIComponent');
    importFromHost('encodeURIComponent');

    importFromHost('Object');
    importFromHost('Function');
    importFromHost('Array');
    importFromHost('String');
    importFromHost('Boolean');
    importFromHost('Number');
    importFromHost('Date');
    importFromHost('RegExp');
    importFromHost('Error');
    importFromHost('EvalError');
    importFromHost('RangeError');
    importFromHost('ReferenceError');
    importFromHost('SyntaxError');
    importFromHost('TypeError');
    importFromHost('URIError');

    importFromHost('Math');
    importFromHost('JSON');

    importFromHost('document');
    //importFromHost('alert');
    //importFromHost('prompt');
}

importStandardFromHost();

// print

function builtin_print() {
    var args = Array.prototype.slice.call(arguments).map(function (x) {
        return (typeof x === 'object') ? cb.printedRepresentation(x) : x;
    });
    cb.addTranscriptREPL(args.join('') + '\n', 'cb-repl-output');
    cb.programState.rte.step_limit = -1; // force exit of trampoline
}

builtin_print.toString = function () {
    return 'function print(value) { ... }';
};

cb.setGlobal('print', builtin_print);

// alert

function builtin_alert() {
    var hostGlobalObject = (function () { return this; }());
    return alert.apply(hostGlobalObject, arguments);
}

builtin_alert.toString = function () {
    return 'function alert(value) { ... }';
};

cb.setGlobal('alert', builtin_alert);

// prompt

function builtin_prompt() {
    var hostGlobalObject = (function () { return this; }());
    return prompt.apply(hostGlobalObject, arguments);
}

builtin_prompt.toString = function () {
    return 'function prompt(value) { ... }';
};

cb.setGlobal('prompt', builtin_prompt);

// confirm

function builtin_confirm() {
    var hostGlobalObject = (function () { return this; }());
    return confirm.apply(hostGlobalObject, arguments);
}

builtin_confirm.toString = function () {
    return 'function confirm(value) { ... }';
};

cb.setGlobal('confirm', builtin_confirm);

// load

builtin_load.toString = function () {
    return 'function load(filename) { ... }';
};

cb.setGlobal('load', builtin_load);

// pause

builtin_pause.toString = function () {
    return 'function pause() { ... }';
};

cb.setGlobal('pause', builtin_pause);

// assert

builtin_assert.toString = function () {
    return 'function assert(condition) { ... }';
};

cb.setGlobal('assert', builtin_assert);

// setScreenMode

builtin_setScreenMode.toString = function () {
    return 'function setScreenMode(width, height) { ... }';
};

cb.setGlobal('setScreenMode', builtin_setScreenMode);

// getScreenWidth

builtin_getScreenWidth.toString = function () {
    return 'function getScreenWidth() { ... }';
};

cb.setGlobal('getScreenWidth', builtin_getScreenWidth);

// getScreenHeight

builtin_getScreenHeight.toString = function () {
    return 'function getScreenHeight() { ... }';
};

cb.setGlobal('getScreenHeight', builtin_getScreenHeight);

// setPixel

builtin_setPixel.toString = function () {
    return 'function setPixel(x, y, color) { ... }';
};

cb.setGlobal('setPixel', builtin_setPixel);

// fillRectangle

builtin_fillRectangle.toString = function () {
    return 'function fillRectangle(x, y, width, height, color) { ... }';
};

cb.setGlobal('fillRectangle', builtin_fillRectangle);

// exportScreen

builtin_exportScreen.toString = function () {
    return 'function exportScreen() { ... }';
};

cb.setGlobal('exportScreen', builtin_exportScreen);

// getMouse

builtin_getMouse.toString = function () {
    return 'function getMouse() { ... }';
};

cb.setGlobal('getMouse', builtin_getMouse);

// cs

builtin_cs.toString = function () {
    return 'function cs() { ... }';
};

cb.setGlobal('cs', builtin_cs);

// pu

builtin_pu.toString = function () {
    return 'function pu() { ... }';
};

cb.setGlobal('pu', builtin_pu);

// pd

builtin_pd.toString = function () {
    return 'function pd() { ... }';
};

cb.setGlobal('pd', builtin_pd);

// st

builtin_st.toString = function () {
    return 'function st() { ... }';
};

cb.setGlobal('st', builtin_st);

// ht

builtin_ht.toString = function () {
    return 'function ht() { ... }';
};

cb.setGlobal('ht', builtin_ht);

// fd

builtin_fd.toString = function () {
    return 'function fd(xdistance, ydistance) { ... }';
};

cb.setGlobal('fd', builtin_fd);

// bk

builtin_bk.toString = function () {
    return 'function bk(xdistance, ydistance) { ... }';
};

cb.setGlobal('bk', builtin_bk);

// mv

builtin_mv.toString = function () {
    return 'function mv(x, y) { ... }';
};

cb.setGlobal('mv', builtin_mv);

// lt

builtin_lt.toString = function () {
    return 'function lt(angle) { ... }';
};

cb.setGlobal('lt', builtin_lt);

// rt

builtin_rt.toString = function () {
    return 'function rt(angle) { ... }';
};

cb.setGlobal('rt', builtin_rt);

// setpc

builtin_setpc.toString = function () {
    return 'function setpc(r, g, b) { ... }';
};

cb.setGlobal('setpc', builtin_setpc);

// setpw

builtin_setpw.toString = function () {
    return 'function setpw(width) { ... }';
};

cb.setGlobal('setpw', builtin_setpw);

// drawtext

builtin_drawtext.toString = function () {
    return 'function drawtext(text) { ... }';
};

cb.setGlobal('drawtext', builtin_drawtext);

// setTimeout

function builtin_setTimeout(func, delay) {
    throw 'setTimeout must be called from codeBoot code';
}

builtin_setTimeout.toString = function () {
    return 'function setTimeout(func, delay) { ... }';
};

builtin_setTimeout._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        var func = params[0];
        var delay = params[1];
        var args = params.slice(2);

        if (params.length < 2) {
            throw 'setTimeout expects at least 2 parameters';
        }

        if (typeof func !== 'function' || !('_apply_' in func)) {
            throw 'func parameter of setTimeout must be a function';
        }

        if (typeof delay !== 'number') {
            throw 'delay parameter of setTimeout must be a number';
        }

        var hostGlobalObject = (function () { return this; }());

        var f = function () {
            code_queue_add(
                function (rte, cont) {
                    return func._apply_(rte, cont, rte.glo, args);
                });
        };

        var result = setTimeout.apply(hostGlobalObject, [f, delay]);

        return return_fn_body(rte, result);
    };

    return exec_fn_body(code,
                        builtin_setTimeout,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

cb.setGlobal('setTimeout', builtin_setTimeout);

// clearTimeout

function builtin_clearTimeout(timeoutID) {
    var hostGlobalObject = (function () { return this; }());
    return clearTimeout.apply(hostGlobalObject, [timeoutID]);
}

builtin_clearTimeout.toString = function () {
    return 'function clearTimeout(timeoutID) { ... }';
};

cb.setGlobal('clearTimeout', builtin_clearTimeout);

// readFile

builtin_readFile.toString = function () {
    return 'function readFile(filename) { ... }';
};

cb.setGlobal('readFile', builtin_readFile);

// writeFile

builtin_writeFile.toString = function () {
    return 'function writeFile(filename, content) { ... }';
};

cb.setGlobal('writeFile', builtin_writeFile);
