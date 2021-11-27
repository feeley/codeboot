CodeBootVM.prototype.setupDrop = function (elem, handler) {

    var vm = this;

    var onDragEnter = function (e) {
        onDragOver(e);
    };

    var onDragLeave = function (e) {
    };

    var onDragOver = function (e) {
        if (handler !== void 0) {
            e.dataTransfer.dropEffect = 'copy';
        }
        e.preventDefault();
        e.stopPropagation();
    };

    var onDrop = function (e) {
        e.preventDefault();
        if (handler !== void 0) {
            handler(e);
        }
    };

    elem.addEventListener('dragenter', onDragEnter);
    elem.addEventListener('dragleave', onDragLeave);
    elem.addEventListener('dragover', onDragOver);
    elem.addEventListener('drop', onDrop);
};

CodeBootVM.prototype.reportError = function (text) {

    var vm = this;

    alert(text);
};

function removeTrailingNewline(text) {
    var s = String(text);
    if (s.charAt(text.length - 1) === '\n') {
        s = s.slice(0, s.length-1);
    }
    return s;
}

function position_to_line_ch(pos) {
    var line0 = position_to_line0(pos);
    var column0 = position_to_column0(pos);
    return { line: line0, ch: column0 };
}

CodeBootVM.prototype.codeHighlight = function (loc, cssClass, markEnd) {

    var vm = this;
    var container = loc.container;
    var editor;

    if (container instanceof SourceContainerInternalFile) {
        var filename = container.toString();
        if (!vm.fs.hasFile(filename)) {
            return null; // the file is not known
        }
        var state = vm.readFileInternal(filename);
        if (container.stamp !== state.stamp) {
            return null; // the content of the editor has changed so can't highlight
        }
        vm.fs.openFile(filename);
        editor = vm.fs.getEditor(filename);
    } else if (container instanceof SourceContainer && container.is_repl()) {
        editor = vm.repl;
    } else {
        // unknown source container
        return null;
    }

    var end = position_to_line_ch(loc.end_pos);
    var start = position_to_line_ch(loc.start_pos);
    var allMarker = null;
    var endMarker = null;
    var eol = null;

    if (start.line === end.line && start.ch < 0 && end.ch <= 0) {

        if (end.ch < 0) return;

        eol = editor.addLineClass(end.line-1, 'text', cssClass+'-eol');

    } else {

        allMarker = editor.markText(start, end, { 'className': cssClass });
        allMarker.cb_editor = editor;

        if (markEnd) {
            // mark the last character (useful for pointing bubble to it)
            start.line = end.line;
            start.ch = end.ch-1;
            endMarker = editor.markText(start, end, { 'className': cssClass+'-end' });
            endMarker.cb_editor = editor;
        }
    }

    return { editor: editor, all: allMarker, eol: eol, end: endMarker };
};

function editor_URL(content, filename) {

    var site = document.location.origin +
               document.location.pathname.replace(/\/[^/]*$/g,'');

    return site + '/query.cgi?' + 'REPLAY=' +
           btoa(encode_utf8(('@C' +
                             (filename === void 0 ? '' : (filename + '@0')) +
                             content + '@E').replace(/\n/g,'@N')));
}

CodeBootVM.prototype.query = function (query) {

    var vm = this;

    vm.saved_query = query;
    vm.replay_command = '';
    vm.replay_command_index = 0;
    vm.replay_parameters = [];
};

function encode_utf8(str) {
    return unescape(encodeURIComponent(str));
}

function decode_utf8(str) {
    return decodeURIComponent(escape(str));
}

function toSafeBase64(str) {
    return convertToSafeBase64(btoa(unescape(encodeURIComponent(str))));
}

