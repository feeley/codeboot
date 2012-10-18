function print() {
    cp.addLineToTranscript(Array.prototype.slice.call(arguments).join(""), null);
}

print.toString = function () {
    return "function print() { [native code] }";
};

function println() {
    cp.addLineToTranscript(Array.prototype.slice.call(arguments).join(""), null);
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
