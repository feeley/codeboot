CodeBoot.prototype.setupDrop = function (elt, handler) {

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

    elt.addEventListener('dragenter', onDragEnter);
    elt.addEventListener('dragleave', onDragLeave);
    elt.addEventListener('dragover', onDragOver);
    elt.addEventListener('drop', onDrop);
};

CodeBoot.prototype.addAlert = function (text, title, kind) {
    var alertDiv = $('<div/>').addClass('alert');
    if (kind) alertDiv.addClass('alert-' + kind);
    alertDiv.text(text);
    if (title) {
        alertDiv.prepend($('<strong/>').text(title), ' ');
    }
    alertDiv.prepend('<button class="close" data-dismiss="alert">&times;</button>');
    $(cb.alerts).append(alertDiv);
};

CodeBoot.prototype.reportError = function (text, title) {
    if (title === undefined) title = 'Error!';
    cb.addAlert(text, title, 'error');
};

CodeBoot.prototype.reportWarning = function (text, title) {
    if (title === undefined) title = 'Warning!';
    cb.addAlert(text, title);
};

function removeTrailingNewline(text) {
    var s = String(text);
    if (s.charAt(text.length - 1) === '\n') {
        s = s.slice(0, s.length-1);
    }
    return s;
}

function position_to_line_ch(pos) {
    return { line: position_to_line(pos)-1,
             ch: position_to_column(pos)-1
           };
}

CodeBoot.prototype.codeHighlight = function (loc, cssClass, markEnd) {

    var container = loc.container;
    var editor;

    if (container instanceof SourceContainerInternalFile) {
        var filename = container.toString();
        if (!cb.fs.hasFile(filename)) {
            return null; // the file is not known
        }
        var state = readFileInternal(filename);
        if (container.stamp !== state.stamp) {
            return null; // the content of the editor has changed so can't highlight
        }
        cb.fs.openFile(filename);
        editor = cb.fs.getEditor(filename);
    } else if (container instanceof SourceContainer) {
        editor = cb.repl;
    } else {
        // unknown source container
        return null;
    }

    var end = position_to_line_ch(loc.end_pos);
    var start = position_to_line_ch(loc.start_pos);
    var allMarker = editor.markText(start, end, { 'className': cssClass });
    allMarker.cb_editor = editor;

    if (markEnd) {
        start.line = end.line;
        start.ch = end.ch-1;
        var endMarker = editor.markText(start, end, { 'className': cssClass+'-end' });
        endMarker.cb_editor = editor;
        return { all: allMarker, end: endMarker };
    } else {
        return { all: allMarker, end: null };
    }
};

CodeBoot.prototype.printedRepresentation_old = function (x) {

    //TODO: avoid infinite loops for circular data!
    //TODO: avoid printing wider than page!
    //TODO: emit HTML markup, so that objects with a toHTML method can be represented specially (such as images)

    if (typeof x === "string") {
        var chars = [];
        chars.push("\"");
        for (var i=0; i<x.length; i++) {
            var c = x.charAt(i);
            if (c === "\"") {
                chars.push("\\\"");
            } else if (c === "\\") {
                chars.push("\\\\");
            } else if (c === "\n") {
                chars.push("\\n");
            } else {
                var n = x.charCodeAt(i);
                if (n <= 31 || n >= 256) {
                    chars.push("\\u" + (n+65536).toString(16).slice(1));
                } else {
                    chars.push(c);
                }
            }
        }
        chars.push("\"");
        return chars.join("");
    } else if (typeof x === "object") {
        if (x === null) {
            return "null";
        } else if (x instanceof Array) {
            var a = [];
            for (var i=0; i<x.length; i++)
                a.push(cb.printedRepresentation(x[i]));
            return "[" + a.join(", ") + "]";
        } else {
            var a = [];
            for (var p in x)
                a.push(cb.printedRepresentation(p)+": "+cb.printedRepresentation(x[p]));
            return "{" + a.join(", ") + "}";
        }
    } else if (typeof x === "undefined") {
        return "undefined";
    } else {
        return String(x);
    }
};

CodeBoot.prototype.printedRepresentation = function (obj, format) {

    if (format === void 0) {
        format = 'plain';
    }

    return cb.objectRepresentation(obj, format, 80).text;
};

function escape_HTML(text) {
  return text.replace(/[&<>"'`]/g, function (chr) {
    return '&#' + chr.charCodeAt(0) + ';';
  });
};

function editor_URL(content, filename) {

    var site = document.location.origin +
               document.location.pathname.replace(/\/[^/]*$/g,'');

    return site + '/query.cgi?' + 'REPLAY=' +
           btoa(encode_utf8(('@C' +
                             (filename === void 0 ? '' : (filename + '@0')) +
                             content + '@E').replace(/\n/g,'@N')));
}

