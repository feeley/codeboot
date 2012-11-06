$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

cp.addAlert = function (text, title, kind) {
    var alertDiv = $("<div/>").addClass("alert");
    if (kind) alertDiv.addClass("alert-" + kind);
    alertDiv.text(text);
    if (title) {
        alertDiv.prepend($("<strong/>").text(title), " ");
    }
    alertDiv.prepend('<button class="close" data-dismiss="alert">&times;</button>');
    $(cp.alerts).append(alertDiv);
};

cp.reportError = function (text, title) {
    if (title === undefined) title = "Error!";
    cp.addAlert(text, title, "error");
};

cp.reportWarning = function (text, title) {
    if (title === undefined) title = "Warning!";
    cp.addAlert(text, title);
};

cp.scrollToEnd = function (editor) {
    var info = editor.getScrollInfo();
    editor.scrollTo(null, info.height - info.clientHeight);
};

function removeTrailingNewline(text) {
    var s = String(text);
    if (s.charAt(text.length - 1) === "\n") {
        s = s.slice(0, s.length-1);
    }
    return s;
}

function CPTranscript(editor) {
    this.editor = editor;
    this.is_empty = true;
    
    this.widgets = [];
}

CPTranscript.prototype.clear = function () {
    for (var i = 0; i < this.widgets.length; i++) {
        this.editor.removeLineWidget(this.widgets[i]);
    }
    this.editor.setValue("");
    this.editor.refresh();
    this.is_empty = true;
    this.hide();
};

CPTranscript.prototype.show = function () {
    $("#transcript").show();
    $("#transcript-sep").show();
};

CPTranscript.prototype.hide = function () {
    $("#transcript").hide();
    $("#transcript-sep").hide();
};

CPTranscript.prototype.addTextLine = function (text, cssClass) {
    var editor = this.editor;
    text = removeTrailingNewline(text);
    // CodeMirror needs to be visible to the updates to the gutter to work...
    if (this.is_empty) this.show();
    
    var line;
    if (this.is_empty) {
        line = 0;
    } else {
        text = "\n" + text;
        line = editor.lineCount();
    }

    editor.replaceRange(text, { line: line, ch: 0 });
    editor.markText({ line: line, ch: 0 }, { line: line+1, ch: 0 }, cssClass);

    if (editor.lineInfo(line).gutterMarkers) {
        // Oops, CodeMirror moved the gutter down instead of appending a blank line
        // We'll set the gutter back on the previous line (ugly!)
        line -= 1;
    }
    editor.setGutterMarker(line, "cp-prompt", document.createTextNode(">"));
    this.is_empty = false;
};

CPTranscript.prototype.addLineWidget = function (textOrNode, cssClass) {    
    // CodeMirror needs to be visible to the updates to the gutter to work...
    if (this.is_empty) this.show();
    
    var widget;
    if (typeof textOrNode === "string") {
        var text = removeTrailingNewline(textOrNode);
        var $widget = $("<div/>");
        if (cssClass) $widget.addClass(cssClass);
        $widget.text(text);
        widget = $widget.get(0);
    } else {
        widget = textOrNode;
    }
    var w = this.editor.addLineWidget(this.editor.lineCount() - 1, widget);
    this.widgets.push(w);
    
    cp.scrollToEnd(this.editor);
};

CPTranscript.prototype.addLine = function (text, cssClass) {
    var line;

    if (cssClass === "transcript-input") {
        this.addTextLine(text, cssClass);
    } else {
        this.addLineWidget(text, cssClass);
    }
};

function position_to_line_ch(pos) {
    return { line: position_to_line(pos)-1,
             ch: position_to_column(pos)-1
           };
}

function code_highlight(loc, cssClass) {

    var container = loc.container;
    var editor;

    if (container instanceof SourceContainerInternalFile) {
        var filename = container.toString();
        if (!cp.fs.hasFile(filename)) {
            return null; // the file is not known
        }
        var state = readFileInternal(filename);
        if (container.stamp !== state.stamp) {
            return null; // the content of the editor has changed so can't highlight
        }
        cp.openFile(filename);
        editor = cp.fs.getEditor(filename);
    } else if (container instanceof SourceContainer) {
        editor = cp.transcript.editor;
    } else {
        // unknown source container
        return null;
    }

    var start = position_to_line_ch(loc.start_pos);
    var end = position_to_line_ch(loc.end_pos);
    return editor.markText(start, end, cssClass);
}

