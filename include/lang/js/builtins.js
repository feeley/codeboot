// JavaScript builtins

// TODO: move to Js class
// codeBoot globalObject getter/setter

LangJs.prototype.initBuiltins = function () {

var lang = this;

function importFromHost(id) {

    if (CodeBoot.prototype.hasHostGlobal(id)) {
        lang.setGlobal(id, CodeBoot.prototype.getHostGlobal(id));
    }
}

function exportToHost(id, lang) {

    CodeBoot.prototype.setHostGlobal(id, function () {
        var fn = lang.getGlobal(id);
        return fn.apply(CodeBoot.prototype.hostGlobalObject, arguments);
    });
}

//exportToHost('clic');
//exportToHost('init');

function importStandardFromHost() {

    importFromHost('NaN');
    importFromHost('Infinity');
    importFromHost('undefined');
    importFromHost('parseInt');
    importFromHost('parseFloat');
    importFromHost('isNaN');
    importFromHost('isFinite');
    importFromHost('decodeURI');
    importFromHost('encodeURI');
    importFromHost('decodeURIComponent');
    importFromHost('encodeURIComponent');

    importFromHost('Object');
    importFromHost('Function');
    importFromHost('Array');
    importFromHost('String');
    importFromHost('Boolean');
    importFromHost('Number');
    importFromHost('Date');
    importFromHost('RegExp');
    importFromHost('Error');
    importFromHost('EvalError');
    importFromHost('RangeError');
    importFromHost('ReferenceError');
    importFromHost('SyntaxError');
    importFromHost('TypeError');
    importFromHost('URIError');

    importFromHost('Math');
    importFromHost('JSON');

    importFromHost('document');
    //importFromHost('alert');
    //importFromHost('prompt');
}

importStandardFromHost();

// alert

function builtin_alert() {
    return alert.apply(hostGlobalObject, arguments);
}

builtin_alert.toString = function () {
    return 'function alert(value) { ... }';
};

lang.setGlobal('alert', builtin_alert);

// prompt

function builtin_prompt() {
    return prompt.apply(hostGlobalObject, arguments);
}

builtin_prompt.toString = function () {
    return 'function prompt(value) { ... }';
};

lang.setGlobal('prompt', builtin_prompt);

// confirm

function builtin_confirm() {
    return confirm.apply(hostGlobalObject, arguments);
}

builtin_confirm.toString = function () {
    return 'function confirm(value) { ... }';
};

lang.setGlobal('confirm', builtin_confirm);

// print

function builtin_print() {
    var args = Array.prototype.slice.call(arguments).map(function (x) {
        return (typeof x === 'object') ? lang.printedRepresentation(x) : x;
    });
    lang.vm.addTranscriptREPL(args.join('') + '\n', 'cb-repl-output');
    lang.rt.rte.step_limit = -1; // force exit of trampoline
}

builtin_print.toString = function () {
    return 'function print(value) { ... }';
};

lang.setGlobal('print', builtin_print);

// load

function builtin_load(filename) {
    throw 'load is not builtin in JavaScript';
}

builtin_load._apply_ = function (rte, cont, this_, params) {

    var filename = params[0];
    var code = vm.compile_file(filename, false); // preserve execution state

    if (code === null) {
        code = function (rte, cont) {
            return return_fn_body(rte, void 0);
        };
    }

    return exec_fn_body(code,
                        builtin_load,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_load.toString = function () {
    return 'function load(filename) { ... }';
};

lang.setGlobal('load', builtin_load);

// pause

function builtin_pause(filename) {
    throw 'pause is not builtin in JavaScript';
}

builtin_pause._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        var delay = params[0];

        if (params.length === 0) {
            delay = Infinity;
        } else if (typeof delay !== 'number' || !(delay >= 0)) {
            throw 'delay parameter of pause must be a non-negative number';
        }

        if (delay !== Infinity) {
            vm.stopAnimation();
            vm.ui.timeoutId = setTimeout(function () {
                                           vm.repeatLastExecEvent();
                                         },
                                         delay*1000);
        }

        return abort_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_pause,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_pause.toString = function () {
    return 'function pause() { ... }';
};

lang.setGlobal('pause', builtin_pause);

// assert

function builtin_assert(condition) {
    throw 'assert is not builtin in JavaScript';
}

builtin_assert._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (!params[0]) {
            return abort_fn_body(rte,
                                 params[1] ? String(params[1]) : 'THIS ASSERTION FAILED');
        }

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_assert,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_assert.toString = function () {
    return 'function assert(condition) { ... }';
};

lang.setGlobal('assert', builtin_assert);

// setScreenMode

function builtin_setScreenMode(width, height) {
    throw 'setScreenMode is not builtin in JavaScript';
}

builtin_setScreenMode._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 2) {
            throw 'setScreenMode expects 2 parameters';
        }

        var max_width = 360;
        var max_height = 240;
        var width = params[0];
        var height = params[1];

        if (typeof width !== 'number' ||
            Math.floor(width) !== width ||
            width < 1 ||
            width > max_width) {
            throw 'width parameter of setScreenMode must be a positive integer no greater than ' + max_width;
        }

        if (typeof height !== 'number' ||
            Math.floor(height) !== height ||
            height < 1 ||
            height > max_height) {
            throw 'height parameter of setScreenMode must be a positive integer no greater than ' + max_height;
        }

        var scale = Math.min(20,
                             Math.floor(max_width / width),
                             Math.floor(max_height / height));

        pixels_window.setScreenMode(width, height, scale);

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_setScreenMode,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_setScreenMode.toString = function () {
    return 'function setScreenMode(width, height) { ... }';
};

lang.setGlobal('setScreenMode', builtin_setScreenMode);

// getScreenWidth

function builtin_getScreenWidth() {
    throw 'getScreenWidth is not builtin in JavaScript';
}

builtin_getScreenWidth._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, pixels_window.width);
    };

    return exec_fn_body(code,
                        builtin_getScreenWidth,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_getScreenWidth.toString = function () {
    return 'function getScreenWidth() { ... }';
};

lang.setGlobal('getScreenWidth', builtin_getScreenWidth);

// getScreenHeight

builtin_getScreenHeight.toString = function () {
    return 'function getScreenHeight() { ... }';
};

lang.setGlobal('getScreenHeight', builtin_getScreenHeight);

function builtin_getScreenHeight() {
    throw 'getScreenHeight is not builtin in JavaScript';
}

builtin_getScreenHeight._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, pixels_window.height);
    };

    return exec_fn_body(code,
                        builtin_getScreenHeight,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

// setPixel

function convertRGB(rgb) {

  if (typeof rgb !== 'object' ||
      rgb === null ||
      !('r' in rgb) ||
      typeof rgb.r !== 'number' ||
      Math.floor(rgb.r) !== rgb.r ||
      rgb.r < 0 || rgb.r > 255 ||
      !('g' in rgb) ||
      typeof rgb.g !== 'number' ||
      Math.floor(rgb.g) !== rgb.g ||
      rgb.g < 0 || rgb.g > 255 ||
      !('b' in rgb) ||
      typeof rgb.b !== 'number' ||
      Math.floor(rgb.b) !== rgb.b ||
      rgb.b < 0 || rgb.b > 255) {
    return null;
  }

  return '#' + ((((((1<<8)+rgb.r)<<8)+rgb.g)<<8)+rgb.b).toString(16).slice(1);
}

function builtin_setPixel(x, y, color) {
    throw 'setPixel is not builtin in JavaScript';
}

builtin_setPixel._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 3) {
            throw 'setPixel expects 3 parameters';
        }

        var x = params[0];
        var y = params[1];
        var color = convertRGB(params[2]);

        if (typeof x !== 'number' ||
            Math.floor(x) !== x ||
            x < 0 ||
            x >= pixels_window.width) {
            throw 'x parameter of setPixel must be a positive integer less than ' + pixels_window.width;
        }

        if (typeof y !== 'number' ||
            Math.floor(y) !== y ||
            y < 0 ||
            y >= pixels_window.height) {
            throw 'y parameter of setPixel must be a positive integer less than ' + pixels_window.height;
        }

        if (color === null) {
            throw 'color parameter of setPixel must be a RGB structure';
        }

        pixels_window.setPixel(x, y, color);

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_setPixel,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_setPixel.toString = function () {
    return 'function setPixel(x, y, color) { ... }';
};

