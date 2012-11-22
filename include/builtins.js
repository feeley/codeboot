// JavaScript builtins

function importFromHost(global) {

    var hostGlobalObject = (function () { return this; }());

    if (hostGlobalObject.hasOwnProperty(global)) {
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
    importFromHost("alert");
    importFromHost("prompt");
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
