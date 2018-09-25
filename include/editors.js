CodeBoot.prototype.initEditor = function (editor, node, history, fileEditor) {
    editor.cb = {};
    editor.cb.node = node;
    editor.cb.history = history;
    editor.cb.fileEditor = fileEditor;
    editor.cb.widgets = [];
    editor.cb.transcriptMarker = null;
    cb.setTranscriptMarker(editor, cb.beginningOfEditor());
};

CodeBoot.prototype.trackEditorFocus = function (editor, focus) {
    if (focus) {
        cb.lastFocusedEditor = editor;
        if (editor === cb.repl) {
            $('body').addClass('cb-focus-repl');
        } else {
            $('body').removeClass('cb-focus-repl');
        }
    } else if (!cb.allowLosingFocus) {
        setTimeout(function () {
            cb.focusLastFocusedEditor();
        }, 0);
    }
};

CodeBoot.prototype.initEditorFocusHandling = function (editor) {

    editor.on('focus', function (cm, event) {
        cb.trackEditorFocus(editor, true);
    });

    editor.on('blur', function (cm, event) {
        cb.trackEditorFocus(editor, false);
    });
};

CodeBoot.prototype.initEditorScrollHandling = function (editor) {

    editor.on('scroll', function (cm) {
        cb.updatePopupPos();
    });

};

