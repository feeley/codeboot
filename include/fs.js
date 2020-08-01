/* ----- UI helpers ----- */

CodeBootVM.prototype.makeCloseButton = function () {
    var vm = this;
    return $('<button/>')
        .addClass('close')
        .append('<i class="fa fa-close"></i>');
}

CodeBootVM.prototype.makeDeleteButton = function () {
    var vm = this;
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Delete file"/>')
        .addClass('close')
        .append('<i class="fa fa-trash-o"></i>');
}

CodeBootVM.prototype.makeShareButton = function () {
    var vm = this;
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Share file"/>')
        .addClass('close')
        .append('<i class="fa fa-share"></i>');
}

CodeBootVM.prototype.makeDownloadButton = function () {
    var vm = this;
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Download file"/>')
        .addClass('close')
        .append('<i class="fa fa-download"></i>');
}

CodeBootVM.prototype.makeEmailButton = function () {
    var vm = this;
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Send codeBoot link by email"/>')
        .addClass('close')
        .append('<i class="fa fa-envelope"></i>');
}

CodeBootVM.prototype.makeCopyButton = function () {
    var vm = this;
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Copy codeBoot link to clipboard"/>')
        .addClass('close')
        .append('<svg width="14" height="16" version="1.1" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z"></path></svg>');
};

CodeBootVM.prototype.scrollTo = function (elementOrSelector) {
    var elementOffset = $(elementOrSelector).position().top;
    $('#cb-editors').animate({scrollTop: elementOffset}, 400);
};

/* ----- Internal file system ----- */

var BUILTIN_FILES = {

    'sample/hello.js' :
        '// This program prints a famous greeting\n' +
        '\n' +
        'print("Hello, world!");\n',

    'sample/hello.py' :
        '# This program prints a famous greeting\n' +
        '\n' +
        'print("Hello, world!")\n',

    'sample/sqrt2.js' :
        '// This program computes the square root of 2 without using Math.sqrt\n' +
        '\n' +
        'var n = 2;       // number whose square root is to be computed\n' +
        'var approx = n;  // first approximation of sqrt(n)\n' +
        '\n' +
        'for (;;) {\n' +
        '    next = (approx + n/approx) / 2;  // improve approximation\n' +
        '    if (next == approx)              // stop when no improvement\n' +
        '        break;\n' +
        '}\n' +
        '\n' +
        'print(approx);  // print square root of n\n',

    'sample/sqrt2.py' :
        '# This program computes the square root of 2 without using math.sqrt\n' +
        '\n' +
        'n = 2       # number whose square root is to be computed\n' +
        'approx = n  # first approximation of sqrt(n)\n' +
        '\n' +
        'while True:\n' +
        '    next = (approx + n/approx) / 2  # improve approximation\n' +
        '    if next == approx:              # stop when no improvement\n' +
        '        break\n' +
        '    approx = next\n' +
        '\n' +
        'print(approx)  # print square root of n\n'
};

BUILTIN_FILES = {};
NEW_FILE_DEFAULT_CONTENT = '';

function CodeBootFile(fs, filename, content, opts) {

    var file = this;

    file.fs = fs;
    file.filename = filename;
    file.content = (content !== undefined) ? content : NEW_FILE_DEFAULT_CONTENT;
    file.cursor = null;
    file.stamp = 0;
    file.editor = undefined;

    new CodeBootFileEditor(file); // initializes file.editor

    if (opts) {
        for (var prop in opts) {
            file[prop] = opts[prop];
        }
    }
}

CodeBootFile.prototype.getContent = function () {
    var file = this;
    if (file.editor.isEnabled()) {
        return file.editor.getValue();
    } else {
        return file.content;
    }
};

CodeBootFile.prototype.setContent = function (content) {
    var file = this;
    file.content = content;
    file.editor.setValue(content);
};