CodeBoot.prototype.objectRepresentation = function (obj, format, limit) {

    var string_key_required = function (key) {

        return !((Scanner.prototype.is_identifier(key) &&
                  !Scanner.prototype.is_keyword(key)) ||
                 (''+key === ''+(+key) &&
                  +key >= 0));

    };

    var xform = function (str) {
        var text;
        if (format === 'HTML') {
            text = escape_HTML(str);
        } else {
            text = str;
        }
        return { text: text, len: str.length };
    };

    if (typeof obj === 'object') {

        if (obj === null) {

            return xform('null');

        } else if ('obj_repr' in obj) {

            return obj.obj_repr(format, limit);

        } else if (obj instanceof Array) {

            var a = ['['];
            var len = 1;

            for (var i=0; i<obj.length; i++) {
                if (i > 0) {
                    a.push(', ');
                    len += 2;
                }
                var r = cb.objectRepresentation(obj[i], format, limit-len-1);
                if (len + r.len + 1 > limit) {
                    a.push('...');
                    len += 3;
                    break;
                } else {
                    a.push(r.text);
                    len += r.len;
                }
            }

            a.push(']');
            len += 1;

            return { text: a.join(''), len: len };

        } else {

            var a = ['{'];
            var len = 1;
            var i = 0;

            for (var p in obj) {
                if (i++ > 0) {
                    a.push(', ');
                    len += 2;
                }
                var r1;
                if (string_key_required(p)) {
                    r1 = cb.objectRepresentation(p, format, limit);
                } else {
                    r1 = xform(''+p);
                }
                var r2 = cb.objectRepresentation(obj[p], format, limit-len-r1.len-3);
                if (len + r1.len + r2.len + 3 > limit) {
                    a.push('...');
                    len += 3;
                    break;
                } else {
                    a.push(r1.text);
                    a.push(': ');
                    a.push(r2.text);
                    len += r1.len + 2 + r2.len;
                }
            }

            a.push('}');
            len += 1;

            return { text: a.join(''), len: len };

        }
    } else if (typeof obj === 'string') {

        var delim = '"';
        var chars = [];
        chars.push(delim);
        for (var i=0; i<obj.length; i++) {
            var c = obj.charAt(i);
            if (c === delim) {
                chars.push('\\'+delim);
            } else if (c === '\\') {
                chars.push('\\\\');
            } else if (c === '\n') {
                chars.push('\\n');
            } else {
                var n = obj.charCodeAt(i);
                if (n <= 31 || n >= 256) {
                    chars.push('\\u' + (n+65536).toString(16).slice(1));
                } else {
                    chars.push(c);
                }
            }
        }
        chars.push(delim);

        return xform(chars.join(''));

    } else if (typeof obj === 'undefined') {

        return xform('undefined');

    } else {

        return xform(String(obj));

    }
};

CodeBoot.prototype.query = function (query) {
    cb.saved_query = query;
    cb.replay_command = '';
    cb.replay_command_index = 0;
    cb.replay_parameters = [];
};

function encode_utf8(str) {
    return unescape(encodeURIComponent(str));
}

function decode_utf8(str) {
    return decodeURIComponent(escape(str));
}

CodeBoot.prototype.handle_query = function () {

    var query = cb.saved_query;

    if (query && query.slice(0, 7) === 'replay=') {

        cb.replay_command = decodeURIComponent(query.slice(7));
        cb.replay_command_index = 0;
        cb.replay_syntax = 1;

        setTimeout(function () { cb.replay(); }, 100);
    } else if (query && query.slice(0, 7) === 'REPLAY=') {

        cb.replay_command = decode_utf8(atob(query.slice(7)));
        cb.replay_command_index = 0;
        cb.replay_syntax = 2;

        setTimeout(function () { cb.replay(); }, 100);
    } else if (query && query.slice(0, 10) === 'replay%25=') {

        cb.replay_command = decodeURIComponent(decodeURIComponent(query.slice(10)));
        cb.replay_command_index = 0;
        cb.replay_syntax = 2;

        setTimeout(function () { cb.replay(); }, 100);
    } else if (query && query.slice(0, 8) === 'replay%=') {

        cb.replay_command = decodeURIComponent(query.slice(8));
        cb.replay_command_index = 0;
        cb.replay_syntax = 2;

        setTimeout(function () { cb.replay(); }, 100);
    }
};

CodeBoot.prototype.replay = function () {

    var command = cb.replay_command;
    var i = cb.replay_command_index;

    if (i < command.length) {
        var j = i;
        while (j < command.length &&
               (command.charAt(j) !== '@' ||
                (command.charAt(j+1) === '@' ||
                 (cb.replay_syntax === 2 && command.charAt(j+1) === 'N')))) {
            if (command.charAt(j) === '@') {
                j += 2;
            } else {
                j += 1;
            }
        }

        var str;

        if (cb.replay_syntax === 2) {
            str = command.slice(i, j).replace(/@N/g,'\n').replace(/@@/g,'@');
        } else {
            str = command.slice(i, j).replace(/@@/g,'\n');
        }

        if (command.charAt(j) === '@') {
            if (command.charAt(j+1) >= '0' && command.charAt(j+1) <= '9') {
                cb.replay_parameters[+command.charAt(j+1)] = str;
                j += 2;
            } else if (command.charAt(j+1) === 'P') {
                if (str !== '') {
                    cb.setInputREPL(str);
                    cb.repl.refresh();
                    cb.repl.focus();
                } else {
                    cb.execEval();
                    j += 2;
                }
            } else if (command.charAt(j+1) === 'S') {
                if (str !== '') {
                    cb.setInputREPL(str);
                    cb.repl.refresh();
                    cb.repl.focus();
                } else {
                    cb.execStep();
                    j += 2;
                }
            } else if (command.charAt(j+1) === 'A') {
                if (str !== '') {
                    cb.setInputREPL(str);
                    cb.repl.refresh();
                    cb.repl.focus();
                } else {
                    cb.execAnimate();
                    j += 2;
                }
            } else if (command.charAt(j+1) === 'E') {
                var default_filename = 'scratch';
                var filename = default_filename;
                if (cb.replay_parameters[0] !== void 0) {
                    filename = cb.replay_parameters[0];
                    cb.replay_parameters[0] = void 0;
                }
                var existing = cb.fs.openFileExistingOrNew(filename);
                var editor = cb.fs.getEditor(filename);
                var replace = true;
                if (existing &&
                    filename !== default_filename &&
                    editor.getValue() !== str) {
                    replace = confirm('You are about to replace the file "' + filename + '" with different content.  Are you sure you want to proceed with the replacement and lose your local changes to that file?');
                }
                if (replace) {
                    editor.setValue(str);
                    cb.showTryMeTooltip();
                }
                j += 2;
            } else if (command.charAt(j+1) === 'C') {
                cb.fs.removeAllEditors();
                drawing_window.cs();
                j += 2;
            } else {
                // unknown command
                j += 2;
            }
        } else {
            if (str !== '') {
                cb.setInputREPL(str);
                if (j === command.length) {
                    cb.showTryMeTooltip();
                }
            }
        }

        cb.replay_command_index = j;

        if (j < command.length) {
            setTimeout(function () { cb.replay(); }, 1);
        }
    }
};