function toSafeBase64FromUint8Array(bytes) {
    var str = '';
    var len = bytes.byteLength;
    for (var i=0; i<len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return convertToSafeBase64(btoa(str));
}

function fromSafeBase64(b64) {
    return decodeURIComponent(escape(atob(convertFromSafeBase64(b64))));
}

function fromSafeBase64ToUint8Array(b64) {
    var str = atob(convertFromSafeBase64(b64));
    var len = str.length;
    var bytes = new Uint8Array(len);
    for (var i=0; i<len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}

function convertToSafeBase64(b64) {
    return b64.replace(/\+/g,'-').replace(/\//g,'_');
}

function convertFromSafeBase64(b64) {
    return b64.replace(/-/g,'+').replace(/_/g,'/');
}

function toUint8Array(str) {
    return new TextEncoder().encode(str);
}

function fromUint8Array(arr) {
    return new TextDecoder().decode(arr);
}

CodeBootVM.prototype.handle_query = function () {

    var vm = this;
    var query = vm.saved_query;

    if (query && query.slice(0, 7) === 'replay=') {

        vm.replay_command = decodeURIComponent(query.slice(7));
        vm.replay_command_index = 0;
        vm.replay_syntax = 1;

        setTimeout(function () { vm.replay(); }, 100);
    } else if (query && query.slice(0, 7) === 'REPLAY=') {

        vm.replay_command = decode_utf8(atob(query.slice(7)));
        vm.replay_command_index = 0;
        vm.replay_syntax = 2;

        setTimeout(function () { vm.replay(); }, 100);
    } else if (query && query.slice(0, 10) === 'replay%25=') {

        vm.replay_command = decodeURIComponent(decodeURIComponent(query.slice(10)));
        vm.replay_command_index = 0;
        vm.replay_syntax = 2;

        setTimeout(function () { vm.replay(); }, 100);
    } else if (query && query.slice(0, 8) === 'replay%=') {

        vm.replay_command = decodeURIComponent(query.slice(8));
        vm.replay_command_index = 0;
        vm.replay_syntax = 2;

        setTimeout(function () { vm.replay(); }, 100);
    }
};

CodeBootVM.prototype.replay = function () {

    var vm = this;
    var command = vm.replay_command;
    var i = vm.replay_command_index;

    if (i < command.length) {
        var j = i;
        while (j < command.length &&
               (command.charAt(j) !== '@' ||
                (command.charAt(j+1) === '@' ||
                 (vm.replay_syntax === 2 && command.charAt(j+1) === 'N')))) {
            if (command.charAt(j) === '@') {
                j += 2;
            } else {
                j += 1;
            }
        }

        var str;

        if (vm.replay_syntax === 2) {
            str = command.slice(i, j).replace(/@N/g,'\n').replace(/@@/g,'@');
        } else {
            str = command.slice(i, j).replace(/@@/g,'\n');
        }

        if (command.charAt(j) === '@') {
            if (command.charAt(j+1) >= '0' && command.charAt(j+1) <= '9') {
                vm.replay_parameters[+command.charAt(j+1)] = str;
                j += 2;
            } else if (command.charAt(j+1) === 'P') {
                if (str !== '') {
                    vm.replSetInput(str);
                    vm.repl.refresh();
                    vm.repl.focus();
                } else {
                    vm.execEval();
                    j += 2;
                }
            } else if (command.charAt(j+1) === 'S') {
                if (str !== '') {
                    vm.replSetInput(str);
                    vm.repl.refresh();
                    vm.repl.focus();
                } else {
                    vm.execStepPause();
                    j += 2;
                }
            } else if (command.charAt(j+1) === 'A') {
                if (str !== '') {
                    vm.replSetInput(str);
                    vm.repl.refresh();
                    vm.repl.focus();
                } else {
                    vm.execAnimate();
                    j += 2;
                }
            } else if (command.charAt(j+1) === 'E') {
                var default_filename = 'scratch';
                var filename = default_filename;
                if (vm.replay_parameters[0] !== void 0) {
                    filename = vm.replay_parameters[0];
                    vm.replay_parameters[0] = void 0;
                }
                var existing = vm.fs.openFileExistingOrNew(filename);
                var editor = vm.fs.getEditor(filename);
                var replace = true;
                if (existing &&
                    filename !== default_filename &&
                    editor.getValue() !== str) {
                    replace = confirm('You are about to replace the file "' + filename + '" with different content.  Are you sure you want to proceed with the replacement and lose your local changes to that file?');
                }
                if (replace) {
                    editor.setValue(str);
                    vm.showTryMeTooltip();
                }
                j += 2;
            } else if (command.charAt(j+1) === 'C') {
                vm.fs.removeAllEditors();
                drawing_window.cs();
                pixels_window.clear();
                j += 2;
            } else {
                // unknown command
                j += 2;
            }
        } else {
            if (str !== '') {
                vm.replSetInput(str);
                if (j === command.length) {
                    vm.showTryMeTooltip();
                }
            }
        }

        vm.replay_command_index = j;

        if (j < command.length) {
            setTimeout(function () { vm.replay(); }, 1);
        }
    }
};

CodeBootVM.prototype.showTryMeTooltip = function () {

    var vm = this;

    vm.showExecControlsMessage('TRY ME!', 2000);
};

CodeBootVM.prototype.showExecControlsMessage = function (msg, timeout) {

    var vm = this;

    var execControls = vm.root.querySelector('.cb-exec-controls-buttons');

    if (execControls) {
        execControls.setAttribute('data-original-title', msg);
        $(execControls).tooltip('show');
        vm.afterDelay(function () {
            $(execControls).tooltip('hide');
            execControls.setAttribute('data-original-title',
                                      execControls.getAttribute('title'));
        }, timeout);
    }
};

CodeBootVM.prototype.isRunning = function () {
    var vm = this;
    return vm.isModeRunning(vm.ui.mode);
};

CodeBootVM.prototype.isModeRunning = function (mode) {
    var vm = this;
    return mode !== vm.modeStopped() && mode !== vm.modeDone();
};

CodeBootVM.prototype.modeStopped = function () {
    return 'stopped';
};

CodeBootVM.prototype.modeDone = function () {
    return 'done';
};

CodeBootVM.prototype.modeAnimating = function () {
    return 'animating';
};

CodeBootVM.prototype.modeAnimatingSleeping = function () {
    return 'animatingSleeping';
};

CodeBootVM.prototype.modeStepping = function () {
    return 'stepping';
};

CodeBootVM.prototype.event_queue_trim = function (n) {

    var vm = this;

    while (vm.ui.event_queue.length > n) {
        vm.ui.event_queue.shift();
    }
};

CodeBootVM.prototype.event_queue_add = function (thunk) {

    var vm = this;

    vm.ui.event_queue.push(thunk);
};

CodeBootVM.prototype.event_queue_check = function () {

    var vm = this;

    if (vm.ui.mode === vm.modeDone()) {
        vm.event_queue_service();
    }
};

CodeBootVM.prototype.event_queue_service = function () {

    var vm = this;

    if (vm.ui.event_queue.length > 0) {
        vm.ui.event_queue.shift()();
    }
};

// Step counter

CodeBootVM.prototype.updateStepCounter = function () {
    var vm = this;
    if (vm.ui.execStepCounter) {
        vm.ui.execStepCounter.innerText = vm.textStepCounter();
    }
};

CodeBootVM.prototype.showingStepCounter = function () {
    var vm = this;
    if (vm.ui.execStepCounter)
        return vm.ui.execStepCounter.style.display !== 'none';
    else
        return false;
};

CodeBootVM.prototype.showStepCounter = function () {
    var vm = this;
    if (vm.ui.execStepCounter) {
        vm.ui.execStepCounter.style.display = 'inline';
        vm.updateStepCounter();
    }
};

CodeBootVM.prototype.hideStepCounter = function () {
    var vm = this;
    if (vm.ui.execStepCounter) {
        vm.ui.execStepCounter.style.display = 'none';
    }
};

CodeBootVM.prototype.textStepCounter = function () {
    var vm = this;
    var count = vm.lang.getStepCount();
    return count + ' step' + (count>1 ? 's' : '');
};

CodeBootVM.prototype.updatePopupPos = function () {
    var vm = this;
    //console.log('called updatePopupPos');
    if (vm.ui.execPointMark !== null &&
        vm.ui.execPointMark.end !== null &&
        vm.ui.execPointBubble !== null) {
        //console.log('==> updatePopupPos ' + vm.isMarkerVisible(vm.ui.execPointMark.end));
        if (vm.isMarkerVisible(vm.ui.execPointMark.end)) {
            vm.ui.execPointBubble.show();
        } else {
            vm.ui.execPointBubble.hide();
        }
    }
};

/*
CodeBootVM.prototype.hasDisplayNone = function (selector) {
    var vm = this;
    var result = true;
    vm.forEachElem(selector, function (elem) {
        if (elem.style.display !== 'none') result = false;
    });
    return result;
};

CodeBootVM.prototype.setText = function (selector, text) {
    var vm = this;
    vm.forEachElem(selector, function (elem) {
        elem.innerText = text;
    });
};

*/

CodeBootVM.prototype.setDisplay = function (selector, display) {

    var vm = this;

    vm.forEachElem(selector, function (elem) {
        elem.style.display = display;
    });
};

CodeBootVM.prototype.replSetReadOnly = function (val) {

    var vm = this;

    vm.setReadOnly(vm.repl, val);
};

CodeBootVM.prototype.enterMode = function (newMode) {

    var vm = this;

    // newMode is one of 'stopped', 'done', 'animating',
    // 'animatingSleeping', 'stepping'

    if (vm.ui.mode === newMode)
        return;

    var isRunning = vm.isModeRunning(newMode);
    var isStepping = newMode === vm.modeStepping();
    var isAnimating = isRunning && !isStepping;

    // Show either play-1, pause or play-pause

    vm.setDisplay('.cb-exec-play-1',     isStepping  ? 'inline' : 'none');
    vm.setDisplay('.cb-exec-pause',      isAnimating ? 'inline' : 'none');
    vm.setDisplay('.cb-exec-play-pause', !isRunning  ? 'inline' : 'none');

    vm.setClass('cb-mode-running', isRunning);
    vm.replSetReadOnly(isRunning);
    vm.fs.fem.setReadOnlyAllEditors(isRunning);

    if (isRunning) {

        // Update step counter

        if (vm.showingStepCounter()) {
            vm.updateStepCounter();
        }
    } else {

        vm.pauseAtStepCount = Infinity; // don't force pause next time
        vm.focusLastFocusedEditor();
        vm.stopAnimation();
        vm.hideExecPoint();
        vm.hideStepCounter();
        vm.lang.stopExecution();
        vm.replAllowInput();

        if (newMode === vm.modeStopped) {
            vm.event_queue_trim(0); // clear event queue
        }

        //TODO: interferes?
        //vm.repl.focus();
    }

    vm.ui.mode = newMode;

    vm.event_queue_check();
};

// UI event handling

// Control of execution

CodeBootVM.prototype.execStepPause = function () {
    var vm = this;
    vm.execEvent('steppause');
};

CodeBootVM.prototype.execAnimate = function () {
    var vm = this;
    vm.execEvent('animate');
};

CodeBootVM.prototype.execEval = function () {
    var vm = this;
    vm.execEvent('eval');
};

CodeBootVM.prototype.execStop = function () {
    var vm = this;
    vm.execEvent('stop');
};

CodeBootVM.prototype.execReset = function () {
    var vm = this;
    vm.execEvent('reset');
};

CodeBootVM.prototype.repeatLatestExecEvent = function () {
    var vm = this;
    vm.execEvent(vm.latestExecEvent);
};

/*
TODO: useless?
CodeBootVM.prototype.execStepOrEval = function () {
    var vm = this;
    if (vm.lang.isRunning()) // currently running code?
        vm.execStep();
    else
        vm.execEval();
};
*/

CodeBootVM.prototype.execEvent = function (event) {

    var vm = this;

    vm.latestExecEvent = event;

    switch (event) {

    case 'steppause':
        vm.steppause();
        break;

    case 'animate':
        vm.animate();
        break;

    case 'eval':
        vm.eval();
        break;

    case 'stop':
        vm.stop();
        break;

    case 'reset':
        vm.reset();
        break;
    }
};

CodeBootVM.prototype.steppause = function () {
    var vm = this;
    if (vm.ui.mode !== vm.modeAnimating()) {
        vm.exec(Infinity);
    } else {
        vm.stopAnimation();
        vm.showExecPoint();
        vm.enterMode(vm.modeStepping());
    }
};

CodeBootVM.prototype.animate = function () {
    var vm = this;
    vm.exec(vm.ui.stepDelay);
};

CodeBootVM.prototype.eval = function () {
    var vm = this;
    vm.exec(0);
};

CodeBootVM.prototype.exec = function (delay) {

    // delay = 0 : execute code without stepping
    // delay = Infinity : pause execution (after one step if currently paused)
    // 0 < delay < Infinity : animate execution with that delay between steps

    var vm = this;

    if (vm.isRunning()) {
        vm.exec_continue(delay);
    } else {
        vm.exec_start(delay);
    }
};

CodeBootVM.prototype.exec_start = function (delay) {

    var vm = this;

    if (vm.lastFocusedEditor === null) return;

    vm.replSetCursorToEnd();

    if (vm.lastFocusedEditor === vm.repl) {

        /* running REPL input */

        vm.exec_start_repl(delay);

    } else {

        /* running file */

        vm.exec_start_file(delay);
    }
};

CodeBootVM.prototype.exec_start_repl = function (delay) {

    var vm = this;

    var source = vm.replGetInput();

    if (source.trim() === '') { // accept empty input but do nothing else
        vm.replAcceptInput();
        vm.replAllowInput();
        return;
    }

    var line = vm.replInputPos().line;

    // remove trailing whitespace to undo effect of automatic indent
    var cleaned_source = source.replace(/[ \t\f]*$/,'');

    function compile() {
        return vm.compile_repl(cleaned_source + '\n',
                               line+1,
                               1,
                               false, // preserve execution state
                               null);
    }

    function after_compile() {
        // accept input and add it to history
        vm.replAddHistory(cleaned_source);
        vm.replAcceptInput();
    }

    vm.stepDelayForEventHandler = delay;

    vm.comp_and_run_code(compile,
                         after_compile,
                         after_compile,
                         delay);
};

CodeBootVM.prototype.exec_start_file = function (delay) {

    var vm = this;

    var filename = vm.lastFocusedEditor.cb.fileEditor.filename;

    if (vm.root.hasAttribute('data-cb-runable-code')) {
        source = '';
    } else {
        source = vm.lang.loadCommand(filename);
        vm.replSetInput(source);
        vm.replAcceptInput();
    }

    function compile() {
        return vm.compile_internal_file(filename,
                                        true, // force reset state
                                        null);
    }

    function after_successful_compile() {
        drawing_window.cs(); // clear drawing window when running file
        pixels_window.clear();
        vm.replAddHistory(source);
    }

    function after_failed_compile() {
    }

    vm.stepDelayForEventHandler = delay;

    vm.comp_and_run_code(compile,
                         after_successful_compile,
                         after_failed_compile,
                         delay);
};

CodeBootVM.prototype.exec_start_event_handler = function (source, event, delay) {

    var vm = this;

    function compile() {
        return vm.compile_event_handler(source + '\n',
                                        1,
                                        1,
                                        false, // preserve execution state
                                        event);
    }

    function after_compile() {
    }

    vm.comp_and_run_code(compile,
                         after_compile,
                         after_compile,
                         delay);
};

CodeBootVM.prototype.comp_and_run_code = function (compile, after_successful_compile, after_failed_compile, delay) {

    var vm = this;

    var code = null;

    vm.hideReasonHighlight();

    try {
        code = compile();
    }
    catch (e) {
        //console.log(e);
        if (e === 'continuable REPL input') {
            vm.replNewline();
        } else {
            after_failed_compile();
            vm.showReason(e);
        }

        vm.replAllowInput();
        return;
    }

    after_successful_compile();

    vm.run_code(code, delay);
};

CodeBootVM.prototype.run_code = function (code, delay) {

    var vm = this;

    if (code === null) {
        vm.replAllowInput();
    } else {
        vm.ui.mode = vm.modeAnimating();
        vm.lang.startExecution(code);
        vm.ui.mode = vm.modeStopped();
        vm.enterMode(vm.modeAnimating());
        vm.exec_continue(delay);
        //TODO: interferes?
        //vm.repl.focus();
    }
};

/*
deprecated
CodeBootVM.prototype.update_mode = function (delay) {

    var vm = this;

    if (delay === 0) {
        vm.enterMode(vm.modeAnimating());
        vm.hideExecPoint();
    } else {
        var was_animating = vm.stopAnimation();
        vm.ui.stepDelay = delay;
        vm.enterMode(vm.modeStepping());
//        if (was_animating)
//            vm.showExecPoint();
    }
};

CodeBootVM.prototype.step_or_animate = function (single_step) {
    var vm = this;
    //TODO: interferes?
    //vm.repl.focus();
    if (vm.lang.isExecuting()) // currently executing code?
        vm.exec_continue(single_step);
    else
        vm.run(single_step);
};
*/

CodeBootVM.prototype.stopAnimation = function () {

    var vm = this;

    // Stops any time-based animation of the program

    var id = vm.ui.timeoutId;

    if (id !== null) {
        clearTimeout(id); // cancel the scheduled execution step
        vm.ui.timeoutId = null;
    }

    return id !== null; // returns true if a time-based animation was cancelled
};

CodeBootVM.prototype.stop = function (reason) {

    // when reason is not null, an error message will be displayed

    var vm = this;

    var mode = (reason === '') ? vm.modeDone() : vm.modeStopped();

    if (vm.ui.mode !== mode) {

        if (reason !== null) {
            if (reason === undefined) reason = 'stopped';
            vm.showReason(reason);
        }

        vm.enterMode(mode);
    }
};

CodeBootVM.prototype.reset = function () {

    var vm = this;

    if (vm.ui.mode !== vm.modeStopped()) {
        vm.enterMode(vm.modeStopped());
    }

    vm.force_reset = true;
};

CodeBootVM.prototype.showReason = function (reason) {

    // reason can be a string or an Error object

    var vm = this;

    var elem = $('<span class="cb-repl-error"/>');
    var withStepCounter = vm.showingStepCounter();
    var loc = null;
    var kind = null;
    var msg;

    if (typeof reason === 'string') {
        msg = reason;
    } else {

        if (reason instanceof vm.Error) {
            loc = reason.loc;
            kind = reason.kind;
            msg = reason.msg;
        } else {
            loc = vm.lang.getLocation();
            msg = 'Internal error -- ' + String(reason);
        }
    }

    if (msg !== '' || withStepCounter) {

        if (loc) {
            loc = vm.lang.relativeLocation(loc);   // convert to relative loc
            msg = vm.errorMessage(loc, kind, msg); // add location to message
            vm.showReasonHighlight(loc);           // and highlight location
        }

        if (withStepCounter) {
            if (msg !== '') msg += ' after ';
            elem.text(msg);
            var counter = $('<span class="badge badge-primary badge-pill cb-step-counter"/>');
            counter.text(vm.textStepCounter());
            elem.append(counter);
            vm.hideStepCounter(); //TODO: belongs elsewhere
        } else {
            elem.text(msg);
        }

        vm.replAddLineWidgetTranscript(elem.get(0));
    }
};

CodeBootVM.prototype.Error = function (loc, kind, msg) {
    var se = this;
    se.loc = loc;
    se.kind = kind;
    se.msg = msg;
};

CodeBootVM.prototype.syntaxError = function (loc, kind, msg) {

    var vm = this;

    if (kind !== 'warning -- ') {
        throw new vm.Error(loc, kind, msg);
    }
};

CodeBootVM.prototype.errorMessage = function (loc, kind, msg) {

    var vm = this;
    var locText = '';

    if (loc && vm.showLineNumbers && !loc.container.is_repl()) {
        locText = loc.toString('simple') + ': ';
    }

    return locText + ((kind === null) ? '' : kind) + msg;
};

CodeBootVM.prototype.displayError = function (loc, kind, msg) {

    var vm = this;

    if (loc) vm.showReasonHighlight(loc);
    vm.replAddTranscript(vm.errorMessage(loc, kind, msg) + '\n',
                         'cb-repl-error');
};

CodeBootVM.prototype.showReasonHighlight = function (loc) {

    var vm = this;

    vm.hideReasonHighlight();

    vm.ui.errorMark = vm.codeHighlight(loc, 'cb-code-error', false);

    if (vm.ui.errorMark)
        vm.scrollToMarker(vm.ui.errorMark.all);
};

CodeBootVM.prototype.hideReasonHighlight = function () {

    var vm = this;
    var mark = vm.ui.errorMark;

    if (mark) {
        vm.clearMarker(mark);
        vm.ui.errorMark = null;
    }
};

CodeBootVM.prototype.clearMarker = function (marker) {

    var vm = this;

    if (marker.all !== null) {
        marker.all.clear();
    }
    if (marker.eol !== null) {
        marker.editor.removeLineClass(marker.eol, 'text');
    }
    if (marker.end !== null) {
        marker.end.clear();
    }
};

CodeBootVM.prototype.within = function (rect, viewport) {

    var vm = this;
    var x = (rect.left + rect.right) / 2;
    var y = (rect.top + rect.bottom) / 2;

    //alert(x+','+y+'   '+viewport.left+','+(viewport.left+viewport.clientWidth)+','+viewport.top+','+(viewport.top+viewport.clientHeight));

    if (x < viewport.left) return false;
    if (x > viewport.left + viewport.clientWidth) return false;
    if (y < viewport.top) return false;
    if (y > viewport.top + viewport.clientHeight) return false;

    return true;
};

CodeBootVM.prototype.isCharacterVisible = function (pos, editor) {
    var vm = this;
    var point = editor.charCoords(pos, 'local');
    var scrollInfo = editor.getScrollInfo();
    return vm.within(point, scrollInfo);
};

CodeBootVM.prototype.isMarkerVisible = function (marker, editor) {
    var vm = this;
    var res = false;
    if (!editor) editor = marker.cb_editor;
    var range = marker.find();
    if (range) res = vm.isCharacterVisible(range.from, editor);
    return res;
};

CodeBootVM.prototype.scrollToMarker = function (marker, editor) {
    var vm = this;
    if (!marker) return;
    if (!editor) editor = marker.cb_editor;
    if (!vm.isMarkerVisible(marker, editor)) {
        var range = marker.find();
        if (range) {
            var rect = editor.charCoords(range.from, 'local');
            var scrollInfo = editor.getScrollInfo();
            //editor.scrollIntoView(rect, 0.5 * scrollInfo.clientHeight);
            editor.scrollIntoView(rect, 0.1 * scrollInfo.clientHeight);
       }
    }
};

function CodeBootExecPointBubble(vm) {

    var bubble = this;

    bubble.vm   = vm;
    bubble.tip  = null;
    bubble.elem = null;
};

CodeBootExecPointBubble.prototype.isVisible = function () {

    var bubble = this;

    if (bubble.tip !== null) {
        return !bubble.tip.hidden;
    }

    return false;
};

CodeBootExecPointBubble.prototype.show = function () {

    var bubble = this;

    if (bubble.tip !== null) {
        //console.log('bubble.tip.show()');
        bubble.tip.show();
    }
};

CodeBootExecPointBubble.prototype.hide = function () {

    var bubble = this;

    if (bubble.tip !== null) {
        //console.log('bubble.tip.hide()');
        bubble.tip.hide();
    }
};

CodeBootExecPointBubble.prototype.destroy = function () {

    var bubble = this;

    if (bubble.tip !== null) {
        bubble.tip.destroy();
    }

    bubble.tip  = null;
    bubble.elem = null;
};

CodeBootExecPointBubble.prototype.setContent = function (html) {

    var bubble = this;

    if (bubble.tip !== null) {
        bubble.tip.setContent(html);
    }
};

CodeBootVM.prototype.execPointCodeElement = function () {

    var vm = this;

    return vm.root.querySelector('.cb-exec-point-code-end');
};

CodeBootExecPointBubble.prototype.attachTo = function (elem, html) {

    var bubble = this;
    var vm = bubble.vm;

    if (elem === null) return;

    if (bubble.elem === null || bubble.elem !== elem) {

        /* create a new bubble */

        if (bubble.elem !== null)
            bubble.destroy();

        var tip = tippy(elem, {
            appendTo: vm.root, //elem.closest('.CodeMirror-scroll'),
            allowHTML: true,
            placement: 'bottom-start',
            maxWidth: 9999,
            trigger: 'manual',
            hideOnClick: false,
            theme: 'cb-exec-point-bubble'
        });

        bubble.tip = tip;
        bubble.elem = elem;
        //console.log('called tippy');
    }
    //else console.log('not calling tippy');

    bubble.setContent(html);
    vm.afterDelay(function () { bubble.show(); });
};

CodeBootVM.prototype.hideExecPoint = function () {

    var vm = this;

    vm.ui.execPointBubble.destroy();

    var mark = vm.ui.execPointMark;

    if (mark !== null) {
        vm.clearMarker(mark);
        vm.ui.execPointMark = null;
    }

        // Somehow, CodeMirror seems to hold on to the marked elements
        // somewhere, causing problems when displaying the
        // bubble. This kludge should at least prevent the problem
        // from manifesting for the user.
        //TODO: proper fix
//        $('.cb-exec-point-code').removeClass('cb-exec-point-code');
};

CodeBootVM.prototype.showExecPoint = function (skipExecPointBubble) {

    var vm = this;

    vm.showStepCounter();

    vm.hideExecPoint();

    var loc = vm.lang.getLocation();
    if (loc) loc = vm.lang.relativeLocation(loc); // convert to relative loc
    vm.ui.execPointMark = vm.codeHighlight(loc, 'cb-exec-point-code', true);

    if (!vm.ui.execPointMark)
        return false;

    vm.scrollToMarker(vm.ui.execPointMark.end);

    var value = vm.lang.getResult();
    var $container;
    if (loc.container instanceof SourceContainerInternalFile) {
        $container = $('#cb-editors');
    } else {
        $container = null; /* use whole document */
    }

    if ($container !== null &&
       true //TODO: fix    !$('.cb-exec-point-code-end').last().isInView($container)
       ) {
        var filename = loc.container.toString();
        vm.fs.openFile(filename);
        var file = vm.fs._asFile(filename);
        vm.scrollTo(file.fe.fileContainer);
    }

    if (!skipExecPointBubble) {
        vm.ui.execPointBubble.attachTo(
            vm.execPointCodeElement(),
            vm.lang.executionStateHTML());
    }

    return true;
/*
    $('.cb-exec-point-code').hover(function (event) {
        if (!vm.ui.execPointBubble.isVisible()) {
            vm.showExecPoint();
        }
    });
*/
};

/*
deprecated
CodeBootVM.prototype.exec_continue = function (delay) {
    var vm = this;
    if (false && vm.hideExecPoint()) { //TODO: find a better way... this causes too much flicker
        // give some time for the browser to refresh the page
        setTimeout(function () { vm.exec_continue2(single_step); }, 10);
    } else {
        // step was not shown, so no need to wait
        vm.exec_continue2(delay);
    }
};
*/

CodeBoot.prototype.register_event_handler = function (vm, src) {
    var id;
    var key = (vm === null ? '' : vm.index) + '/' + src;
    var map = CodeBoot.prototype.event_handler_map;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
        id = map[key];
    } else {
        var descrs = CodeBoot.prototype.event_handler_descrs;
        id = descrs.push({ vm: vm, src: src })-1;
        map[key] = id;
    }
    return id;
};

CodeBoot.prototype.rewrite_event_handlers = function (vm, elem) {
    var prefix = 'CodeBoot.prototype.event_handle(event,';
    CodeBoot.prototype.event_attrs.forEach(function (attr) {
        if (elem.hasAttribute(attr)) {
            var val = elem.getAttribute(attr);
            if (val.indexOf(prefix) !== 0) {
                // register handler only if it is not already transformed
                var id = CodeBoot.prototype.register_event_handler(vm, val);
                if (attr === 'onload') {
                    elem.removeAttribute(attr);
                    CodeBoot.prototype.onload_handlers.push({ id: id, elem: elem });
                } else {
                    var handler = prefix + id + ')';
                    elem.setAttribute(attr, handler);
                }
            }
        }
    });
    CodeBoot.prototype.rewrite_event_handlers_children(vm, elem);
};

CodeBoot.prototype.rewrite_event_handlers_children = function (vm, elem) {
    var child = elem.firstElementChild;
    while (child) {
        CodeBoot.prototype.rewrite_event_handlers(vm, child);
        child = child.nextElementSibling;
    }
};

CodeBoot.prototype.event_attrs =
    ['onload','onfocus','onblur','onfocusin','onfocusout',
     'onkeydown','onkeypress','onkeyup',
     'onclick','ondblclick','oncontextmenu','onmousedown','onmouseup',
     'onmousemove','onmouseenter','onmouseleave','onmouseover','onmouseout',
     'onanimationcancel','onanimationend','onanimationiteration'];

CodeBoot.prototype.event_handler_map = Object.create(null);
CodeBoot.prototype.event_handler_descrs = [];
CodeBoot.prototype.onload_handlers = [];

CodeBoot.prototype.event_handle = function (event, id) {
    var descr = CodeBoot.prototype.event_handler_descrs[id];
    var vm = descr.vm;
    if (!vm) vm = getCodeBootVM();
    vm.event_handle(descr.src, event);
};

CodeBootVM.prototype.event_handle = function (src, event) {

    var vm = this;

    if (vm.ui.mode !== vm.modeStopped()) {
        vm.event_queue_add(function () {
            vm.exec_start_event_handler(src, vm.copy_event(event), vm.stepDelayForEventHandler);
        });

        vm.event_queue_check();
    }
};

CodeBootVM.prototype.copy_event = function (event) {

    var vm = this;

    var copy = {};

    ['type', 'target', 'currentTarget', 'pageX', 'pageY', 'buttons',
     'key', 'code', 'altKey', 'ctrlKey', 'shiftKey'].forEach(function (prop) {
        if (prop in event) copy[prop] = event[prop];
    });

    return copy;
};


CodeBootVM.prototype.exec_continue = function (delay) {

    var vm = this;
    var lang = vm.lang;

    if (!lang.isExecuting()) return;

    var maxStepChunk = 51151;
    var stepChunk = maxStepChunk;
    var newMode;

    if (delay > 0) {
        stepChunk = 1; // execute single step
    } else {
        stepChunk = Math.max(1,
                             Math.min(stepChunk,
                                      vm.pauseAtStepCount -
                                      vm.lang.getStepCount()));
    }

    var was_animating = vm.stopAnimation(); // cancel execution animation timer if any

    try {
        lang.continueExecution(stepChunk, delay);
    }
    catch (e) {
        vm.updatePlayground();
        //console.log(e);
        vm.showReason(e);
        vm.stop(null);
        return;
    }

    vm.updatePlayground();

    /*
      if (vm.ui.mode === vm.modeStepping()) {
      single_step = true;
      }
    */

    //$('#cb-menu-brand').text(vm.ui.mode);

    if (!lang.isExecuting()) {

        //console.log('lang.isExecuting() === false');
        // execution has finished... check if with result or error

        if (lang.isEndedWithResult()) {
            var is_repl = vm.lang.getLocation().container.is_repl();
            vm.executionEndedWithResult(lang.getResult(), is_repl);
        } else {
            vm.executionEndedWithError(vm.lang.getError());
        }

    } else if (vm.lang.getLocation().container.is_html()) {

        if (vm.ui.timeoutId !== null) {

            // program is executing a "sleep"?

            newMode = vm.modeAnimatingSleeping();

        } else {

            // resume execution after appropriate delay

            newMode = vm.modeAnimating();

            vm.stepDelay = delay;

            vm.ui.timeoutId =
                vm.afterDelay(function () {
                                  vm.exec_continue(vm.stepDelay);
                              });
        }

        vm.enterMode(newMode);

    } else {

        //console.log('lang.isExecuting() === true');

        // determine how execution will continue (either we continue
        // after the requested delay, or we must wait for an execution
        // event)

        newMode = vm.modeStepping();

        if (delay < Infinity) {

            // execution with animation mode

            var forceStepping = vm.pauseAtStepCount <= vm.lang.getStepCount();

            if (vm.pauseAtStepCount <= vm.lang.getStepCount()) {
                newMode = vm.modeStepping();
                vm.pauseAtStepCount = Infinity; // don't force pause next time
                maxStepChunk = 0; // force showing step counter
            }

            if (vm.showingStepCounter()) {
                vm.updateStepCounter();
            } else if (vm.lang.getStepCount() >= maxStepChunk || forceStepping) {
                vm.showStepCounter();
            }

            if (vm.ui.timeoutId !== null) {

                // program is executing a "sleep"?

                newMode = vm.modeAnimatingSleeping();

            } else if (!forceStepping) {

                // resume execution after appropriate delay

                newMode = vm.modeAnimating();

                vm.stepDelay = delay;

                vm.ui.timeoutId =
                    vm.afterDelay(function () {
                                      vm.exec_continue(vm.stepDelay);
                                  },
                                  delay);
            }
        }

        if (forceStepping) {
            vm.showExecPoint();
        } else if (delay > 0 || newMode === vm.modeAnimatingSleeping()) {
            vm.showExecPoint(delay <= 10);
        } else {
            vm.hideExecPoint();
        }

        vm.enterMode(newMode);
    }
};

CodeBootVM.prototype.executionEndedWithError = function (err) {
    var vm = this;
    vm.stop(err);
};

CodeBootVM.prototype.executionEndedWithResult = function (result, is_repl) {

    var vm = this;

    if (is_repl) {
      vm.lastResult = result;
      vm.lastResultRepresentation = vm.lang.printedRepresentation(result);

      if (result !== void 0) {
          vm.replAddTranscript(vm.lastResultRepresentation, 'cb-repl-result');
      }
    }

    vm.executionHook();

    vm.stop('');
};

CodeBootVM.prototype.executionHook = function () {
};

CodeBootVM.prototype.executionSleep = function(sleepTime, afterSleepDelay) {
    var vm = this;

    if (sleepTime === Infinity){
        // Infinite sleep is a switch to single-step mode
        vm.ui.timeoutId = vm.afterDelay(function () { vm.exec_continue(Infinity); });
    }
    else if (sleepTime < 100) {
        // For short sleep, do not display bubble
        vm.ui.timeoutId = vm.afterDelay(function () { vm.exec_continue(afterSleepDelay); }, sleepTime);
    } else {
        function executionSleepLoop(sleepTime, afterSleepDelay, contextHTML){
            // For longer time, display a count-down
            var sleepStep = Math.min(sleepTime, 100);
            var remainingSleepTime = sleepTime - sleepStep;

            var bubbleContent =
                '<div class="cb-exec-point-bubble-value">' +
                '<code><i>sleeping ' + (sleepTime / 1000).toFixed(1) + 's</i></code>' +
                '</div>' +
                contextHTML;

            vm.ui.execPointBubble.attachTo(vm.execPointCodeElement(), bubbleContent);

            if (remainingSleepTime <= 0){
                // Restart execution after next micro-sleep
                vm.ui.timeoutId = vm.afterDelay(function () { vm.exec_continue(afterSleepDelay); }, sleepTime);
            }
            else {
                // Sleep for 100ms then comeback to update counter
                vm.ui.timeoutId = vm.afterDelay(function () {
                    vm.executionSleep(remainingSleepTime, afterSleepDelay);
                }, sleepStep);
            }
        }

        // Compute the context once before the sleep instead of at each step
        var context = vm.lang.contextHTML();

        var contextHTML =
            context === ''
                ? ''
                : '<div class="cb-exec-point-bubble-context">' +
                    vm.lang.contextHTML() +
                    '</div>';

        $('.cb-exec-point-code').hover(function (event) {
        if (!vm.ui.execPointBubble.isVisible()) {
            vm.showExecPoint();
        }})

        executionSleepLoop(sleepTime, afterSleepDelay, contextHTML);
    }
}


/*
deprecated
CodeBootVM.prototype.run_setup_and_execute = function (compile, single_step) {

    var vm = this;
    var code = null;

    vm.hideReasonHighlight();

    try {
        code = compile();
        if (code === null) {
            vm.stop(null);
            return true;
        } else {
            vm.lang.startExecution(code);
        }
    }
    catch (e) {
        //console.log(e);//TODO: remove
        if (e === 'continuable REPL input')
            return false;
        if (e !== false)
            vm.stop(String(e));
        else
            vm.stop(null);
        return true;
    }

    vm.execute(single_step);

    //TODO: interferes?
    //vm.repl.focus();

    return true;
};
*/

//-----------------------------------------------------------------------------

// Compilation of source code (at the REPL, files and URLs)

CodeBootVM.prototype.compile_repl = function (source, line, ch, force_reset, event) {
    var vm = this;
    return vm.compile(source,
                      new SourceContainer(source, false, line-1, ch-1),
                      force_reset,
                      event);
};

CodeBootVM.prototype.compile_event_handler = function (source, line, ch, force_reset, event) {
    var vm = this;
    return vm.compile(source,
                      new SourceContainer(source, null, line-1, ch-1),
                      force_reset,
                      event);
};

CodeBootVM.prototype.compile_file = function (filename, force_reset, event) {
    var vm = this;
    if (/^http:\/\//.test(filename)) {
        return vm.compile_url_file(filename, force_reset, event);
    } else {
        return vm.compile_internal_file(filename, force_reset, event);
    }
};

// begin deprecated

CodeBootVM.prototype.cacheURL = {};

CodeBootVM.prototype.readURL = function (url) {
    var vm = this;
    var cache = vm.cacheURL;
    if (Object.prototype.hasOwnProperty.call(cache, url)) {
        return cache[url];
    } else {
        var source = vm.getURL(url);
        if (source !== undefined) cache[url] = source;
        return source;
    }
};

CodeBootVM.prototype.getURL = function (url) {
    var vm = this;
    var content;
    $.ajax({
        url: 'geturl.cgi',
        type: 'POST',
        data: { url: url },
        dataType: 'text',
        async: false,
        success: function (data) {
            content = data;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            vm.replAddTranscript('Failed to load remote ressource\n',
                                 'cb-repl-error');
        }
    });
    return content;
};

CodeBootVM.prototype.compile_url_file = function (url, force_reset, event) {

    var vm = this;
    var source = vm.readURL(url);
    if (source === undefined) source = '';

    return vm.compile(source,
                      new SourceContainer(source, url, 0, 0),
                      force_reset,
                      event);
};

// end deprecated

CodeBootVM.prototype.compile_internal_file = function (filename, force_reset, event) {

    var vm = this;
    var state = vm.readFileInternal(filename);
    var source = state.content;

    return vm.compile(source,
                      new SourceContainerInternalFile(source, filename, 0, 0, state.stamp),
                      force_reset,
                      event);
};

CodeBootVM.prototype.readFileInternal = function (filename) {

    var vm = this;
    var file = vm.fs.getByName(filename);

    return {
        stamp: file.stamp,
        content: file.getContent(),
    };
};

CodeBootVM.prototype.writeFileInternal = function (filename, content) {

    var vm = this;
    var file;

    if (vm.fs.hasFile(filename)) {
        file = vm.fs.getByName(filename);
        file.setContent(content);
    } else {
        file = new CodeBootFile(vm.fs, filename, content);
        vm.fs.addFile(file);
        vm.fs.rebuildFileMenu();
    }
}

CodeBootVM.prototype.compile = function (source, container, force_reset, event) {

    var vm = this;

    force_reset = force_reset || vm.force_reset;
    vm.force_reset = false;

    return vm.lang.compile(source,
                           container,
                           force_reset,
                           event);
};

CodeBootVM.prototype.filterAST = function (ast, source) {

    var vm = this;

    vm.lastAST = ast;
    vm.lastSource = source;
    vm.lastResult = null;
    vm.lastResultRepresentation = null;

    return ast;
};

//-----------------------------------------------------------------------------

// TODO: deprecated

CodeBootVM.prototype.undo = function (cm) {
    cm.undo();
};

CodeBootVM.prototype.redo = function (cm) {
    cm.redo();
};
