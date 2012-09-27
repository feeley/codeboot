function print(s) {

    cp.addLineToTranscript(s, null);

/*
    if (cp.currentConsoleLine) {
        $(cp.currentConsoleLine).append($("<span/>").text(s));
    } else {
        cp.currentConsoleLine = document.createElement('span');
        cp.console.appendChild(cp.currentConsoleLine);
        $(cp.currentConsoleLine).addClass("console-output").text(s);
    }
    
    if (s.charAt(s.length - 1) === "\n") {
        cp.currentConsoleLine = undefined;
    }
*/
}

print.toString = function () {
    return "function print() { [native code] }";
};

function println(s) {

    cp.addLineToTranscript(s, null);

/*
    if (cp.currentConsoleLine) {
        $(cp.currentConsoleLine).append($("<span/>").text(s));
        cp.currentConsoleLine = undefined;
        $(cp.console).append("\n");
    } else {
        cp.addLineToConsole(s, "console-output");
    }
*/
}

println.toString = function () {
    return "function println() { [native code] }";
};
