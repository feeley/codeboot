/* ----- UI helpers ----- */

var NAVBAR_HEIGHT = 40;
var EDITOR_SPACING = 20;

function makeCloseButton() {
    return $("<button/>").addClass("close").append("&times;");
}

function makeMenuSeparator() {
    return $('<li class="divider"></li>');
}

cp.scrollTo = function (elementOrSelector) {
    var elementOffset = $(elementOrSelector).offset().top - NAVBAR_HEIGHT - EDITOR_SPACING;
    $("body").animate({scrollTop: elementOffset}, 400);
}

function makeToolbar() {
    var $toolbar = $('<div class="btn-toolbar pull-right"/>');

    return $toolbar;
}

function makeTBGroup() {
    return $('<div class="btn-group"/>');
}

function makeTBButton($contents, props) {
    var $btn = $('<button class="btn"/>');

    for (var key in props) {
        $btn.attr(key, props[key]);
    }

    if ($contents) {
        $btn.append($contents);
    }

    return $btn;
}

/* ----- Internal file system ----- */

var BUILTIN_FILES = {
        'sample/hello.js' : '// This program prints a famous greeting\n' +
                            '\n' +
                            'print("Hello, world!\\n");\n',
        'sample/fact.js'  : '// This program prints the factorial of 5\n' +
                            '\n' +
                            'var fact = function (n) {\n' +
                            '    if (n <= 1) {\n' +
                            '        return 1;\n' +
                            '    } else {\n' +
                            '        return n * fact(n-1);\n' +
                            '    }\n' +
                            '};\n' +
                            '\n' +
                            'print(fact(5));\n',
        'sample/sqrt2.js' : '// This program computes the square root of 2 without using Math.sqrt\n' +
                            '\n' +
                            'var n = 2;\n' +
                            'var a = n; // approximation of sqrt(n)\n' +
                            '\n' +
                            'do {\n' +
                            '    a = (a + n/a) / 2;\n' +
                            '} while (a != (a + n/a) / 2);\n' +
                            '\n' +
                            'print(a);\n',
};

var NEW_FILE_DEFAULT_CONTENT = "// Enter JavaScript code here";

function CPFile(filename, content, opts) {
    this.filename = filename;
    this.content = (content !== (void 0)) ? content : NEW_FILE_DEFAULT_CONTENT;
    this.stamp = 0;
    this.editor = undefined;

    if (opts) {
        for (var prop in opts) {
            this[prop] = opts[prop];
        }
    }
}

CPFile.prototype.getContent = function () {
    if (this.editor) {
        return this.editor.getValue();
    }

    return this.content;
};

CPFile.prototype.save = function () {
    if (this.editor) {
        var old_content = this.content;
        var new_content = this.editor.getValue();
        if (new_content !== old_content) {
            this.content = new_content;
            this.stamp += 1;
        }
    }
};

CPFile.prototype.serialize = function () {
    var json = {
        filename: this.filename,
        content: this.getContent(),
        stamp: this.stamp
    };
    return json;
};

CPFile.prototype.clone = function () {
    var other = new CPFile(this.filename, this.content);
    for (var prop in this) {
        if (this.hasOwnProperty(prop)) {
            other[prop] = this[prop];
        }
    }
    return other;
};

function CPFileManager() {
    this.clear();
}

CPFileManager.prototype.clear = function () {
    this.builtins = {};
    this.files = Object.create(this.builtins);
    this._loadBuiltins();
};

CPFileManager.prototype._loadBuiltins = function () {
    for (var filename in BUILTIN_FILES) {
        var f = new CPFile(filename, BUILTIN_FILES[filename]);
        this.builtins[filename] = f;
    };
};

CPFileManager.prototype._asFilename = function (fileOrFilename) {
    if (typeof fileOrFilename === "string") return fileOrFilename;
    return fileOrFilename.filename;
};

CPFileManager.prototype._asFile = function (fileOrFilename) {
    if (typeof fileOrFilename !== "string") return fileOrFilename;
    return this.getByName(fileOrFilename);
};

CPFileManager.prototype.isBuiltin = function (fileOrFilename) {
    var filename = this._asFilename(fileOrFilename);
    return this.builtins.hasOwnProperty(filename);
};

CPFileManager.prototype.addFile = function (f) {
    this.files[f.filename] = f;
};

