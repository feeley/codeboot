cp.clearSession = function () {
    localStorage.removeItem("cp");
};

cp.saveSession = function () {
    var state = cp.serializeState();
    localStorage["cp"] = JSON.stringify(state);
};

cp.loadSession = function () {
    // Restore tabs
    var state = localStorage["cp"];
    if (state) {
        cp.restoreState(JSON.parse(state));
    }
};
