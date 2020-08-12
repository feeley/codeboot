CodeBootVM.prototype.initEditor = function (editor, node, history, fileEditor) {

    var vm = this;

    editor.cb = {};
    editor.cb.node = node;
    editor.cb.vm = vm;
    editor.cb.history = history;
    editor.cb.fileEditor = fileEditor;
    editor.cb.widgets = [];
    editor.cb.transcriptMarker = null;
    vm.setTranscriptMarker(editor, vm.beginningOfEditor());
};

CodeBootVM.prototype.trackEditorFocus = function (editor, event, focus) {

    var vm = this;

    if (focus) {
        vm.lastFocusedEditor = editor;
        if (editor === vm.repl) {
            vm.root.classList.add('cb-focus-repl');
        } else {
            vm.root.classList.remove('cb-focus-repl');
        }
    } else if (!vm.allowLosingFocus) {
        vm.ASAP(function () {
            vm.focusLastFocusedEditor();
        });
    }
};

CodeBootVM.prototype.initEditorFocusHandling = function (editor) {

    var vm = this;

    editor.on('focus', function (cm, event) {
        vm.trackEditorFocus(editor, event, true);
    });

    editor.on('blur', function (cm, event) {
        vm.trackEditorFocus(editor, event, false);
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
        lineNumbers: vm.showLineNumbers,
        cursorScrollMargin: 0,
        gutters: ['CodeMirror-linenumbers', 'cb-file-cm-gutter'],
        fixedGutter: false,
        matchBrackets: true,
        keyMap: 'emacs',
        extraKeys: {

            //TODO: reenable
            //'Ctrl-/' : function (cm) {
            //    var tok = cm.getTokenAt(cm.getCursor(false));
            //    var isComment = tok.className === 'comment';
            //    cm.commentRange(!isComment, cm.getCursor(true), cm.getCursor(false));
            // },

            'Ctrl-L': function (cm) { cm.cb.vm.replReset(); },
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

    vm.lang.setupEditor(editor);

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

function CodeBootHistoryManager(editor) {

    var hm = this;

    hm.editor = editor;
    hm.history = [];
    hm.pos = 0;
    hm.limit = 100; // TODO: make this configurable
    hm.currentLine = undefined;
}

CodeBootHistoryManager.prototype.setEditorValue = function (v) {

    var hm = this;
    var vm = hm.editor.cb.vm;

    vm.replSetPrompt(true, v);
    vm.repl.refresh();
    CodeMirror.commands.goLineEnd(vm.repl);
};

CodeBootHistoryManager.prototype.resetPos = function () {

    var hm = this;

    hm.pos = hm.history.length;
    hm.currentLine = undefined;
};

CodeBootHistoryManager.prototype.add = function (line) {

    var hm = this;
    var vm = hm.editor.cb.vm;

    hm.history.push(line);
    while (hm.history.length > hm.limit) {
        hm.history.shift();
    }
    hm.resetPos();

    vm.stateAddedHistory(line);
};

CodeBootHistoryManager.prototype.previous = function () {

    var hm = this;
    var vm = hm.editor.cb.vm;

    var index = hm.pos - 1;
    if (hm.pos === hm.history.length) {
        // Remember the current line to be able to restore it later, if needed
        hm.currentLine = vm.replGetInput();
    }
    if (index >= 0) {
        // Restore previous history item
        hm.setEditorValue(hm.history[index]);
        hm.pos = index;
    }
};

CodeBootHistoryManager.prototype.serializeState = function () {

    var hm = this;

    return {
        history: hm.history
    };
};

CodeBootHistoryManager.prototype.restoreState = function (state) {

    var hm = this;

    hm.history = state.history;
    hm.resetPos();
};


CodeBootHistoryManager.prototype.next = function () {

    var hm = this;
    var index = hm.pos + 1;

    if (index < hm.history.length) {
        hm.setEditorValue(hm.history[index]);
        hm.pos = index;
    }  else if (index === hm.history.length) {
        hm.setEditorValue(hm.currentLine);
        hm.resetPos();
    }
};

CodeBootVM.prototype.replAddHistory = function (source) {

    var vm = this;

    if (!vm.repl) return;

    vm.repl.cb.history.add(source);
};

/*
deprecated

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

    var ts = this;

    ts.editor = editor;
    ts.is_empty = true;
    ts.widgets = [];
}

CodeBootTranscript.prototype.onTranscriptChanged = function () {
};

CodeBootTranscript.prototype.clear = function () {

    var ts = this;

    ts.show(); // this seems to avoid initialization problems
    for (var i = 0; i < ts.widgets.length; i++) {
        ts.editor.removeLineWidget(ts.widgets[i]);
    }
    ts.editor.setValue('');
    ts.editor.refresh();
    ts.is_empty = true;
    ts.hide();
};

CodeBootTranscript.prototype.show = function () {

    var ts = this;

    $('#cb-repl-transcript').show();
    $('body').attr('data-cb-has-transcript', 'true');
    ts.onTranscriptChanged();
};

CodeBootTranscript.prototype.hide = function () {

    var ts = this;

    $('body').attr('data-cb-has-transcript', 'false');
    $('#cb-repl-transcript').hide();
    ts.onTranscriptChanged();
};

CodeBootTranscript.prototype.addTextLine = function (text, cssClass) {

    var ts = this;
    var editor = ts.editor;

    text = removeTrailingNewline(text);
    // CodeMirror needs to be visible to the updates to the gutter to work...
    if (ts.is_empty) ts.show();

    var line;
    if (ts.is_empty) {
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
    ts.is_empty = false;

//    vm.scrollToEnd(ts.editor);

    ts.onTranscriptChanged();
};

CodeBootTranscript.prototype.addLineWidget = function (textOrNode, cssClass) {

    var ts = this;

    // CodeMirror needs to be visible to the updates to the gutter to work...
    if (ts.is_empty) ts.show();

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
    var w = ts.editor.addLineWidget(ts.editor.lineCount() - 1, widget);
    ts.widgets.push(w);

//    vm.scrollToEnd(ts.editor);

    ts.onTranscriptChanged();
};

CodeBootTranscript.prototype.addLine = function (text, cssClass) {

    var ts = this;
    var line;

    if (cssClass === 'transcript-input') {
        ts.addTextLine(text, cssClass);
    } else {
        ts.addLineWidget(text, cssClass);
    }
};
*/

CodeBootVM.prototype.replSetup = function () {

    var vm = this;
    var node = vm.root.querySelector('.cb-repl');

    if (node && !vm.repl) {

        var options = {
            lineNumbers: false,    // Show line numbers
            matchBrackets: true,
            keyMap: 'emacs',
            cursorScrollMargin: 0,
            gutters: ['CodeMirror-linenumbers', 'cb-repl-cm-gutter'],
            fixedGutter: false,
            extraKeys: {
                'Ctrl-L': function (cm) { cm.cb.vm.replReset(); },
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
            
        var editor = CodeMirror.fromTextArea(node, options);

        vm.repl = editor;

        vm.initEditor(editor, node, new CodeBootHistoryManager(editor), null);
        vm.initEditorFocusHandling(editor);
        vm.initEditorScrollHandling(editor);
    }

    if (vm.repl) {
        var width = Math.max(vm.lang.getPrompt().length,
                             vm.lang.getPromptCont().length);
        vm.forEachElem('.cb-console', function (elem) {
            elem.setAttribute('data-cb-prompt-width', width+'');
        });
        vm.lang.setupEditor(vm.repl);
        vm.replReset();
        vm.repl.refresh();
        vm.repl.focus();
    }
};

CodeBootVM.prototype.replAcceptInput = function () {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    editor.replaceRange('\n', vm.endOfEditor(), vm.endOfEditor());

    vm.replSetReadOnlyTranscript(vm.endOfEditor());

    vm.replSetPrompt(false);

    vm.replScrollToEnd();
};

CodeBootVM.prototype.replInputPos = function () {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    var transcriptPos = editor.cb.transcriptMarker.find();
    return transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
};

CodeBootVM.prototype.replGetInput = function () {

    var vm = this;
    var editor = vm.repl;

    return editor.getRange(vm.replInputPos(), vm.endOfEditor());
};

CodeBootVM.prototype.replSetInput = function (text) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    vm.replReplaceInput(text);

    editor.setCursor(vm.endOfEditor());

//TODO: deprecated
//    cm.setValue(text);
//    cm.setCursor(0, text.length);
};

CodeBootVM.prototype.replReplaceInput = function (text) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    editor.replaceRange(text, vm.replInputPos(), vm.endOfEditor());
};

CodeBootVM.prototype.replReset = function () {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    editor.setValue('');
    vm.setTranscriptMarker(editor, vm.beginningOfEditor());
    vm.replSetPrompt(true);
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
              readOnly: true } );
};

CodeBootVM.prototype.replSetReadOnlyTranscript = function (endPos) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    vm.setTranscriptMarker(editor, endPos);
};

CodeBootVM.prototype.replSetPrompt = function (prompt, text) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    if (text === undefined) text = '';

    vm.replSetInput(text);

    var line = editor.lastLine();

    if (prompt) {
        var elem = document.createElement('div');
        elem.innerText = vm.lang.getPrompt();
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', elem);
    } else {
        editor.setGutterMarker(line, 'cb-repl-cm-gutter', null);
    }

    vm.replScrollToEnd();
};

