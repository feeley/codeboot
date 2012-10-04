$(document).ready(function() {
    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
});

cp.getCurrentTab = function () {
    if (cp.currentTab) {
        return cp.tabs[cp.currentTab];
    }
    return undefined;
};

function cp_internal_closeTab(id) {
    // Remove tab
    var current_tab = $("#tabitem_" + id);
    if (current_tab.hasClass("active")) {
        var prev_tab = current_tab.prev();
        if (prev_tab.length === 0) {
            // no prev tab, use the next one
            prev_tab = current_tab.next();
        }
        if (prev_tab.length !== 0) {
            // Activate this tab
            prev_tab.children('a').tab('show');
        }
    }
    current_tab.remove();
    
    // Remove content
    $("#" + id).remove();
    
    // Clear data
    delete cp.tabs[id];
}

cp.closeAllTabs = function () {
    var tabs = cp.tabs;
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab) {
            cp_internal_closeTab(tab.id);
        }
    }
    cp.tabs = [];
};

cp.closeTab = function (id) {
    cp_internal_closeTab(id);
    
    // If no tabs remain, create a new one
    if ($("#editor-tabs").children("li").length === 0) {        
        cp.newTab();
    }
};

function cp_internal_nextTabID() {
    var tabs = cp.tabs;
    var i = 1;
    while (tabs[i]) i++;
    return i;
}

function cp_internal_makeCloseButton() {
    return $("<button/>").addClass("close").append("&times;");
}

cp.newTab = function (title, id) {
    if (id === undefined) {
        id = cp_internal_nextTabID();
    }
    if (title === undefined) {
        title = "untitled" + id;
    }
    
    // Create tab
    // <li><a href="#untitled" data-toggle="tab">untitled<button class="close">&times;</button></a></li>
    var close_button = cp_internal_makeCloseButton();
    close_button.click((function (tabID) {
        return function (event) {
            event.stopPropagation();
            event.preventDefault();
            cp.closeTab(tabID);
        };
    })(id));
    
    //     ___________
    //    | tab_id  x |
    //    |___________|______________
    //    | .tab-pane                |
    //    |                          |
    //    |      id                  |
    //    |                          |
    //    |__________________________|
    
    var titleSpan = $('<span/>').addClass("tabTitle").text(title);
    var link = $('<a data-toggle="tab"/>').attr("id", "tab_" + id).attr("href", "#" + id).append(titleSpan).append(close_button);
    link.on('shown', (function (tabID) {
        return function (event) {
            cp.currentTab = tabID;
        };
    })(id));
    link.dblclick((function (title, tabID) {
        return function (event) {
            var newTitle = prompt("Enter a new name for '" + cp.tabs[tabID].title + "'");
            if (newTitle !== null) {
                title.text(newTitle);
                cp.tabs[tabID].title = newTitle;
            }
        };
    })(titleSpan, id));
    var tab_item = $("<li/>").attr("id", "tabitem_" + id).append(link);
    $("#editor-tabs").append(tab_item);        
    
    // Create content
    // <div class="tab-pane" id="untitled"><pre class="editor">Hello</pre></div>
    var pre = document.createElement('pre');
    pre.setAttribute("class", "editor");
    
    var content = $("<div/>").addClass("tab-pane").attr("id", id).append($(pre));
    $("#editors").append(content);          
    
    // Create and register editor
    var editor = createCodeEditor(pre);
    var tab = {
        id: id,
        editor: editor,
        title: title
    };
    cp.tabs[id] = tab;
    editor.tab = tab;
    
    // Activate new tab          
    $("#tab_" + id).tab("show");
    editor.refresh();
    
    return cp.tabs[id];
};

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
}

cp.addLineToConsole = function (line, cssClass) {

    if (cp.currentConsoleLine) {
        cp.currentConsoleLine = undefined;
        $(cp.console).append("\n");
    }
    if (!cssClass) cssClass = "console-output";
    $(cp.console).append($("<span/>").addClass(cssClass).text(line), "\n");
};

//cp.runScript = function (s) {
//    var _eval = eval; // Use indirect eval to simulate top-level execution
//    return _eval("with (cp.builtins) {" + s + "}");  // FIXME: insecure!
//};

function position_to_line_ch(pos) {
    return { line: position_to_line(pos)-1,
             ch: position_to_column(pos)-1
           };
}

function code_highlight(loc, cssClass) {
    var start = position_to_line_ch(loc.start_pos);
    var end = position_to_line_ch(loc.end_pos);
    return cp.transcript.markText(start, end, cssClass);
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
    step_delay: 0
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
}

cp.play = function () {
    cp.play_or_step(false);
}

cp.step = function () {
    cp.play_or_step(true);
}

cp.cancel_animation = function () {
    if (program_state.timeout_id !== null) {
        clearTimeout(program_state.timeout_id);
        program_state.timeout_id = null;
    }
};