CodeBoot.prototype.showTryMeTooltip = function (filename) {
    $('#cb-exec-controls-buttons').tooltip('show');

    // Auto hide the tooltip after 2 secs
    setTimeout(function () { $('#cb-exec-controls-buttons').tooltip('hide'); }, 2000);
};

CodeBoot.prototype.modeStopped = function () {
    return 'stopped';
};

CodeBoot.prototype.modeAnimating = function () {
    return 'animating';
};

CodeBoot.prototype.modeAnimatingSleeping = function () {
    return 'animatingSleeping';
};

CodeBoot.prototype.modeStepping = function () {
    return 'stepping';
};

CodeBoot.prototype.initProgramState = function () {
    cb.programState = {
        rte: null,
        errorMark: null,
        execPointMark: null,
        execPointBubble: new CBExecPointBubble(),
        value_bubble: null, //TODO: deprecated
        timeoutId: null,
        stepDelay: 0,
        mode: null,
        code_queue: []
    };
};

function code_queue_add(code) {
    cb.programState.code_queue.push(code);
    code_queue_check();
}

function code_queue_check() {
    if (cb.programState.mode === cb.modeStopped()) {
        code_queue_service();
    }
}

function code_queue_service() {
    if (cb.programState.code_queue.length > 0) {
        var code = cb.programState.code_queue.shift();
        cb.programState.rte = jev.runSetup(code,
                                           {globalObject: cb.globalObject});
        cb.execute(false);
    }
}

CodeBoot.prototype.showingStepCounter = function () {
    return $('#cb-exec-step-counter').is(':visible');
};

CodeBoot.prototype.showStepCounter = function () {
    var counter = $('#cb-exec-step-counter');
    counter.css('display', 'inline');
    counter.text(cb.textStepCounter());
};

CodeBoot.prototype.hideStepCounter = function () {
    var counter = $('#cb-exec-step-counter');
    counter.css('display', 'none');
};

CodeBoot.prototype.textStepCounter = function () {
    var count = cb.programState.rte.step_count;
    return + count + ' step' + (count>1 ? 's' : '');
};

CodeBoot.prototype.updatePopupPos = function () {
    if (cb.programState.execPointMark !== null &&
        cb.programState.execPointMark.end !== null &&
        cb.programState.execPointBubble !== null) {
        if (cb.isMarkerVisible(cb.programState.execPointMark.end)) {
            cb.programState.execPointBubble.show();
        } else {
            cb.programState.execPointBubble.hide();
        }
    }
};

CodeBoot.prototype.enterMode = function (newMode) {

    // newMode is one of 'stopped', 'animating', 'animatingSleeping', 'stepping'

    if (cb.programState.mode === newMode)
        return false;

    var isStopped = newMode === cb.modeStopped();
    var isStepping = newMode === cb.modeStepping();
    var isAnimating = newMode === cb.modeAnimating();
    var isAnimatingSleeping = newMode === cb.modeAnimatingSleeping();

    // Show either play-1, pause or play-pause

    if (isStopped) {
        $('#cb-exec-img-play-1'    ).css('display', 'none');
        $('#cb-exec-img-pause'     ).css('display', 'none');
        $('#cb-exec-img-play-pause').css('display', 'inline');
    } else if (isAnimating || isAnimatingSleeping) {
        $('#cb-exec-img-play-1'    ).css('display', 'none');
        $('#cb-exec-img-pause'     ).css('display', 'inline');
        $('#cb-exec-img-play-pause').css('display', 'none');
    } else {
        $('#cb-exec-img-play-1'    ).css('display', 'inline');
        $('#cb-exec-img-pause'     ).css('display', 'none');
        $('#cb-exec-img-play-pause').css('display', 'none');
    }

    if (isStopped) {
        $('body').removeClass('cb-mode-running');
        cb.repl.setOption('readOnly', false);
        cb.fs.editorManager.setReadOnlyAllEditors(false);
    } else {
        $('body').addClass('cb-mode-running');
        cb.repl.setOption('readOnly', true);
        cb.fs.editorManager.setReadOnlyAllEditors(true);
    }

    if (isStopped) {

        cb.focusLastFocusedEditor();
        cb.stopAnimation();
        cb.hideExecPoint();
        cb.hideStepCounter();
        cb.programState.rte = null;
        cb.setPromptREPL();
        //TODO: interferes?
        //cb.repl.focus();
    } else {
        // Update step counter
        if (cb.showingStepCounter()) {
            cb.showStepCounter(cb.programState.rte.step_count);
        }
    }

    cb.programState.mode = newMode;

    return true;
};

// UI event handling

// Control of execution

CodeBoot.prototype.execStep = function () {
    cb.execEvent('step');
};

CodeBoot.prototype.execAnimate = function () {
    cb.execEvent('animate');
};

CodeBoot.prototype.execEval = function () {
    cb.execEvent('eval');
};

CodeBoot.prototype.execStop = function () {
    cb.execEvent('stop');
};

CodeBoot.prototype.repeatLastExecEvent = function () {
    cb.execEvent(cb.lastExecEvent);
};