lang.setGlobal('setPixel', builtin_setPixel);

function builtin_fillRectangle(x, y, color) {
    throw 'fillRectangle is not builtin in JavaScript';
}

// fillRectangle

builtin_fillRectangle._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 5) {
            throw 'fillRectangle expects 5 parameters';
        }

        var x = params[0];
        var y = params[1];
        var w = params[2];
        var h = params[3];
        var color = convertRGB(params[4]);

        if (typeof x !== 'number' ||
            Math.floor(x) !== x ||
            x < 0 ||
            x >= pixels_window.width) {
            throw 'x parameter of fillRectangle must be a positive integer less than ' + pixels_window.width;
        }

        if (typeof y !== 'number' ||
            Math.floor(y) !== y ||
            y < 0 ||
            y >= pixels_window.height) {
            throw 'y parameter of fillRectangle must be a positive integer less than ' + pixels_window.height;
        }

        var max_width = pixels_window.width - x;
        var max_height = pixels_window.height - y;

        if (typeof w !== 'number' ||
            Math.floor(w) !== w ||
            w < 0 ||
            w > max_width) {
            throw 'width parameter of fillRectangle must be a positive integer less than ' + (max_width+1);
        }

        if (typeof h !== 'number' ||
            Math.floor(h) !== h ||
            h < 0 ||
            h > max_height) {
            throw 'height parameter of fillRectangle must be a positive integer less than ' + (max_height+1);
        }

        if (color === null) {
            throw 'color parameter of fillRectangle must be a RGB structure';
        }

        pixels_window.fillRectangle(x, y, w, h, color);

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_fillRectangle,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_fillRectangle.toString = function () {
    return 'function fillRectangle(x, y, width, height, color) { ... }';
};