CodeBootFile.prototype.save = function () {
    var file = this;
    if (file.editor.isEnabled()) {
        var oldContent = file.content;
        var newContent = file.editor.getValue();
        if (newContent !== oldContent) {
            file.content = newContent;
            file.stamp += 1;
        }
    }
};

CodeBootFile.prototype.serialize = function () {
    var file = this;
    var json = {
        filename: file.filename,
        content: file.getContent(),
        cursor: file.cursor === null ?
                {line: 0, ch: 0} :
                {line: file.cursor.line, ch: file.cursor.ch},
        stamp: file.stamp
    };
    return json;
};

CodeBootFile.prototype.clone = function () {
    var file = this;
    var other = new CodeBootFile(file.fs, file.filename, file.content);
    for (var prop in file) {
        if (Object.prototype.hasOwnProperty.call(file, prop)) {
            other[prop] = file[prop];
        }
    }
    return other;
};

function CodeBootFileSystem(vm) {

    var fs = this;

    fs.vm = vm;
    fs.editorManager = undefined;
    new CodeBootFileEditorManager(fs);
    fs.init();
}

CodeBootFileSystem.prototype.init = function () {

    var fs = this;

    fs.removeAllEditors();
    fs.clear();
    fs.rebuildFileMenu();
};

CodeBootFileSystem.prototype.clear = function () {

    var fs = this;

    fs.builtins = {};
    fs.files = Object.create(fs.builtins);
    fs._loadBuiltins();
};

CodeBootFileSystem.prototype._loadBuiltins = function () {

    var fs = this;

    for (var filename in BUILTIN_FILES) {
        var f = new CodeBootFile(fs, filename, BUILTIN_FILES[filename]);
        fs.builtins[filename] = f;
    };
};

CodeBootFileSystem.prototype._asFilename = function (fileOrFilename) {

    var fs = this;

    if (typeof fileOrFilename === 'string') return fileOrFilename;
    return fileOrFilename.filename;
};

CodeBootFileSystem.prototype._asFile = function (fileOrFilename) {

    var fs = this;

    if (typeof fileOrFilename !== 'string') return fileOrFilename;
    return fs.getByName(fileOrFilename);
};

CodeBootFileSystem.prototype.isBuiltin = function (fileOrFilename) {

    var fs = this;
    var filename = fs._asFilename(fileOrFilename);

    return Object.prototype.hasOwnProperty.call(fs.builtins, filename);
};

CodeBootFileSystem.prototype.addFile = function (f) {

    var fs = this;

    fs.files[f.filename] = f;
};

CodeBootFileSystem.prototype.hasFile = function (fileOrFilename) {

    var fs = this;
    var filename = fs._asFilename(fileOrFilename);

    return Object.prototype.hasOwnProperty.call(fs.files, filename) ||
           Object.prototype.hasOwnProperty.call(fs.builtins, filename);
};

CodeBootFileSystem.prototype.generateUniqueFilename = function () {

    var fs = this;
    var prefix = 'untitled';

    for (var index = 1; ; index++) {
        var candidateName = prefix + (index===1 ? '' : index) + '.js';
        if (!fs.hasFile(candidateName)) {
            return candidateName;
        }
    }
};

CodeBootFileSystem.prototype.getByName = function (filename) {

    var fs = this;

    if (!fs.hasFile(filename)) {
        throw 'File not found: "' + filename + '"';
    }

    var file = fs.files[filename];

    if (!Object.prototype.hasOwnProperty.call(fs.files, filename)) {
        // This is a builtin file, make an editable copy
        file = file.clone();
        fs.files[filename] = file;
    }

    return file;
};

CodeBootFileSystem.prototype.deleteFile = function (fileOrFilename) {

    var fs = this;
    var filename = fs._asFilename(fileOrFilename);

    if (fs.hasFile(filename)) {
        delete fs.files[filename];
        return true;
    }

    return false;
};

