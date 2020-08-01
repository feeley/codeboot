CodeBootVM.prototype.initEditor = function (editor, node, history, fileEditor) {

    var vm = this;

    editor.cb = {};
    editor.cb.node = node;
    editor.cb.vm = vm;  // TODO: was CodeBoot.prototype.get_vm(node);
    editor.cb.history = history;
    editor.cb.fileEditor = fileEditor;
    editor.cb.widgets = [];
    editor.cb.transcriptMarker = null;
    vm.setTranscriptMarker(editor, vm.beginningOfEditor());
};

CodeBootVM.prototype.trackEditorFocus = function (editor, focus) {

    var vm = this;

    if (focus) {
        vm.lastFocusedEditor = editor;
        if (editor === vm.repl) {
            vm.elem.classList.add('cb-focus-repl');
        } else {
            vm.elem.classList.remove('cb-focus-repl');
        }
    } else if (!vm.allowLosingFocus) {
        setTimeout(function () {
            vm.focusLastFocusedEditor();
        }, 0);
    }
};

CodeBootVM.prototype.initEditorFocusHandling = function (editor) {

    var vm = this;

    editor.on('focus', function (cm, event) {
        vm.trackEditorFocus(editor, true);
    });

    editor.on('blur', function (cm, event) {
        vm.trackEditorFocus(editor, false);
    });
};

CodeBootVM.prototype.initEditorScrollHandling = function (editor) {

    var vm = this;

    editor.on('scroll', function (cm) {
        vm.updatePopupPos();
    });

};