function printed_repr_old(x) {

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
                a.push(printed_repr(x[i]));
            return "[" + a.join(", ") + "]";
        } else {
            var a = [];
            for (var p in x)
                a.push(printed_repr(p)+": "+printed_repr(x[p]));
            return "{" + a.join(", ") + "}";
        }
    } else if (typeof x === "undefined") {
        return "undefined";
    } else {
        return String(x);
    }
}

function printed_repr(obj, format) {

    if (format === void 0) {
        format = "plain";
    }

    return object_repr(obj, format, 80).text;
}

function escape_HTML(text) {
  return text.replace(/[&<>"'`]/g, function (chr) {
    return '&#' + chr.charCodeAt(0) + ';';
  });
};

function editor_URL(content, filename) {

    return document.location.origin +
           document.location.pathname.replace(/\/[^/]*$/g,"") +
           "/query.cgi?replay%=" +
           encodeURIComponent(("@C" +
                               (filename === void 0 ? "" : (filename + "@0")) +
                               content + "@E").replace(/\n/g,"@N"));
}

function object_repr(obj, format, limit) {

    var string_key_required = function (key) {

        return !((Scanner.prototype.is_identifier(key) &&
                  !Scanner.prototype.is_keyword(key)) ||
                 (""+key === ""+(+key) &&
                  +key >= 0));

    };

    var xform = function (str) {
        var text;
        if (format === "HTML") {
            text = escape_HTML(str);
        } else {
            text = str;
        }
        return { text: text, len: str.length };
    };

    if (typeof obj === "object") {

        if (obj === null) {

            return xform("null");

        } else if ("obj_repr" in obj) {

            return obj.obj_repr(format, limit);

        } else if (obj instanceof Array) {

            var a = ["["];
            var len = 1;

            for (var i=0; i<obj.length; i++) {
                if (i > 0) {
                    a.push(", ");
                    len += 2;
                }
                var r = object_repr(obj[i], format, limit-len-1);
                if (len + r.len + 1 > limit) {
                    a.push("...");
                    len += 3;
                    break;
                } else {
                    a.push(r.text);
                    len += r.len;
                }
            }

            a.push("]");
            len += 1;

            return { text: a.join(""), len: len };

        } else {

            var a = ["{"];
            var len = 1;
            var i = 0;

            for (var p in obj) {
                if (i++ > 0) {
                    a.push(", ");
                    len += 2;
                }
                var r1;
                if (string_key_required(p)) {
                    r1 = object_repr(p, format, limit);
                } else {
                    r1 = xform(""+p);
                }
                var r2 = object_repr(obj[p], format, limit-len-r1.len-3);
                if (len + r1.len + r2.len + 3 > limit) {
                    a.push("...");
                    len += 3;
                    break;
                } else {
                    a.push(r1.text);
                    a.push(": ");
                    a.push(r2.text);
                    len += r1.len + 2 + r2.len;
                }
            }

            a.push("}");
            len += 1;

            return { text: a.join(""), len: len };

        }
    } else if (typeof obj === "string") {

        var chars = [];
        chars.push("\"");
        for (var i=0; i<obj.length; i++) {
            var c = obj.charAt(i);
            if (c === "\"") {
                chars.push("\\\"");
            } else if (c === "\\") {
                chars.push("\\\\");
            } else if (c === "\n") {
                chars.push("\\n");
            } else {
                var n = obj.charCodeAt(i);
                if (n <= 31 || n >= 256) {
                    chars.push("\\u" + (n+65536).toString(16).slice(1));
                } else {
                    chars.push(c);
                }
            }
        }
        chars.push("\"");

        return xform(chars.join(""));

    } else if (typeof obj === "undefined") {

        return xform("undefined");

    } else {

        return xform(String(obj));

    }
}

cp.query = function (query) {
    cp.saved_query = query;
    cp.replay_command = "";
    cp.replay_command_index = 0;
    cp.replay_parameters = [];
};