cp.cancel = function () {
    cp.cancel_animation();
    cp.show_step(false);
    cp.show_cancel(false);
    program_state.rte = null;
    cp.repl.busy = false;
    set_prompt(cp.repl);
    cp.repl.refresh();
    cp.repl.focus();
};

cp.show_error = function (show) {

    if (program_state.error_mark !== null) {
        program_state.error_mark.clear();
        program_state.error_mark = null;
    }

    if (show) {
        program_state.error_mark = code_highlight(program_state.rte.ast.loc, "error-code");
    }
};

cp.show_cancel = function (show) {

    var cancel = document.getElementById("cancel-button");

    if (show) {
        cancel.style.display = "block";
    } else {
        cancel.style.display = "none";
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

        if (!js_eval_finished(rte)) {
            cp.show_step(single_step);
            cp.show_cancel(true);
            if (single_step) {
                if (program_state.step_delay > 0) {
                    program_state.timeout_id = setTimeout(function ()
                                                          { cp.execute(true); },
                                                          program_state.step_delay);
                }
            } else {
                program_state.timeout_id = setTimeout(function ()
                                                      { cp.execute(false); },
                                                      1);
            }
        } else {

            if (rte.error !== null) {
                cp.show_error(true);
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
            return;
        }
    }

    cp.repl.cp.history.add(str);
    cp.addLineToTranscript(str, null);

    cp.show_error(false);

    var error = function (loc, kind, msg) {
        if (kind !== "warning") {
            code_highlight(loc, "error-code");
            cp.addLineToTranscript(kind + " -- " + msg, "error-message");
            throw false;
        }
    };

    cp.repl.busy = true;

    try {
        program_state.rte = js_eval_setup(source,
                                          {
                                              filename: "",
                                              error: error,
                                              line: line+1,
                                              column: ch+1
                                          });
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

cp.loadFile = function (cm, f) {
    if (!cm) return;
    
    cp_internal_readTextFile((function(theEditor) {
        return function(contents) {
            theEditor.setValue(contents);
       };
    })(cm));
};

cp.undo = function (cm) {
    cm.undo();
};

cp.redo = function (cm) {
    cm.redo();
};

function cp_internal_readTextFile(f, callback) {
    if (!Modernizr.filereader) {
        cp.reportError("File is reader not supported by the browser");
    } else {
        var reader = new FileReader();
        reader.onerror = function (e) {
            cp.reportError("File read failed");
        };
        reader.onload = function(e) {
            callback(e.target.result);
        };        
        reader.readAsText(f);
    }
}

function cp_internal_saveFile(contents, name) {
    if (name === undefined) name = "untitled";
    var bb = new BlobBuilder();    
    if (typeof contents !== "string") {
        contents = String(contents);
    }
    bb.append(contents);
    var blob = bb.getBlob("application/x-download;charset=" + document.characterSet);
    saveAs(blob, name);
}

function cp_internal_openFile(callback) {
    if (!Modernizr.filereader) {
        cp.reportError("File is reader not supported by the browser");
    } else {
        $("#btnOpenFile").click((function (cb) {
            return function (event) {
                 var fileInput = document.getElementById('fileInput');
                 var file = fileInput.files[0];
                 if (cb) {
                     cb(file);
                 }
                 $('#fileOpenDialog').modal('hide');
             };
        })(callback));
        
        // Display the dialog
        $("#fileOpenDialog").modal('show');
    }
}


cp.save = function (cm) {
    cp_internal_saveFile(cm.getValue(), cm.tab.title + ".js");
};

cp.load = function (cm) {
    cp_internal_openFile((function (editor) {
        return function (file) {
            cp.loadFile(editor, file);
        };
    })(cm));
};

cp.serializeState = function () {
    var state = {
        tabs: [],
        repl: {
            history: undefined
        },
        devMode: cp.devMode
    };
    /*
    var tabs = cp.tabs;
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab) {
            state.tabs.push({
                id: tab.id,
                title: tab.title,
                text: tab.editor.getValue()
            });
        }
    }
    */
    
    state.repl.history = cp.repl.cp.history.serializeState();
    
    return state;
};

cp.restoreState = function (state) {
    if (state === undefined) return;
    
    try {
        /*
        if (state.tabs) {
            var tabs = state.tabs;
            cp.closeAllTabs();
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                var newTab = cp.newTab(tab.title, tab.id);
                newTab.editor.setValue(tab.text);
            }
            if (cp.tabs.length === 0) {
                cp.newTab();
            }
        }
        */
        
        // Restore history
        cp.repl.cp.history.restoreState(state.repl.history);
        cp.setDevMode(!!state.devMode);
    } catch (e) {
        cp.reportError("Unable to restore state: " + e);
    }
};

cp.saveProject = function (cm) {
    var state = cp.serializeState();
    cp_internal_saveFile(JSON.stringify(state), "project.cp");
};

cp.loadProject = function (cm) {
    cp_internal_openFile(function (file) {
        cp_internal_readTextFile(file, function (contents) {
            cp.restoreState(JSON.parse(contents));
        });
    });
};
