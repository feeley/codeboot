CodeBootVM.prototype.storageId = function () {
    var vm = this;
    return 'codeboot3'; //TODO: one state per VM
};

CodeBootVM.prototype.getStorage = function () {
    var vm = this;
    try {
        return localStorage[vm.storageId()];
    } catch (e) {
        return null;
    }
};

CodeBootVM.prototype.setStorage = function (value) {
    var vm = this;
    try {
        localStorage[vm.storageId()] = value;
    } catch (e) {
    }
};

CodeBootVM.prototype.clearStorage = function () {
    var vm = this;
    localStorage.removeItem(vm.storageId());
};

CodeBootVM.prototype.saveSession = function () {
    var vm = this;
    var state = vm.serializeState();
    vm.setStorage(JSON.stringify(state));
};

CodeBootVM.prototype.loadSession = function () {
    var vm = this;
    var state = vm.getStorage();
    if (state) {
        vm.fs.init();
        vm.restoreState(JSON.parse(state));
    }
};

CodeBootVM.prototype.serializeState = function () {
    var vm = this;
    var state = {
        tabs: [],
        repl: {
            history: undefined
        },
        lang: vm.lang.getId(),
        level: vm.level,
//        devMode: vm.devMode,
        animationSpeed: vm.animationSpeed,
        options: vm.options
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

    failed = cb_internal_attempt(function () {
        cb.repl.cb.history.restoreState(state.repl.history);
    }) || failed;

    failed = cb_internal_attempt(function () {
//        cb.vms['#cb-vm-1'].setLang(state.language || 'js-novice');
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setDevMode(!!state.devMode);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setAnimationSpeed(state.animationSpeed);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.vms['#cb-vm-1'].setShowLineNumbers(!!state.options.showLineNumbers);
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