cp.handle_query = function () {

    var query = cp.saved_query;

    if (query && query.slice(0, 7) === "replay=") {

        cp.replay_command = decodeURIComponent(query.slice(7));
        cp.replay_command_index = 0;
        cp.replay_syntax = 1;

        setTimeout(function () { cp.replay(); }, 100);
    } else if (query && query.slice(0, 10) === "replay%25=") {

        cp.replay_command = decodeURIComponent(decodeURIComponent(query.slice(10)));
        cp.replay_command_index = 0;
        cp.replay_syntax = 2;

        setTimeout(function () { cp.replay(); }, 100);
    } else if (query && query.slice(0, 8) === "replay%=") {

        cp.replay_command = decodeURIComponent(query.slice(8));
        cp.replay_command_index = 0;
        cp.replay_syntax = 2;

        setTimeout(function () { cp.replay(); }, 100);
    }
};

cp.replay = function () {

    var command = cp.replay_command;
    var i = cp.replay_command_index;

    if (i < command.length) {
        var j = i;
        while (j < command.length &&
               (command.charAt(j) !== "@" ||
                (command.charAt(j+1) === "@" ||
                 (cp.replay_syntax === 2 && command.charAt(j+1) === "N")))) {
            if (command.charAt(j) === "@") {
                j += 2;
            } else {
                j += 1;
            }
        }

        var str;

        if (cp.replay_syntax === 2) {
            str = command.slice(i, j).replace(/@N/g,"\n").replace(/@@/g,"@");
        } else {
            str = command.slice(i, j).replace(/@@/g,"\n");
        }

        if (command.charAt(j) === "@") {
            if (command.charAt(j+1) >= "0" && command.charAt(j+1) <= "9") {
                cp.replay_parameters[+command.charAt(j+1)] = str;
                j += 2;
            } else if (command.charAt(j+1) === "P") {
                if (str !== "") {
                    set_input(cp.repl, str);
                    cp.repl.refresh();
                    cp.repl.focus();
                } else {
                    cp.run(false);
                    j += 2;
                }
            } else if (command.charAt(j+1) === "S") {
                if (str !== "") {
                    set_input(cp.repl, str);
                    cp.repl.refresh();
                    cp.repl.focus();
                } else {
                    cp.animate(0);
                    j += 2;
                }
            } else if (command.charAt(j+1) === "A") {
                if (str !== "") {
                    set_input(cp.repl, str);
                    cp.repl.refresh();
                    cp.repl.focus();
                } else {
                    cp.animate(500);
                    j += 2;
                }
            } else if (command.charAt(j+1) === "E") {
                var default_filename = "scratch";
                var filename = default_filename;
                if (cp.replay_parameters[0] !== void 0) {
                    filename = cp.replay_parameters[0];
                    cp.replay_parameters[0] = void 0;
                }
                var existing = cp.openFileExistingOrNew(filename);
                var editor = cp.fs.getEditor(filename);
                var replace = true;
                if (existing &&
                    filename !== default_filename &&
                    editor.getValue() !== str) {
                    replace = confirm("You are about to replace the file '" + filename + "' with different content.  Are you sure you want proceed with the replacement and lose your local changes to that file?");
                }
                if (replace) {
                    editor.setValue(str);
                }
                j += 2;
            } else if (command.charAt(j+1) === "C") {
                cp.closeAll();
                j += 2;
            } else {
                // unknown command
                j += 2;
            }
        } else {
            if (str !== "") {
                set_input(cp.repl, str);
            }
        }

        cp.replay_command_index = j;

        if (j < command.length) {
            setTimeout(function () { cp.replay(); }, 1);
        }
    }
};

var program_state = {
    rte: null,
    error_mark: null,
    step_mark: null,
    step_popover: null,
    timeout_id: null,
    step_delay: 0,
    mode: 'stopped',
    controller: null,
    step_counter: null
};

function setControllerState(controller, enabled) {
    $(".exec-btn-step", controller).toggleClass('disabled', !enabled);
    $(".exec-btn-play", controller).toggleClass('disabled', !enabled);
    $(".exec-btn-anim", controller).toggleClass('disabled', !enabled);
}