CodeBootFileSystem.prototype.renameFile = function (fileOrFilename, newFilename) {

    var fs = this;

    if (fs.hasFile(newFilename)) {
        throw 'File already exists: "' + newFilename + '"';
    }

    var file = fs._asFile(fileOrFilename);

    delete fs.files[file.filename];
    file.filename = newFilename;
    fs.addFile(file);
};

CodeBootFileSystem.prototype.getContent = function (fileOrFilename) {

    var fs = this;
    var file = fs._asFile(fileOrFilename);

    return file.getContent();
};

CodeBootFileSystem.prototype.getEditor = function (fileOrFilename) {

    var fs = this;

    return fs._asFile(fileOrFilename).editor.editor;
};

CodeBootFileSystem.prototype.setContent = function (fileOrFilename, content) {

    var fs = this;
    var file = fs._asFile(fileOrFilename);

    file.setContent(content);
};

CodeBootFileSystem.prototype.each = function (callback, selector) {

    var fs = this;

    if (!selector) selector = function (f) { return true; };

    for (var filename in fs.files) {

        if (!fs.hasFile(filename)) continue; // Prune Object method name

        var file = fs.getByName(filename);
        if (selector(file)) {
            callback(file);
        }
    }
};

CodeBootFileSystem.prototype.forEachEditor = function (callback) {

    var fs = this;

    fs.editorManager.editors.forEach(callback);
};

CodeBootFileSystem.prototype.serialize = function () {

    var fs = this;
    var json = [];
    var isUserFile = function (file) {
        return Object.prototype.hasOwnProperty.call(fs.files, file.filename);
    };

    fs.each(function (file) {
        json.push(file.serialize());
    },
    isUserFile);

    return json;
};

CodeBootFileSystem.prototype.restore = function (json) {

    var fs = this;

    fs.clear();

    for (var i = 0; i < json.length; i++) {
        var fileProps = json[i];
        var file = new CodeBootFile(fs, fileProps.filename, fileProps.content, fileProps);
        fs.addFile(file);
    }
};

CodeBootFileSystem.prototype.rebuildFileMenu = function () {

    var fs = this;

    $('#cb-file-selection').empty();

    var item = $('<a id="cb-file-new" class="dropdown-item" href="#"><strong>New</strong></a>');

    item.on('click', function (event) {
        fs.newFile();
    });

    $('#cb-file-selection').append(item);

    $('#cb-file-selection').append($('<div class="dropdown-divider"></div>'));

    fs.each(function (file) {
        fs.addFileToMenu(file);
    });
};

CodeBootFileSystem.prototype.addFileToMenu = function (file) {

    var fs = this;
    var filename = file.filename;

    var item = $('<a class="dropdown-item" href="#"/>');
    item.attr('data-cb-filename', filename);

    item.on('click', function (event) {
        file.editor.edit();
    });

    item.append($('<span/>').text(filename));

    var buttons =$('<span/>').addClass('cb-file-buttons');

    if (!fs.isBuiltin(file)) {

        var deleteButton = fs.vm.makeDeleteButton();

        deleteButton.on('click', function (event) {

            $(deleteButton).tooltip('hide');

            var reallyDelete = confirm('Delete file "' + file.filename + '"? This cannot be undone.');

            if (reallyDelete) {
                file.editor.disable();
                item.remove();
                fs.deleteFile(file);
            }

            return false;
        });

        buttons.append(deleteButton);
    }

    var downloadButton = fs.vm.makeDownloadButton();

    downloadButton.on('click', function (event) {
        $('#cb-file-selection').dropdown('toggle');
        $(downloadButton).tooltip('hide');
        file.download();
        return false;
    });

    buttons.append(downloadButton);

    var emailButton = fs.vm.makeEmailButton();

    emailButton.on('click', function (event) {
        $('#cb-file-selection').dropdown('toggle');
        $(emailButton).tooltip('hide');
        file.email();
        return false;
    });

    buttons.append(emailButton);

    item.append(buttons);

    // Keep the menu sorted
    var children = $('#cb-file-selection').children();
    for (var i=2; i<children.length; i++) {
        var element = $(children.get(i));
        if (filename < element.attr('data-cb-filename')) {
            item.insertBefore(element);
            return;
        }
    }

    $('#cb-file-selection').append(item);
};