CodeBoot.prototype.execStepOrEval = function () {
    if (cb.programState.rte !== null) // currently running code?
        cb.execStep();
    else
        cb.execEval();
};

CodeBoot.prototype.execEvent = function (event) {

    cb.lastExecEvent = event;

    switch (event) {

    case 'step':
        cb.animate(0);
        break;

    case 'animate':
        cb.animate(cb.stepDelay);
        break;

    case 'eval':
        cb.eval();
        break;

    case 'stop':
        cb.stop();
        break;
    }
};

CodeBoot.prototype.animate = function (newStepDelay) {
    var was_animating = cb.stopAnimation();
    cb.programState.stepDelay = newStepDelay;
    if (newStepDelay === 0) {
        cb.enterMode(cb.modeStepping());
        if (!was_animating)
            cb.step_or_animate(true);
        else
            cb.showExecPoint();
    } else {
        cb.enterMode(cb.modeAnimating());
        cb.step_or_animate(true);
    }
};

CodeBoot.prototype.eval = function () {
    cb.enterMode(cb.modeAnimating());
    cb.hideExecPoint();
    cb.step_or_animate(false);
};

CodeBoot.prototype.step_or_animate = function (single_step) {
    //TODO: interferes?
    //cb.repl.focus();
    if (cb.programState.rte !== null) // currently running code?
        cb.execute(single_step);
    else
        cb.run(single_step);
};

CodeBoot.prototype.stopAnimation = function () {

    // Stops any time-based animation of the program

    var id = cb.programState.timeoutId;

    if (id !== null) {
        clearTimeout(id); // cancel the scheduled execution step
        cb.programState.timeoutId = null;
    }

    return id !== null; // returns true if a time-based animation was cancelled
};

CodeBoot.prototype.stop = function (reason) {

    if (cb.programState.mode !== cb.modeStopped()) {

        var msg = $('<span class="cb-repl-error"/>');
        var withStepCounter = cb.showingStepCounter();

        if (reason !== null) {
            if (reason === void 0) {
                reason = 'stopped';
            } else {
                var loc = cb.programState.rte.ast.loc;
                cb.showError(loc);
                reason = cb.errorMessage(loc, null, reason);
            }
            if (withStepCounter) {
                reason += ' after ';
            }
            msg.text(reason);
        }

        if (withStepCounter) {
            var counter = $('<span class="badge badge-primary badge-pill cb-step-counter"/>');
            counter.text(cb.textStepCounter());
            msg.append(counter);
            cb.hideStepCounter();
        }

        if (reason !== null || withStepCounter) {
            cb.addLineWidgetTranscriptREPL(msg.get(0));
        }

        cb.enterMode(cb.modeStopped());
    }
};

CodeBoot.prototype.showError = function (loc) {

    cb.hide_error();

    cb.programState.errorMark = cb.codeHighlight(loc, 'cb-code-error', false);

    cb.scrollToMarker(cb.programState.errorMark.all);
};

CodeBoot.prototype.hide_error = function () {
    if (cb.programState.errorMark !== null) {
        cb.clearMarker(cb.programState.errorMark);
        cb.programState.errorMark = null;
    }
};

CodeBoot.prototype.clearMarker = function (marker) {
    if (marker.all !== null) {
        marker.all.clear();
    }
    if (marker.end !== null) {
        marker.end.clear();
    }
};

CodeBoot.prototype.within = function (rect, viewport) {

    var x = (rect.left + rect.right) / 2;
    var y = (rect.top + rect.bottom) / 2;

    //alert(x+','+y+'   '+viewport.left+','+(viewport.left+viewport.clientWidth)+','+viewport.top+','+(viewport.top+viewport.clientHeight));

    if (x < viewport.left) return false;
    if (x > viewport.left + viewport.clientWidth) return false;
    if (y < viewport.top) return false;
    if (y > viewport.top + viewport.clientHeight) return false;

    return true;
};

CodeBoot.prototype.isCharacterVisible = function (pos, editor) {
    var point = editor.charCoords(pos, 'local');
    var scrollInfo = editor.getScrollInfo();
    return cb.within(point, scrollInfo);
};

CodeBoot.prototype.isMarkerVisible = function (marker, editor) {
    var res = false;
    if (!editor) editor = marker.cb_editor;
    var range = marker.find();
    if (range) res = cb.isCharacterVisible(range.from, editor);
    return res;
};

CodeBoot.prototype.scrollToMarker = function (marker, editor) {
    if (!marker) return;
    if (!editor) editor = marker.cb_editor;
    if (!cb.isMarkerVisible(marker, editor)) {
        var range = marker.find();
        if (range) {
            var rect = editor.charCoords(range.from, 'local');
            var scrollInfo = editor.getScrollInfo();
            //editor.scrollIntoView(rect, 0.5 * scrollInfo.clientHeight);
            editor.scrollIntoView(rect, 0.1 * scrollInfo.clientHeight);
       }
    }
};

function CBExecPointBubble() {
    this.tip  = null;
    this.elem = null;
};

CBExecPointBubble.prototype.isVisible = function () {

    if (this.tip !== null) {
        var popper = this.tip.getPopperElement(this.elem);
        if (popper !== null) {
            return popper.style.visibility !== 'hidden';
        }
    }

    return false;
};

CBExecPointBubble.prototype.show = function () {

    if (this.tip !== null) {
        var popper = this.tip.getPopperElement(this.elem);
        if (popper !== null) {
            this.tip.show(popper);
        }
    }

};

CBExecPointBubble.prototype.hide = function () {

    if (this.tip !== null) {
        var popper = this.tip.getPopperElement(this.elem);
        if (popper !== null) {
            this.tip.hide(popper);
        }
    }

};

