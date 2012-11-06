function print() {
    cp.transcript.addLine(Array.prototype.slice.call(arguments).join(""), "transcript-output");
}

print.toString = function () {
    return "function print() { [native code] }";
};

function println() {
    cp.transcript.addLine(Array.prototype.slice.call(arguments).join(""), "transcript-output");
}

println.toString = function () {
    return "function println() { [native code] }";
};

var load = builtin_load;

load.toString = function () {
    return "function load() { [native code] }";
};

var pause = builtin_pause;

pause.toString = function () {
    return "function pause() { [native code] }";
};

var assert = builtin_assert;

assert.toString = function () {
    return "function assert() { [native code] }";
};

var setScreenMode = builtin_setScreenMode;

setScreenMode.toString = function () {
    return "function setScreenMode() { [native code] }";
};

var getScreenWidth = builtin_getScreenWidth;

getScreenWidth.toString = function () {
    return "function getScreenWidth() { [native code] }";
};

var getScreenHeight = builtin_getScreenHeight;

getScreenHeight.toString = function () {
    return "function getScreenHeight() { [native code] }";
};

var setPixel = builtin_setPixel;

setPixel.toString = function () {
    return "function setPixel() { [native code] }";
};
