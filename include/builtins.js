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

exportToHost("clic");
exportToHost("init");

function importStandardFromHost() {

    importFromHost("NaN");
    importFromHost("Infinity");
    importFromHost("undefined");
    importFromHost("parseInt");
    importFromHost("parseFloat");
    importFromHost("isNaN");
    importFromHost("isFinite");
    importFromHost("decodeURI");
    importFromHost("encodeURI");
    importFromHost("decodeURIComponent");
    importFromHost("encodeURIComponent");

    importFromHost("Object");
    importFromHost("Function");
    importFromHost("Array");
    importFromHost("String");
    importFromHost("Boolean");
    importFromHost("Number");
    importFromHost("Date");
    importFromHost("RegExp");
    importFromHost("Error");
    importFromHost("EvalError");
    importFromHost("RangeError");
    importFromHost("ReferenceError");
    importFromHost("SyntaxError");
    importFromHost("TypeError");
    importFromHost("URIError");

    importFromHost("Math");
    importFromHost("JSON");

    importFromHost("document");
    //importFromHost("alert");
    //importFromHost("prompt");
}

importStandardFromHost();

// print

function builtin_print() {
    cb.transcript.addLine(Array.prototype.slice.call(arguments).join(""), "transcript-output");
}

builtin_print.toString = function () {
    return "function print(value) { ... }";
};

cb.setGlobal("print", builtin_print);

// alert

function builtin_alert() {
    var hostGlobalObject = (function () { return this; }());
    return alert.apply(hostGlobalObject, arguments);
}

builtin_alert.toString = function () {
    return "function alert(value) { ... }";
};

cb.setGlobal("alert", builtin_alert);

// prompt

function builtin_prompt() {
    var hostGlobalObject = (function () { return this; }());
    return prompt.apply(hostGlobalObject, arguments);
}

builtin_prompt.toString = function () {
    return "function prompt(value) { ... }";
};

cb.setGlobal("prompt", builtin_prompt);

// load

builtin_load.toString = function () {
    return "function load(filename) { ... }";
};

cb.setGlobal("load", builtin_load);

// pause

builtin_pause.toString = function () {
    return "function pause() { ... }";
};

cb.setGlobal("pause", builtin_pause);

// assert

builtin_assert.toString = function () {
    return "function assert(condition) { ... }";
};

cb.setGlobal("assert", builtin_assert);

// setScreenMode

builtin_setScreenMode.toString = function () {
    return "function setScreenMode(width, height) { ... }";
};

cb.setGlobal("setScreenMode", builtin_setScreenMode);

// getScreenWidth

builtin_getScreenWidth.toString = function () {
    return "function getScreenWidth() { ... }";
};

cb.setGlobal("getScreenWidth", builtin_getScreenWidth);

// getScreenHeight

builtin_getScreenHeight.toString = function () {
    return "function getScreenHeight() { ... }";
};

cb.setGlobal("getScreenHeight", builtin_getScreenHeight);

// setPixel

builtin_setPixel.toString = function () {
    return "function setPixel(x, y, color) { ... }";
};

cb.setGlobal("setPixel", builtin_setPixel);

// exportScreen

builtin_exportScreen.toString = function () {
    return "function exportScreen() { ... }";
};

cb.setGlobal("exportScreen", builtin_exportScreen);

// cs

builtin_cs.toString = function () {
    return "function cs() { ... }";
};

cb.setGlobal("cs", builtin_cs);

// pu

builtin_pu.toString = function () {
    return "function pu() { ... }";
};

cb.setGlobal("pu", builtin_pu);

// pd

builtin_pd.toString = function () {
    return "function pd() { ... }";
};

cb.setGlobal("pd", builtin_pd);

// st

builtin_st.toString = function () {
    return "function st() { ... }";
};

cb.setGlobal("st", builtin_st);

// ht

builtin_ht.toString = function () {
    return "function ht() { ... }";
};

cb.setGlobal("ht", builtin_ht);

// fd

builtin_fd.toString = function () {
    return "function fd(distance) { ... }";
};

cb.setGlobal("fd", builtin_fd);

// bk

builtin_bk.toString = function () {
    return "function bk(distance) { ... }";
};

cb.setGlobal("bk", builtin_bk);

// lt

builtin_lt.toString = function () {
    return "function lt(angle) { ... }";
};

cb.setGlobal("lt", builtin_lt);

// rt

builtin_rt.toString = function () {
    return "function rt(angle) { ... }";
};

cb.setGlobal("rt", builtin_rt);

// setpc

builtin_setpc.toString = function () {
    return "function setpc(r, g, b) { ... }";
};

cb.setGlobal("setpc", builtin_setpc);

// setpw

builtin_setpc.toString = function () {
    return "function setpw(width) { ... }";
};

cb.setGlobal("setpw", builtin_setpw);

// drawtext

builtin_drawtext.toString = function () {
    return "function drawtext(text) { ... }";
};

cb.setGlobal("drawtext", builtin_drawtext);

// setTimeout

function builtin_setTimeout(func, delay) {
    throw "setTimeout must be called from codeBoot code";
}

builtin_setTimeout.toString = function () {
    return "function setTimeout(func, delay) { ... }";
};

builtin_setTimeout._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        var func = params[0];
        var delay = params[1];
        var args = params.slice(2);

        if (params.length < 2) {
            return abort_fn_body(rte, void 0, "setTimeout expects at least 2 parameters");
        }

        if (typeof func !== "function" || !("_apply_" in func)) {
            return abort_fn_body(rte, void 0, "func parameter of setTimeout must be a function");
        }

        if (typeof delay !== "number") {
            return abort_fn_body(rte, void 0, "delay parameter of setTimeout must be a number");
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

cb.setGlobal("setTimeout", builtin_setTimeout);

// clearTimeout

function builtin_clearTimeout(timeoutID) {
    var hostGlobalObject = (function () { return this; }());
    return clearTimeout.apply(hostGlobalObject, [timeoutID]);
}

builtin_clearTimeout.toString = function () {
    return "function clearTimeout(timeoutID) { ... }";
};

cb.setGlobal("clearTimeout", builtin_clearTimeout);

// readFile

builtin_readFile.toString = function () {
    return "function readFile(filename) { ... }";
};

cb.setGlobal("readFile", builtin_readFile);

// writeFile

builtin_writeFile.toString = function () {
    return "function writeFile(filename, content) { ... }";
};

cb.setGlobal("writeFile", builtin_writeFile);