CodeBoot.prototype.createCodeEditor = function (node, fileEditor) {

    var options = {
        value: '',
        mode: 'javascript',
        indentUnit: 4,       // Indent with 4 spaces
        lineNumbers:  cb.options.showLineNumbers,   // Show line numbers
        cursorScrollMargin: 0,
        gutters: ['CodeMirror-linenumbers', 'cb-file-cm-gutter'],
        fixedGutter: false,
        matchBrackets: true,
        extraKeys: {

            //TODO: reenable
            //'Ctrl-/' : function (cm) {
            //    var tok = cm.getTokenAt(cm.getCursor(false));
            //    var isComment = tok.className === 'comment';
            //    cm.commentRange(!isComment, cm.getCursor(true), cm.getCursor(false));
            // },

            'Ctrl-L': function (cm) { cb.resetREPL(); },
            'Esc': function (cm) { cb.eventStop(); },
            'Enter': function (cm) { if (cb.programState.mode === cb.modeStopped()) return CodeMirror.Pass; cb.eventStep(); },
            'Shift-Enter': function (cm) { cb.eventStep(); },
            'Shift-Ctrl-Enter': function (cm) { cb.eventEval(); },
            'F5' : function (cm) { cb.eventStep(); },
            'F6' : function (cm) { cb.eventAnimate(); },
            'F7' : function (cm) { cb.eventEval(); },
            'F8' : function (cm) { cb.eventStop(); }
        },

        onDragEvent: function(cm, event) {
            if (event.type === 'drop') {
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer;
                var files = dt.files;
                cb.loadFile(cm, files[0]);
                return true;
            } else if (event.type === 'dragover') {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
        }
        //,viewportMargin: Infinity
    };

    var editor = CodeMirror.fromTextArea(node, options);

    cb.initEditor(editor, node, null, fileEditor);
    cb.initEditorFocusHandling(editor);
    cb.initEditorScrollHandling(editor);

    return editor;
};

cb.loadFile = function (cm, f) {
    if (!cm) return;

    cb_internal_readTextFile(f, function(contents) {
        cm.setValue(contents);
    });
};

function cb_internal_readTextFile(f, callback) {
    if (typeof FileReader === 'undefined') {
        cb.reportError('File is reader not supported by the browser');
        return;
    }

    var reader = new FileReader();
    reader.onerror = function (e) {
        cb.reportError('Failed to read file');
    };
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsText(f);
}

// ================================================================================
//                                       REPL
// ================================================================================

function REPLHistoryManager() {
    this.history = [];
    this.pos = 0;
    this.limit = 100; // TODO: make this configurable
    this.currentLine = undefined;
}

REPLHistoryManager.prototype.setEditorValue = function (v) {
    cb.setPromptREPL(true, v);
    cb.repl.refresh();
    CodeMirror.commands.goLineEnd(cb.repl);
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
        this.currentLine = cb.getInputREPL();
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

CodeBoot.prototype.createREPLTranscript = function () {

    var options = {
        mode:  'javascript',
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers:  false,   // Show line numbers
        matchBrackets: false,
        cursorScrollMargin: 0,
        gutters: ['CodeMirror-linenumbers', 'cb-repl-cm-gutter'],
        fixedGutter: false,
        readOnly: 'nocursor',
        //viewportMargin: Infinity,
        lineWrapping: true
    };

    var node = document.getElementById('cb-repl-transcript');

    var editor = CodeMirror(node, options);

    cb.initEditor(editor, node, null, null);
    cb.initEditorScrollHandling(editor);

    return new CBTranscript(editor);
};

function CBTranscript(editor) {
    this.editor = editor;
    this.is_empty = true;
    this.widgets = [];
}

CBTranscript.prototype.onTranscriptChanged = function () {
};

CBTranscript.prototype.clear = function () {
    this.show(); // this seems to avoid initialization problems
    for (var i = 0; i < this.widgets.length; i++) {
        this.editor.removeLineWidget(this.widgets[i]);
    }
    this.editor.setValue('');
    this.editor.refresh();
    this.is_empty = true;
    this.hide();
};

CBTranscript.prototype.show = function () {
    $('#cb-repl-transcript').show();
    $('body').attr('data-cb-has-transcript', 'true');
    this.onTranscriptChanged();
};

CBTranscript.prototype.hide = function () {
    $('body').attr('data-cb-has-transcript', 'false');
    $('#cb-repl-transcript').hide();
    this.onTranscriptChanged();
};

CBTranscript.prototype.addTextLine = function (text, cssClass) {
    var editor = this.editor;
    text = removeTrailingNewline(text);
    // CodeMirror needs to be visible to the updates to the gutter to work...
    if (this.is_empty) this.show();

    var line;
    if (this.is_empty) {
        line = 0;
    } else {
        text = '\n' + text;
        line = editor.lineCount();
    }

    editor.replaceRange(text, { line: line, ch: 0 });
    editor.markText({ line: line, ch: 0 }, { line: line+1, ch: 0 }, {className : cssClass});

    if (editor.lineInfo(line).gutterMarkers) {
        // Oops, CodeMirror moved the gutter down instead of appending a blank line
        // We'll set the gutter back on the previous line (ugly!)
        line -= 1;
    }
    if (cssClass === 'transcript-input')
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', document.createTextNode('>'));
    this.is_empty = false;

//    cb.scrollToEnd(this.editor);

    this.onTranscriptChanged();
};

CBTranscript.prototype.addLineWidget = function (textOrNode, cssClass) {
    // CodeMirror needs to be visible to the updates to the gutter to work...
    if (this.is_empty) this.show();

    var widget;
    if (typeof textOrNode === 'string') {
        var text = removeTrailingNewline(textOrNode);
        var $widget = $('<div/>');
        if (cssClass) $widget.addClass(cssClass);
        $widget.text(text);
        widget = $widget.get(0);
    } else {
        widget = textOrNode;
    }
    var w = this.editor.addLineWidget(this.editor.lineCount() - 1, widget);
    this.widgets.push(w);

//    cb.scrollToEnd(this.editor);

    this.onTranscriptChanged();
};

CBTranscript.prototype.addLine = function (text, cssClass) {
    var line;

    if (cssClass === 'transcript-input') {
        this.addTextLine(text, cssClass);
    } else {
        this.addLineWidget(text, cssClass);
    }
};

CodeBoot.prototype.createREPL = function () {

    var options = {
        mode: 'javascript',
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers: false,    // Show line numbers
        matchBrackets: true,
        cursorScrollMargin: 0,
        gutters: ['CodeMirror-linenumbers', 'cb-repl-cm-gutter'],
        fixedGutter: false,
        extraKeys: {
            'Ctrl-L': function (cm) { cb.resetREPL(); },
            'Ctrl-\\': function (cm) { cb.toggleDevMode(); },
            'Up': function (cm) {
                cm.cb.history.previous();
                return true;
            },
            'Down': function (cm) {
                cm.cb.history.next();
                return true;
            },
            'Esc': function (cm) { cb.eventStop(); },
            'Enter': function (cm) { cb.eventEval(); },
            'Shift-Enter': function (cm) { cb.eventStep(); },
            'Shift-Ctrl-Enter': function (cm) { cb.eventEval(); },
            'F5' : function (cm) { cb.eventStep(); },
            'F6' : function (cm) { cb.eventAnimate(); },
            'F7' : function (cm) { cb.eventEval(); },
            'F8' : function (cm) { cb.eventStop(); }
        },
        //viewportMargin: Infinity,
        lineWrapping: true
    };

    var node = document.getElementById('cb-repl');
    var editor = CodeMirror.fromTextArea(node, options);

    cb.initEditor(editor, node, new REPLHistoryManager(), null);
    cb.initEditorFocusHandling(editor);
    cb.initEditorScrollHandling(editor);

    editor.focus();

    //startBG();
    return editor;
};

var count = 0;
function startBG() {
    setTimeout(function () {
        count++;
        cb.addSingleLineTranscriptREPL('count='+count+'\n','cb-transcript');
        startBG();
    }, 1000);
}

CodeBoot.prototype.acceptInputREPL = function () {

    var editor = cb.repl;

    editor.replaceRange('\n', cb.endOfEditor(), cb.endOfEditor());

    cb.setReadOnlyTranscriptREPL(cb.endOfEditor());

    cb.setPromptREPL(false);

    cb.scrollToEndREPL();
};

CodeBoot.prototype.inputPosREPL = function () {
    var editor = cb.repl;
    var transcriptPos = editor.cb.transcriptMarker.find();
    return transcriptPos ? transcriptPos.to : cb.beginningOfEditor();
};

CodeBoot.prototype.getInputREPL = function () {
    var editor = cb.repl;
    return editor.getRange(cb.inputPosREPL(), cb.endOfEditor());
};

CodeBoot.prototype.setInputREPL = function (text) {

    var editor = cb.repl;

    cb.replaceInputREPL(text);

    editor.setCursor(cb.endOfEditor());

//TODO: deprecated
//    cm.setValue(text);
//    cm.setCursor(0, text.length);
};

CodeBoot.prototype.replaceInputREPL = function (text) {
    var editor = cb.repl;
    editor.replaceRange(text, cb.inputPosREPL(), cb.endOfEditor());
};

CodeBoot.prototype.resetREPL = function () {
    var editor = cb.repl;
    editor.setValue('');
    cb.setTranscriptMarker(editor, cb.beginningOfEditor());
    cb.setPromptREPL();
    cb.repl.cb.history.resetPos();
};

CodeBoot.prototype.setTranscriptMarker = function (editor, endPos) {

    if (editor.cb.transcriptMarker) {
        editor.cb.transcriptMarker.clear();
        editor.cb.transcriptMarker = null;
    }

    editor.cb.transcriptMarker =
        editor.markText(
            cb.beginningOfEditor(),
            endPos,
            { className: 'cb-transcript',
              readOnly: true} );
};

CodeBoot.prototype.setReadOnlyTranscriptREPL = function (endPos) {
    var editor = cb.repl;
    cb.setTranscriptMarker(editor, endPos);
};

var default_prompt = '>';

CodeBoot.prototype.setPromptREPL = function (prompt, text) {

    var editor = cb.repl;

    if (text === void 0) text = '';

    cb.setInputREPL(text);

    if (prompt === void 0) prompt = true;

    var line = editor.lastLine();

    if (prompt) {
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', document.createTextNode(default_prompt));
    } else {
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', null);
    }

    cb.scrollToEndREPL();
};

CodeBoot.prototype.scrollToEnd = function (editor) {
    CodeMirror.commands.goDocEnd(editor);
};

CodeBoot.prototype.scrollToEndREPL = function () {
    var editor = cb.repl;
    cb.scrollToEnd(editor);
};

CodeBoot.prototype.nextLineStart = function (pos) {
    return { line: pos.line+1, ch: 0 };
};

CodeBoot.prototype.beginningOfEditor = function () {
    return { line: 0, ch: 0 };
};

CodeBoot.prototype.endOfEditor = function () {
    return { line: Infinity, ch: 0 };
};

CodeBoot.prototype.addSingleLineTranscriptREPL = function (text, cssClass) {

    var editor = cb.repl;
    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : cb.beginningOfEditor();

    editor.replaceRange(text, pos); //TODO: why is this so slow?

    editor.markText(pos, cb.nextLineStart(pos), { className: cssClass });

    cb.setReadOnlyTranscriptREPL(cb.nextLineStart(pos));

    cb.scrollToEndREPL();

//    if (editor.lineInfo(line).gutterMarkers) {
//        // Oops, CodeMirror moved the gutter down instead of appending a blank line
//        // We'll set the gutter back on the previous line (ugly!)
//        line -= 1;
//    }

//    if (cssClass === 'transcript-input')
//        editor.setGutterMarker(line, 'cb-repl-cm-gutter', document.createTextNode('>'));

//    this.is_empty = false;

//    cb.scrollToEnd(this.editor);

//    this.onTranscriptChanged();

};

CodeBoot.prototype.addLineWidgetTranscriptREPL = function (widget, cssClass) {

    var editor = cb.repl;
    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : cb.beginningOfEditor();
    var w = editor.addLineWidget(pos.line-1, widget);
//    var w = editor.addWidget(cb.lastLinePos(cb.repl), widget, false);
//    var w = editor.addLineWidget(editor.lineCount() - 2, widget);
    editor.cb.widgets.push(w);


//    cb.scrollToEnd(editor);

//    editor.onTranscriptChanged();
};

CodeBoot.prototype.addTranscriptREPL = function (text, cssClass) {
    if (text.length > 0 && text.indexOf('\n') === text.length-1) {
        /* optimize for single newline at end */
        this.addSingleLineTranscriptREPL(text, cssClass);
    } else {
        var lines = text.split('\n');
        for (var i=0; i<lines.length-1; i++) {
            this.addSingleLineTranscriptREPL(lines[i] + '\n', cssClass);
        }
        //TODO: handle text after last newline
    }
};
