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

CodeBootVM.prototype.trackEditorFocus = function (editor, focus) {

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

// Disable Ctrl-V and Ctrl-X keybindings that users expect to map to paste/cut
delete CodeMirror.keyMap.emacs['Ctrl-V'];
delete CodeMirror.keyMap.emacs['Ctrl-X'];

CodeBootVM.prototype.createCodeEditor = function (node, fileEditor) {

    var vm = this;

    function enter(cm) {
        if (cm.cb.vm.ui.mode === cm.cb.vm.modeStopped()) return CodeMirror.Pass;
        cm.cb.vm.eventEval();
    };

    function shiftEnter(cm) {
        cm.cb.vm.eventStepPause();
    };

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

            'Ctrl-L': function (cm) { cm.cb.vm.eventClearConsole(); },
            'Esc': function (cm) { cm.cb.vm.eventStop(); },
            'Enter': enter,
            'Shift-Enter': shiftEnter,
            'Shift-Ctrl-Enter': function (cm) { cm.cb.vm.eventEval(); },
            'F5' : function (cm) { cm.cb.vm.eventStepPause(); },
            'F6' : function (cm) { cm.cb.vm.eventAnimate(); },
            'F7' : function (cm) { cm.cb.vm.eventEval(); },
            'F8' : function (cm) { cm.cb.vm.eventStop(); }
        },
        dragDrop: false,
        //,viewportMargin: Infinity
    };

    vm.adjustEditorOptions(options);

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
    hm.saved = [];
//    hm.currentLine = undefined;
}

CodeBootHistoryManager.prototype.setEditorValue = function (v) {

    var hm = this;
    var vm = hm.editor.cb.vm;

//    console.log('setEditorValue');

    vm.replSetInput(v);
//    vm.repl.refresh();
//    CodeMirror.commands.goLineEnd(vm.repl);
};

CodeBootHistoryManager.prototype.resetPos = function () {

    var hm = this;

    hm.pos = hm.history.length;
//    hm.currentLine = undefined;
    hm.saved = [];
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

    // save current line in case there were any edits
    hm.saved[hm.pos] = vm.replGetInput();

    if (index >= 0) {
        // Restore previous history item
        hm.setEditorValue(hm.getSaved(index));
        hm.pos = index;
    }
};

CodeBootHistoryManager.prototype.next = function () {

    var hm = this;
    var vm = hm.editor.cb.vm;

    var index = hm.pos + 1;

    // save current line in case there were any edits
    hm.saved[hm.pos] = vm.replGetInput();

    if (index <= hm.history.length) {
        hm.setEditorValue(hm.getSaved(index));
        hm.pos = index;
    }
};