CodeBootFile.prototype.download = function () {
    var file = this;
    var filename = file.filename;
    var content = file.content;
    $('#cb-form-download-content').val(content);
    $('#cb-form-download-filename').val(filename);
//    vm.saveInProgress = true;
    $('#cb-form-download').submit();
};

CodeBootFile.prototype.email = function () {
    var file = this;
    var filename = file.filename;
    var content = file.content;
    var url = editor_URL(content, filename);
    var subject = encodeURIComponent(filename);
    var body = encodeURIComponent(url+'\n\n\n'+content);
    var href = 'mailto:?subject=' + subject + '&body=' + body;
    var w = window.open(href, '_blank');
    if (w) w.close();
};

CodeBootFileSystem.prototype.openFile = function (fileOrFilename) {

    var fs = this;
    var file = fs._asFile(fileOrFilename);

    file.editor.edit();
};

CodeBootFileSystem.prototype.newFile = function (filename) {

    var fs = this;

    if (filename === void 0) {
        filename = fs.generateUniqueFilename();
    }

    var file = new CodeBootFile(fs, filename);

    fs.addFile(file);
    fs.addFileToMenu(file);

    file.editor.edit();

    return filename;
};

CodeBootFileSystem.prototype.openFileExistingOrNew = function (filename) {

    var fs = this;

    if (fs.hasFile(filename)) {
        fs.openFile(filename);
        return true;
    } else {
        fs.newFile(filename);
        return false;
    }
};

CodeBootFileSystem.prototype.removeAllEditors = function () {
    var fs = this;
    fs.editorManager.removeAllEditors();
};

//-----------------------------------------------------------------------------

function CodeBootFileEditorManager(fs) {

    var fem = this;

    fs.editorManager = fem;
    fem.fs = fs;
    fem.editors = [];
    fem.activated = -1;
}

CodeBootFileEditorManager.prototype.isActivated = function (editor) {

    var fem = this;

    return (fem.activated >= 0 && fem.editors[fem.activated] === editor);

};

CodeBootFileEditorManager.prototype.indexOf = function (editor) {

    var fem = this;

    for (var i=fem.editors.length-1; i>=0; i--) {
        if (fem.editors[i] === editor) {
            return i;
        }
    }
    return -1;
};

CodeBootFileEditorManager.prototype.activate = function (editor) {

    var fem = this;

    if (editor.isActivated()) return; // already activated

    var i = fem.indexOf(editor);

    if (i < 0) return; // not a valid editor

    if (fem.activated >= 0) {
        // deactivate currently activated editor
        fem.editors[fem.activated].deactivatePresentation();
    }

    editor.activatePresentation(); // activate editor

    fem.activated = i; // remember it is activated
};

CodeBootFileEditorManager.prototype.add = function (editor) {

    var fem = this;

    fem.editors.push(editor);

    if (fem.activated < 0) {
        fem.show(); // show editors
        editor.activate(); // activate editor
    } else {
        editor.deactivatePresentation(); // deactivate editor
    }
};

CodeBootFileEditorManager.prototype.setReadOnlyAllEditors = function (readOnly) {

    var fem = this;

    for (var i=0; i<fem.editors.length; i++) {
        fem.editors[i].setReadOnly(readOnly);
    }
};

CodeBootFileEditorManager.prototype.removeAllEditors = function () {

    var fem = this;

    while (fem.editors.length > 0) {
        fem.remove(fem.editors[fem.editors.length-1]);
    }
};