CBExecPointBubble.prototype.destroy = function () {

    if (this.tip !== null) {
        var popper = this.tip.getPopperElement(this.elem);
        if (popper !== null) {
            this.tip.destroy(popper);
        }
    }

    this.tip  = null;
    this.elem = null;

};

CBExecPointBubble.prototype.replaceContent = function (html) {

    if (this.tip !== null) {
        var popper = this.tip.getPopperElement(this.elem);
        if (popper !== null) {
            var contentElem = popper.querySelector('.tippy-tooltip-content');
            if (contentElem !== null) {
                contentElem.innerHTML = html;
            }
        }
    }

};

CodeBoot.prototype.execPointCodeElement = function () {

    var elems = [].slice.call(document.querySelectorAll('.cb-exec-point-code-end'),-1);

    if (elems.length === 0)
        return null;
    else
        return elems[0];
};

CBExecPointBubble.prototype.attachTo = function (elem, html) {

    if (elem === null) return;

    var _this = this;

    if (this.elem === null || this.elem !== elem) {

        /* create a new bubble */

        if (this.elem !== null)
            this.destroy();

        //count++; $('#cb-menu-brand-btn').text(count);
        var tip = tippy(elem, {
            html: '#cb-exec-point-bubble-template',
            theme: 'cb-exec-point-bubble',
            position: 'bottom-start',
            trigger: 'manual',
            sticky: 'true',
            zIndex: 999, /* just under dropdown menu */
            arrow: true,
            interactive: true,
            duration: 0,
            popperOptions: {
                modifiers: {
                    flip: {
                        enabled: true
                    }
                }
            }
        });

        this.tip = tip;
        this.elem = elem;
    }

    this.replaceContent(html);
    setTimeout(function () { _this.show(); }, 0);

};

CodeBoot.prototype.execPointBubbleHTML = function () {

    var val = cb.programState.rte.result;
    var valHTML = (val === void 0)
                  ? '<i>no value</i>'
                  : cb.printedRepresentation(val, 'HTML');

    var contextHTML = cb.dumpContext();

    if (contextHTML === '') {
        return '<div class="cb-exec-point-bubble-value-no-context">' +
               valHTML +
               '</div>';
    } else {
        return '<div class="cb-exec-point-bubble-value">' +
               valHTML +
               '</div>' +
               '<div class="cb-exec-point-bubble-context">' +
               contextHTML +
               '</div>';
    }
};

CodeBoot.prototype.hideExecPoint = function () {

    cb.programState.execPointBubble.destroy();

    var mark = cb.programState.execPointMark;

    if (mark !== null) {
        cb.clearMarker(mark);
        cb.programState.execPointMark = null;
    }

        // Somehow, CodeMirror seems to hold on to the marked elements
        // somewhere, causing problems when displaying the
        // bubble. This kludge should at least prevent the problem
        // from manifesting for the user.
        //TODO: proper fix
//        $('.cb-exec-point-code').removeClass('cb-exec-point-code');
};

CodeBoot.prototype.showExecPoint = function () {

    cb.showStepCounter();

    cb.hideExecPoint();

    var loc = cb.programState.rte.ast.loc;
    cb.programState.execPointMark = cb.codeHighlight(loc, 'cb-exec-point-code', true);

    if (cb.programState.execPointMark !== null) {
        cb.scrollToMarker(cb.programState.execPointMark.end);
    }

    var value = cb.programState.rte.result;
    var $container;
    if (loc.container instanceof SourceContainerInternalFile) {
        $container = $('#cb-editors');
    } else {
        $container = null; /* use whole document */
    }

    if ($container !== null &&
        !$('.cb-exec-point-code-end').last().isInView($container)) {
        var filename = loc.container.toString();
        cb.fs.openFile(filename);
        cb.scrollTo(cb.getFileContainerFor(filename));
    }

    cb.programState.execPointBubble.attachTo(
        cb.execPointCodeElement(),
        cb.execPointBubbleHTML());

    $('.cb-exec-point-code').hover(function (event) {
        if (!cb.programState.execPointBubble.isVisible()) {
            cb.showExecPoint();
        }
    });
};

CodeBoot.prototype.dumpContext = function () {

    var rte = cb.programState.rte;
    var f = rte.frame;
    var cte = f.cte;
    var result = [];
    var seen = {};

    var add = function (id, val) {
        if (seen[id] === void 0) {
            if (val !== void 0) { // don't show undefined variables
                result.push('<div class="cb-exec-point-bubble-binding"><span class="cb-code-font">' + id + '</span>: ' + cb.printedRepresentation(val, 'HTML') + '</div>');
            }
            seen[id] = true;
        }
    };

    while (cte !== null) {
        for (var id_str in cte.params) {
            var i = cte.params[id_str];
            add(id_str, f.params[i]);
        }
        for (var id_str in cte.locals) {
            if (cte.parent !== null) {
                var i = cte.locals[id_str];
                add(id_str, f.locals[i]);
            } else {
                if (!well_known_global[id_str]) {
                    add(id_str, rte.glo[id_str]);
                }
            }
        }
        if (cte.callee !== null) {
            add(cte.callee, f.callee);
        }
        cte = cte.parent;
        f = f.parent;
    }

    return result.join('');
};

CodeBoot.prototype.undeclareGlobals = function (rte) {

    var glo = rte.glo;

    for (var v in glo) {
        if (!well_known_global[v]) {
            delete glo[v];
        }
    }
};