CodeBootVM.prototype.createCodeEditor = function (node, fileEditor) {

    var vm = this;
    var options = {
        value: '',
        mode: 'javascript',
        indentUnit: 4,       // Indent with 4 spaces
        lineNumbers:  vm.options.showLineNumbers,   // Show line numbers
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

            'Ctrl-L': function (cm) { cm.cb.vm.resetREPL(); },
            'Esc': function (cm) { cm.cb.vm.eventStop(); },
            'Enter': function (cm) { if (cm.cb.vm.ui.mode === cm.cb.vm.modeStopped()) return CodeMirror.Pass; cm.cb.vm.eventStep(); },
            'Shift-Enter': function (cm) { cm.cb.vm.eventStep(); },
            'Shift-Ctrl-Enter': function (cm) { cm.cb.vm.eventEval(); },
            'F5' : function (cm) { cm.cb.vm.eventStep(); },
            'F6' : function (cm) { cm.cb.vm.eventAnimate(); },
            'F7' : function (cm) { cm.cb.vm.eventEval(); },
            'F8' : function (cm) { cm.cb.vm.eventStop(); }
        },

        onDragEvent: function(cm, event) {
            if (event.type === 'drop') {
                event.stopPropagation();
                event.preventDefault();
                var dt = event.dataTransfer;
                var files = dt.files;
                cm.cb.vm.editFileFromRealFS(cm, files[0]);
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

    vm.initEditor(editor, node, null, fileEditor);
    vm.initEditorFocusHandling(editor);
    vm.initEditorScrollHandling(editor);

    return editor;
};

CodeBootVM.prototype.editFileFromRealFS = function (cm, path) {

    var vm = this;

    if (!cm) return;

    vm.readFileFromRealFSSync(path, function(contents) {
        cm.setValue(contents);
    });
};

CodeBootVM.prototype.readFileFromRealFSSync = function (path, callback) {

    var vm = this;

    if (typeof FileReader === 'undefined') {
        vm.reportError('FileReader not supported by the browser');
        return;
    }

    var reader = new FileReader();
    reader.onerror = function (e) {
        vm.reportError('FileReader failed to read ' + path);
    };
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsText(path);
}

//=============================================================================
//                                       REPL
//=============================================================================

function REPLHistoryManager() {
    this.history = [];
    this.pos = 0;
    this.limit = 100; // TODO: make this configurable
    this.currentLine = undefined;
}

REPLHistoryManager.prototype.setEditorValue = function (v) {
    vm.setPromptREPL(true, v);
    vm.repl.refresh();
    CodeMirror.commands.goLineEnd(vm.repl);
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
        this.currentLine = vm.getInputREPL();
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

CodeBootVM.prototype.createREPLTranscript = function () {

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

    vm.initEditor(editor, node, null, null);
    vm.initEditorScrollHandling(editor);

    return new CodeBootTranscript(editor);
};

function CodeBootTranscript(editor) {
    this.editor = editor;
    this.is_empty = true;
    this.widgets = [];
}

CodeBootTranscript.prototype.onTranscriptChanged = function () {
};

CodeBootTranscript.prototype.clear = function () {
    this.show(); // this seems to avoid initialization problems
    for (var i = 0; i < this.widgets.length; i++) {
        this.editor.removeLineWidget(this.widgets[i]);
    }
    this.editor.setValue('');
    this.editor.refresh();
    this.is_empty = true;
    this.hide();
};

CodeBootTranscript.prototype.show = function () {
    $('#cb-repl-transcript').show();
    $('body').attr('data-cb-has-transcript', 'true');
    this.onTranscriptChanged();
};

CodeBootTranscript.prototype.hide = function () {
    $('body').attr('data-cb-has-transcript', 'false');
    $('#cb-repl-transcript').hide();
    this.onTranscriptChanged();
};

CodeBootTranscript.prototype.addTextLine = function (text, cssClass) {
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

//    vm.scrollToEnd(this.editor);

    this.onTranscriptChanged();
};

CodeBootTranscript.prototype.addLineWidget = function (textOrNode, cssClass) {
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

//    vm.scrollToEnd(this.editor);

    this.onTranscriptChanged();
};

CodeBootTranscript.prototype.addLine = function (text, cssClass) {
    var line;

    if (cssClass === 'transcript-input') {
        this.addTextLine(text, cssClass);
    } else {
        this.addLineWidget(text, cssClass);
    }
};

CodeBootVM.prototype.createREPL = function () {

    var vm = this;

    var options = {
        mode: 'javascript',
        indentUnit: 4,         // Indent by 4 spaces
        lineNumbers: false,    // Show line numbers
        matchBrackets: true,
        cursorScrollMargin: 0,
        gutters: ['CodeMirror-linenumbers', 'cb-repl-cm-gutter'],
        fixedGutter: false,
        extraKeys: {
            'Ctrl-L': function (cm) { cm.cb.vm.resetREPL(); },
            'Ctrl-\\': function (cm) { cm.cb.vm.toggleDevMode(); },
            'Up': function (cm) {
                cm.cb.history.previous();
                return true;
            },
            'Down': function (cm) {
                cm.cb.history.next();
                return true;
            },
            'Esc': function (cm) { cm.cb.vm.eventStop(); },
            'Enter': function (cm) { cm.cb.vm.eventEval(); },
            'Shift-Enter': function (cm) { cm.cb.vm.eventStep(); },
            'Shift-Ctrl-Enter': function (cm) { cm.cb.vm.eventEval(); },
            'F5' : function (cm) { cm.cb.vm.eventStep(); },
            'F6' : function (cm) { cm.cb.vm.eventAnimate(); },
            'F7' : function (cm) { cm.cb.vm.eventEval(); },
            'F8' : function (cm) { cm.cb.vm.eventStop(); }
        },
        //viewportMargin: Infinity,
        lineWrapping: true
    };

    var node = document.getElementById('cb-repl');
    var editor = CodeMirror.fromTextArea(node, options);

    vm.initEditor(editor, node, new REPLHistoryManager(), null);
    vm.initEditorFocusHandling(editor);
    vm.initEditorScrollHandling(editor);

    editor.focus();

    //startBG();
    return editor;
};

// TODO: remove
var count = 0;
function startBG() {
    setTimeout(function () {
        count++;
        vm.addSingleLineTranscriptREPL('count='+count+'\n','cb-transcript');
        startBG();
    }, 1000);
}

CodeBootVM.prototype.acceptInputREPL = function () {

    var vm = this;
    var editor = vm.repl;

    editor.replaceRange('\n', vm.endOfEditor(), vm.endOfEditor());

    vm.setReadOnlyTranscriptREPL(vm.endOfEditor());

    vm.setPromptREPL(false);

    vm.scrollToEndREPL();
};

CodeBootVM.prototype.inputPosREPL = function () {
    var vm = this;
    var editor = vm.repl;
    var transcriptPos = editor.cb.transcriptMarker.find();
    return transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
};

CodeBootVM.prototype.getInputREPL = function () {
    var vm = this;
    var editor = vm.repl;
    return editor.getRange(vm.inputPosREPL(), vm.endOfEditor());
};

CodeBootVM.prototype.setInputREPL = function (text) {

    var vm = this;
    var editor = vm.repl;

    vm.replaceInputREPL(text);

    editor.setCursor(vm.endOfEditor());

//TODO: deprecated
//    cm.setValue(text);
//    cm.setCursor(0, text.length);
};

CodeBootVM.prototype.replaceInputREPL = function (text) {
    var vm = this;
    var editor = vm.repl;
    editor.replaceRange(text, vm.inputPosREPL(), vm.endOfEditor());
};

CodeBootVM.prototype.resetREPL = function () {
    var vm = this;
    var editor = vm.repl;
    editor.setValue('');
    vm.setTranscriptMarker(editor, vm.beginningOfEditor());
    vm.setPromptREPL();
    vm.repl.cb.history.resetPos();
};

CodeBootVM.prototype.setTranscriptMarker = function (editor, endPos) {

    var vm = this;

    if (editor.cb.transcriptMarker) {
        editor.cb.transcriptMarker.clear();
        editor.cb.transcriptMarker = null;
    }

    editor.cb.transcriptMarker =
        editor.markText(
            vm.beginningOfEditor(),
            endPos,
            { className: 'cb-transcript',
              readOnly: true} );
};

CodeBootVM.prototype.setReadOnlyTranscriptREPL = function (endPos) {
    var vm = this;
    var editor = vm.repl;
    vm.setTranscriptMarker(editor, endPos);
};

var default_prompt = '>';

CodeBootVM.prototype.setPromptREPL = function (prompt, text) {

    var vm = this;
    var editor = vm.repl;

    if (text === void 0) text = '';

    vm.setInputREPL(text);

    if (prompt === void 0) prompt = true;

    var line = editor.lastLine();

    if (prompt) {
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', document.createTextNode(default_prompt));
    } else {
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', null);
    }

    vm.scrollToEndREPL();
};

CodeBootVM.prototype.scrollToEnd = function (editor) {
    var vm = this;
    CodeMirror.commands.goDocEnd(editor);
};

CodeBootVM.prototype.scrollToEndREPL = function () {
    var vm = this;
    var editor = vm.repl;
    vm.scrollToEnd(editor);
};

CodeBootVM.prototype.nextLineStart = function (pos) {
    return { line: pos.line+1, ch: 0 };
};

CodeBootVM.prototype.beginningOfEditor = function () {
    return { line: 0, ch: 0 };
};

CodeBootVM.prototype.endOfEditor = function () {
    return { line: Infinity, ch: 0 };
};

CodeBootVM.prototype.addSingleLineTranscriptREPL = function (text, cssClass) {

    var vm = this;
    var editor = vm.repl;
    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : vm.beginningOfEditor();

    editor.replaceRange(text, pos); //TODO: why is this so slow?

    editor.markText(pos, vm.nextLineStart(pos), { className: cssClass });

    vm.setReadOnlyTranscriptREPL(vm.nextLineStart(pos));

    vm.scrollToEndREPL();

//    if (editor.lineInfo(line).gutterMarkers) {
//        // Oops, CodeMirror moved the gutter down instead of appending a blank line
//        // We'll set the gutter back on the previous line (ugly!)
//        line -= 1;
//    }

//    if (cssClass === 'transcript-input')
//        editor.setGutterMarker(line, 'cb-repl-cm-gutter', document.createTextNode('>'));

//    this.is_empty = false;

//    vm.scrollToEnd(this.editor);

//    this.onTranscriptChanged();

};

CodeBootVM.prototype.addLineWidgetTranscriptREPL = function (widget, cssClass) {

    var vm = this;
    var editor = vm.repl;
    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
    var w = editor.addLineWidget(pos.line-1, widget);
//    var w = editor.addWidget(vm.lastLinePos(vm.repl), widget, false);
//    var w = editor.addLineWidget(editor.lineCount() - 2, widget);
    editor.cb.widgets.push(w);


//    vm.scrollToEnd(editor);

//    editor.onTranscriptChanged();
};

CodeBootVM.prototype.addTranscriptREPL = function (text, cssClass) {
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