lang.setGlobal('fillRectangle', builtin_fillRectangle);

// exportScreen

function builtin_exportScreen() {
    throw 'exportScreen is not builtin in JavaScript';
}

builtin_exportScreen._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        return return_fn_body(rte, pixels_window.exportScreen());
    };

    return exec_fn_body(code,
                        builtin_exportScreen,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_exportScreen.toString = function () {
    return 'function exportScreen() { ... }';
};

lang.setGlobal('exportScreen', builtin_exportScreen);

// getMouse

function builtin_getMouse() {
    throw 'getMouse is not builtin in JavaScript';
}

builtin_getMouse._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {
        var state;
        if (showing_drawing_window()) {
            var pos = drawing_window.pageToRelative(vm.mousePos);
            state = { x: pos.x, y: pos.y, down: vm.mouseDown };
        } else if (showing_pixels_window()) {
            var pos = pixels_window.pageToRelative(vm.mousePos);
            state = { x: pos.x, y: pos.y, down: vm.mouseDown };
        } else {
            state = { x: vm.mousePos.x, y: vm.mousePos.y, down: vm.mouseDown };
        }
        return return_fn_body(rte, state);
    };

    return exec_fn_body(code,
                        builtin_getMouse,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_getMouse.toString = function () {
    return 'function getMouse() { ... }';
};

lang.setGlobal('getMouse', builtin_getMouse);

// cs

builtin_cs.toString = function () {
    return 'function cs() { ... }';
};

lang.setGlobal('cs', builtin_cs);

// pu

builtin_pu.toString = function () {
    return 'function pu() { ... }';
};

lang.setGlobal('pu', builtin_pu);

// pd

builtin_pd.toString = function () {
    return 'function pd() { ... }';
};

lang.setGlobal('pd', builtin_pd);

// st

builtin_st.toString = function () {
    return 'function st() { ... }';
};

lang.setGlobal('st', builtin_st);

// ht

builtin_ht.toString = function () {
    return 'function ht() { ... }';
};

lang.setGlobal('ht', builtin_ht);

// fd

builtin_fd.toString = function () {
    return 'function fd(xdistance, ydistance) { ... }';
};

lang.setGlobal('fd', builtin_fd);

// bk

builtin_bk.toString = function () {
    return 'function bk(xdistance, ydistance) { ... }';
};

lang.setGlobal('bk', builtin_bk);

// mv

builtin_mv.toString = function () {
    return 'function mv(x, y) { ... }';
};

lang.setGlobal('mv', builtin_mv);

// lt

builtin_lt.toString = function () {
    return 'function lt(angle) { ... }';
};

lang.setGlobal('lt', builtin_lt);

// rt

builtin_rt.toString = function () {
    return 'function rt(angle) { ... }';
};

lang.setGlobal('rt', builtin_rt);

// setpc

builtin_setpc.toString = function () {
    return 'function setpc(r, g, b) { ... }';
};

lang.setGlobal('setpc', builtin_setpc);

// setpw

builtin_setpw.toString = function () {
    return 'function setpw(width) { ... }';
};

lang.setGlobal('setpw', builtin_setpw);

// drawtext

builtin_drawtext.toString = function () {
    return 'function drawtext(text) { ... }';
};

lang.setGlobal('drawtext', builtin_drawtext);

// setTimeout

function builtin_setTimeout(func, delay) {
    throw 'setTimeout must be called from codeBoot code';
}

builtin_setTimeout.toString = function () {
    return 'function setTimeout(func, delay) { ... }';
};

builtin_setTimeout._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        var func = params[0];
        var delay = params[1];
        var args = params.slice(2);

        if (params.length < 2) {
            throw 'setTimeout expects at least 2 parameters';
        }

        if (typeof func !== 'function' || !('_apply_' in func)) {
            throw 'func parameter of setTimeout must be a function';
        }

        if (typeof delay !== 'number') {
            throw 'delay parameter of setTimeout must be a number';
        }

        var f = function () {
            code_queue_add(
                function (rte, cont) {
                    return func._apply_(rte, cont, rte.glo, args);
                });
        };

        var result = setTimeout.apply(hostGlobalObject, [f, delay]);

        return return_fn_body(rte, result);
    };

    return exec_fn_body(code,
                        builtin_setTimeout,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

lang.setGlobal('setTimeout', builtin_setTimeout);

// clearTimeout

function builtin_clearTimeout(timeoutID) {
    return clearTimeout.apply(hostGlobalObject, [timeoutID]);
}

builtin_clearTimeout.toString = function () {
    return 'function clearTimeout(timeoutID) { ... }';
};

lang.setGlobal('clearTimeout', builtin_clearTimeout);

// readFile

function builtin_readFile(filename) {
    throw 'readFile does not exist in JavaScript';
}

builtin_readFile._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 1) {
            throw 'readFile expects 1 parameter';
        }

        var filename = params[0];

        if (typeof filename !== 'string') {
            throw 'filename parameter of readFile must be a string';
        }

        var state = vm.readFileInternal(filename);

        return return_fn_body(rte, state.content);
    };

    return exec_fn_body(code,
                        builtin_readFile,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_readFile.toString = function () {
    return 'function readFile(filename) { ... }';
};

lang.setGlobal('readFile', builtin_readFile);

// writeFile

function builtin_writeFile(filename, content) {
    throw 'writeFile does not exist in JavaScript';
}

builtin_writeFile._apply_ = function (rte, cont, this_, params) {

    var code = function (rte, cont) {

        if (params.length !== 2) {
            throw 'writeFile expects 2 parameters';
        }

        var filename = params[0];
        var content = params[1];

        if (typeof filename !== 'string') {
            throw 'filename parameter of writeFile must be a string';
        }

        if (typeof content !== 'string') {
            throw 'content parameter of writeFile must be a string';
        }

        writeFileInternal(filename, content);

        return return_fn_body(rte, void 0);
    };

    return exec_fn_body(code,
                        builtin_writeFile,
                        rte,
                        cont,
                        this_,
                        params,
                        [],
                        null,
                        null);
};

builtin_writeFile.toString = function () {
    return 'function writeFile(filename, content) { ... }';
};

lang.setGlobal('writeFile', builtin_writeFile);

};