var well_known_global = {};
well_known_global['NaN'] = true;
well_known_global['Infinity'] = true;
well_known_global['undefined'] = true;
well_known_global['parseInt'] = true;
well_known_global['parseFloat'] = true;
well_known_global['isNaN'] = true;
well_known_global['isFinite'] = true;
well_known_global['decodeURI'] = true;
well_known_global['encodeURI'] = true;
well_known_global['decodeURIComponent'] = true;
well_known_global['encodeURIComponent'] = true;
well_known_global['Object'] = true;
well_known_global['Function'] = true;
well_known_global['Array'] = true;
well_known_global['String'] = true;
well_known_global['Boolean'] = true;
well_known_global['Number'] = true;
well_known_global['Date'] = true;
well_known_global['RegExp'] = true;
well_known_global['Error'] = true;
well_known_global['EvalError'] = true;
well_known_global['RangeError'] = true;
well_known_global['ReferenceError'] = true;
well_known_global['SyntaxError'] = true;
well_known_global['TypeError'] = true;
well_known_global['URIError'] = true;
well_known_global['Math'] = true;
well_known_global['JSON'] = true;
well_known_global['document'] = true;
well_known_global['print'] = true;
well_known_global['alert'] = true;
well_known_global['prompt'] = true;
well_known_global['confirm'] = true;
well_known_global['load'] = true;
well_known_global['pause'] = true;
well_known_global['assert'] = true;
well_known_global['setScreenMode'] = true;
well_known_global['getScreenWidth'] = true;
well_known_global['getScreenHeight'] = true;
well_known_global['setPixel'] = true;
well_known_global['exportScreen'] = true;
well_known_global['getMouse'] = true;
well_known_global['cs'] = true;
well_known_global['pu'] = true;
well_known_global['pd'] = true;
well_known_global['st'] = true;
well_known_global['ht'] = true;
well_known_global['fd'] = true;
well_known_global['bk'] = true;
well_known_global['mv'] = true;
well_known_global['lt'] = true;
well_known_global['rt'] = true;
well_known_global['setpc'] = true;
well_known_global['setpw'] = true;
well_known_global['drawtext'] = true;
well_known_global['setTimeout'] = true;
well_known_global['clearTimeout'] = true;
well_known_global['readFile'] = true;
well_known_global['writeFile'] = true;

CodeBoot.prototype.execute = function (single_step) {
    if (false && cb.hideExecPoint()) { //TODO: find a better way... this causes too much flicker
        // give some time for the browser to refresh the page
        setTimeout(function () { cb.execute2(single_step); }, 10);
    } else {
        // step was not shown, so no need to wait
        cb.execute2(single_step);
    }
};

CodeBoot.prototype.execute2 = function (single_step) {

    var stepChunk = 51151;
    var newMode = cb.modeStopped();
    cb.stopAnimation();

    var rte = cb.programState.rte;

    if (rte !== null && !rte.finished()) {

        try {
            rte.step(single_step ? 1 : stepChunk);
        }
        catch (e) {
            update_playground_visibility();
            if (e !== false)
                cb.stop(String(e));
            else
                cb.stop(null);
            return;
        }

        update_playground_visibility();

        if (cb.programState.mode === cb.modeStepping()) {
            single_step = true;
        }

        //$('#cb-menu-brand').text(cb.programState.mode);

        if (!rte.finished()) {
            newMode = cb.modeStepping();
            if (single_step) {
                cb.showExecPoint();
                if (cb.programState.stepDelay > 0) {
                    newMode = cb.modeAnimating();
                    cb.programState.timeoutId = setTimeout(function ()
                                                           { cb.execute(true); },
                                                           cb.programState.stepDelay);
                } else if (cb.programState.timeoutId !== null) {
                    newMode = cb.modeAnimatingSleeping();
                }
            } else {
                if (cb.showingStepCounter() ||
                    cb.programState.rte.step_count >= stepChunk) {
                    cb.showStepCounter();
                }
                newMode = cb.modeAnimating();
                cb.programState.timeoutId = setTimeout(function ()
                                                       { cb.execute(false); },
                                                       1);
            }
        } else {

            if (rte.error !== null) {
                cb.executionEndedWithError(String(rte.error));
            } else {
                cb.executionEndedWithResult(rte.getResult());
            }
        }
    }

    cb.enterMode(newMode);

    code_queue_check();
};

CodeBoot.prototype.executionEndedWithError = function (msg) {
    cb.stop(msg);
};

CodeBoot.prototype.executionEndedWithResult = function (result) {

    cb.lastResult = result;
    cb.lastResultRepresentation = cb.printedRepresentation(result);

    if (result !== void 0) {
        cb.addTranscriptREPL(cb.lastResultRepresentation + '\n',
                             'cb-repl-result');
    }

    cb.executionHook();

    cb.stop(null);
};

CodeBoot.prototype.executionHook = function () {
};

CodeBoot.prototype.run = function (single_step) {

    var code_gen;
    var source;

    if (cb.lastFocusedEditor === cb.repl) {

        /* running REPL input */

        source = cb.getInputREPL();

        if (false && source.trim() === '') {
            if (cb.programState.rte !== null) {
                cb.execute(true);
                return;
            }
            if (single_step) {
                cb.enterMode(cb.modeStopped());
                code_queue_check();
                return;
            }
        }

        var line = cb.inputPosREPL().line;

        code_gen = function () {
            return cb.compile_repl_expression(source, line+1, 1);
        };

    } else {

        /* running file */

        var filename = cb.lastFocusedEditor.cb.fileEditor.filename;

        source = 'load("' + filename + '")';

        cb.replaceInputREPL(source);

        drawing_window.cs(); /* clear drawing window when running file */

        code_gen = function () {
            var code = cb.compile_internal_file(filename);
            return function (rte, cont) {
                cb.undeclareGlobals(rte);
                return code(rte, cont);
            };
        };
    }

    if (source.trim() !== '')
        cb.repl.cb.history.add(source);

    cb.acceptInputREPL();

    cb.run_setup_and_execute(code_gen, single_step);
};

