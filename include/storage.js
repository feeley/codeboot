cp.clearSession = function () {
    localStorage.removeItem("codeplay");
};

cp.saveSession = function () {
    var state = cp.serializeState();
    localStorage["codeplay"] = JSON.stringify(state);
};

cp.loadSession = function () {
    // Restore tabs
    var state = localStorage["codeplay"];
    if (state) {
        cp.restoreState(JSON.parse(state));
    }
};

cp.serializeState = function () {
    var state = {
        tabs: [],
        repl: {
            history: undefined
        },
        devMode: cp.devMode
    };

    state.repl.history = cp.repl.cp.history.serializeState();

    state.files = cp.fs.files;
    state.openEditors = [];
    $(".row[data-cp-filename]").each(function () {
        state.openEditors.push($(this).attr("data-cp-filename"));
    });

    return state;
};

cp.restoreState = function (state) {
    if (state === undefined) return;

    try {
        // Restore history
        cp.repl.cp.history.restoreState(state.repl.history);
        cp.setDevMode(!!state.devMode);

        if (state.files) {
            for (var filename in state.files) {
                cp.fs.files[filename] = state.files[filename];
            }
            cp.rebuildFileMenu();
        }

        if (state.openEditors) {
            for (var i = state.openEditors.length - 1; i >= 0; i--) {
                cp.openFile(state.openEditors[i]);
            }
        }
    } catch (e) {
        cp.reportError("Unable to restore state: " + e);
    }
};
