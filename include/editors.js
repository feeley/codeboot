function createCodeEditor(node) {
    var options = {
        value: "",
        mode:  "javascript",
        indentUnit: 4,       // Indent with 4 spaces
        lineNumbers:  false,   // Show line numbers
        matchBrackets: true,
        extraKeys: {
            "Enter": function(cm) { cm.autoInsertBraces(cm); },
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm); },
            "Ctrl-\\": function (cm) { Mousetrap.trigger("ctrl+\\"); }
        },

        onDragEvent: function(cm, event) {
            if (event.type === "drop") {
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer;
                var files = dt.files;
                cp.loadFile(cm, files[0]);
                return true;
            } else if (event.type === "dragover") {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
        }
    };

    var editor = CodeMirror(node, options);
    // editor.save = cp.save; // TODO
    return editor;
}

cp.loadFile = function (cm, f) {
    if (!cm) return;

    cp_internal_readTextFile(f, function(contents) {
        cm.setValue(contents);
    });
};

function cp_internal_readTextFile(f, callback) {
    if (!Modernizr.filereader) {
        cp.reportError("File is reader not supported by the browser");
    } else {
        var reader = new FileReader();
        reader.onerror = function (e) {
            cp.reportError("File read failed");
        };
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsText(f);
    }
}

// ================================================================================
//                                       REPL
// ================================================================================

function REPLHistoryManager(cm) {
    this.editor = cm;
    this.history = [];
    this.pos = 0;
    this.limit = 100; // TODO: make this configurable
    this.currentLine = undefined;
}

REPLHistoryManager.prototype.setEditorValue = function (v) {
    this.editor.setValue(v);
    this.editor.refresh();
    CodeMirror.commands.goLineEnd(this.editor);
};

REPLHistoryManager.prototype.resetPos = function () {
    this.pos = this.history.length;
    this.currentLine = undefined;
};

REPLHistoryManager.prototype.add = function (line) {
    this.history.push(line);
    while (this.history.length > this.limit) {
        this.history.shift();
    }
    this.resetPos();
};

REPLHistoryManager.prototype.previous = function () {
    var index = this.pos - 1;
    if (this.pos === this.history.length) {
        // Remember the current line to be able to restore it later, if needed
        this.currentLine = this.editor.getValue();
    }
    if (index >= 0) {
        // Restore previous history item
        this.setEditorValue(this.history[index]);
        this.pos = index;
    }
};

REPLHistoryManager.prototype.serializeState = function () {
    return {
        history: this.history
    };
};

REPLHistoryManager.prototype.restoreState = function (state) {
    this.history = state.history;
    this.resetPos();
};


REPLHistoryManager.prototype.next = function () {
    var index = this.pos + 1;
    if (index < this.history.length) {
        this.setEditorValue(this.history[index]);
        this.pos = index;
    }  else if (index === this.history.length) {
        this.setEditorValue(this.currentLine);
        this.resetPos();
    }
};

function createTranscript(node) {
    var options = {
        mode:  "javascript",
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers:  false,   // Show line numbers
        matchBrackets: true,
        gutters: ["CodeMirror-linenumbers", "cp-prompt"],
        readOnly: "nocursor",
        lineWrapping: true
    };
    var editor = CodeMirror(node, options);
    return editor;
}

var default_prompt = "> ";

var set_prompt = function (cm, prompt) {
//    if (prompt === void 0)
//        prompt = default_prompt;
    set_input(cm, "");
};

var set_input = function (cm, str) {
    cm.setValue(str);
    cm.setCursor(0, str.length);
};

function createREPL(node) {

    var options = {
        mode:  "javascript",
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers:  false,   // Show line numbers
        matchBrackets: true,
        gutters: ["CodeMirror-linenumbers", "cp-prompt"],
        extraKeys: {
            "Ctrl-C": function (cm) { cp.clearREPL(); cm.cp.history.resetPos(); },
            "Ctrl-L": function (cm) { cp.clearAll(); cm.cp.history.resetPos(); },
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm); },
            "Shift-Enter": function(cm) { cp.run(true); },
            "Enter": function(cm) { cp.run(false); },
            "Up": function (cm) {
                cm.cp.history.previous();
                return true;
            },
            "Down": function (cm) {
                cm.cp.history.next();
                return true;
            },
            "Ctrl-\\": function (cm) { Mousetrap.trigger("ctrl+\\"); }
        },
        onKeyEvent: function (cm, event) {
            if (cm.busy) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
        lineWrapping: true
    };
    var editor = CodeMirror(node, options);
    editor.cp = {};
    editor.cp.history = new REPLHistoryManager(editor);
    editor.busy = false;
    editor.focus();
    set_prompt(editor);
    editor.setGutterMarker(0, "cp-prompt", document.createTextNode(">"));
    return editor;
}
