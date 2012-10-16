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

cp.addLineToTranscript = function (text, cssClass) {
    var line;

    text = String(text);
    if (text.charAt(text.length - 1) === "\n")
        text = text.slice(0,text.length-1);

    if (cp.non_empty) {
        line = cp.transcript.lineCount();
        text = "\n" + text;
    } else {
        line = 0;
        $("#transcript").show();
        $("#transcript-sep").show();
        cp.non_empty = true;
    }

    cp.transcript.replaceRange(text, { line: line, ch: 0 });

    if (cssClass !== null)
        cp.transcript.markText({ line: line, ch: 0 }, { line: line+1, ch: 0 }, cssClass);
};

cp.addLineToConsole = function (line, cssClass) {

    if (cp.currentConsoleLine) {
        cp.currentConsoleLine = undefined;
        $(cp.console).append("\n");
    }
    if (!cssClass) cssClass = "console-output";
    $(cp.console).append($("<span/>").addClass(cssClass).text(line), "\n");
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
        editor = cp.transcript;
    } else {
        // unknown source container
        return null;
    }

    var start = position_to_line_ch(loc.start_pos);
    var end = position_to_line_ch(loc.end_pos);
    return editor.markText(start, end, cssClass);
}

function printed_repr(x) {

    //TODO: avoid infinite loops for circular data!
    //TODO: avoid printing wider than page!

    if (typeof x === "string") {
        return "\"" + x + "\""; //TODO: should escape ", \, etc!
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

cp.query = function (query) {
    cp.saved_query = query;
};

cp.handle_query = function () {

    var query = cp.saved_query;

    if (query !== null) {
        query = decodeURIComponent(query);
    }

    if (query && query.slice(0, 7) === "replay=") {

        var i = 7;

        while (i < query.length) {
            var j = i;
            while (j < query.length &&
                   query.charCodeAt(j) !== 96 &&
                   query.charCodeAt(j) !== 126) j++;
            if (i<j)
                set_input(cp.repl, default_prompt + query.slice(i, j));
            if (query.charCodeAt(j) === 126) { // ~
                cp.run(false);
            } else if (query.charCodeAt(j) === 96) { // `
                cp.step();
            }
            j++;
            i = j;
        }
    }
};

var program_state = {
    rte: null,
    error_mark: null,
    step_mark: null,
    timeout_id: null,
    step_delay: 0,
    mode: 'stopped',
    controller: null,
};

function setControllerState(controller, enabled) {
    $(".exec-btn-step", controller).toggleClass('disabled', !enabled);
    $(".exec-btn-play", controller).toggleClass('disabled', !enabled);
    $(".exec-btn-anim", controller).toggleClass('disabled', !enabled);
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
    $(".exec-lbl-count", control).toggle(newMode !== 'stopped');

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
    cp.show_step(false);
    cp.enterMode('stopped');
    program_state.rte = null;
    cp.repl.busy = false;
    set_prompt(cp.repl);
    cp.repl.refresh();
    cp.repl.focus();
};

cp.show_error = function (loc) {

    if (program_state.error_mark !== null) {
        program_state.error_mark.clear();
        program_state.error_mark = null;
    }

    if (loc !== void 0) {
        program_state.error_mark = code_highlight(loc, "error-code");
    }
};

cp.show_step = function (show) {

    if (program_state.step_mark !== null) {
        program_state.step_mark.clear();
        program_state.step_mark = null;
    }

    var step_value = document.getElementById("step-value");

    if (show) {
        program_state.step_mark = code_highlight(program_state.rte.ast.loc, "exec-point-code");
        var value = program_state.rte.result;
        $(step_value).text(printed_repr(value));
        step_value.style.display = (value === void 0) ? "none" : "block";
    } else {
        step_value.style.display = "none";
        $(step_value).text("");
    }
};

cp.execute = function (single_step) {
    var newMode = 'stopped';
    cp.cancel_animation();

    var rte = program_state.rte;

    if (rte !== null && !js_eval_finished(rte)) {

        try {
            js_eval_step(rte, single_step ? 1 : 257);
        } catch (e) {
            cp.addLineToTranscript(String(e), "error-message");
            cp.cancel();
            return;
        }

        $(".exec-lbl-count", program_state.controller).text("Step " + rte.step_count);

        if (!js_eval_finished(rte)) {
            newMode = 'stepping';
            cp.show_step(single_step);
            if (single_step) {
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
                cp.addLineToTranscript(rte.error, "error-message");
            } else {
                var result = js_eval_result(rte);
                if (result !== void 0) {
                    cp.addLineToTranscript(printed_repr(result), null);
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
    if (cp.non_empty !== void 0)
        line = cp.transcript.lineCount();
    else
        line = 0;

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
    cp.addLineToTranscript(str, null);

    var code = cp.compile_repl_expression(source, line, ch);

    cp.run_setup_and_execute(code, single_step);
};

cp.load = function(filename, single_step) {

    var source = "load(\"" + filename + "\")";
    var str = "> " + source;

    set_prompt(cp.repl, "");
    cp.repl.refresh();

    cp.repl.cp.history.add(str);
    cp.addLineToTranscript(str, null);

    var code = cp.compile_internal_file(filename);

    cp.run_setup_and_execute(code, single_step);
};

cp.run_setup_and_execute = function (code, single_step) {

    cp.show_error();

    cp.repl.busy = true;

    try {
        program_state.rte = js_run_setup(code);
    }
    catch (e) {
        if (e !== false)
            cp.addLineToTranscript(String(e), "error-message");
        cp.repl.busy = false;
        set_prompt(cp.repl);
        cp.repl.refresh();
        return;
    }

    cp.execute(single_step);

    cp.repl.focus();
};

function builtin_load(filename)
{
    throw "unimplemented";///////////////////////////
}

builtin_load._apply_ = function (rte, cont, this_, params)
{
    var filename = params[0];
    var code = cp.compile_internal_file(filename);

    return exec_fn_body(code, builtin_load, rte, cont, this_, params, [], null);
};

cp.compile_repl_expression = function (source, line, ch)
{
    return cp.compile(source,
                      new SourceContainer(source, "<REPL>", line+1, ch+1));
};

cp.compile_internal_file = function (filename)
{
    var state = readFileInternal(filename);
    var source = state.content;

    return cp.compile(source,
                      new SourceContainerInternalFile(source, filename, 1, 1, state.stamp));
};

function readFileInternal(filename)
{
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

cp.syntax_error = function (loc, kind, msg) {

    if (kind !== "warning") {
        cp.show_error(loc);
        cp.addLineToTranscript(kind + " -- " + msg, "error-message");
        throw false;
    }
};

cp.clearREPL = function () {
    set_prompt(cp.repl);
    cp.repl.refresh();
    cp.repl.focus();
};

cp.clearTranscript = function () {
    cp.transcript.setValue("");
    cp.transcript.refresh();
    cp.non_empty = false;
    $("#transcript").hide();
    $("#transcript-sep").hide();
};

cp.clearAll = function () {
    cp.cancel();
    cp.clearREPL();
    cp.clearTranscript();
}

cp.undo = function (cm) {
    cm.undo();
};

cp.redo = function (cm) {
    cm.redo();
};
