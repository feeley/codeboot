CodeBootVM.prototype.getStorageId = function () {

    var vm = this;

    return vm.storageId;
};

CodeBootVM.prototype.getStorage = function () {

    var vm = this;

    try {
        var storage = localStorage[vm.getStorageId()];
        if (storage)
            return storage;
        else
            return null;
    } catch (e) {
        return null;
    }
};

CodeBootVM.prototype.setStorage = function (value) {

    var vm = this;

    try {
        localStorage[vm.getStorageId()] = value;
    } catch (e) {
    }
};

CodeBootVM.prototype.clearStorage = function () {

    var vm = this;

    localStorage.removeItem(vm.getStorageId());
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
        vm.restoreState(JSON.parse(state));
    }
};

CodeBootVM.prototype.serializeState = function () {

    var vm = this;

    var state = {
        repl: {
            history: undefined
        },
        lang: vm.lang.getId() + '-' + vm.level,
        devMode: vm.devMode,
        showLineNumbers: vm.showLineNumbers,
        largeFont: vm.largeFont,
        animationSpeed: vm.animationSpeed,
        options: vm.options
    };

    state.repl.history = vm.repl.cb.hm.serializeState();

    state.files = vm.fs.serialize();
    state.openEditors = [];
    vm.fs.forEachEditor(function (editor) {
        state.openEditors.push(editor.file.filename);
    });
    state.activeEditor = null;
    if (vm.fs.fem.activated >= 0) {
        state.activeEditor = vm.fs.fem.editors[vm.fs.fem.activated].file.filename;
    }

    return state;
};

function cb_internal_attempt(operation) {
    try {
        operation();
        return false;
    } catch (e) {
        return true;
    }
}

CodeBootVM.prototype.restoreState = function (state) {

    var vm = this;

    if (state === undefined) return;

    var failed = false;

    if (state.options) {
        cb.options = state.options;
    }

    failed = cb_internal_attempt(function () {
        vm.repl.cb.hm.restoreState(state.repl.history);
    }) || failed;

    failed = cb_internal_attempt(function () {
        vm.setLang(state.lang || 'js-novice');
        vm.setLangUI();
    }) || failed;

    failed = cb_internal_attempt(function () {
        vm.setDevMode(!!state.devMode);
    }) || failed;

    failed = cb_internal_attempt(function () {
        vm.setShowLineNumbers(!!state.showLineNumbers);
    }) || failed;

    failed = cb_internal_attempt(function () {
        vm.setLargeFont(!!state.largeFont);
    }) || failed;

    failed = cb_internal_attempt(function () {
        vm.setAnimationSpeed(state.animationSpeed);
    }) || failed;

    if (state.files) {
        failed = cb_internal_attempt(function () {
            vm.fs.restore(state.files);
            vm.fs.rebuildFileMenu();
        }) || failed;
    }

    if (state.openEditors) {
        failed = cb_internal_attempt(function () {
            state.openEditors.forEach(function (filename) {
                vm.fs.openFile(filename);
            });
        }) || failed;
    }

    if (state.activeEditor) {
        failed = cb_internal_attempt(function () {
            var file = vm.fs._asFile(state.activeEditor);
            file.fe.activate();
        }) || failed;
    }

    if (failed) {
        vm.reportError('Failed to restore state');
    }
};