function setStepCounter(count) {
    if (program_state.step_counter !== null) {
        program_state.step_counter.text(count + " step" + (count>1 ? "s" : ""));
    }
}

function disableOtherControllers(controller) {
    $('[data-cp-exec="controller"]').each(function () {
        if (this !== controller) {
            setControllerState(this, false);
        }
    });
}

function enableAllControllers() {
    $('[data-cp-exec="controller"]').each(function () {
        setControllerState(this, true);
    });
}

cp.setController = function (idOrElement) {
    var element;
    if (typeof idOrElement === "string") {
        element = document.getElementById(idOrElement);
    } else {
        element = idOrElement;
    }

    if (program_state.controller === null) {
        program_state.controller = element;
        disableOtherControllers(element);
        return true;
    }

    if (program_state.controller === element) return true;

    return false;
};

cp.enterMode = function (newMode) {
    if (newMode === "stopped") {
        program_state.controller = null;
        enableAllControllers();
    }
	if (program_state.mode === newMode) return;

	// newMode is one of 'stopped', 'animating', 'stepping'

	var control = program_state.controller;

    // Cancel button
    $(".exec-btn-cancel", control).toggleClass("disabled", newMode === 'stopped');

    // Pause button
    $(".exec-btn-pause", control).toggleClass("disabled", newMode !== 'animating');

    // Step button + icon
    $(".exec-btn-step", control).toggleClass("disabled", newMode === 'animating');
	$('.exec-icon-singleStep', control).toggle(newMode === 'stepping');
	$(".exec-icon-stepMode", control).toggle(newMode !== 'stepping');

    // Step counter
    if (newMode === 'animating' || newMode === 'stepping') {
        if (program_state.step_counter === null) {
            program_state.step_counter = $('<span class="badge badge-info exec-lbl-count"/>');
            setStepCounter(program_state.rte.step_count);
            cp.repl.addWidget({line: 0, ch: 0}, program_state.step_counter.get(0), false);
        }
    } else if (newMode === 'stopped' && program_state.step_counter != null) {
        // Clone the widget rather than attempt to reset its positioning for now
        // TODO: move the widget rather the clone it
        var $newWidget = $('<span class="badge badge-info exec-lbl-count"/>');
        $oldWidget = $(program_state.step_counter);
        $newWidget.text($oldWidget.text());
        $oldWidget.remove();
        cp.transcript.addLineWidget($newWidget.get(0));
        program_state.step_counter = null;
    }

	program_state.mode = newMode;
};

cp.animate = function (new_step_delay) {
    program_state.step_delay = new_step_delay;
    cp.step();
};

cp.play_or_step = function (single_step) {
    cp.repl.focus();
    if (program_state.rte !== null)
        cp.execute(single_step);
    else
        cp.run(single_step);
};

cp.play = function () {
    cp.play_or_step(false);
};

cp.step = function () {
    cp.play_or_step(true);
};

cp.cancel_animation = function () {
    if (program_state.timeout_id !== null) {
        clearTimeout(program_state.timeout_id);
        program_state.timeout_id = null;
    }
};

cp.cancel = function () {
    cp.cancel_animation();
    cp.hide_step();
    cp.enterMode('stopped');
    program_state.rte = null;
    cp.repl.busy = false;
    set_prompt(cp.repl);
    cp.repl.refresh();
    cp.repl.focus();
};

cp.show_error = function (loc) {

    cp.hide_error();

    program_state.error_mark = code_highlight(loc, "error-code");
};

cp.hide_error = function () {
    if (program_state.error_mark !== null) {
        program_state.error_mark.clear();
        program_state.error_mark = null;
    }
};

function within(point, rect) {
    if (point.left < rect.left) return false;
    if (point.right > rect.left + rect.clientWidth) return false;
    if (point.top < rect.top) return false;
    if (point.top > rect.top + rect.clientHeight) return false;
    return true;
}

function scrollToMarker(marker) {
    var range = marker.find();
    var editor = marker.cm; // TODO: non-documented, so brittle
    if (range) {
        var pos = range.from;
        var point = editor.charCoords(pos, "local");
        var scrollInfo = editor.getScrollInfo();
        if (!within(point, scrollInfo)) {
            editor.scrollTo(point.left, point.top);
        }
    }
}

