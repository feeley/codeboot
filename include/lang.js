// Each language supported by codeBoot is represented by an object
// which is a subclass of Lang.  It responds to the following methods:

// lang.getId()    returns the language's identifier, e.g. 'js'
// lang.getExts()  returns the language's source file extensions, e.g. ['.js']
// lang.getDir()   returns the language's directory, e.g. 'include/lang/js'
//
// lang.getPrompt()
//                 returns the language's main prompt
//
// lang.getPromptCont()
//                 returns the language's continuation prompt
//
// lang.getLevels()
//                 returns an array of the language's levels
//                 e.g., ['novice', 'standard'].
//
// lang.setupEditor(editor)
//                 setup the CodeMirror editor for the language,
//                 such as setting the mode, indent unit, etc
//
// lang.getSVG(level)
//                 returns the object { onLight:'<svg...>', onDark:'<svg...>' }
//                 that contains the SVG definition for an image of the
//                 language level appropriate for displaying on light and
//                 dark backgrounds respectively

// A language instance responds to the following methods:
//
// lang.getStepCount()
//                 returns the step count

function Lang() {

    var lang = this;

    lang.rt = null; // run time state
}

Lang.prototype = new Object();

Lang.prototype.getId = function () {

    var lang = this;

    return lang.properties.id;
};

Lang.prototype.getExts = function () {

    var lang = this;

    return lang.properties.exts;
};

Lang.prototype.getPrompt = function () {

    var lang = this;

    return lang.properties.prompt;
};

Lang.prototype.getPromptCont = function () {

    var lang = this;

    return lang.properties.promptCont;
};

Lang.prototype.getLangFromExt = function (ext) {
    for (var id in Lang.prototype.registered) {
        var constructor = Lang.prototype.registered[id];
        var exts = constructor.prototype.properties.exts;
        for (var i in exts) {
            if (ext === exts[i])
                return constructor;
        }
    }
    return undefined;
};

Lang.prototype.getDir = function () {

    var lang = this;

    return "include/lang/" + lang.getId();
};

Lang.prototype.getLevels = function () {

    var lang = this;

    return lang.properties.levels;
};

Lang.prototype.setupEditor = function (editor) {

    var lang = this;
    var opts = lang.properties.editorOpts;

    for (var k in opts) {
        editor.setOption(k, opts[k]);
    }
};

Lang.prototype.getSVG = function (level) {

    var lang = this;

    if (level === 'novice') {
        return { onLight: lang.properties.SVG.black,
                 onDark: lang.properties.SVG.white };
    } else {
        return { onLight: lang.properties.SVG.color,
                 onDark: lang.properties.SVG.color };
    }
};

Lang.prototype.create = function (id, vm) {
    var constructor = Lang.prototype.registered[id];
    if (constructor === undefined)
        throw 'unknown language ' + id;
    return new constructor(vm);
};

Lang.prototype.firstKey = function (obj) {
    for (var key in obj) return key;
    return null;
};

Lang.prototype.registered = {};

Lang.prototype.register = function (constructor) {
    Lang.prototype.registered[constructor.prototype.getId()] = constructor;
};

Lang.prototype.forEachRegisteredLang = function (fn) {
    for (var id in Lang.prototype.registered) {
        fn(Lang.prototype.registered[id]);
    };
};

Lang.prototype.full = function (id_and_level) {

    if (id_and_level.indexOf('-') < 0) {
        if (id_and_level === '') {
            var id = Lang.prototype.firstKey(Lang.prototype.registered);
            if (id) {
                var level = Lang.prototype.firstKey(Lang.prototype.registered[id].prototype.getLevels());
                id_and_level = Lang.prototype.join(id, level);
            } else {
                id_and_level = Lang.prototype.join('?', '?');
            }
        }
    }

    return id_and_level;
};