CodeBootFileEditorManager.prototype.remove = function (editor) {

    var fem = this;
    var i = fem.indexOf(editor);

    if (i < 0) return; // not a valid editor

    editor.file.save();

    editor.removePresentation();

    editor.fileTab = null;
    editor.fileTabLabel = null;
    editor.fileTabCloseButton = null;
    editor.fileContainer = null;
    editor.editor = null;

    fem.editors.splice(i, 1); // remove from editors

    if (i === fem.activated) {
        fem.activated = -1;
        // need to activate some other editor
        if (i < fem.editors.length) {
            fem.editors[i].activate();
        } else if (i > 0) {
            fem.editors[i-1].activate();
        } else {
            // no other editor to activate
            fem.hide();
            vm.focusREPL();
        }
    } else if (i < fem.activated) {
        fem.activated--;
    }
};

CodeBootFileEditorManager.prototype.show = function () {
    var fem = this;
    $('#cb-editors').css('display', 'flex');
};

CodeBootFileEditorManager.prototype.hide = function () {
    var fem = this;
    $('#cb-editors').css('display', 'none');
};

//-----------------------------------------------------------------------------

function CodeBootFileEditor(file) {

    var fe = this;

    fe.file = file;
    fe.fileTab = null;
    fe.fileTabLabel = null;
    fe.fileTabCloseButton = null;
    fe.fileContainer = null;
    fe.editor = null;
    file.editor = fe;
}

CodeBootFileEditor.prototype.isActivated = function () {

    var fe = this;
    var fs = fe.file.fs;

    return fs.editorManager.isActivated(fe);
};

CodeBootFileEditor.prototype.activate = function () {

    var fe = this;
    var fs = fe.file.fs;

    fs.editorManager.activate(fe);
};

CodeBootFileEditor.prototype.activatePresentation = function () {

    var fe = this;

    fe.fileTab.addClass('active');
    fe.fileContainer.css('display', 'inline');
    fe.editor.refresh();
};

CodeBootFileEditor.prototype.deactivatePresentation = function () {

    var fe = this;

    fe.fileTab.removeClass('active');
    fe.fileContainer.css('display', 'none');
};

CodeBootFileEditor.prototype.removePresentation = function () {

    var fe = this;

    fe.fileTab.remove();
    fe.fileContainer.remove();
};

CodeBootFileEditor.prototype.isEnabled = function () {

    var fe = this;

    return fe.editor !== null;
};

CodeBootFileEditor.prototype.getValue = function () {

    var fe = this;

    if (fe.isEnabled()) {
        return fe.editor.getValue();
    } else {
        return '';
    }
};

CodeBootFileEditor.prototype.setValue = function (val) {

    var fe = this;

    if (fe.isEnabled()) {
        fe.editor.setValue(val);
    }
};

CodeBootFileEditor.prototype.edit = function () {

    var fe = this;

    fe.enable();
    fe.activate();
    fe.editor.focus();
};

CodeBootFileEditor.prototype.enable = function () {

    var fe = this;

    if (fe.isEnabled()) return; // noop if currently enabled

    var file = fe.file;
    var filename = file.filename;

    // create file tab

    var fileTab = $('<li class="nav-link cb-file-tab"/>');

    //fileTab.attr('data-cb-filename', filename);

    var fileTabCloseButton = fe.file.fs.vm.makeCloseButton();
    var fileTabLabel = $('<span class="tab-label"/>').text(filename);

    fileTab.append(fileTabCloseButton).append(fileTabLabel);

    // create file container

    var fileContainer = $('<div class="cb-file-container"/>');

    //fileContainer.attr('data-cb-filename', filename);

    var textarea = $('<textarea class="cb-file-editor"/>');

    fileContainer.append(textarea);

    // add file tab and file container to page

    $('#cb-file-tabs').append(fileTab);
    $('#cb-editors').append(fileContainer);

    // create code editor

    var editor = fe.file.fs.vm.createCodeEditor(textarea.get(0), file);

    editor.setValue(file.content);

    if (file.cursor) {
        editor.setCursor(file.cursor);
    }

    var saveHandler = function () {
        file.save();
        editor.currentSaveTimeout = (void 0);
    };

    editor.on('change', function (cm, change) {
        if (editor.currentSaveTimeout !== (void 0)) {
            // extend the window
            clearTimeout(editor.currentSaveTimeout);
        }
        editor.currentSaveTimeout = setTimeout(saveHandler, SAVE_DELAY);
    });

    editor.on('cursorActivity', function () {
        file.cursor = editor.getCursor();
    });

    fileContainer.on('click', function (event) {
        editor.focus();
    });

    // remember each element for quick access

    fe.fileTab = fileTab;
    fe.fileTabLabel = fileTabLabel;
    fe.fileTabCloseButton = fileTabCloseButton;
    fe.fileContainer = fileContainer;
    fe.editor = editor;

    fe.normalTabEvents();

    file.fs.editorManager.add(fe);
};