cp.hide_step = function () {

    if (program_state.step_mark !== null ||
        program_state.step_popover !== null) {

        if (program_state.step_mark !== null) {
            program_state.step_mark.clear();
            program_state.step_mark = null;
        }

        if (program_state.step_popover !== null) {
            program_state.step_popover.popover('destroy');
            program_state.step_popover = null;
        }

        return true;
    }
    else
    {
        return false;
    }
};

cp.show_step = function () {

    cp.hide_step();

    program_state.step_mark = code_highlight(program_state.rte.ast.loc, "exec-point-code");
    scrollToMarker(program_state.step_mark);

    var value = program_state.rte.result;
    var value_repr = (value === void 0) ? "NO VALUE" : printed_repr(value, "HTML");
    program_state.step_popover = $(".exec-point-code").last();
    program_state.step_popover.last().popover({
	animation: false,
	placement: "bottom",
	trigger: "manual",
	title: value_repr,
	content: cp.dump_context(),
	html: true,
    });

    program_state.step_popover.popover('show');
};

cp.dump_context = function () {

    //return ""; // don't dump context yet

    var rte = program_state.rte;
    var f = rte.frame;
    var cte = f.cte;
    var result = [];
    var seen = {};

    var add = function (id, val)
    {
        if (seen[id] === void 0)
        {
            if (val !== void 0) // don't show undefined variables
            {
                result.push("<strong>" + id + ":</strong> " + printed_repr(val, "HTML"));
            }
            seen[id] = true;
        }
    };

    while (cte !== null)
    {
        for (var id_str in cte.params)
        {
            var i = cte.params[id_str];
            add(id_str, f.params[i]);
        }
        for (var id_str in cte.locals)
        {
            if (cte.parent !== null)
            {
                var i = cte.locals[id_str];
                add(id_str, f.locals[i]);
            }
            else
            {
                if (uninteresting_global[id_str] === void 0)
                {
                    add(id_str, rte.glo[id_str]);
                }
            }
        }
        if (cte.callee !== null)
        {
            add(cte.callee, f.callee);
        }
        cte = cte.parent;
        f = f.parent;
    }

    return result.join("<br/>");
};

var uninteresting_global = {};
uninteresting_global["print"] = true;
uninteresting_global["alert"] = true;
uninteresting_global["prompt"] = true;
uninteresting_global["println"] = true;
uninteresting_global["pause"] = true;
uninteresting_global["assert"] = true;
uninteresting_global["load"] = true;
uninteresting_global["Math"] = true;
uninteresting_global["Date"] = true;
uninteresting_global["String"] = true;
uninteresting_global["Array"] = true;
uninteresting_global["Number"] = true;
uninteresting_global["setScreenMode"] = true;
uninteresting_global["getScreenWidth"] = true;
uninteresting_global["getScreenHeight"] = true;
uninteresting_global["setPixel"] = true;

cp.execute = function (single_step) {

    if (false && cp.hide_step()) { //TODO: find a better way... this causes too much flicker
        // give some time for the browser to refresh the page
        setTimeout(function () { cp.execute2(single_step); }, 10);
    } else {
        // step was not shown, so no need to wait
        cp.execute2(single_step);
    }
};

cp.execute2 = function (single_step) {

    var newMode = 'stopped';
    cp.cancel_animation();

    var rte = program_state.rte;

    if (rte !== null && !js_eval_finished(rte)) {

        try {
            js_eval_step(rte, single_step ? 1 : 257);
        }
        catch (e) {
            if (e !== false)
                cp.transcript.addLine(String(e), "error-message");
            cp.cancel();
            return;
        }

        setStepCounter(rte.step_count);

        if (program_state.mode === 'stepping') {
            single_step = true;
        }

        if (!js_eval_finished(rte)) {
            newMode = 'stepping';
            if (single_step) {
                cp.show_step();
                if (program_state.step_delay > 0) {
                    newMode = 'animating';
                    program_state.timeout_id = setTimeout(function ()
                                                          { cp.execute(true); },
                                                          program_state.step_delay);
                }
            } else {
                newMode = 'animating';
                program_state.timeout_id = setTimeout(function ()
                                                      { cp.execute(false); },
                                                      1);
            }
        } else {

            if (rte.error !== null) {
                cp.show_error(program_state.rte.ast.loc);
                cp.transcript.addLine(rte.error, "error-message");
            } else {
                var result = js_eval_result(rte);
                if (result !== void 0) {
                    cp.transcript.addLine(printed_repr(result), "transcript-result");
                }
            }

            cp.cancel();
        }
    }

    cp.enterMode(newMode);
};