CodeBootHistoryManager.prototype.getSaved = function (i) {

    var hm = this;

    if (hm.saved[i] === undefined) {
        hm.saved[i] = hm.history[i];
    }

    return hm.saved[i];
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

CodeBootVM.prototype.adjustEditorOptions = function (options) {

    var vm = this;

    if (!vm.editable) {
        options.inputStyle = 'contenteditable';
        options.readOnly = 'nocursor';
    }
};

CodeBootVM.prototype.replSetup = function () {

    var vm = this;
    var node = vm.root.querySelector('.cb-repl');

    if (node && !vm.repl) {

        function cursorUp(cm) {
            if (cm.cb.vm.replCursorOnFirstLineOfInput()) {
                cm.cb.history.previous();
            } else {
                cm.execCommand('goLineUp');
            }
        };

        function cursorDown(cm) {
            if (cm.cb.vm.replCursorOnLastLineOfInput()) {
                cm.cb.history.next();
            } else {
                cm.execCommand('goLineDown');
            }
        };

        function insertLine(cm) {
            var first = vm.replCursorOnFirstLineOfInput();
            cm.cb.vm.replAddInputLine('', first, false);
            vm.replAddPrompt2(true); // add continuation prompt to new line
            cm.execCommand('goCharLeft');
        };

        function newline(cm) {
            var first = vm.replCursorOnFirstLineOfInput();
            cm.cb.vm.replAddInputLine('', first, false);
            vm.replAddPrompt2(true); // add continuation prompt to new line
        };

        function newlineAndIndent(cm) {
            var first = vm.replCursorOnFirstLineOfInput();
            cm.cb.vm.replAddInputLine('', first, false);
            vm.replAddPrompt2(true); // add continuation prompt to new line
            cm.execCommand('indentAuto');
        };

        function enter(cm) {
            if (true || cm.cb.vm.replCursorOnLastLineOfInput()) {
                cm.cb.vm.replSetCursorToEnd();
                cm.cb.vm.eventEval();
            } else {
                newlineAndIndent(cm);
            }
        };

        function shiftEnter(cm) {
            if (true || cm.cb.vm.replCursorOnLastLineOfInput()) {
                cm.cb.vm.replSetCursorToEnd();
                cm.cb.vm.eventStepPause();
            } else {
                newlineAndIndent(cm);
            }
        };

        var options = {
            lineNumbers: false,    // Show line numbers
            matchBrackets: true,
            keyMap: 'emacs',
            cursorScrollMargin: 0,
            gutters: ['CodeMirror-linenumbers', 'cb-repl-cm-gutter'],
            fixedGutter: false,
            extraKeys: {
                'Ctrl-L': function (cm) { cm.cb.vm.eventClearConsole(); },
                'Ctrl-\\': function (cm) { cm.cb.vm.toggleDevMode(); },
                'Up': cursorUp,
                'Ctrl-P': cursorUp,
                'Down': cursorDown,
                'Ctrl-N': cursorDown,
                'Ctrl-J': newline,
                'Ctrl-O': insertLine,
                'Esc': function (cm) { cm.cb.vm.eventStop(); },
                'Enter': enter,
                'Shift-Enter': shiftEnter,
                'Shift-Ctrl-Enter': function (cm) { cm.cb.vm.eventEval(); },
                'F5' : function (cm) { cm.cb.vm.eventStepPause(); },
                'F6' : function (cm) { cm.cb.vm.eventAnimate(); },
                'F7' : function (cm) { cm.cb.vm.eventEval(); },
                'F8' : function (cm) { cm.cb.vm.eventStop(); }
            },
            dragDrop: false,
            //viewportMargin: Infinity,
            lineWrapping: true
        };

        vm.adjustEditorOptions(options);

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

CodeBootVM.prototype.replCursorOnFirstColumnOfInput = function () {

    var vm = this;
    var editor = vm.repl;

    return editor.getCursor().ch === 0;
};

CodeBootVM.prototype.replCursorOnFirstLineOfInput = function () {

    var vm = this;
    var editor = vm.repl;

    var cursor = editor.cursorCoords(editor.getCursor());
    var first = editor.cursorCoords(vm.replInputPos());

    return cursor.top === first.top;
};

CodeBootVM.prototype.replCursorOnLastLineOfInput = function () {

    var vm = this;
    var editor = vm.repl;

    var cursor = editor.cursorCoords(editor.getCursor());
    var last = editor.cursorCoords({ line: editor.lastLine()+1, ch: 0 });

    return cursor.top === last.top;
};

CodeBootVM.prototype.replCursorPos = function () {

    var vm = this;
    var editor = vm.repl;

    return editor.getCursor();
};

CodeBootVM.prototype.replNewline = function () {

    var vm = this;
    var editor = vm.repl;

//    console.log('replNewline');
    if (!editor) return;

    var first = vm.replCursorOnFirstLineOfInput();
    vm.replAddInputLine('', first, false);
    editor.execCommand('indentAuto');
};

CodeBootVM.prototype.replAcceptInput = function () {

    var vm = this;
    var editor = vm.repl;

//    console.log('replAcceptInput |'+vm.replGetInput()+'|');
    if (!editor) return;
/*
    var input = vm.replGetInput();
    var nl = input.lastIndexOf('\n');

    // avoid empty lines that prevent prompt from showing
    if (nl === input.length-1)
        editor.replaceRange('\f', vm.endOfEditor(), vm.endOfEditor());

    vm.replAddPrompt2(nl >= 0); // set prompt of last line of input

    editor.replaceRange('\n', vm.endOfEditor(), vm.endOfEditor());
*/
    vm.replAddInputLine('',
                        vm.replCursorOnFirstLineOfInput(),
                        false);

//    vm.replAddPrompt2(false); // add normal prompt

    vm.replSetReadOnlyTranscript(vm.endOfEditor());

    vm.replScrollToEnd();
};

CodeBootVM.prototype.replInputPos = function () {

    var vm = this;
    var editor = vm.repl;

    var transcriptPos = editor.cb.transcriptMarker.find();
    return transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
};

CodeBootVM.prototype.replEmptyInput = function () {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return true;

    var transcriptPos = editor.cb.transcriptMarker.find();
    var start = transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
    var cursor = editor.getCursor();
    return start.line === cursor.line;
};

CodeBootVM.prototype.replGetInput = function () {

    var vm = this;
    var editor = vm.repl;

//    console.log('replGetInput');
    return editor.getRange(vm.replInputPos(), vm.endOfEditor());
};

CodeBootVM.prototype.replSetCursorToEnd = function () {

    var vm = this;
    var editor = vm.repl;

    editor.setCursor(vm.endOfEditor());
    vm.replScrollToEnd();
//    console.log('did replSetCursorToEnd();');
};

CodeBootVM.prototype.replSetInput = function (text) {

    var vm = this;
    var editor = vm.repl;

//    console.log('replSetInput');
    if (!editor) return;

    var lines = text.split('\n');

    editor.replaceRange('', vm.replInputPos(), vm.endOfEditor());

    for (var i=0; i<lines.length; i++) {
        vm.replAddInputLine(lines[i], i === 0, i === lines.length-1);
    }

    vm.replSetCursorToEnd();
//    editor.setCursor(vm.endOfEditor());

//TODO: deprecated
//    cm.setValue(text);
//    cm.setCursor(0, text.length);
};

CodeBootVM.prototype.replAddInputLine = function (line, first, last) {

    var vm = this;
    var editor = vm.repl;

    var addSpace = (line === '' && !last);
    if (addSpace) line += ' '; // on empty line: add then remove space
                               // to avoid hidden gutter bug
    editor.replaceRange(line,
                        editor.getCursor(),
                        editor.getCursor());
    vm.replAddPrompt2(!first); // normal or continuation prompt
    if (!last) {
        editor.replaceRange('\n',
                            vm.getOffsetFromCursor(editor,addSpace?-1:0),
                            editor.getCursor());
    }
};

/*deprecated

CodeBootVM.prototype.replReplaceInput = function (text) {

    var vm = this;
    var editor = vm.repl;

//    console.log('replReplaceInput');
    if (!editor) return;

    var lines = text.split('\n');
    editor.replaceRange(text, vm.replInputPos(), vm.endOfEditor());
};
*/

CodeBootVM.prototype.replReset = function () {

    var vm = this;
    var editor = vm.repl;

//    console.log('replReset');
    if (!editor) return;

    editor.setValue('');
    vm.setTranscriptMarker(editor, vm.beginningOfEditor());
    vm.replAllowInput();
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
              inclusiveLeft: true,
              //atomic: true,
              readOnly: true } );
};

CodeBootVM.prototype.replSetReadOnlyTranscript = function (endPos) {

    var vm = this;
    var editor = vm.repl;

//    console.log('replSetReadOnlyTranscript');
    if (!editor) return;

    vm.setTranscriptMarker(editor, endPos);
};

CodeBootVM.prototype.replAllowInput = function () {

    var vm = this;

    vm.replAddPrompt2(!vm.replEmptyInput());
};

CodeBootVM.prototype.replAddPrompt = function () {

    var vm = this;
    var editor = vm.repl;

//    console.log('replAddPrompt');
    if (!editor) return;

//    if (text !== undefined)
//        vm.replSetInput(text);

    var line = editor.lastLine();

    var elem = document.createElement('div');
    elem.innerText = vm.replEmptyInput()
                     ? vm.lang.getPrompt()
                     : vm.lang.getPromptCont();
    editor.setGutterMarker(line, 'cb-repl-cm-gutter', elem);

    vm.replSetCursorToEnd();
};

CodeBootVM.prototype.replAddPrompt2 = function (cont) {

    var vm = this;
    var editor = vm.repl;

//    console.log('replAddPrompt2');
    if (!editor) return;

    var cursor = vm.replCursorPos();
    var elem = document.createElement('div');
    elem.innerText = cont ? vm.lang.getPromptCont() : vm.lang.getPrompt()
    editor.setGutterMarker(cursor.line, 'cb-repl-cm-gutter', elem);
    editor.refresh();
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

CodeBootVM.prototype.beginningOfLastLineOfEditor = function (editor) {
    return { line: editor.lastLine(), ch: 0 };
};

CodeBootVM.prototype.offsetFromEndOfEditor = function (editor, offset) {
    var pos = editor.posFromIndex(Infinity); // get end line/ch
    if (offset === 0) return pos;
    var ind = editor.indexFromPos(pos); // get actual index
    return editor.posFromIndex(ind + offset);
};

CodeBootVM.prototype.getOffsetFromCursor = function (editor, offset) {
    var pos = editor.getCursor(); // get end line/ch
    if (offset === 0) return pos;
    var ind = editor.indexFromPos(pos); // get actual index
    return editor.posFromIndex(ind + offset);
};

CodeBootVM.prototype.endOfEditor = function () {
    return { line: Infinity, ch: 0 };
};

CodeBootVM.prototype.replAddSingleLineTranscript = function (text, cssClass) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;

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

CodeBootVM.prototype.replAddLineWidgetTranscript = function (widget) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;
//    console.log('starting vm.replAddLineWidgetTranscript');

    var transcriptPos = editor.cb.transcriptMarker.find();
    var pos = transcriptPos ? transcriptPos.to : vm.beginningOfEditor();
    var w = editor.addLineWidget(pos.line-1, widget);
//    var w = editor.addWidget(vm.lastLinePos(vm.repl), widget, false);
//    var w = editor.addLineWidget(editor.lineCount() - 2, widget);
    editor.cb.widgets.push(w);

    vm.replScrollToEnd();
};

CodeBootVM.prototype.replAddTranscript = function (text, cssClass) {

    var vm = this;
    var editor = vm.repl;

    if (!editor) return;
//    console.log('starting vm.replAddTranscript');

    vm.setAttribute('data-cb-show-console', true);
    vm.setAttribute('data-cb-show-repl-container', true);

    if (text.length > 0) {
        text = text.split('\r').join(''); // remove carriage-return
        if (text.indexOf('\n') === text.length-1) {
            /* optimize for single newline at end */
            vm.replAddSingleLineTranscript(text, cssClass);
        } else {
            var lines = text.split('\n');
            for (var i=0; i<lines.length-1; i++) {
                vm.replAddSingleLineTranscript(lines[i] + '\n', cssClass);
            }
            if (lines[lines.length-1].length > 0) {
                vm.replAddSingleLineTranscript(lines[lines.length-1] + '\n', cssClass);
            }
        }
    }
};