Lang.prototype.split = function (id_and_level) {
    id_and_level = Lang.prototype.full(id_and_level);
    var i = id_and_level.indexOf('-');
    return { id: id_and_level.slice(0, i), level: id_and_level.slice(i+1) };
};

Lang.prototype.join = function (id, level) {
    return id + '-' + level;
};

//-----------------------------------------------------------------------------

function SourceContainer(source, tostr, start_line0, start_column0) {

    var sc = this;

    sc.source = source;
    sc.tostr = tostr;
    sc.start_line0 = start_line0;
    sc.start_column0 = start_column0;
}

SourceContainer.prototype.toString = function () {

    var sc = this;

    return sc.tostr;
};

function SourceContainerInternalFile(source, tostr, start_line0, start_column0, stamp) {

    var sc = this;

    sc.source = source;
    sc.tostr = tostr;
    sc.start_line0 = start_line0;
    sc.start_column0 = start_column0;
    sc.stamp = stamp;
}

SourceContainerInternalFile.prototype.toString = function () {

    var sc = this;

    return sc.tostr;
};


// position information is zero based, i.e. 0 means line or column 1


var COLUMN_SHIFT = 16;


function line0_and_column0_to_position(line0, column0) {
    return [line0, column0];
//    return line0 + (column0 << COLUMN_SHIFT);
}


function position_to_line0(pos) {
    return pos[0];
//    return pos & ((1 << COLUMN_SHIFT) - 1);
}


function position_to_line(pos) {
    return position_to_line0(pos) + 1;
}


function position_to_column0(pos) {
    return pos[1];
//    return pos >>> COLUMN_SHIFT;
}


function position_to_column(pos) {
    return position_to_column0(pos) + 1;
}


function position_within_container(pos, container) {

    var line0 = position_to_line0(pos);
    var column0 = position_to_column0(pos);

    if (line0 === 0)
        column0 += container.start_column0;

    line0 += container.start_line0;

    return line0_and_column0_to_position(line0, column0);
}


/* deprecated

function position_to_char_offset(loc, pos)
{
    var source = loc.container.source;
    var line0 = position_to_line0(pos) - loc.container.start_line0;
    var column0 = position_to_column0(pos);

    if (line0 === 0)
        return column0 - loc.container.start_column0;

    for (var offs=0; offs<source.length; offs++)
    {
        if (source.charCodeAt(offs) === EOL_CH &&
            --line0 === 0)
            return offs + column0;
    }

    return 0;
}
*/


function Location(container, start_pos, end_pos) {

    var loc = this;

    loc.container = container;
    loc.start_pos = start_pos;
    loc.end_pos   = end_pos;
}


Location.prototype.join = function (loc2) {

    var loc = this;

    return new Location(loc.container, loc.start_pos, loc2.end_pos);
};


Location.prototype.toString = function(format) {

    var loc = this;

    if (format === "simple") {
        return "At line " +
               position_to_line(loc.start_pos) +
               " in \"" + loc.container.toString() + "\"";
    } else {
        return "\"" + loc.container.toString() + "\"@" +
               position_to_line(loc.start_pos) + "." +
               position_to_column(loc.start_pos) +
               "-" +
               position_to_line(loc.end_pos) + "." +
               position_to_column(loc.end_pos);
    }
};

Lang.prototype.absoluteLocation = function (container,
                                            start_line0,
                                            start_column0,
                                            end_line0,
                                            end_column0) {

    var start_pos = line0_and_column0_to_position(start_line0, start_column0);
    var end_pos = line0_and_column0_to_position(end_line0, end_column0);

    return new Location(container, start_pos, end_pos);
};

Lang.prototype.relativeLocation = function (container,
                                            start_line0,
                                            start_column0,
                                            end_line0,
                                            end_column0) {

    var start_pos = line0_and_column0_to_position(start_line0, start_column0);
    var end_pos = line0_and_column0_to_position(end_line0, end_column0);

    return new Location(container,
                        position_within_container(start_pos, container),
                        position_within_container(end_pos, container));
};
