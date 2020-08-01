// Each language supported by codeBoot is represented by an object
// which is a subclass of Lang.  It responds to the following methods:

// lang.getId()    returns the language's identifier, e.g. 'js'
// lang.getExt()   returns the language's source file extension, e.g. '.js'
// lang.getDir()   returns the language's directory, e.g. 'include/lang/js'
//
// lang.getLevels()
//                 returns an array of the language's levels
//                 e.g., ['novice', 'standard'].
//
// lang.getEditorOpts()
//                 returns the CodeMirror options for the language,
//                 e.g. { mode: 'javascript', indentUnit: 4 }
//
// lang.getBrandImg(level, dark_bg, width)
//                 returns the HTML code for an image of the language level
//                 appropriate for displaying on a dark background when
//                 dark_bg is true (otherwise for a light background)
//                 and of the indicated width, e.g.
//                 '<img src="include/lang/js/img-white.svg" width="12px"/>'

// A language instance responds to the following methods:
//
// lang.getStepCount()
//                 returns the step count

function Lang() {
    this.rt = null; // run time state
}

Lang.prototype = new Object();

Lang.prototype.getId = function () {
    return this.properties.id;
};

Lang.prototype.getExt = function () {
    return this.properties.ext;
};

Lang.prototype.getLangFromExt = function (ext) {
    for (var id in Lang.prototype.registered) {
        var constructor = Lang.prototype.registered[id];
        if (ext === constructor.prototype.properties.ext)
            return constructor;
    }
    return undefined;
};

Lang.prototype.getDir = function () {
    return "include/lang/" + this.getId();
};

Lang.prototype.getLevels = function () {
    return this.properties.levels;
};

Lang.prototype.getEditorOpts = function () {
    return this.properties.editorOpts;
};

Lang.prototype.getBrandImg = function (level, dark_bg, width) {
    return '<img src="' + this.getDir() + '/' + this.getId() + '-img-' +
           (level === 'novice' ? (dark_bg ? 'white' : 'black') : 'color') +
           '.svg"' +
           (width ? (' width="' + width + '"') : '') +
           '/>';
};

Lang.prototype.create = function (id, vm) {
    var constructor = Lang.prototype.registered[id];
    if (constructor === undefined)
        throw 'unknown language ' + id;
    return new constructor(vm);
};

Lang.prototype.registered = {};

Lang.prototype.register = function (constructor) {
    this.registered[constructor.prototype.getId()] = constructor;
};

Lang.prototype.full = function (id_and_level) {
    if (id_and_level.indexOf('-') < 0) {
        if (id_and_level === '')
            id_and_level = 'js';
        id_and_level + '-standard';
    }
    return id_and_level;
};

Lang.prototype.split = function (id_and_level) {
    id_and_level = Lang.prototype.full(id_and_level);
    var i = id_and_level.indexOf('-');
    return { id: id_and_level.slice(0, i), level: id_and_level.slice(i+1) };
};