cp.run = function(single_step) {

    var str = cp.repl.getValue();
    set_prompt(cp.repl, "");
    cp.repl.refresh();

    var line;
    if (cp.transcript.is_empty) {
        line = 0;
    } else {
        line = cp.transcript.editor.lineCount();
    }

    var ch = 0;

    var source = str;
    if (source.slice(0, 2) === "> ") {
        source = source.slice(2);
        ch = 2;
    } else if (source.slice(0, 1) === ">") {
        source = source.slice(1);
        ch = 1;
    }

    if (source === "") {
        if (program_state.rte !== null) {
            cp.execute(true);
            return;
        }
        if (single_step) {
            set_prompt(cp.repl);
            cp.repl.refresh();
            cp.enterMode('stopped');
            return;
        }
    }

    cp.repl.cp.history.add(str);
    cp.transcript.addLine(str, "transcript-input");

    var code_gen = function ()
                   {
                       return cp.compile_repl_expression(source, line, ch);
                   };

    cp.run_setup_and_execute(code_gen, single_step);
};

cp.load = function(filename, single_step) {

    var src = "load(\"" + filename + "\")";

    set_prompt(cp.repl, "");
    cp.repl.refresh();

    cp.repl.cp.history.add(src);
    cp.transcript.addLine(src, "transcript-input");

    var code_gen = function ()
                   {
                       return cp.compile_internal_file(filename);
                   };

    cp.run_setup_and_execute(code_gen, single_step);
};

cp.run_setup_and_execute = function (code_gen, single_step) {

    cp.hide_error();

    cp.repl.busy = true;

    try {
        var code = code_gen();
        program_state.rte = js_run_setup(code);
    }
    catch (e) {
        if (e !== false)
            cp.transcript.addLine(String(e), "error-message");
        cp.cancel();
        return;
    }

    cp.execute(single_step);

    cp.repl.focus();
};

function abort_fn_body(rte, result, msg) {

    cp.enterMode("stepping");

    if (msg !== void 0) {
        cp.transcript.addLine(msg, "error-message");
    }

    program_state.step_delay = 0;
    rte.step_limit = rte.step_count; // exit trampoline

    return return_fn_body(rte, result);
}

function return_fn_body(rte, result) {

    var cont = rte.stack.cont;

    rte.frame = rte.stack.frame;
    rte.stack = rte.stack.stack;

    return cont(rte, result);
}

function builtin_pause(filename) {
    throw "unimplemented";///////////////////////////
}

builtin_pause._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
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
    throw "unimplemented";///////////////////////////
}

builtin_assert._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (!params[0]) {
            return abort_fn_body(rte,
                                 "THIS ASSERTION FAILED",
                                 params[1]);
        }

        return cont(rte, void 0);
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
    throw "unimplemented";///////////////////////////
}

builtin_setScreenMode._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 2) {
            return abort_fn_body(rte, void 0, "setScreenMode expects 2 parameters");
        }

        var width = params[0];
        var height = params[1];
            
        if (typeof width !== "number" ||
            Math.floor(width) !== width ||
            width < 1 ||
            width > 300) {
            return abort_fn_body(rte, void 0, "width parameter of setScreenMode must be a positive integer no greater than 300");
        }

        if (typeof height !== "number" ||
            Math.floor(height) !== height ||
            height < 1) {
            return abort_fn_body(rte, void 0, "height parameter of setScreenMode must be a positive integer no greater than 200");
        }

        var pixSize = Math.min(10, Math.floor(450 / width + 1));

        var divNode = document.createElement("div");

        var pixels = new cp.output.PixelGrid(divNode, {
            rows: height,
            cols: width,
            pixelSize: (pixSize >= 3) ? pixSize-1 : pixSize,
            borderWidth: (pixSize >= 3) ? 1 : 0,
        });

        pixels.clear('black');

        cp.transcript.addLineWidget(divNode);

        cp.screenPixels = pixels;
        cp.screenWidth = width;
        cp.screenHeight = height;

        return cont(rte, void 0);
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

