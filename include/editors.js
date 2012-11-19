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
            "Ctrl-\\": function (cm) { Mousetrap.trigger("ctrl+\\"); },
            "Ctrl-I" : function (cm) { cm.autoFormatRange(cm.getCursor(true), cm.getCursor(false)); },
            "Ctrl-/" : function (cm) {
                var tok = cm.getTokenAt(cm.getCursor(false));
                var isComment = tok.className === "comment";
                cm.commentRange(!isComment, cm.getCursor(true), cm.getCursor(false));
             }
        },

        onDragEvent: function(cm, event) {
            if (event.type === "drop") {
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer;
                var files = dt.files;
                bc.loadFile(cm, files[0]);
                return true;
            } else if (event.type === "dragover") {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
        }
    };

    var editor = CodeMirror(node, options);
    editor.on("scroll", bc_internal_updatePopupPos);
    editor.on("focus", function () { bc.lastEditor = editor; });
    return editor;
}

bc.loadFile = function (cm, f) {
    if (!cm) return;

    bc_internal_readTextFile(f, function(contents) {
        cm.setValue(contents);
    });
};

function bc_internal_readTextFile(f, callback) {
    if (!Modernizr.filereader) {
        bc.reportError("File is reader not supported by the browser");
    } else {
        var reader = new FileReader();
        reader.onerror = function (e) {
            bc.reportError("File read failed");
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
        gutters: ["CodeMirror-linenumbers", "bc-prompt"],
        readOnly: "nocursor",
        lineWrapping: true
    };
    var editor = CodeMirror(node, options);
    editor.on("scroll", bc_internal_updatePopupPos);
    editor.on("focus", function () { bc.lastEditor = editor; });
    return editor;
}

var default_prompt = ">";

var set_prompt = function (cm, prompt) {
   if (prompt === void 0) {
       cm.setGutterMarker(0, "bc-prompt", document.createTextNode(default_prompt));
       $("#repl").removeClass("busy");
   } else {
       cm.setGutterMarker(0, "bc-prompt", null);
       $("#repl").addClass("busy");
   }

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
        gutters: ["CodeMirror-linenumbers", "bc-prompt"],
        extraKeys: {
            "Ctrl-C": function (cm) { bc.clearREPL(); cm.bc.history.resetPos(); },
            "Ctrl-L": function (cm) { bc.clearAll(); cm.bc.history.resetPos(); },
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm); },
            "Shift-Enter": function(cm) { bc.run(true); },
            "Enter": function(cm) { bc.run(false); },
            "Up": function (cm) {
                cm.bc.history.previous();
                return true;
            },
            "Down": function (cm) {
                cm.bc.history.next();
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
    editor.on("focus", function () { bc.lastEditor = editor; });
    editor.bc = {};
    editor.bc.history = new REPLHistoryManager(editor);
    editor.busy = false;
    editor.focus();
    set_prompt(editor);
    editor.setGutterMarker(0, "bc-prompt", document.createTextNode(">"));
    return editor;
}
