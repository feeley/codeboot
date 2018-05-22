/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot File system --
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER INxk
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Authors:
 * - Marc Feeley
 */

/* ----- UI helpers ----- */

CodeBoot.prototype.makeCloseButton = function () {
    return $('<button/>')
        .addClass('close')
        .append('<i class="fa fa-close"></i>');
}

CodeBoot.prototype.makeDeleteButton = function () {
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Delete file"/>')
        .addClass('close')
        .append('<i class="fa fa-trash-o"></i>');
}

CodeBoot.prototype.makeShareButton = function () {
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Share file"/>')
        .addClass('close')
        .append('<i class="fa fa-share"></i>');
}

CodeBoot.prototype.makeDownloadButton = function () {
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Download file"/>')
        .addClass('close')
        .append('<i class="fa fa-download"></i>');
}

CodeBoot.prototype.makeEmailButton = function () {
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Send codeBoot link by email"/>')
        .addClass('close')
        .append('<i class="fa fa-envelope"></i>');
}

CodeBoot.prototype.makeCopyButton = function () {
    return $('<button data-toggle="tooltip" data-delay="750" data-animation="false" data-placement="bottom" title="Copy codeBoot link to clipboard"/>')
        .addClass('close')
        .append('<svg width="14" height="16" version="1.1" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z"></path></svg>');
};

CodeBoot.prototype.scrollTo = function (elementOrSelector) {
    var elementOffset = $(elementOrSelector).position().top;
    $('#cb-editors').animate({scrollTop: elementOffset}, 400);
};

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

var NEW_FILE_DEFAULT_CONTENT = '// Enter JavaScript code here';

BUILTIN_FILES = {};
NEW_FILE_DEFAULT_CONTENT = '';

function CBFile(fileManager, filename, content, opts) {

    this.fileManager = fileManager;
    this.filename = filename;
    this.content = (content !== (void 0)) ? content : NEW_FILE_DEFAULT_CONTENT;
    this.cursor = null;
    this.stamp = 0;
    this.editor = undefined;

    new CBFileEditor(this); // initializes this.editor

    if (opts) {
        for (var prop in opts) {
            this[prop] = opts[prop];
        }
    }
}

CBFile.prototype.getContent = function () {
    if (this.editor.isEnabled()) {
        return this.editor.getValue();
    } else {
        return this.content;
    }
};

CBFile.prototype.setContent = function (content) {
    this.content = content;
    this.editor.setValue(content);
};

CBFile.prototype.save = function () {
    if (this.editor.isEnabled()) {
        var oldContent = this.content;
        var newContent = this.editor.getValue();
        if (newContent !== oldContent) {
            this.content = newContent;
            this.feedbacks = cb.fm.serializeMarks(this.editor);
            this.stamp += 1;
        }
    }
};

CBFile.prototype.serialize = function () {

    this.editor.enable(); // Need to enable the editor to fetch feedbacks
    var json = {
        filename: this.filename,
        content: this.getContent(),
        cursor: this.cursor === null ?
                {line: 0, ch: 0} :
                {line: this.cursor.line, ch: this.cursor.ch},
        stamp: this.stamp,

        // Feedback manager serializer
        feedbacks:cb.fm.serializeMarks(this.editor)
    };

    return json;
};

CBFile.prototype.clone = function () {
    var other = new CBFile(this.fileManager, this.filename, this.content);
    for (var prop in this) {
        if (Object.prototype.hasOwnProperty.call(this, prop)) {
            other[prop] = this[prop];
        }
    }
    return other;
};

function CBFileManager() {
    this.editorManager = undefined;
    new CBFileEditorManager(this);
    //new CBFeedbackManager(this);
    this.init(rebuild);
}

CBFileManager.prototype.init = function () {
    this.removeAllEditors();
    this.clear();
    this.rebuildFileMenu();
};

CBFileManager.prototype.clear = function () {
    this.builtins = {};
    this.files = Object.create(this.builtins);
    this._loadBuiltins();
};

CBFileManager.prototype._loadBuiltins = function () {
    for (var filename in BUILTIN_FILES) {
        var f = new CBFile(this, filename, BUILTIN_FILES[filename]);
        this.builtins[filename] = f;
    };
};

CBFileManager.prototype._asFilename = function (fileOrFilename) {
    if (typeof fileOrFilename === 'string') return fileOrFilename;
    return fileOrFilename.filename;
};

CBFileManager.prototype._asFile = function (fileOrFilename) {
    if (typeof fileOrFilename !== 'string') return fileOrFilename;
    return this.getByName(fileOrFilename);
};