cp.screenWidth = 0;

function builtin_getScreenWidth() {
    throw "unimplemented";///////////////////////////
}

builtin_getScreenWidth._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, cp.screenWidth);
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

cp.screenHeight = 0;

function builtin_getScreenHeight() {
    throw "unimplemented";///////////////////////////
}

builtin_getScreenHeight._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, cp.screenHeight);
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
    throw "unimplemented";///////////////////////////
}

builtin_setPixel._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 3) {
            return abort_fn_body(rte, void 0, "setPixel expects 3 parameters");
        }

        var x = params[0];
        var y = params[1];
        var color = params[2];
            
        if (typeof x !== "number" ||
            Math.floor(x) !== x ||
            x < 0 ||
            x >= cp.screenWidth) {
            return abort_fn_body(rte, void 0, "x parameter of setPixel must be a positive integer less than " + cp.screenWidth);
        }

        if (typeof y !== "number" ||
            Math.floor(y) !== y ||
            y < 0 ||
            y >= cp.screenHeight) {
            return abort_fn_body(rte, void 0, "y parameter of setPixel must be a positive integer less than " + cp.screenHeight);
        }

        if (typeof color !== "object" ||
            color === null ||
            !("r" in color) ||
            typeof color.r !== "number" ||
            Math.floor(color.r) !== color.r ||
            color.r < 0 || color.r > 255 ||
            !("g" in color) ||
            typeof color.g !== "number" ||
            Math.floor(color.g) !== color.g ||
            color.g < 0 || color.g > 255 ||
            !("b" in color) ||
            typeof color.b !== "number" ||
            Math.floor(color.b) !== color.b ||
            color.b < 0 || color.b > 255) {
            return abort_fn_body(rte, void 0, "color parameter of setPixel must be a RGB structure");
        }

        cp.screenPixels.setPixel(x,
                                 y,
                                 "#" +
                                 (256+color.r).toString(16).slice(1) +
                                 (256+color.g).toString(16).slice(1) +
                                 (256+color.b).toString(16).slice(1));

        return cont(rte, void 0);
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

function builtin_load(filename) {
    throw "unimplemented";///////////////////////////
}

builtin_load._apply_ = function (rte, cont, this_, params) {

    var filename = params[0];
    var code = cp.compile_internal_file(filename);

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

cp.compile_repl_expression = function (source, line, ch) {
    return cp.compile(source,
                      new SourceContainer(source, "<REPL>", line+1, ch+1));
};

cp.compile_internal_file = function (filename) {

    var state = readFileInternal(filename);
    var source = state.content;

    return cp.compile(source,
                      new SourceContainerInternalFile(source, filename, 1, 1, state.stamp));
};

function readFileInternal(filename) {

    var file = cp.fs.getByName(filename);

    return {
        stamp: file.stamp,
        content: file.getContent(),
    };
}

cp.compile = function (source, container) {
    return js_compile(source,
                      {
                          container: container,
                          error: cp.syntax_error
                      });
};

var warnSemicolon = true;

cp.syntax_error = function (loc, kind, msg) {

    if (warnSemicolon && msg === "';' missing after this token") {
        kind = "syntax error";
        cp.show_error(loc);
        cp.transcript.addLine(kind + " -- " + msg, "error-message");
        throw false;
    }

    if (kind !== "warning") {
        cp.show_error(loc);
        cp.transcript.addLine(kind + " -- " + msg, "error-message");
        throw false;
    }
};

cp.clearREPL = function () {
    set_prompt(cp.repl);
    cp.repl.refresh();
    cp.repl.focus();
};

cp.clearAll = function () {
    cp.cancel();
    cp.clearREPL();
    cp.transcript.clear();
}

cp.undo = function (cm) {
    cm.undo();
};

cp.redo = function (cm) {
    cm.redo();
};
