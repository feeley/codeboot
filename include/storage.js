bc.clearSession = function () {
    localStorage.removeItem("bootcode");
};

bc.saveSession = function () {
    var state = bc.serializeState();
    localStorage["bootcode"] = JSON.stringify(state);
};

bc.loadSession = function () {
    // Restore tabs
    var state = localStorage["bootcode"];
    if (!state) {
        // For the transition period
        state = localStorage["codeplay"];
        localStorage.removeItem("codeplay");
    }
    if (state) {
        bc.restoreState(JSON.parse(state));
    }
};

bc.serializeState = function () {
    var state = {
        tabs: [],
        repl: {
            history: undefined
        },
        devMode: bc.devMode,
        languageLevel: bc.languageLevel
    };

    state.repl.history = bc.repl.bc.history.serializeState();

    state.files = bc.fs.serialize();
    state.openEditors = [];
    $(".row[data-bc-filename]").each(function () {
        state.openEditors.push($(this).attr("data-bc-filename"));
    });

    return state;
};

function bc_internal_attempt(operation) {
    try {
        operation();
        return true;
    } catch (e) {
        return false;
    }
}

bc.restoreState = function (state) {
    if (state === undefined) return;
    var failed = false;

    failed = bc_internal_attempt(function () {
        bc.repl.bc.history.restoreState(state.repl.history);
    }) || failed;

    failed = bc_internal_attempt(function () {
        bc.setLanguageLevel(state.languageLevel || "novice");
    }) || failed;

    failed = bc_internal_attempt(function () {
        bc.setDevMode(!!state.devMode);
    }) || failed;

    if (state.files) {
        failed = bc_internal_attempt(function () {
            bc.fs.restore(state.files);
            bc.rebuildFileMenu();
        }) || failed;
    }

    if (state.openEditors) {
        failed = bc_internal_attempt(function () {
            for (var i = state.openEditors.length - 1; i >= 0; i--) {
                bc.openFile(state.openEditors[i]);
            }
        }) || failed;
    }

    if (failed) {
        bc.reportError("Failed to restore state");
    }
};