CPFileManager.prototype.hasFile = function (fileOrFilename) {
    var filename = this._asFilename(fileOrFilename);
    return this.files.hasOwnProperty(filename) || this.builtins.hasOwnProperty(filename);
};

CPFileManager.prototype.getByName = function (filename) {
    if (!this.hasFile(filename)) {
        throw "File not found: '" + filename + "'";
    }
    var file = this.files[filename];
    if (!this.files.hasOwnProperty(filename)) {
        // This is a builtin file, make an editable copy
        file = file.clone();
        this.files[filename] = file;
    }
    return file;
};

CPFileManager.prototype.deleteFile = function (fileOrFilename) {
    var filename = this._asFilename(fileOrFilename);
    if (this.hasFile(filename)) {
        delete this.files[filename];
        return true;
    }

    return false;
};

CPFileManager.prototype.renameFile = function (fileOrFilename, newFilename) {
    if (this.hasFile(newFilename)) {
        throw "File already exists: " + newFilename;
    }
    var file = this._asFile(fileOrFilename);
    delete this.files[file.filename];
    file.filename = newFilename;
    this.addFile(file);
};

CPFileManager.prototype.getContent = function (fileOrFilename) {
    var file = this._asFile(fileOrFilename);
    return file.getContent();
};

CPFileManager.prototype.getEditor = function (fileOrFilename) {
    return this._asFile(fileOrFilename).editor;
};

CPFileManager.prototype.each = function (callback, selector) {
    if (!selector) selector = function (f) { return true; };
    for (var filename in this.files) {
        if (!this.hasFile(filename)) continue; // Prune Object method name

        var file = this.getByName(filename);
        if (selector(file)) {
            callback(file);
        }
    }
};

CPFileManager.prototype.serialize = function () {
    var json = [];
    var self = this;
    var isUserFile = function (file) {
        return self.files.hasOwnProperty(file.filename);
    };

    this.each(function (file) {
        json.push(file.serialize());
    },
    isUserFile);

    return json;
};

CPFileManager.prototype.restore = function (json) {
    this.clear();
    for (var i = 0; i < json.length; i++) {
        var fileProps = json[i];
        var file = new CPFile(fileProps.filename, fileProps.content, fileProps);
        this.addFile(file);
    }
};

// ----------------------------------------------------------------------

