// JavaScript builtins

function importFromHost(global) {

    var hostGlobalObject = (function () { return this; }());

    if (global in hostGlobalObject) {
        cb.addGlobal(global, hostGlobalObject[global]);
    }
}

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

cb.addGlobal("print", builtin_print);

// alert

function builtin_alert() {
    var hostGlobalObject = (function () { return this; }());
    return alert.apply(hostGlobalObject, arguments);
}

builtin_alert.toString = function () {
    return "function alert(value) { ... }";
};

cb.addGlobal("alert", builtin_alert);

// prompt

function builtin_prompt() {
    var hostGlobalObject = (function () { return this; }());
    return prompt.apply(hostGlobalObject, arguments);
}

builtin_prompt.toString = function () {
    return "function prompt(value) { ... }";
};

cb.addGlobal("prompt", builtin_prompt);

// load

builtin_load.toString = function () {
    return "function load(filename) { ... }";
};

cb.addGlobal("load", builtin_load);

// pause

builtin_pause.toString = function () {
    return "function pause() { ... }";
};

cb.addGlobal("pause", builtin_pause);

// assert

builtin_assert.toString = function () {
    return "function assert(condition) { ... }";
};

cb.addGlobal("assert", builtin_assert);

// setScreenMode

builtin_setScreenMode.toString = function () {
    return "function setScreenMode(width, height) { ... }";
};

cb.addGlobal("setScreenMode", builtin_setScreenMode);

// getScreenWidth

builtin_getScreenWidth.toString = function () {
    return "function getScreenWidth() { ... }";
};

cb.addGlobal("getScreenWidth", builtin_getScreenWidth);

// getScreenHeight

builtin_getScreenHeight.toString = function () {
    return "function getScreenHeight() { ... }";
};

cb.addGlobal("getScreenHeight", builtin_getScreenHeight);

// setPixel

builtin_setPixel.toString = function () {
    return "function setPixel(x, y, color) { ... }";
};

cb.addGlobal("setPixel", builtin_setPixel);

// cs

builtin_cs.toString = function () {
    return "function cs() { ... }";
};

cb.addGlobal("cs", builtin_cs);

// pu

builtin_pu.toString = function () {
    return "function pu() { ... }";
};

cb.addGlobal("pu", builtin_pu);

// pd

builtin_pd.toString = function () {
    return "function pd() { ... }";
};

cb.addGlobal("pd", builtin_pd);

// st

builtin_st.toString = function () {
    return "function st() { ... }";
};

cb.addGlobal("st", builtin_st);

// ht

builtin_ht.toString = function () {
    return "function ht() { ... }";
};

cb.addGlobal("ht", builtin_ht);

// fd

builtin_fd.toString = function () {
    return "function fd(distance) { ... }";
};

cb.addGlobal("fd", builtin_fd);

// bk

builtin_bk.toString = function () {
    return "function bk(distance) { ... }";
};

cb.addGlobal("bk", builtin_bk);

// lt

builtin_lt.toString = function () {
    return "function lt(angle) { ... }";
};

cb.addGlobal("lt", builtin_lt);

// rt

builtin_rt.toString = function () {
    return "function rt(angle) { ... }";
};

cb.addGlobal("rt", builtin_rt);

// setpc

builtin_setpc.toString = function () {
    return "function setpc(r, g, b) { ... }";
};

cb.addGlobal("setpc", builtin_setpc);

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

cb.addGlobal("setTimeout", builtin_setTimeout);

// clearTimeout

function builtin_clearTimeout(timeoutID) {
    var hostGlobalObject = (function () { return this; }());
    return clearTimeout.apply(hostGlobalObject, [timeoutID]);
}

builtin_clearTimeout.toString = function () {
    return "function clearTimeout(timeoutID) { ... }";
};

cb.addGlobal("clearTimeout", builtin_clearTimeout);
