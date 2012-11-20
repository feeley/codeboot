cb.clearSession = function () {
    localStorage.removeItem("codeboot");
};

cb.saveSession = function () {
    var state = cb.serializeState();
    localStorage["codeboot"] = JSON.stringify(state);
};

cb.loadSession = function () {
    // Restore tabs
    var state = localStorage["codeboot"];
    if (!state) {
        // For the transition period
        state = localStorage["codeplay"];
        localStorage.removeItem("codeplay");
    }
    if (state) {
        cb.restoreState(JSON.parse(state));
    }
};

cb.serializeState = function () {
    var state = {
        tabs: [],
        repl: {
            history: undefined
        },
        devMode: cb.devMode,
        languageLevel: cb.languageLevel
    };

    state.repl.history = cb.repl.cb.history.serializeState();

    state.files = cb.fs.serialize();
    state.openEditors = [];
    $(".row[data-cb-filename]").each(function () {
        state.openEditors.push($(this).attr("data-cb-filename"));
    });

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

cb.restoreState = function (state) {
    if (state === undefined) return;
    var failed = false;

    failed = cb_internal_attempt(function () {
        cb.repl.cb.history.restoreState(state.repl.history);
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setLanguageLevel(state.languageLevel || "novice");
    }) || failed;

    failed = cb_internal_attempt(function () {
        cb.setDevMode(!!state.devMode);
    }) || failed;

    if (state.files) {
        failed = cb_internal_attempt(function () {
            cb.fs.restore(state.files);
            cb.rebuildFileMenu();
        }) || failed;
    }

    if (state.openEditors) {
        failed = cb_internal_attempt(function () {
            for (var i = state.openEditors.length - 1; i >= 0; i--) {
                cb.openFile(state.openEditors[i]);
            }
        }) || failed;
    }

    if (failed) {
        cb.reportError("Failed to restore state");
    }
};