CBFileManager.prototype.isBuiltin = function (fileOrFilename) {
    var filename = this._asFilename(fileOrFilename);
    return Object.prototype.hasOwnProperty.call(this.builtins, filename);
};

CBFileManager.prototype.addFile = function (f) {
    this.files[f.filename] = f;
};

CBFileManager.prototype.hasFile = function (fileOrFilename) {
    var filename = this._asFilename(fileOrFilename);
    return Object.prototype.hasOwnProperty.call(this.files, filename) ||
           Object.prototype.hasOwnProperty.call(this.builtins, filename);
};

CBFileManager.prototype.generateUniqueFilename = function () {
    var prefix = 'untitled';
    for (var index = 1; ; index++) {
        var candidateName = prefix + (index===1 ? '' : index) + '.js';
        if (!this.hasFile(candidateName)) {
            return candidateName;
        }
    }
};

CBFileManager.prototype.getByName = function (filename) {
    if (!this.hasFile(filename)) {
        throw 'File not found: "' + filename + '"';
    }
    var file = this.files[filename];
    if (!Object.prototype.hasOwnProperty.call(this.files, filename)) {
        // This is a builtin file, make an editable copy
        file = file.clone();
        this.files[filename] = file;
    }
    return file;
};

CBFileManager.prototype.deleteFile = function (fileOrFilename) {
    var filename = this._asFilename(fileOrFilename);
    if (this.hasFile(filename)) {
        delete this.files[filename];
        return true;
    }

    return false;
};

CBFileManager.prototype.renameFile = function (fileOrFilename, newFilename) {
    if (this.hasFile(newFilename)) {
        throw 'File already exists: "' + newFilename + '"';
    }
    var file = this._asFile(fileOrFilename);
    delete this.files[file.filename];
    file.filename = newFilename;
    this.addFile(file);
};

CBFileManager.prototype.getContent = function (fileOrFilename) {
    var file = this._asFile(fileOrFilename);
    return file.getContent();
};

CBFileManager.prototype.getEditor = function (fileOrFilename) {
    return this._asFile(fileOrFilename).editor.editor;
};

CBFileManager.prototype.setContent = function (fileOrFilename, content) {
    var file = this._asFile(fileOrFilename);
    file.setContent(content);
};

CBFileManager.prototype.each = function (callback, selector) {
    if (!selector) selector = function (f) { return true; };
    for (var filename in this.files) {

        if (!this.hasFile(filename)) continue; // Prune Object method name

        var file = this.getByName(filename);
        if (selector(file)) {
            callback(file);
        }
    }
};

CBFileManager.prototype.forEachEditor = function (callback) {
    this.editorManager.editors.forEach(callback);
};

CBFileManager.prototype.serialize = function () {
    var json = [];
    var self = this;
    var isUserFile = function (file) {
        return Object.prototype.hasOwnProperty.call(self.files, file.filename);
    };


    this.each(function (file) {
        json.push(file.serialize());
    },
    isUserFile);
    return json;
};

CBFileManager.prototype.restore = function (json) {
    this.clear();
    for (var i = 0; i < json.length; i++) {
        var fileProps = json[i];
        var file = new CBFile(this, fileProps.filename, fileProps.content, fileProps);
        file.feedbacks = fileProps.feedbacks;
        this.addFile(file);
    }
};

CBFileManager.prototype.rebuildFileMenu = function () {

    var self = this;

    $('#cb-file-selection').empty();

    var item = $('<a id="cb-file-new" class="dropdown-item" href="#"><strong>New</strong></a>');

    item.on('click', $.proxy(this.newFile, this, void 0));

    $('#cb-file-selection').append(item);

    $('#cb-file-selection').append($('<div class="dropdown-divider"></div>'));

    this.each(function (file) {
        self.addFileToMenu(file);
    });
};

CBFileManager.prototype.addFileToMenu = function (file) {

    var self = this;
    var filename = file.filename;

    var item = $('<a class="dropdown-item" href="#"/>');
    item.attr('data-cb-filename', filename);

    item.on('click', function (event) {
        file.editor.edit();
    });

    item.append($('<span/>').text(filename));

    var buttons =$('<span/>').addClass('cb-file-buttons');

    if (!this.isBuiltin(file)) {

        var deleteButton = cb.makeDeleteButton();

        deleteButton.on('click', function (event) {

            $(deleteButton).tooltip('hide');

            var reallyDelete = confirm('Delete file "' + file.filename + '"? This cannot be undone.');

            if (reallyDelete) {
                file.editor.disable();
                item.remove();
                self.deleteFile(file);
            }

            return false;
        });

        buttons.append(deleteButton);
    }

    var downloadButton = cb.makeDownloadButton();

    downloadButton.on('click', function (event) {
        $('#cb-file-selection').dropdown('toggle');
        $(downloadButton).tooltip('hide');
        file.download();
        return false;
    });

    buttons.append(downloadButton);

    var emailButton = cb.makeEmailButton();

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
        if (filename < element.attr(' data-cb-filename')) {
            item.insertBefore(element);
            return;
        }
    }

    $('#cb-file-selection').append(item);
};

