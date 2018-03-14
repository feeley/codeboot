CodeBoot.prototype.clearSession = function () {
    localStorage.removeItem('codeboot');
};

CodeBoot.prototype.saveSession = function () {
    var state = cb.serializeState();
    localStorage['codeboot'] = JSON.stringify(state);
};

CodeBoot.prototype.loadSession = function () {
    var state = localStorage['codeboot'];
    if (state) {
        cb.fs.init();
        cb.restoreState(JSON.parse(state));
    }
};

CodeBoot.prototype.serializeState = function () {
    var state = {
        tabs: [],
        repl: {
            history: undefined
        },
        languageLevel: cb.languageLevel,
        devMode: cb.devMode,
        animationSpeed: cb.animationSpeed,
        options: cb.options,
        macros: cb.macros // Save binded macros
    };

    state.repl.history = cb.repl.cb.history.serializeState();

    state.files = cb.fs.serialize();
    state.openEditors = [];
    cb.fs.forEachEditor(function (editor) {
        state.openEditors.push(editor.file.filename);
    });
    state.activeEditor = null;
    if (cb.fs.editorManager.activated >= 0) {
        state.activeEditor = cb.fs.editorManager.editors[cb.fs.editorManager.activated].file.filename;
    }

    return state;
};

function cb_internal_attempt(operation) {
    try {
        operation();
        return true;
    } catch (e) {
        return false;
    }
}

CodeBoot.prototype.restoreState = function (state) {

    if (state === undefined) return;

    var failed = false;

    if (state.options) {
        cb.options = state.options;
    }

    if (state.macros) {
        cb.macros = state.macros;
    }

    failed = cb_internal_attempt(function () {
        cb.repl.cb.history.restoreState(state.repl.history);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setLanguageLevel(state.languageLevel || 'novice');
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setDevMode(!!state.devMode);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setAnimationSpeed(state.animationSpeed);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setShowLineNumbers(!!state.options.showLineNumbers);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setLargeFont(!!state.options.largeFont);
    }) || failed;

    if (state.files) {
        failed = cb_internal_attempt(function () {
            cb.fs.restore(state.files);
            cb.fs.rebuildFileMenu();
        }) || failed;
    }

    if (state.openEditors) {
        failed = cb_internal_attempt(function () {
            state.openEditors.forEach(function (filename) {
                cb.fs.openFile(filename);
            });
        }) || failed;
    }

    if (state.activeEditor) {
        failed = cb_internal_attempt(function () {
            var file = cb.fs._asFile(state.activeEditor);
            file.editor.activate();

        }) || failed;
    }

    if (failed) {
        cb.reportError('Failed to restore state');
    }
};