// length of window (in ms) during which changes will be buffered
var SAVE_DELAY = 300;

CodeBootFileEditor.prototype.normalTabEvents = function () {

    var fe = this;

    fe.fileTab.on('click', function (event) {
        fe.edit();
    });

    fe.fileTab.on('dblclick', function (event) {
        fe.rename();
    });

    fe.fileTabCloseButton.on('click', function (event) {
        fe.disable();
    });

    fe.fileTabCloseButton.css('display', 'inline');
};

CodeBootFileEditor.prototype.renameTabEvents = function () {
    var fe = this;
    fe.fileTab.off('click');
    fe.fileTab.off('dblclick');
    fe.fileTabCloseButton.css('display', 'none');
};

CodeBootFileEditor.prototype.disable = function () {

    var fe = this;

    if (!fe.isEnabled()) return; // noop if currently not enabled

    var file = fe.file;

    file.fs.editorManager.remove(fe);
};

CodeBootFileEditor.prototype.rename = function () {

    var fe = this;

    if (!fe.isEnabled()) return; // noop if currently not enabled

    var lastFocusedEditor = fe.file.fs.vm.lastFocusedEditor;
    fe.file.fs.vm.lastFocusedEditor = null; // allow focus to leave editor

    var oldFilename = fe.file.filename;
    var inputBox = $('<input type="text" class="cb-rename-box"/>');

    inputBox.val(oldFilename);
    fe.fileTabLabel.empty();
    fe.fileTabLabel.append(inputBox);

    var resetTabTo = function (filename) {
        inputBox.remove();
        fe.fileTabLabel.text(filename);
        fe.normalTabEvents();
        fe.file.fs.vm.lastFocusedEditor = lastFocusedEditor;
        fe.file.fs.vm.focusLastFocusedEditor();
    };

    var resetTabToOldFilename = function () {
        resetTabTo(oldFilename);
    };

    fe.renameTabEvents();

    inputBox.focusout(function (event) {
        resetTabToOldFilename();
    });

    inputBox.keypress(function (event) {
        if (event.keyCode == 13) {
            // Enter pressed, perform renaming
            var newFilename = inputBox.val();
            if (newFilename !== oldFilename) {

                if (fe.file.fs.hasFile(newFilename)) {
                    alert('Filename already in use');
                    resetTabToOldFilename();
                    return;
                }

                fe.file.fs.renameFile(oldFilename, newFilename);
            }
            resetTabTo(newFilename);
            fe.file.fs.rebuildFileMenu(); // TODO: inefficient
        } else if (event.keyCode == 27) {
            // Escape pressed, reset
            resetTabToOldFilename();
        }
    });

    inputBox.focus();
};

CodeBootFileEditor.prototype.setReadOnly = function (readOnly) {
    var fe = this;
    fe.editor.setOption('readOnly', readOnly);
};

//-----------------------------------------------------------------------------

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