CodeBoot.prototype.run_setup_and_execute = function (code_gen, single_step) {

    cb.hide_error();

    try {
        var code = code_gen();
        if (code === null) {
            cb.stop(null);
            return;
        } else {
            cb.programState.rte = jev.runSetup(code,
                                               {globalObject: cb.globalObject});
        }
    }
    catch (e) {
        if (e !== false)
            cb.stop(String(e));
        else
            cb.stop(null);
        return;
    }

    cb.execute(single_step);

    //TODO: interferes?
    //cb.repl.focus();
};

function abort_fn_body(rte, result, msg) {

    cb.programState.stepDelay = 0;
    rte.step_limit = rte.step_count; // exit trampoline

    if (msg !== void 0) {
        cb.stop(msg);
    } else {
        cb.enterMode(cb.modeStepping());
    }

    return return_fn_body(rte, result);
}

function return_fn_body(rte, result) {

    var cont = rte.stack.cont;

    rte.frame = rte.stack.frame;
    rte.stack = rte.stack.stack;

    return cont(rte, result);
}

function builtin_pause(filename) {
    throw 'unimplemented';///////////////////////////
}

builtin_pause._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        var delay = params[0];

        if (params.length === 0) {
            delay = Infinity;
        } else if (typeof delay !== 'number' || !(delay >= 0)) {
            throw 'delay parameter of pause must be a non-negative number';
        }

        if (delay !== Infinity) {
            cb.stopAnimation();
            cb.programState.timeoutId = setTimeout(function () {
                                                       cb.repeatLastExecEvent();
                                                   },
                                                   delay*1000);
        }

        return abort_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_pause,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_assert(condition) {
    throw 'unimplemented';///////////////////////////
}

builtin_assert._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (!params[0]) {
            return abort_fn_body(rte,
                                 params[1] ? String(params[1]) : 'THIS ASSERTION FAILED');
        }

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_assert,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_setScreenMode(width, height) {
    throw 'unimplemented';///////////////////////////
}

builtin_setScreenMode._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 2) {
            throw 'setScreenMode expects 2 parameters';
        }

        var width = params[0];
        var height = params[1];

        if (typeof width !== 'number' ||
            Math.floor(width) !== width ||
            width < 1 ||
            width > 300) {
            throw 'width parameter of setScreenMode must be a positive integer no greater than 300';
        }

        if (typeof height !== 'number' ||
            Math.floor(height) !== height ||
            height < 1 ||
            height > 100) {
            throw 'height parameter of setScreenMode must be a positive integer no greater than 100';
        }

        var pixSize = Math.min(10,
                               Math.floor(300 / width + 1),
                               Math.floor(150 / height + 1));

        var divNode = document.createElement('div');

        var pixels = new cb.output.PixelGrid(divNode, {
            rows: height,
            cols: width,
            pixelSize: (pixSize >= 5) ? pixSize-1 : pixSize,
            borderWidth: (pixSize >= 5) ? 1 : 0,
        });


        pixels.clear(pixels.black);

        cb.addLineWidgetTranscriptREPL(divNode);
        cb.screenPixels = pixels;
        cb.screenWidth = width;
        cb.screenHeight = height;

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_setScreenMode,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

cb.screenWidth = 0;

function builtin_getScreenWidth() {
    throw 'unimplemented';///////////////////////////
}

builtin_getScreenWidth._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, cb.screenWidth);
    };

    return exec_fn_body(code,
                        builtin_getScreenWidth,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

cb.screenHeight = 0;

function builtin_getScreenHeight() {
    throw 'unimplemented';///////////////////////////
}

builtin_getScreenHeight._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, cb.screenHeight);
    };

    return exec_fn_body(code,
                        builtin_getScreenHeight,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_setPixel(x, y, color) {
    throw 'unimplemented';///////////////////////////
}

builtin_setPixel._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 3) {
            throw 'setPixel expects 3 parameters';
        }

        var x = params[0];
        var y = params[1];
        var color = params[2];

        if (typeof x !== 'number' ||
            Math.floor(x) !== x ||
            x < 0 ||
            x >= cb.screenWidth) {
            throw 'x parameter of setPixel must be a positive integer less than ' + cb.screenWidth;
        }

        if (typeof y !== 'number' ||
            Math.floor(y) !== y ||
            y < 0 ||
            y >= cb.screenHeight) {
            throw 'y parameter of setPixel must be a positive integer less than ' + cb.screenHeight;
        }

        if (typeof color !== 'object' ||
            color === null ||
            !('r' in color) ||
            typeof color.r !== 'number' ||
            Math.floor(color.r) !== color.r ||
            color.r < 0 || color.r > 255 ||
            !('g' in color) ||
            typeof color.g !== 'number' ||
            Math.floor(color.g) !== color.g ||
            color.g < 0 || color.g > 255 ||
            !('b' in color) ||
            typeof color.b !== 'number' ||
            Math.floor(color.b) !== color.b ||
            color.b < 0 || color.b > 255) {
            throw 'color parameter of setPixel must be a RGB structure';
        }

        cb.screenPixels.setPixel(x,
                                 y,
                                 '#' +
                                 (256+color.r).toString(16).slice(1) +
                                 (256+color.g).toString(16).slice(1) +
                                 (256+color.b).toString(16).slice(1));

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_setPixel,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_exportScreen() {
    throw 'unimplemented';///////////////////////////
}

