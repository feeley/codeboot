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
    
    return state;
};

cp.restoreState = function (state) {
    if (state === undefined) return;
    
    try {        
        // Restore history
        cp.repl.cp.history.restoreState(state.repl.history);
        cp.setDevMode(!!state.devMode);
    } catch (e) {
        cp.reportError("Unable to restore state: " + e);
    }
};