CBFile.prototype.download = function () {
    var file = this;
    var filename = file.filename;
    var content = file.content;
    $('#cb-form-download-content').val(content);
    $('#cb-form-download-filename').val(filename);
//    cb.saveInProgress = true;
    $('#cb-form-download').submit();
};

CBFile.prototype.email = function () {
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

CBFileManager.prototype.openFile = function (fileOrFilename) {

    var file = this._asFile(fileOrFilename);
    file.editor.edit();
};

CBFileManager.prototype.newFile = function (filename) {

    if (filename === void 0) {
        filename = this.generateUniqueFilename();
    }

    var file = new CBFile(this, filename);

    this.addFile(file);
    this.addFileToMenu(file);

    file.editor.edit();

    return filename;
};

CBFileManager.prototype.openFileExistingOrNew = function (filename) {

    if (this.hasFile(filename)) {
        this.openFile(filename);
        return true;
    } else {
        this.newFile(filename);
        return false;
    }
};

CBFileManager.prototype.removeAllEditors = function () {
    this.editorManager.removeAllEditors();
};

//-----------------------------------------------------------------------------

function CBFileEditorManager(fileManager) {
    fileManager.editorManager = this;
    this.fileManager = fileManager;
    this.editors = [];
    this.activated = -1;
}

CBFileEditorManager.prototype.isActivated = function (editor) {
    return (this.activated >= 0 && this.editors[this.activated] === editor);
};

CBFileEditorManager.prototype.indexOf = function (editor) {
    for (var i=this.editors.length-1; i>=0; i--) {
        if (this.editors[i] === editor) {
            return i;
        }
    }
    return -1;
};

CBFileEditorManager.prototype.activate = function (editor) {

    if (editor.isActivated()) return; // already activated

    var i = this.indexOf(editor);

    if (i < 0) return; // not a valid editor

    if (this.activated >= 0) {
        // deactivate currently activated editor
        this.editors[this.activated].deactivatePresentation();
    }

    editor.activatePresentation(); // activate editor

    this.activated = i; // remember it is activated
};

CBFileEditorManager.prototype.add = function (editor) {
    this.editors.push(editor);
    if (this.activated < 0) {
        this.show(); // show editors
        editor.activate(); // activate editor
    } else {
        editor.deactivatePresentation(); // deactivate editor
    }
};

CBFileEditorManager.prototype.setReadOnlyAllEditors = function (readOnly) {
    for (var i=0; i<this.editors.length; i++) {
        this.editors[i].setReadOnly(readOnly);
    }
};

CBFileEditorManager.prototype.removeAllEditors = function () {
    while (this.editors.length > 0) {
        this.remove(this.editors[this.editors.length-1]);
    }
};

CBFileEditorManager.prototype.remove = function (editor) {

    var i = this.indexOf(editor);

    if (i < 0) return; // not a valid editor

    editor.file.save();

    editor.removePresentation();

    editor.fileTab = null;
    editor.fileTabLabel = null;
    editor.fileTabCloseButton = null;
    editor.fileContainer = null;
    editor.editor = null;

    this.editors.splice(i, 1); // remove from editors

    if (i === this.activated) {
        this.activated = -1;
        // need to activate some other editor
        if (i < this.editors.length) {
            this.editors[i].activate();
        } else if (i > 0) {
            this.editors[i-1].activate();
        } else {
            // no other editor to activate
            this.hide();
            cb.focusREPL();
        }
    } else if (i < this.activated) {
        this.activated--;
    }
};

CBFileEditorManager.prototype.show = function () {
    $('#cb-editors').css('display', 'flex');
};

CBFileEditorManager.prototype.hide = function () {
    $('#cb-editors').css('display', 'none');
};

//-----------------------------------------------------------------------------

function CBFileEditor(file) {
    file.editor = this;
    this.file = file;
    this.fileTab = null;
    this.fileTabLabel = null;
    this.fileTabCloseButton = null;
    this.fileContainer = null;
    this.editor = null;
}

CBFileEditor.prototype.isActivated = function () {
    var fileManager = this.file.fileManager;
    return fileManager.editorManager.isActivated(this);
};

CBFileEditor.prototype.activate = function () {
    var fileManager = this.file.fileManager;
    fileManager.editorManager.activate(this);
};

CBFileEditor.prototype.activatePresentation = function () {
    this.fileTab.addClass('active');
    this.fileContainer.css('display', 'inline');
    this.editor.refresh();
};

CBFileEditor.prototype.deactivatePresentation = function () {
    this.fileTab.removeClass('active');
    this.fileContainer.css('display', 'none');
};

CBFileEditor.prototype.removePresentation = function () {
    this.fileTab.remove();
    this.fileContainer.remove();
};

CBFileEditor.prototype.isEnabled = function () {
    return this.editor !== null;
};

CBFileEditor.prototype.getValue = function () {
    if (this.isEnabled()) {
        return this.editor.getValue();
    } else {
        return '';
    }
};

CBFileEditor.prototype.setValue = function (val) {
    if (this.isEnabled()) {
        this.editor.setValue(val);
    }
};

CBFileEditor.prototype.edit = function () {
    this.enable();
    this.activate();
    this.editor.focus();
};

CBFileEditor.prototype.enable = function () {

    if (this.isEnabled()) return; // noop if currently enabled

    var self = this;

    var file = this.file;
    var filename = file.filename;

    // create file tab

    var fileTab = $('<li class="nav-link cb-file-tab"/>');

    //fileTab.attr('data-cb-filename', filename);

    var fileTabCloseButton = cb.makeCloseButton();
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

    var editor = cb.createCodeEditor(textarea.get(0), file);

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

    this.fileTab = fileTab;
    this.fileTabLabel = fileTabLabel;
    this.fileTabCloseButton = fileTabCloseButton;
    this.fileContainer = fileContainer;
    this.editor = editor;

    this.normalTabEvents();

    file.fileManager.editorManager.add(this);

    cb.fm.deserializeMarks(editor, file.feedbacks);
};

// length of window (in ms) during which changes will be buffered
var SAVE_DELAY = 300;

CBFileEditor.prototype.normalTabEvents = function () {

    var self = this;

    this.fileTab.on('click', function (event) {
        self.edit();
    });

    this.fileTab.on('dblclick', function (event) {
        self.rename();
    });

    this.fileTabCloseButton.on('click', function (event) {
        self.disable();
    });

    this.fileTabCloseButton.css('display', 'inline');
};

CBFileEditor.prototype.renameTabEvents = function () {
    this.fileTab.off('click');
    this.fileTab.off('dblclick');
    this.fileTabCloseButton.css('display', 'none');
};

CBFileEditor.prototype.disable = function () {

    if (!this.isEnabled()) return; // noop if currently not enabled

    var file = this.file;

    file.feedbacks = cb.fm.serializeMarks(this);

    file.fileManager.editorManager.remove(this);
};

CBFileEditor.prototype.rename = function () {

    if (!this.isEnabled()) return; // noop if currently not enabled

    var lastFocusedEditor = cb.lastFocusedEditor;
    cb.lastFocusedEditor = null; // allow focus to leave editor

    var editor = this;
    var oldFilename = editor.file.filename;
    var inputBox = $('<input type="text" class="cb-rename-box"/>');
    inputBox.val(oldFilename);
    editor.fileTabLabel.empty();
    editor.fileTabLabel.append(inputBox);

    var resetTabTo = function (filename) {
        inputBox.remove();
        editor.fileTabLabel.text(filename);
        editor.normalTabEvents();
        cb.lastFocusedEditor = lastFocusedEditor;
        cb.focusLastFocusedEditor();
    };

    var resetTabToOldFilename = function () {
        resetTabTo(oldFilename);
    };

    editor.renameTabEvents();

    inputBox.focusout(function (event) {
        resetTabToOldFilename();
    });

    inputBox.keypress(function (event) {
        if (event.keyCode == 13) {
            // Enter pressed, perform renaming
            var newFilename = inputBox.val();
            if (newFilename !== oldFilename) {

                if (editor.file.fileManager.hasFile(newFilename)) {
                    alert('Filename already in use');
                    resetTabToOldFilename();
                    return;
                }

                editor.file.fileManager.renameFile(oldFilename, newFilename);
            }
            resetTabTo(newFilename);
            editor.file.fileManager.rebuildFileMenu(); // TODO: inefficient
        } else if (event.keyCode == 27) {
            // Escape pressed, reset
            resetTabToOldFilename();
        }
    });

    inputBox.focus();
};

CBFileEditor.prototype.setReadOnly = function (readOnly) {
    this.editor.setOption('readOnly', readOnly);
};


//-----------------------------------------------------------------------------

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
