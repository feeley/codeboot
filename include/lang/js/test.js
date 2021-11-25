var cp = {};

cp.repl = document.getElementById("repl");

//cp.cm = CodeMirror(cp.repl, { readOnly: "nocursor" });
cp.cm = CodeMirror(cp.repl, {});

var line = 0;
var count = 0;

cp.step = function () {

        var node = document.createElement("div");
        node.textContent = "after line " + line + " widget #"+ (++count);
        node.className = "error-message";
        cp.cm.addLineWidget(line, node);

//    alert("step");

};

cp.play = function () {

    line++;
//    alert("play");

};

cp.clear = function () {

cp.cm.replaceRange("Line " + (cp.cm.lineCount()-1) + " : foobar\n", cp.cm.getCursor(false));


//    alert("clear");

};

cp.cancel = function () {

cp.cm.replaceRange("(on line " + (cp.cm.lineCount()-1) + ")", cp.cm.getCursor(false));
//    alert("cancel");

};