CodeBootVM.prototype.scrollToEnd = function (editor) {
    var vm = this;
    CodeMirror.commands.goDocEnd(editor);
};

CodeBootVM.prototype.replScrollToEnd = function () {
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

CodeBootVM.prototype.replAddSingleLineTranscript = function (text, cssClass) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    vm.setDisplay('.cb-console', 'block');

    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : vm.beginningOfEditor();

    editor.replaceRange(text, pos); //TODO: why is this so slow?

    editor.markText(pos, vm.nextLineStart(pos), { className: cssClass });

    vm.replSetReadOnlyTranscript(vm.nextLineStart(pos));

    vm.replScrollToEnd();
    
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

CodeBootVM.prototype.replAddLineWidgetTranscript = function (widget, cssClass) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
    var w = editor.addLineWidget(pos.line-1, widget);
//    var w = editor.addWidget(vm.lastLinePos(vm.repl), widget, false);
//    var w = editor.addLineWidget(editor.lineCount() - 2, widget);
    editor.cb.widgets.push(w);


//    vm.scrollToEnd(editor);

//    editor.onTranscriptChanged();
};

CodeBootVM.prototype.replAddTranscript = function (text, cssClass) {
    if (text.length > 0) {
        if (text.indexOf('\n') === text.length-1) {
            /* optimize for single newline at end */
            this.replAddSingleLineTranscript(text, cssClass);
        } else {
            var lines = text.split('\n');
            for (var i=0; i<lines.length-1; i++) {
                this.replAddSingleLineTranscript(lines[i] + '\n', cssClass);
            }
            //TODO: handle text after last newline
        }
    }
};
