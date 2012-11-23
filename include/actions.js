$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

cb.addAlert = function (text, title, kind) {
    var alertDiv = $("<div/>").addClass("alert");
    if (kind) alertDiv.addClass("alert-" + kind);
    alertDiv.text(text);
    if (title) {
        alertDiv.prepend($("<strong/>").text(title), " ");
    }
    alertDiv.prepend('<button class="close" data-dismiss="alert">&times;</button>');
    $(cb.alerts).append(alertDiv);
};

cb.reportError = function (text, title) {
    if (title === undefined) title = "Error!";
    cb.addAlert(text, title, "error");
};

cb.reportWarning = function (text, title) {
    if (title === undefined) title = "Warning!";
    cb.addAlert(text, title);
};

cb.scrollToEnd = function (editor) {
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

CPTranscript.prototype.onTranscriptChanged = function () {
    // TODO: make this configurable
    var $console = $("#console-row");
    var top = $console.offset().top;
    var height = $console.height();
    $("#editors").css("top", top + height);
}

CPTranscript.prototype.clear = function () {
    for (var i = 0; i < this.widgets.length; i++) {
        this.editor.removeLineWidget(this.widgets[i]);
    }
    this.editor.setValue("");
    this.editor.refresh();
    this.is_empty = true;
    this.hide();
    this.onTranscriptChanged();
};

CPTranscript.prototype.show = function () {
    $("#transcript").show();
    $("#transcript-sep").show();
    this.onTranscriptChanged();
};

CPTranscript.prototype.hide = function () {
    $("#transcript").hide();
    $("#transcript-sep").hide();
    this.onTranscriptChanged();
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
    editor.markText({ line: line, ch: 0 }, { line: line+1, ch: 0 }, {"className" : cssClass});

    if (editor.lineInfo(line).gutterMarkers) {
        // Oops, CodeMirror moved the gutter down instead of appending a blank line
        // We'll set the gutter back on the previous line (ugly!)
        line -= 1;
    }
    editor.setGutterMarker(line, "cb-prompt", document.createTextNode(">"));
    this.is_empty = false;

    this.onTranscriptChanged();
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

    cb.scrollToEnd(this.editor);

    this.onTranscriptChanged();
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
        if (!cb.fs.hasFile(filename)) {
            return null; // the file is not known
        }
        var state = readFileInternal(filename);
        if (container.stamp !== state.stamp) {
            return null; // the content of the editor has changed so can't highlight
        }
        cb.openFile(filename);
        editor = cb.fs.getEditor(filename);
    } else if (container instanceof SourceContainer) {
        editor = cb.transcript.editor;
    } else {
        // unknown source container
        return null;
    }

    var start = position_to_line_ch(loc.start_pos);
    var end = position_to_line_ch(loc.end_pos);
    return editor.markText(start, end, {"className": cssClass});
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

    var site = document.location.origin +
               document.location.pathname.replace(/\/[^/]*$/g,"");

    return site +
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

cb.query = function (query) {
    cb.saved_query = query;
    cb.replay_command = "";
    cb.replay_command_index = 0;
    cb.replay_parameters = [];
};

cb.handle_query = function () {

    var query = cb.saved_query;

    if (query && query.slice(0, 7) === "replay=") {

        cb.replay_command = decodeURIComponent(query.slice(7));
        cb.replay_command_index = 0;
        cb.replay_syntax = 1;

        setTimeout(function () { cb.replay(); }, 100);
    } else if (query && query.slice(0, 10) === "replay%25=") {

        cb.replay_command = decodeURIComponent(decodeURIComponent(query.slice(10)));
        cb.replay_command_index = 0;
        cb.replay_syntax = 2;

        setTimeout(function () { cb.replay(); }, 100);
    } else if (query && query.slice(0, 8) === "replay%=") {

        cb.replay_command = decodeURIComponent(query.slice(8));
        cb.replay_command_index = 0;
        cb.replay_syntax = 2;

        setTimeout(function () { cb.replay(); }, 100);
    }
};

cb.replay = function () {

    var command = cb.replay_command;
    var i = cb.replay_command_index;

    if (i < command.length) {
        var j = i;
        while (j < command.length &&
               (command.charAt(j) !== "@" ||
                (command.charAt(j+1) === "@" ||
                 (cb.replay_syntax === 2 && command.charAt(j+1) === "N")))) {
            if (command.charAt(j) === "@") {
                j += 2;
            } else {
                j += 1;
            }
        }

        var str;

        if (cb.replay_syntax === 2) {
            str = command.slice(i, j).replace(/@N/g,"\n").replace(/@@/g,"@");
        } else {
            str = command.slice(i, j).replace(/@@/g,"\n");
        }

        if (command.charAt(j) === "@") {
            if (command.charAt(j+1) >= "0" && command.charAt(j+1) <= "9") {
                cb.replay_parameters[+command.charAt(j+1)] = str;
                j += 2;
            } else if (command.charAt(j+1) === "P") {
                if (str !== "") {
                    set_input(cb.repl, str);
                    cb.repl.refresh();
                    cb.repl.focus();
                } else {
                    cb.run(false);
                    j += 2;
                }
            } else if (command.charAt(j+1) === "S") {
                if (str !== "") {
                    set_input(cb.repl, str);
                    cb.repl.refresh();
                    cb.repl.focus();
                } else {
                    cb.animate(0);
                    j += 2;
                }
            } else if (command.charAt(j+1) === "A") {
                if (str !== "") {
                    set_input(cb.repl, str);
                    cb.repl.refresh();
                    cb.repl.focus();
                } else {
                    cb.animate(500);
                    j += 2;
                }
            } else if (command.charAt(j+1) === "E") {
                var default_filename = "scratch";
                var filename = default_filename;
                if (cb.replay_parameters[0] !== void 0) {
                    filename = cb.replay_parameters[0];
                    cb.replay_parameters[0] = void 0;
                }
                var existing = cb.openFileExistingOrNew(filename);
                var editor = cb.fs.getEditor(filename);
                var replace = true;
                if (existing &&
                    filename !== default_filename &&
                    editor.getValue() !== str) {
                    replace = confirm("You are about to replace the file '" + filename + "' with different content.  Are you sure you want proceed with the replacement and lose your local changes to that file?");
                }
                if (replace) {
                    editor.setValue(str);
                    showTryMeTooltip(filename);
                }
                j += 2;
            } else if (command.charAt(j+1) === "C") {
                cb.closeAll();
                j += 2;
            } else {
                // unknown command
                j += 2;
            }
        } else {
            if (str !== "") {
                set_input(cb.repl, str);
                if (j === command.length) {
                    showTryMeOnButton($("#step-button"));
                }
            }
        }

        cb.replay_command_index = j;

        if (j < command.length) {
            setTimeout(function () { cb.replay(); }, 1);
        }
    }
};

function showTryMeTooltip(filename) {
    var $row = $('.row[data-cb-filename="' + filename + '"]');
    var $btn = $(".action-btn", $row.get(0));
    showTryMeOnButton($btn);
};

function showTryMeOnButton($btn) {

    $btn.tooltip({
        trigger: "manual",
        placement: "left",
        html: true,
        template: '<div class="tooltip tryme"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
    });

    var tooltip = $btn.data('tooltip');
    if (tooltip) {
        tooltip.getTitle = function () {
            // Bootstrap insists on using the title attribute for tooltips, so override
            return 'Try me!';
        };
        $btn.tooltip('show');

        // Auto hide the tooltip after 5 secs
        setTimeout(function () { $btn.tooltip('hide'); }, 5000);

        // Hide the tooltip if the user clicks on the button before 5 secs
        $btn.on("click.codeboot.tryMe", function () {
            $btn.tooltip('hide');
        });
    }
}

var program_state = {
    rte: null,
    error_mark: null,
    step_mark: null,
    value_bubble: null,
    timeout_id: null,
    step_delay: 0,
    mode: 'stopped',
    step_counter: null
};

function setControllerState(controller, enabled) {
    $(".dropdown-toggle", controller).toggleClass('disabled', !enabled);
    $(".action-btn", controller).toggleClass('disabled', !enabled);
}

function setStepCounter(count) {
    if (program_state.step_counter !== null) {
        program_state.step_counter.text(count + " step" + (count>1 ? "s" : ""));
    }
}

function disableAllControllers() {
    $('[data-cb-exec="controller"]').each(function () {
        setControllerState(this, false);
    });
}

function enableAllControllers() {
    $('[data-cb-exec="controller"]').each(function () {
        setControllerState(this, true);
    });
}

cb.enterMode = function (newMode) {
    // newMode is one of 'stopped', 'animating', 'stepping'

    if (program_state.mode === newMode) return;

    if (newMode === "stopped") {
        enableAllControllers();
    } else {
        disableAllControllers();
    }

    var control = $("#repl-controls");

    // Cancel button
    $(".exec-btn-cancel", control).toggleClass("disabled", newMode === 'stopped');

    // Pause button
    $(".exec-btn-pause", control).toggleClass("disabled", newMode !== 'animating');

    // Step button + icon
    $(".exec-btn-step", control).toggleClass("disabled", newMode === 'animating');
    if (newMode === 'stepping') {
        $("#step-mode-icon").removeClass("icon-exp-pause").addClass("icon-exp-one");
    } else {
        $("#step-mode-icon").removeClass("icon-exp-one").addClass("icon-exp-pause");
    }

    // Step counter
    if (newMode === 'animating' || newMode === 'stepping') {
        if (program_state.step_counter === null) {
            program_state.step_counter = $('<span class="badge badge-info exec-lbl-count"/>');
            setStepCounter(program_state.rte.step_count);
            cb.repl.addWidget({line: 0, ch: 0}, program_state.step_counter.get(0), false);
        }
    } else if (newMode === 'stopped' && program_state.step_counter != null) {
        // Clone the widget rather than attempt to reset its positioning for now
        // TODO: move the widget rather the clone it
        var $newWidget = $('<span class="badge badge-info exec-lbl-count"/>');
        $oldWidget = $(program_state.step_counter);
        $newWidget.text($oldWidget.text());
        $oldWidget.remove();
        cb.transcript.addLineWidget($newWidget.get(0));
        program_state.step_counter = null;
    }

    program_state.mode = newMode;
};

cb.animate = function (new_step_delay) {
    program_state.step_delay = new_step_delay;
    cb.step();
};

cb.play_or_step = function (single_step) {
    cb.repl.focus();
    if (program_state.rte !== null)
        cb.execute(single_step);
    else
        cb.run(single_step);
};

cb.play = function () {
    program_state.mode = "animating";
    cb.play_or_step(false);
};

cb.step = function () {
    cb.play_or_step(true);
};

cb.cancel_animation = function () {
    if (program_state.timeout_id !== null) {
        clearTimeout(program_state.timeout_id);
        program_state.timeout_id = null;
    }
};

cb.cancel = function () {
    cb.cancel_animation();
    cb.hide_step();
    cb.enterMode('stopped');
    program_state.rte = null;
    cb.repl.busy = false;
    set_prompt(cb.repl);
    cb.repl.refresh();
    cb.repl.focus();
};

cb.show_error = function (loc) {

    cb.hide_error();

    program_state.error_mark = code_highlight(loc, "error-code");
};

cb.hide_error = function () {
    if (program_state.error_mark !== null) {
        program_state.error_mark.clear();
        program_state.error_mark = null;
    }
};

function within(rect, viewport) {
    if (rect.left < viewport.left) return false;
    if (rect.right > viewport.left + viewport.clientWidth) return false;
    if (rect.top < viewport.top) return false;
    if (rect.bottom > viewport.top + viewport.clientHeight) return false;
    return true;
}

function isCharacterVisible(pos, cm) {
    var point = cm.charCoords(pos, "local");
    var scrollInfo = cm.getScrollInfo();
    return within(point, scrollInfo);
}

function isMarkerVisible(marker, cm) {
    if (!cm) cm = marker.cm; // TODO: non-documented, so brittle
    var range = marker.find();
    if (range) return isCharacterVisible(range.from, cm);

    return false;
}

function scrollToMarker(marker, cm) {
    if (!cm) cm = marker.cm; // TODO: non-documented, so brittle
    if (!isMarkerVisible(marker, cm)) {
        var range = marker.find();
        if (range) {
            var rect = cm.charCoords(range.from, "local");
            cm.scrollTo(rect.left, rect.top);
        }
    }
}

function CPValueBubble(opts) {
    this.opts = {};
    $.extend(this.opts, {
        value : program_state.rte.result,
        context : cb.dump_context(),
        $anchor : function () { return $(".exec-point-code").last(); },
        $container: null,
    }, opts);

    this.closed = false;
    this.$last_anchor = null;
    this.init(this.anchor())
}

CPValueBubble.prototype.init = function ($anchor) {
    if (this._popover) this._popover.destroy();
    $anchor.popover({
        animation: false,
        placement: "bottom",
        trigger: "manual",
        title: '<span class="exec-point-value">'
                 + this._valueRepr(this.opts.value)
                 + '</span>'
                 + '<button class="close">&times;</button>',
        content: this.opts.context,
        html: true,
        padding: 2
    });
    this._popover = $anchor.data('popover');

    // Add close button handler
    // Popovers / tooltips are created lazily, so intercept their creation to install the handler
    var oldShow = this._popover.show;
    var self = this;
    this._popover.show = function () {
        var $tip = this.tip();
        $tip.addClass("value-bubble");
        oldShow.apply(this, arguments);
        $("button.close", $tip).on("click", function() {
            self.closed = true;
            self.hide();
            $(".exec-point-code").one("mouseover", function () {
                if (!self.isOpen()) {
                    self.show();
                }
            });
        });
    }
};

CPValueBubble.prototype.anchor = function () {
    var $anchor = this.opts.$anchor;
    if (typeof $anchor === "function") {
        this.$last_anchor = $anchor();
        if (this._popover && !this.$last_anchor.data('popover')) {
            // We lost the popover, most likely because the anchor
            // changed under our feet. This seems to happen when e.g. the window
            // is resized (observed on Chrome)
            this.init(this.$last_anchor);
        }
        return this.$last_anchor;
    } else {
        return $anchor;
    }
};

CPValueBubble.prototype._valueRepr = function (val) {
    if (val === void 0) return "NO VALUE";
    return printed_repr(val, "HTML");
};

CPValueBubble.prototype.show = function () {
    this.closed = false;
    if (this.anchor().isInView(this.opts.$container)) {
        // The proper height for the tooltip will only be available after
        // we show it. So, we first display it with visibility:hidden,
        // compute the placement, and finally display it to the user.
        this._popover.tip().css("visibility", "hidden");
        this.anchor().popover('show');
        this.setPlacement(this._calculatePlacement());
        this.anchor().popover('show');
        this._popover.tip().css("visibility", "visible");
    }
};

CPValueBubble.prototype._calculatePlacement = function () {
    if (!this.opts.$container) {
        return "bottom";
    }

    var $bubble = this._popover.tip();
    var extra_padding = 5; // Extra padding for safety
    var editorsRect = this.opts.$container.getBounds();
    var anchorRect = this.anchor().getBounds();
    if (anchorRect.bottom + this.height() + extra_padding >= editorsRect.bottom) {
        return "top";
    } else {
        return "bottom";
    }
};

CPValueBubble.prototype.update = function () {
    if (this.closed) return;

    if (this.anchor().isInView(this.opts.$container)) {
        this.setPlacement(this._calculatePlacement());
        this.anchor().popover('show');
    } else {
        this.hide();
    }
};

CPValueBubble.prototype.hide = function () {
    this.$last_anchor.popover('hide');
};

CPValueBubble.prototype.destroy = function () {
    this.$last_anchor.popover('destroy');
    this._popover = null;
};

CPValueBubble.prototype.isOpen = function (args) {
    return this._popover.tip().hasClass('in');
};

CPValueBubble.prototype.setPlacement = function (placement) {
    this._popover.options.placement = placement;
};

CPValueBubble.prototype.height = function () {
    var arrow_height = 10;
    var h = this._popover.tip().height();
    if (h === 0) {
        // Popover hasn't been created yet, so create it
        this._popover.setContent();
        h = this._popover.tip().height();
    }
    return h + arrow_height;
}

cb.hide_step = function () {

    if (program_state.step_mark !== null ||
        program_state.value_bubble !== null) {

        if (program_state.value_bubble !== null) {
            program_state.value_bubble.destroy();
            program_state.value_bubble = null;
        }

        if (program_state.step_mark !== null) {
            program_state.step_mark.clear();
            program_state.step_mark = null;
        }

        // Somehow, CodeMirror seems to hold on to the marked elements somewhere,
        // causing problems when displaying the bubble. This kludge should at least
        // prevent the problem from manifesting for the user.
        // TODO: proper fix
        $(".exec-point-code").removeClass("exec-point-code");

        return true;
    }
    else
    {
        return false;
    }
};

cb.show_step = function () {

    cb.hide_step();

    var loc = program_state.rte.ast.loc;
    program_state.step_mark = code_highlight(loc, "exec-point-code");
    scrollToMarker(program_state.step_mark);

    var value = program_state.rte.result;
    var $container;
    if (loc.container instanceof SourceContainerInternalFile) {
        $container = $("#editors");
    } else {
        $container = null; /* use whole document */
    }

    if (!$(".exec-point-code").last().isInView($container)) {
        var filename = loc.container.toString();
        cb.scrollTo(cb.getContainerFor(filename));
    }

    program_state.value_bubble = new CPValueBubble({
        $container: $container
    });
    program_state.value_bubble.show();
};

cb.dump_context = function () {

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

cb.execute = function (single_step) {

    if (false && cb.hide_step()) { //TODO: find a better way... this causes too much flicker
        // give some time for the browser to refresh the page
        setTimeout(function () { cb.execute2(single_step); }, 10);
    } else {
        // step was not shown, so no need to wait
        cb.execute2(single_step);
    }
};

cb.execute2 = function (single_step) {

    var newMode = 'stopped';
    cb.cancel_animation();

    var rte = program_state.rte;

    if (rte !== null && !rte.finished()) {

        try {
            rte.step(single_step ? 1 : 51151);
        }
        catch (e) {
            if (e !== false)
                cb.transcript.addLine(String(e), "error-message");
            cb.cancel();
            return;
        }

        setStepCounter(rte.step_count);

        if (program_state.mode === 'stepping') {
            single_step = true;
        }

        if (!rte.finished()) {
            newMode = 'stepping';
            if (single_step) {
                cb.show_step();
                if (program_state.step_delay > 0) {
                    newMode = 'animating';
                    program_state.timeout_id = setTimeout(function ()
                                                          { cb.execute(true); },
                                                          program_state.step_delay);
                }
            } else {
                newMode = 'animating';
                program_state.timeout_id = setTimeout(function ()
                                                      { cb.execute(false); },
                                                      1);
            }
        } else {

            if (rte.error !== null) {
                cb.show_error(program_state.rte.ast.loc);
                cb.transcript.addLine(rte.error, "error-message");
            } else {
                var result = rte.getResult();
                if (result !== void 0) {
                    cb.transcript.addLine(printed_repr(result), "transcript-result");
                }
            }

            cb.cancel();
        }
    }

    cb.enterMode(newMode);
};

cb.run = function(single_step) {

    var str = cb.repl.getValue();
    set_prompt(cb.repl, "");
    cb.repl.refresh();

    var line;
    if (cb.transcript.is_empty) {
        line = 0;
    } else {
        line = cb.transcript.editor.lineCount();
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
            cb.execute(true);
            return;
        }
        if (single_step) {
            set_prompt(cb.repl);
            cb.repl.refresh();
            cb.enterMode('stopped');
            return;
        }
    }

    cb.repl.cb.history.add(str);
    cb.transcript.addLine(str, "transcript-input");

    var code_gen = function ()
                   {
                       return cb.compile_repl_expression(source, line, ch);
                   };

    cb.run_setup_and_execute(code_gen, single_step);
};

cb.load = function(filename, single_step) {

    var src = "load(\"" + filename + "\")";

    set_prompt(cb.repl, "");
    cb.repl.refresh();

    cb.repl.cb.history.add(src);
    cb.transcript.addLine(src, "transcript-input");

    var code_gen = function ()
                   {
                       return cb.compile_internal_file(filename);
                   };

    cb.run_setup_and_execute(code_gen, single_step);
};

cb.globalObject = {};

cb.addGlobal = function (name, value) {
    cb.globalObject[name] = value;
};

cb.run_setup_and_execute = function (code_gen, single_step) {

    cb.hide_error();

    cb.repl.busy = true;

    try {
        var code = code_gen();
        program_state.rte = jev.runSetup(code,
                                         {globalObject: cb.globalObject});
    }
    catch (e) {
        if (e !== false)
            cb.transcript.addLine(String(e), "error-message");
        cb.cancel();
        return;
    }

    cb.execute(single_step);

    cb.repl.focus();
};

function abort_fn_body(rte, result, msg) {

    cb.enterMode("stepping");

    if (msg !== void 0) {
        cb.transcript.addLine(msg, "error-message");
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

        var pixels = new cb.output.PixelGrid(divNode, {
            rows: height,
            cols: width,
            pixelSize: (pixSize >= 3) ? pixSize-1 : pixSize,
            borderWidth: (pixSize >= 3) ? 1 : 0,
        });

        pixels.clear('black');

        cb.transcript.addLineWidget(divNode);

        cb.screenPixels = pixels;
        cb.screenWidth = width;
        cb.screenHeight = height;

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

cb.screenWidth = 0;

function builtin_getScreenWidth() {
    throw "unimplemented";///////////////////////////
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
    throw "unimplemented";///////////////////////////
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
            x >= cb.screenWidth) {
            return abort_fn_body(rte, void 0, "x parameter of setPixel must be a positive integer less than " + cb.screenWidth);
        }

        if (typeof y !== "number" ||
            Math.floor(y) !== y ||
            y < 0 ||
            y >= cb.screenHeight) {
            return abort_fn_body(rte, void 0, "y parameter of setPixel must be a positive integer less than " + cb.screenHeight);
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

        cb.screenPixels.setPixel(x,
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
    var code = cb.compile_internal_file(filename);

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

cb.compile_repl_expression = function (source, line, ch) {
    return cb.compile(source,
                      new SourceContainer(source, "<REPL>", line+1, ch+1));
};

cb.compile_internal_file = function (filename) {

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

cb.compile = function (source, container) {
    return jev.compile(source,
                       {
                           container: container,
                           error: cb.syntax_error,
                           languageLevel: cb.languageLevel
                       });
};

var warnSemicolon = true;

cb.syntax_error = function (loc, kind, msg) {

    if (warnSemicolon && msg === "';' missing after this token") {
        kind = "syntax error";
        cb.show_error(loc);
        cb.transcript.addLine(kind + " -- " + msg, "error-message");
        throw false;
    }

    if (kind !== "warning") {
        cb.show_error(loc);
        cb.transcript.addLine(kind + " -- " + msg, "error-message");
        throw false;
    }
};

cb.clearREPL = function () {
    set_prompt(cb.repl);
    cb.repl.refresh();
    cb.repl.focus();
};

cb.clearAll = function () {
    cb.cancel();
    cb.clearREPL();
    cb.transcript.clear();
}

cb.undo = function (cm) {
    cm.undo();
};

cb.redo = function (cm) {
    cm.redo();
};