cp.addFileToMenu = function (fileOrFilename) {
    var file = cp.fs._asFile(fileOrFilename);
    var filename = file.filename;

    var $file_item = $('<li/>');
    $file_item.attr("data-cp-filename", filename);
    var $file_link = $('<a href="#"/>');
    $file_link.click(function () {
        cp.openFile(filename);
    });

    if (!cp.fs.isBuiltin(file)) {
        var $deleteButton = $('<i class="icon-trash pull-right"/>');
        $file_link.append($deleteButton);
        $deleteButton.click(function (event) {
            var reallyDelete = confirm("Delete file '" + filename + "'? This cannot be undone.");
            if (reallyDelete) {
                cp.deleteFile(filename);
            } else {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }

    $file_link.append(filename);
    $file_item.append($file_link);

    // Keep the menu sorted
    var $children = $("#file-list").children();
    for (var i = 0; i < $children.size(); i++) {
        var $element = $($children.get(i));
        var element_filename = $element.attr('data-cp-filename');
        if (filename < element_filename) {
            $file_item.insertBefore($element);
            return;
        }
    }

    $("#file-list").append($file_item);
};

cp.rebuildFileMenu = function () {
    $("#file-list").empty();
    cp.fs.each(function (file) {
        cp.addFileToMenu(file);
    });
};

cp.initFS = function () {
    cp.fs = new CPFileManager();
    cp.rebuildFileMenu();
};

cp.generateUniqueFilename = function () {
    var prefix = "script";
    for (var index = 1; ; index++) {
        var candidateName = prefix + index;
        if (!cp.fs.hasFile(candidateName)) {
            return candidateName;
        }
    }
};

cp.getContainerFor = function (fileOrFilename) {
    var filename = cp.fs._asFilename(fileOrFilename);
    return $('.row[data-cp-filename="' + filename + '"]').get(0);
};

cp.openFile = function (filename) {
    var container = cp.getContainerFor(filename);
    if (container) {
        cp.scrollTo(container);
    } else {
        cp.newTab(filename);
    }
};

cp.closeFile = function (fileOrFilename) {
    var file = cp.fs._asFile(fileOrFilename);
    file.save();
    file.editor = null;

    $(cp.getContainerFor(file)).remove();
};

cp.closeAll = function () {
    $("[data-cp-filename]").each(function () {
        var filename = $(this).attr('data-cp-filename');
        cp.closeFile(filename);
    });
};

cp.deleteFile = function (filename) {
    $('[data-cp-filename="' + filename + '"]').remove();
    cp.fs.deleteFile(filename);
};

function basename(filename) {
    return filename.replace(/\\/g,'/').replace( /.*\//, '');
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

cp.makeEditorToolbar = function (file) {
    var $toolbar = makeToolbar();
    var controller = $toolbar.get(0);
    $toolbar.attr('data-cp-exec', 'controller');

    var $execControlsGroup = makeTBGroup();
    $execControlsGroup.appendTo($toolbar);

    var $stepButton = makeTBButton($('<i class="icon-play"/>'), {"title" : "Step"});
    $stepButton.addClass('exec-btn-step');
    $stepButton.append($('<img class="exec-icon-stepMode" src="icons/exp_pause.png"/>'));
    $stepButton.append($('<img class="exec-icon-singleStep hide" src="icons/exp_1.png"/>'));
    $stepButton.click(function () {
        if (!cp.setController(controller)) return false;
        if (program_state.mode === 'stopped') {
            program_state.step_delay = 0;
            cp.load(file.filename, true);
        } else {
            cp.animate(0);
        }
    });
    $stepButton.appendTo($execControlsGroup);

    var $loadButton = makeTBButton($('<i class="icon-play"/>'), {"title" : "Load"});
    $loadButton.addClass('exec-btn-play');
    $loadButton.append($('<img src="icons/exp_inf.png"/>'));
    $loadButton.click(function () {
        if (!cp.setController(controller)) return false;
        if (program_state.mode === 'stopped') {
            cp.load(file.filename, false);
        } else {
            cp.play();
        }
    });
    $loadButton.appendTo($execControlsGroup);

    var $animateButton = makeTBButton($('<i class="icon-play"/>'), {"title" : "Load"});
    $animateButton.addClass('exec-btn-anim');
    $animateButton.click(function () {
        if (!cp.setController(controller)) return false;

        if (program_state.mode === 'stopped') {
            program_state.step_delay = cp.stepDelay;
            cp.load(file.filename, true);
        } else {
            cp.animate(cp.stepDelay);
        }
    });
    $animateButton.appendTo($execControlsGroup);

    var $pauseButton = makeTBButton($('<i class="icon-pause"/>'), {"title" : "Pause"});
    $pauseButton.addClass('exec-btn-pause disabled');
    $pauseButton.click(function () {
        if (!cp.setController(controller)) return false;
        cp.animate(0);
    });
    $pauseButton.appendTo($execControlsGroup);

    var $stopButton = makeTBButton($('<i class="icon-stop"/>'), {"title" : "Stop"});
    $stopButton.addClass('exec-btn-cancel disabled');
    $stopButton.click(function () {
        if (!cp.setController(controller)) return false;
        cp.cancel();
    });
    $stopButton.appendTo($execControlsGroup);

    return $toolbar;
};

cp.makeLHSEditorToolbar = function (file) {
    var $toolbar = makeToolbar();
    var $group = makeTBGroup();
    $group.appendTo($toolbar);

    var $saveButton = makeTBButton($('<i class="icon-download-alt"/>'), {"title" : "Download"});
    $saveButton.click(function () {
        var name = basename(file.filename);
        if (!endsWith(name, ".js")) {
            name = name + ".js";
        }
        saveAs(cp.fs.getContent(file), name);
    });
    $saveButton.appendTo($group);

    var $btnContents = $('<span class="cp-zclip-target" data-zclip-role="copy-url"><i class="icon-link"/></span>');
    var $copyURLButton = makeTBButton($btnContents, {"title" : "Copy URL"});
    $copyURLButton.appendTo($group);

    return $toolbar;
};

var SAVE_DELAY = 300; // length of window (in ms) during which changes will be buffered

function createFileEditor(node, file) {
    var editor = createCodeEditor(node);

    file.editor = editor;
    editor.setValue(file.content);
    var saveHandler = function () {
        file.save();
        editor.currentSaveTimeout = (void 0);
    };
    editor.on("change", function (cm, change) {
        if (editor.currentSaveTimeout !== (void 0)) {
            // extend the window
            clearTimeout(editor.currentSaveTimeout);
        }
        editor.currentSaveTimeout = setTimeout(saveHandler, SAVE_DELAY);
    });
    return editor;
}

function cp_internal_onTabDblClick(event) {
    var $element = $(event.target);

    var oldFilename = $element.text();
    var $inputBox = $('<input type="text" class="rename-box span2"/>');
    $inputBox.val(oldFilename);
    $element.empty();
    $element.append($inputBox);

    var resetTab = function () {
        $inputBox.remove();
        $element.text(oldFilename);
    };

    $inputBox.focusout(resetTab);

    $inputBox.keydown(function (event) {
        if (event.keyCode == 13) {
            // Enter pressed, perform renaming
            var newFilename = $inputBox.val();
            if (cp.fs.hasFile(newFilename)) {
                alert("Filename already in use");
                resetTab();
                return;
            }

            cp.fs.renameFile(oldFilename, newFilename);
            $inputBox.remove();
            $element.text(newFilename);
            $('[data-cp-filename="' + oldFilename + '"]').attr("data-cp-filename", newFilename);

            cp.rebuildFileMenu(); // TODO: inefficient
        } else if (event.keyCode == 27) {
            // Escape pressed, reset
            resetTab();
        }
    });

    $inputBox.focus();
}

cp.newTab = function (fileOrFilename) {
	/*
     * <div class="row">
     *   <ul class="nav nav-tabs">
     *     <li class="active"><a href="#">Untitled.js<button class="close">&times;</button></a></li>
     *   </ul>
     *   <pre class="tab-content"></pre>
     * </div>
    */

    var file = cp.fs._asFile(fileOrFilename);
    var filename = file.filename;

	var $row = $('<div class="row"/>');
	$row.attr("data-cp-filename", filename);

	var $toolbar = cp.makeEditorToolbar(file);
	$row.append($toolbar);

	if (program_state.mode !== "stopped") {
	    setControllerState($toolbar, false);
	}

	var $nav = $('<ul class="nav nav-tabs"/>');

	var $closeButton = makeCloseButton();
	$closeButton.click(function () {
	    cp.closeFile(file);
	});
	$tab_text_container = $('<span class="tab-label"/>').text(filename);
	$tab_label = $('<a href="#"/>').append($tab_text_container).append($closeButton);
	$nav.append($('<li class="active"/>').append($tab_label));
    $nav.append($('<li/>').append(cp.makeLHSEditorToolbar(file)));
	$row.append($nav);

	// Support renaming
	$tab_text_container.dblclick(cp_internal_onTabDblClick);

	var $pre = $('<pre class="tab-content file-editor"/>');
	$row.append($pre);

    $row.insertAfter($("#step-value-row"));

	var editor = createFileEditor($pre.get(0), file);

	cp.scrollTo($row);

    // Make editor resizable
    $(".CodeMirror", $row).resizable({
          handles: "s",
          minHeight: 100,
          stop: function() { editor.refresh(); },
          resize: function() {
            $(".CodeMirror-scroll", $row).height($(this).height());
            $(".CodeMirror-scroll", $row).width($(this).width());
            editor.refresh();
          }
    });

    var $btnCopyURL = $('[data-zclip-role="copy-url"]', $row);
    $btnCopyURL.zclip({
        path:'include/ZeroClipboard.swf',
        copy: function() {
            var content = cp.fs.getContent(file);
            return editor_URL(content, file.filename);
        }
    });
};

cp.newFile = function () {
    var filename = cp.generateUniqueFilename();
    var file = new CPFile(filename);
    cp.fs.addFile(file);

    cp.addFileToMenu(file);
    cp.newTab(file);
    return filename;
};

cp.openFileExistingOrNew = function (filename) {

    if (cp.fs.hasFile(filename)) {
        cp.openFile(filename);
        return true;
    } else {
        var file = new CPFile(filename);
        cp.fs.addFile(file);

        cp.addFileToMenu(file);
        cp.newTab(file);
        return false;
    }
};