builtin_exportScreen._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        if (!('screenPixels' in cb)) {
            return return_fn_body(rte, null);
        }

        var pixels = [];

        for(var i = 0; i<cb.screenHeight; i++) {
            pixels.push([]);
            for(var j = 0; j<cb.screenWidth; j++) {
                pixels[i].push(cb.screenPixels.pixels[i][j]);
            }
        }

        return return_fn_body(rte, pixels.map(function(e) { return e.join(''); }).join('\n'));
    };

    return exec_fn_body(code,
                        builtin_exportScreen,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_getMouse() {
    throw 'unimplemented';///////////////////////////
}

builtin_getMouse._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        var pos = cb.mousePos;
        if (cb.screenPixels)
            pos = cb.screenPixels.pageToRelative(pos);
        return return_fn_body(rte, { x: pos.x, y: pos.y, down: cb.mouseDown });
    };

    return exec_fn_body(code,
                        builtin_getMouse,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_load(filename) {
    throw 'unimplemented';///////////////////////////
}

builtin_load._apply_ = function (rte, cont, this_, params) {

    var filename = params[0];
    var code = cb.compile_file(filename);

    if (code === null) {
        code = function (rte, cont) {
            return return_fn_body(rte, void 0);
        };
    }

    return exec_fn_body(code,
                        builtin_load,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_readFile(filename) {
    throw 'unimplemented';///////////////////////////
}

builtin_readFile._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 1) {
            throw 'readFile expects 1 parameter';
        }

        var filename = params[0];

        if (typeof filename !== 'string') {
            throw 'filename parameter of readFile must be a string';
        }

        var state = readFileInternal(filename);

        return return_fn_body(rte, state.content);
    };

    return exec_fn_body(code,
                        builtin_readFile,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

function builtin_writeFile(filename, content) {
    throw 'unimplemented';///////////////////////////
}

builtin_writeFile._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 2) {
            throw 'writeFile expects 2 parameters';
        }

        var filename = params[0];
        var content = params[1];

        if (typeof filename !== 'string') {
            throw 'filename parameter of writeFile must be a string';
        }

        if (typeof content !== 'string') {
            throw 'content parameter of writeFile must be a string';
        }

        writeFileInternal(filename, content);

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_writeFile,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

CodeBoot.prototype.compile_repl_expression = function (source, line, ch) {
    return cb.compile(source,
                      new SourceContainer(source, '<REPL>', line, ch));
};

CodeBoot.prototype.compile_file = function (filename) {
    if (/^http:\/\//.test(filename)) {
        return cb.compile_url_file(filename);
    } else {
        return cb.compile_internal_file(filename);
    }
};

CodeBoot.prototype.urlGet = function (url) {
    var content;
    $.ajax({
        url: 'urlget.cgi',
        type: 'POST',
        data: {url: url},
        dataType: 'text',
        async: false,
        success: function (data) {
            content = data;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            cb.addTranscriptREPL('Failed to load remote ressource\n',
                                 'cb-repl-error');
        }
    });
    return content;
};

cb.cacheURL = {};

CodeBoot.prototype.readURL = function (url) {
    if (Object.prototype.hasOwnProperty.call(cb.cacheURL, url)) {
        return cb.cacheURL[url];
    } else {
        var source = cb.urlGet(url);
        if (source !== (void 0)) cb.cacheURL[url] = source;
        return source;
    }
};

CodeBoot.prototype.compile_url_file = function (url) {

    var source = cb.readURL(url);
    if (source === (void 0)) source = '';

    return cb.compile(source,
                      new SourceContainer(source, url, 1, 1));
};

CodeBoot.prototype.compile_internal_file = function (filename) {

    var state = readFileInternal(filename);
    var source = state.content;

    return cb.compile(source,
                      new SourceContainerInternalFile(source, filename, 1, 1, state.stamp));
};

function readFileInternal(filename) {

    var file = cb.fs.getByName(filename);

    return {
        stamp: file.stamp,
        content: file.getContent(),
    };
}

function writeFileInternal(filename, content) {

    var file;

    if (cb.fs.hasFile(filename)) {
        file = cb.fs.getByName(filename);
    } else {
        file = new CBFile(cb.fs, filename);
        cb.fs.addFile(file);
        cb.fs.addFileToMenu(file);
    }

    file.setContent(content);
}

CodeBoot.prototype.compile = function (source, container) {
    return jev.compile(source,
                       {
                           container: container,
                           error: function (loc, kind, msg) {
                               cb.syntaxError(loc, kind, msg);
                           },
                           detectEmpty: true,
                           languageLevel: cb.languageLevel,
                           filterAST: function (ast, source) {
                               return cb.filterAST(ast, source);
                           }
                       });
};

CodeBoot.prototype.filterAST = function (ast, source) {
    cb.lastAST = ast;
    cb.lastSource = source;
    cb.lastResult = null;
    cb.lastResultRepresentation = null;
    return ast;
};

var warnSemicolon = true;

CodeBoot.prototype.syntaxError = function (loc, kind, msg) {

    if (warnSemicolon && msg === '\';\' missing after this token') {
        cb.displayError(loc, 'syntax error', msg);
        throw false;
    }

    if (kind !== 'warning') {
        cb.displayError(loc, kind, msg);
        throw false;
    }
};

CodeBoot.prototype.errorMessage = function (loc, kind, msg) {
    var locText = '';
    if (cb.options.showLineNumbers && loc.container.toString() != '<REPL>') {
        locText = loc.toString('simple') + ': ';
    }
    return locText + ((kind === null) ? '' : kind + ' -- ') + msg;
};

CodeBoot.prototype.displayError = function (loc, kind, msg) {
    cb.showError(loc);
    cb.addTranscriptREPL(cb.errorMessage(loc, kind, msg) + '\n',
                         'cb-repl-error');
};

CodeBoot.prototype.undo = function (cm) {
    cm.undo();
};

CodeBoot.prototype.redo = function (cm) {
    cm.redo();
};

cb.initProgramState();
