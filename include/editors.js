function getFullScreenWrapper(cm) {
    return $(cm.getWrapperElement()).parent();
}

function isFullScreen(cm) {
  return getFullScreenWrapper(cm).hasClass("CodeMirror-fullscreen");
}

function setFullScreen(cm, full) {
    var $wrapper = getFullScreenWrapper(cm);
    var consoleOffset = $("#floating-console").offset()
    $wrapper
        .toggleClass("CodeMirror-fullscreen", full)
        .css("top", full ? consoleOffset.top : 0)
        .css("left", full ? consoleOffset.left : 0)
        .css("right", full ? consoleOffset.left : 0);
    cb.makeEditorResizable(cm, !full);
    cm.refresh();

    // $("#editors").css("visibility", full ? "hidden" : "visible");
    $("#floating-console").css("visibility", full ? "hidden" : "visible");
}

function createCodeEditor(node) {
    var options = {
        value: "",
        mode:  "javascript",
        indentUnit: 4,       // Indent with 4 spaces
        lineNumbers:  cb.options.showLineNumbers,   // Show line numbers
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
             },
             "F11": function(cm) {
                setFullScreen(cm, !isFullScreen(cm));
             },
             "Esc": function(cm) {
                if (isFullScreen(cm)) setFullScreen(cm, false);
             }
        },

        onDragEvent: function(cm, event) {
            if (event.type === "drop") {
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer;
                var files = dt.files;
                cb.loadFile(cm, files[0]);
                return true;
            } else if (event.type === "dragover") {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
        }
    };

    var editor = CodeMirror(node, options);
    editor.on("scroll", cb_internal_updatePopupPos);
    editor.on("focus", function () { cb.lastEditor = editor; });
    return editor;
}

cb.makeEditorResizable = function (editor, enable) {
    // Make editor resizable
    var $wrapper = $(editor.getWrapperElement());

    if (enable === (void 0) || enable === true) {
        $wrapper.resizable({
              handles: "s",
              minHeight: 100,
              stop: function() {
                $wrapper.css("width", "auto");
                editor.refresh();
              },
              resize: function() {
                  var $scroller = $(editor.getScrollerElement());
                  $scroller.height($(this).height());
                  $scroller.width($(this).width());
                  editor.refresh();
              }
        });
    } else {
        $wrapper.resizable("destroy");
    }
}

cb.loadFile = function (cm, f) {
    if (!cm) return;

    cb_internal_readTextFile(f, function(contents) {
        cm.setValue(contents);
    });
};

function cb_internal_readTextFile(f, callback) {
    if (!Modernizr.filereader) {
        cb.reportError("File is reader not supported by the browser");
    } else {
        var reader = new FileReader();
        reader.onerror = function (e) {
            cb.reportError("File read failed");
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
        gutters: ["CodeMirror-linenumbers", "cb-prompt"],
        readOnly: "nocursor",
        lineWrapping: true
    };
    var editor = CodeMirror(node, options);
    editor.on("scroll", cb_internal_updatePopupPos);
    editor.on("focus", function () { cb.lastEditor = editor; });
    return editor;
}

var default_prompt = ">";

var set_prompt = function (cm, prompt) {
   if (prompt === void 0) {
       cm.setGutterMarker(0, "cb-prompt", document.createTextNode(default_prompt));
       $("#repl").removeClass("busy");
   } else {
       cm.setGutterMarker(0, "cb-prompt", null);
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
        gutters: ["CodeMirror-linenumbers", "cb-prompt"],
        extraKeys: {
            "Ctrl-C": function (cm) { cb.clearREPL(); cm.cb.history.resetPos(); },
            "Ctrl-L": function (cm) { cb.clearAll(); cm.cb.history.resetPos(); },
            "Ctrl-Enter": function(cm) { cm.autoInsertBraces(cm); },
            "Shift-Enter": function(cm) { cb.animate(0); },
            "Enter": function(cm) { cb.run(false); },
            "Up": function (cm) {
                cm.cb.history.previous();
                return true;
            },
            "Down": function (cm) {
                cm.cb.history.next();
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
    editor.on("focus", function () { cb.lastEditor = editor; });
    editor.cb = {};
    editor.cb.history = new REPLHistoryManager(editor);
    editor.busy = false;
    editor.focus();
    set_prompt(editor);
    editor.setGutterMarker(0, "cb-prompt", document.createTextNode(">"));
    return editor;
}
