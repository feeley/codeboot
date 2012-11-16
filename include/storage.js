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
        devMode: cp.devMode,
        languageLevel: cp.languageLevel
    };

    state.repl.history = cp.repl.cp.history.serializeState();

    state.files = cp.fs.serialize();
    state.openEditors = [];
    $(".row[data-cp-filename]").each(function () {
        state.openEditors.push($(this).attr("data-cp-filename"));
    });

    return state;
};

function cp_internal_attempt(operation) {
    try {
        operation();
        return true;
    } catch (e) {
        return false;
    }
}

cp.restoreState = function (state) {
    if (state === undefined) return;
    var failed = false;

    failed = cp_internal_attempt(function () {
        cp.repl.cp.history.restoreState(state.repl.history);
    }) || failed;

    failed = cp_internal_attempt(function () {
        cp.setLanguageLevel(state.languageLevel || "novice");
    }) || failed;

    failed = cp_internal_attempt(function () {
        cp.setDevMode(!!state.devMode);
    }) || failed;

    if (state.files) {
        failed = cp_internal_attempt(function () {
            cp.fs.restore(state.files);
            cp.rebuildFileMenu();
        }) || failed;
    }

    if (state.openEditors) {
        failed = cp_internal_attempt(function () {
            for (var i = state.openEditors.length - 1; i >= 0; i--) {
                cp.openFile(state.openEditors[i]);
            }
        }) || failed;
    }

    if (failed) {
        cp.reportError("Failed to restore state");
    }
};
