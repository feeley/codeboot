// Python language implementation

function LangPy(vm) {

    var lang = this;

    lang.vm = vm;

    Lang.call(lang);

    lang.init();
}

LangPy.prototype = Object.create(Lang.prototype);

LangPy.prototype.properties =
    {
        id: 'py',
        exts: ['.py'],
        levels:
        {
            novice: 'Python novice',
//            standard: 'Python standard'
        },
        scriptType: 'text/python',
        prompt: '>>>',
        promptCont: '...',
        editorOpts: { mode: 'python', indentUnit: 4 },
        SVG:
        {
            black: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M126.915866,0.0722755491 C62.0835831,0.0722801733 66.1321288,28.1874648 66.1321288,28.1874648 L66.2044043,57.3145115 L128.072276,57.3145115 L128.072276,66.0598532 L41.6307171,66.0598532 C41.6307171,66.0598532 0.144551098,61.3549438 0.144551098,126.771315 C0.144546474,192.187673 36.3546019,189.867871 36.3546019,189.867871 L57.9649915,189.867871 L57.9649915,159.51214 C57.9649915,159.51214 56.8001363,123.302089 93.5968379,123.302089 L154.95878,123.302089 C154.95878,123.302089 189.434218,123.859386 189.434218,89.9830604 L189.434218,33.9695088 C189.434218,33.9695041 194.668541,0.0722755491 126.915866,0.0722755491 L126.915866,0.0722755491 L126.915866,0.0722755491 Z M92.8018069,19.6589497 C98.9572068,19.6589452 103.932242,24.6339846 103.932242,30.7893845 C103.932246,36.9447844 98.9572068,41.9198193 92.8018069,41.9198193 C86.646407,41.9198239 81.6713721,36.9447844 81.6713721,30.7893845 C81.6713674,24.6339846 86.646407,19.6589497 92.8018069,19.6589497 L92.8018069,19.6589497 L92.8018069,19.6589497 Z" fill="black"/><path d="M128.757101,254.126271 C193.589403,254.126271 189.540839,226.011081 189.540839,226.011081 L189.468564,196.884035 L127.600692,196.884035 L127.600692,188.138693 L214.042251,188.138693 C214.042251,188.138693 255.528417,192.843589 255.528417,127.427208 C255.52844,62.0108566 219.318366,64.3306589 219.318366,64.3306589 L197.707976,64.3306589 L197.707976,94.6863832 C197.707976,94.6863832 198.87285,130.896434 162.07613,130.896434 L100.714182,130.896434 C100.714182,130.896434 66.238745,130.339138 66.238745,164.215486 L66.238745,220.229038 C66.238745,220.229038 61.0044225,254.126271 128.757101,254.126271 L128.757101,254.126271 L128.757101,254.126271 Z M162.87116,234.539597 C156.715759,234.539597 151.740726,229.564564 151.740726,223.409162 C151.740726,217.253759 156.715759,212.278727 162.87116,212.278727 C169.026563,212.278727 174.001595,217.253759 174.001595,223.409162 C174.001618,229.564564 169.026563,234.539597 162.87116,234.539597 L162.87116,234.539597 L162.87116,234.539597 Z" fill="black"/></g></svg>',
            white: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M126.915866,0.0722755491 C62.0835831,0.0722801733 66.1321288,28.1874648 66.1321288,28.1874648 L66.2044043,57.3145115 L128.072276,57.3145115 L128.072276,66.0598532 L41.6307171,66.0598532 C41.6307171,66.0598532 0.144551098,61.3549438 0.144551098,126.771315 C0.144546474,192.187673 36.3546019,189.867871 36.3546019,189.867871 L57.9649915,189.867871 L57.9649915,159.51214 C57.9649915,159.51214 56.8001363,123.302089 93.5968379,123.302089 L154.95878,123.302089 C154.95878,123.302089 189.434218,123.859386 189.434218,89.9830604 L189.434218,33.9695088 C189.434218,33.9695041 194.668541,0.0722755491 126.915866,0.0722755491 L126.915866,0.0722755491 L126.915866,0.0722755491 Z M92.8018069,19.6589497 C98.9572068,19.6589452 103.932242,24.6339846 103.932242,30.7893845 C103.932246,36.9447844 98.9572068,41.9198193 92.8018069,41.9198193 C86.646407,41.9198239 81.6713721,36.9447844 81.6713721,30.7893845 C81.6713674,24.6339846 86.646407,19.6589497 92.8018069,19.6589497 L92.8018069,19.6589497 L92.8018069,19.6589497 Z" fill="white"/><path d="M128.757101,254.126271 C193.589403,254.126271 189.540839,226.011081 189.540839,226.011081 L189.468564,196.884035 L127.600692,196.884035 L127.600692,188.138693 L214.042251,188.138693 C214.042251,188.138693 255.528417,192.843589 255.528417,127.427208 C255.52844,62.0108566 219.318366,64.3306589 219.318366,64.3306589 L197.707976,64.3306589 L197.707976,94.6863832 C197.707976,94.6863832 198.87285,130.896434 162.07613,130.896434 L100.714182,130.896434 C100.714182,130.896434 66.238745,130.339138 66.238745,164.215486 L66.238745,220.229038 C66.238745,220.229038 61.0044225,254.126271 128.757101,254.126271 L128.757101,254.126271 L128.757101,254.126271 Z M162.87116,234.539597 C156.715759,234.539597 151.740726,229.564564 151.740726,223.409162 C151.740726,217.253759 156.715759,212.278727 162.87116,212.278727 C169.026563,212.278727 174.001595,217.253759 174.001595,223.409162 C174.001618,229.564564 169.026563,234.539597 162.87116,234.539597 L162.87116,234.539597 L162.87116,234.539597 Z" fill="white"/></g></svg>',
            color: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient x1="12.9593594%" y1="12.0393928%" x2="79.6388325%" y2="78.2008538%" id="linearGradient-1"><stop stop-color="#387EB8" offset="0%"></stop><stop stop-color="#366994" offset="100%"></stop></linearGradient><linearGradient x1="19.127525%" y1="20.5791813%" x2="90.7415328%" y2="88.4290372%" id="linearGradient-2"><stop stop-color="#FFE052" offset="0%"></stop><stop stop-color="#FFC331" offset="100%"></stop></linearGradient></defs><g><path d="M126.915866,0.0722755491 C62.0835831,0.0722801733 66.1321288,28.1874648 66.1321288,28.1874648 L66.2044043,57.3145115 L128.072276,57.3145115 L128.072276,66.0598532 L41.6307171,66.0598532 C41.6307171,66.0598532 0.144551098,61.3549438 0.144551098,126.771315 C0.144546474,192.187673 36.3546019,189.867871 36.3546019,189.867871 L57.9649915,189.867871 L57.9649915,159.51214 C57.9649915,159.51214 56.8001363,123.302089 93.5968379,123.302089 L154.95878,123.302089 C154.95878,123.302089 189.434218,123.859386 189.434218,89.9830604 L189.434218,33.9695088 C189.434218,33.9695041 194.668541,0.0722755491 126.915866,0.0722755491 L126.915866,0.0722755491 L126.915866,0.0722755491 Z M92.8018069,19.6589497 C98.9572068,19.6589452 103.932242,24.6339846 103.932242,30.7893845 C103.932246,36.9447844 98.9572068,41.9198193 92.8018069,41.9198193 C86.646407,41.9198239 81.6713721,36.9447844 81.6713721,30.7893845 C81.6713674,24.6339846 86.646407,19.6589497 92.8018069,19.6589497 L92.8018069,19.6589497 L92.8018069,19.6589497 Z" fill="url(#linearGradient-1)" /><path d="M128.757101,254.126271 C193.589403,254.126271 189.540839,226.011081 189.540839,226.011081 L189.468564,196.884035 L127.600692,196.884035 L127.600692,188.138693 L214.042251,188.138693 C214.042251,188.138693 255.528417,192.843589 255.528417,127.427208 C255.52844,62.0108566 219.318366,64.3306589 219.318366,64.3306589 L197.707976,64.3306589 L197.707976,94.6863832 C197.707976,94.6863832 198.87285,130.896434 162.07613,130.896434 L100.714182,130.896434 C100.714182,130.896434 66.238745,130.339138 66.238745,164.215486 L66.238745,220.229038 C66.238745,220.229038 61.0044225,254.126271 128.757101,254.126271 L128.757101,254.126271 L128.757101,254.126271 Z M162.87116,234.539597 C156.715759,234.539597 151.740726,229.564564 151.740726,223.409162 C151.740726,217.253759 156.715759,212.278727 162.87116,212.278727 C169.026563,212.278727 174.001595,217.253759 174.001595,223.409162 C174.001618,229.564564 169.026563,234.539597 162.87116,234.539597 L162.87116,234.539597 L162.87116,234.539597 Z" fill="url(#linearGradient-2)"/></g></svg>'
        },
        builtinPrograms:
        {
            'sample/hello.py' :
                '# This program prints a famous greeting\n' +
                '\n' +
                'print("Hello world!")\n',

            'sample/sqrt2.py' :
                '# This program computes the square root of 2 without using math.sqrt\n' +
                '\n' +
                'n = 2       # number whose square root is to be computed\n' +
                'approx = n  # first approximation of sqrt(n)\n' +
                '\n' +
                'while True:\n' +
                '    next = (approx + n/approx) / 2  # improve approximation\n' +
                '    if next == approx:              # stop when no improvement\n' +
                '        break\n' +
                '    approx = next\n' +
                '\n' +
                'print(approx)  # print square root of n\n'
        }
    };

Lang.prototype.register(LangPy);

LangPy.prototype.init = function () {
    var lang = this;
    lang.rt = new lang.RunTime(lang);
};

LangPy.prototype.loadCommand = function (filename) {
    return 'load("' + filename + '")';
//    return 'import ' + filename.replace(/\.[^/.]+$/, '');
};

LangPy.prototype.RunTime = function (lang) {

    var rt = this;

    rt.lang = lang;
    rt.ast = null;
    rt.msg = '';
    rt.error = null;
    rt.cont = null;
    rt.ctx = null;
    rt.stepCount = 0;
    rt.stepLimit = 0;
    rt.rte = null;
};

LangPy.prototype.compile = function (source, container, reboot, event) {

    // Parameters:
    //
    //   source     a string containing the code to compile
    //
    //   container  a Container object indicating where the code is
    //              located (a file/REPL, the starting line, etc)
    //
    //   reboot     boolean indicating if execution state of
    //              the program should be reset
    //
    //   event      an event to add to the environment (or undefined)

    var lang = this;
    var from_repl = container.is_repl();

    var compilationError = runtime_get_compilationError_thrower(lang.vm, container, source, from_repl);

    var syntaxError = runtime_get_syntaxError_thrower(compilationError);

    var external_context =
      {
          compilationError: compilationError,
          syntaxError: syntaxError,
          safe_for_space: false,
      };

    var ast = pyinterp.parse(source,
                             '<unknown>',
                             from_repl || event ? 'single' : 'exec',
                             external_context);

    // REPL input must end in a blank line, unless it contains a single line
    if (from_repl) {
        if (source.indexOf('\n') !== source.length-1 &&
            source.slice(-2) !== '\n\n')
            throw 'continuable REPL input';
    }

    attach_to_container(ast, container);

    var code;

    if (event) {
        var code_handler = pyinterp.comp_event_handler(ast, external_context);
        if (code_handler === null) {
            code = null;
        } else {
            code = function (rte, cont) {
                return code_handler(rte, cont, event);
            };
        }
    } else {
        code = pyinterp.comp(ast, external_context);
    }

    if (code === null) // empty program?
        return null;

    lang.initRunTimeState(reboot);

    return pyinterp.prepare_execution(code, lang.rt.rte);
};

LangPy.prototype.startExecution = function (cont) {

    var lang = this;

    //console.log('LangPy.startExecution');

    lang.rt.stepCount = 0;
    lang.rt.stepLimit = 0;
    lang.rt.ast = null;
    lang.rt.msg = '';
    lang.rt.error = null;
    lang.rt.cont = function () {
                       return cont(lang.rt.rte,
                                   function () {
                                       lang.rt.cont = null; // end execution
                                       return null;
                                   });
                   };
//    lang.rt.cont = cont;
    lang.rt.ctx = null;
};

LangPy.prototype.continueExecution = function (maxSteps, delay) {

    var lang = this;
    var vm = lang.vm;

    //console.log('LangPy.continueExecution maxSteps='+maxSteps);

    if (maxSteps > 0 && lang.rt.cont) {

        lang.rt.stepLimit = lang.rt.stepCount + maxSteps;

        while (lang.rt.stepCount < lang.rt.stepLimit && lang.rt.cont) {
            var state = lang.rt.cont();
            if (!state) {
                lang.rt.cont = null;
                break;
            }
            lang.rt.stepCount += state.nb_steps;
            lang.rt.ast = state.ast;
            lang.rt.msg = state.msg;
            lang.rt.nb_steps = state.nb_steps;
            lang.rt.display_result = state.display_result;
            lang.rt.error = state.error;
            lang.rt.cont = state.cont;
            lang.rt.ctx = state.ctx;

            if (state.sleep_time !== undefined) {
                vm.executionSleep(state.sleep_time, delay);
                break
            }

            else if (state.breakpoint) {
                vm.executionSleep(Infinity);
                break
            }
        }
    }
};

LangPy.prototype.refreshUI = function () {
    var lang = this;
    lang.rt.stepLimit = -1; // cause exit of the trampoline
};

LangPy.prototype.getStepCount = function () {
    var lang = this;
    return lang.rt.stepCount;
};

LangPy.prototype.isExecuting = function () {
    var lang = this;
    return lang.rt.cont !== null;
};

LangPy.prototype.isEndedWithResult = function () {
    var lang = this;
    return !(lang.rt.error);
};

LangPy.prototype.getResult = function () {
    var lang = this;
    if (lang.rt.display_result) {
        return lang.rt.msg;
    } else {
        return void 0;
    }
};

LangPy.prototype.getError = function () {
    var lang = this;
    var vm = lang.vm;
    return new vm.Error(lang.getLocation(), null, lang.rt.error);
};

LangPy.prototype.getLocation = function () {

    var lang = this;
    var ast = lang.rt.ast;

    if (!ast) return null;

    return lang.Location0(ast.container,
                          ast.lineno-1,
                          ast.col_offset,
                          ast.end_lineno-1,
                          ast.end_col_offset);
};

LangPy.prototype.stopExecution = function () {

    var lang = this;

    lang.rt.cont = null;
};

LangPy.prototype.executionStateHTML = function () {

    var lang = this;
    var result = lang.rt.msg;
    var resultHTML = '' === result
                    ? '<i>no value</i>'
                    : lang.printedRepresentation(result, 'HTML');

    var contextHTML = lang.contextHTML();
    if (contextHTML == '') {
        return '<div class="cb-exec-point-bubble-value">' +
               resultHTML +
               '</div>';
    } else {
        return '<div class="cb-exec-point-bubble-value">' +
               resultHTML +
               '</div>' +
               '<div class="cb-exec-point-bubble-context">' +
                contextHTML +
               '</div>';
    }
};

LangPy.prototype.contextHTML = function () {

    var lang = this;
    var rte = lang.rt.ctx.rte;

    var env_repr = pyinterp.get_scope_variables_repr(rte);

    var result = [];

    var add = function (id, val) {
        result.push('<div class="cb-exec-point-bubble-binding"><span class="cb-code-font">' + id + '</span>: ' + lang.printedRepresentation(val, 'HTML') + '</div>');
    };

    env_repr.forEach(function(item){
        var [id, val] = item;
        add(id, val)
    })

    return result.join('');
};

LangPy.prototype.printedRepresentation = function (obj, format) {

    var lang = this;

    if (format === void 0) {
        format = 'plain';
    }

    return lang.objectRepresentation(obj, format, 80).text;
};

LangPy.prototype.objectRepresentation = function (obj, format, limit) {

    var lang = this;

    var xform = function (str) {
        var text;
        if (format === 'HTML') {
            text = escape_HTML(str);
        } else {
            text = str;
        }
        return { text: text, len: str.length };
    };
    return xform(obj === undefined ? "" : obj);
};

//-----------------------------------------------------------------------------

LangPy.prototype.initRunTimeState = function (reboot) {

    var lang = this;
    // default 'trace' option to false
    var options = { trace: false, safe_for_space: false };

    //console.log('LangPy.initRunTimeState reboot='+reboot);

    if (!lang.rt.rte || reboot) {
        lang.rt.rte = pyinterp.fresh_rte(options);
        lang.rt.rte.vm = lang.vm;
    }
};

function runtime_print(msg, rte) {
    rte.vm.replAddTranscript(msg + '\n', 'cb-repl-output');
    rte.vm.lang.refreshUI();
};

function runtime_alert(msg) {
  alert(msg);
};

function runtime_confirm(msg) {
  return confirm(msg);
};

function runtime_input(msg) {
    result = prompt(msg);
    if (result === null) {
        return void 0;
    } else {
        return result;
    }
};

function runtime_prompt(msg) {
  return runtime_input(msg);
}


// TODO: move these routines somwwhere else
function drawing_cs(rte, width, height) {

    var dw = rte.vm.ui.dw;
    var vm = dw.vm;

    if (width !== void 0 || height !== void 0) {

        if (width === void 0 || height === void 0)
            throw 'clear expects 0 or 2 parameters';

        var max_width = 800;
        var max_height = 600;

        if (typeof width !== 'number' ||
            Math.floor(width) !== width ||
            width < 1 ||
            width > max_width) {
            throw 'width parameter of clear must be a positive integer no greater than ' + max_width;
        }

        if (typeof height !== 'number' ||
            Math.floor(height) !== height ||
            height < 1 ||
            height > max_height) {
            throw 'height parameter of clear must be a positive integer no greater than ' + max_height;
        }

        if (width !== dw.width || height !== dw.height) {

            dw = new DrawingWindow(vm, width, height);

            vm.ui.playground_showing = undefined;
            vm.ui.dw = dw;
        }
    }

    dw.cs();
    dw.prepareToShow();
}

function drawing_ht(rte) {
    var dw = rte.vm.ui.dw;
    dw.ht();
    dw.prepareToShow();
}

function drawing_st(rte) {
    var dw = rte.vm.ui.dw;
    dw.st();
    dw.prepareToShow();
}

function drawing_pd(rte) {
    var dw = rte.vm.ui.dw;
    dw.pd();
    dw.prepareToShow();
}

function drawing_pu(rte) {
    var dw = rte.vm.ui.dw;
    dw.pu();
    dw.prepareToShow();
}

function drawing_fd(rte, xdist, ydist) {
    var dw = rte.vm.ui.dw;
    dw.fd(xdist, ydist);
    dw.prepareToShow();
}

function drawing_bk(rte, xdist, ydist) {
    var dw = rte.vm.ui.dw;
    dw.bk(xdist, ydist);
    dw.prepareToShow();
}

function drawing_lt(rte, angle) {
    var dw = rte.vm.ui.dw;
    dw.lt(angle);
    dw.prepareToShow();
}

function drawing_rt(rte, angle) {
    var dw = rte.vm.ui.dw;
    dw.rt(angle);
    dw.prepareToShow();
}

function drawing_mv(rte, x, y) {
    var dw = rte.vm.ui.dw;
    dw.mv(x, y);
    dw.prepareToShow();
}

function drawing_setpc(rte, r, g, b) {
    var dw = rte.vm.ui.dw;
    dw.setpc(r, g, b);
    dw.prepareToShow();
}

function drawing_setpw(rte, width) {
    var dw = rte.vm.ui.dw;
    dw.setpw(width);
    dw.prepareToShow();
}

function drawing_drawtext(rte, text) {
    var dw = rte.vm.ui.dw;
    dw.drawtext(text);
    dw.prepareToShow();
}

function drawing_setScreenMode(rte, width, height) {

    var pw = rte.vm.ui.pw;

    if (width !== void 0 || height !== void 0) {

        if (width === void 0 || height === void 0)
            throw 'setScreenMode expects 0 or 2 parameters';

        var max_width = 800;
        var max_height = 600;

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

        var scale = Math.max(1, Math.min(20,
                                         Math.floor(360 / width),
                                         Math.floor(240 / height)));

        if (width !== pw.width || height !== pw.height || scale !== pw.scale) {
            pw.setScreenMode(width, height, scale);
        } else {
            pw.clearScreen();
        }
    }

    pw.prepareToShow();
}

function drawing_getScreenWidth(rte) {
    var pw = rte.vm.ui.pw;
    return pw.width;
}

function drawing_getScreenHeight(rte) {
    var pw = rte.vm.ui.pw;
    return pw.height;
}

function drawing_setPixel(rte, x, y, color) {
    var pw = rte.vm.ui.pw;
    pw.setPixel(x, y, convertRGB4(color) || blackRGB);
    pw.prepareToShow();
}

function drawing_fillRectangle(rte, x, y, width, height, color) {
    var pw = rte.vm.ui.pw;
    pw.fill_rect(x, y, width, height, convertRGB4(color) || blackRGB);
    pw.prepareToShow();
}

function drawing_exportScreen(rte) {
    var pw = rte.vm.ui.pw;
    return pw.exportScreen();
}

// Mouse information

function getMouse(rte) {
    return rte.vm.getMouse();
}

function getMouseX(rte) {
  return rte.vm.getMouse().x;
}

function getMouseY(rte) {
  return rte.vm.getMouse().y;
}

function getMouseButton(rte) {
  return rte.vm.cb.mouse.button;
}

function getMouseShift(rte) {
  return rte.vm.cb.mouse.shift;
}

function getMouseCtrl(rte) {
  return rte.vm.cb.mouse.ctrl;
}

function getMouseAlt(rte) {
  return rte.vm.cb.mouse.alt;
}

function runtime_read_file(rte, filename) {
    var fs = rte.vm.fs;

    if (fs.hasFile(filename)) {
        return fs.getContent(filename);
    } else {
        return undefined;
    }
}

function runtime_readFile(rte, filename) {

    var vm = rte.vm;

    return vm.readFileInternal(filename).content;
}

function runtime_writeFile(rte, filename, content) {

    var vm = rte.vm;

    vm.writeFileInternal(filename, content);
}

function runtime_querySelector(rte, selector) {

    var vm = rte.vm;

    return document.querySelector(selector);
}

function runtime_getInnerHTML(rte, elem) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    return elem.innerHTML;
}

function runtime_setInnerHTML(rte, elem, html) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    elem.innerHTML = html;

    CodeBoot.prototype.rewrite_event_handlers_children(vm, elem);

    vm.updateHTMLWindow();
}

function runtime_getValue(rte, elem) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    return elem.value;
}

function runtime_setValue(rte, elem, val) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    elem.value = val;

    vm.updateHTMLWindow();
}

function runtime_hasAttribute(rte, elem, attr) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    return elem.hasAttribute(attr);
}

function runtime_removeAttribute(rte, elem, attr) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    elem.removeAttribute(attr);

    vm.updateHTMLWindow();
}

function runtime_getAttribute(rte, elem, attr) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    return elem.getAttribute(attr);
}

function runtime_setAttribute(rte, elem, attr, val) {

    var vm = rte.vm;

    if (typeof(elem) === 'string') {
        elem = document.querySelector(elem);
    }

    elem.setAttribute(attr, val);

    if (CodeBoot.prototype.event_attrs.indexOf(attr) >= 0) {
        val = CodeBoot.prototype.rewrite_event_handlers(vm, elem);
    }

    vm.updateHTMLWindow();
}

function runtime_is_domelement(val) {
    try {
        // Will not work with IE7
        return val instanceof Element;
    }
    catch (e) {
        // Support for IE7, see: https://stackoverflow.com/questions/384286/how-do-you-check-if-a-javascript-object-is-a-dom-object
        // Unless someone does something weird with codeBoot, this should be a good indication that an object is and element
        return (typeof obj === "object") &&
            (obj.nodeType===1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument === "object");
    }
}

function runtime_is_null(val) {
    return val === null;
}

function attach_to_container(ast, container) {
    if (typeof ast === 'object') {
        if (Object.prototype.hasOwnProperty.call(ast, '_fields')) {
            ast.container = container;
            for (var i in ast._fields) {
                attach_to_container(ast[ast._fields[i]], container);
            }
        } else if (ast instanceof Array) {
            ast.forEach(function (a) { attach_to_container(a, container); });
        }
    }
}

function runtime_attach_ast_to_file(rte, ast, filename) {
    var state = rte.vm.readFileInternal(filename);
    var source = state.content;
    var container = new SourceContainerInternalFile(source, filename, 0, 0, state.stamp);
    attach_to_container(ast, container);
}

function runtime_get_file_container(rte, filename) {
    var state = rte.vm.readFileInternal(filename);
    var source = state.content;
    return new SourceContainerInternalFile(source, filename, 0, 0, state.stamp);

}

function runtime_ast_is_from_repl(ast) {
    return ast.container.is_repl();
}

function runtime_get_compilationError_thrower(vm, container, source, from_repl=false) {
    function compilationError(start_line0,
                         start_column0,
                         end_line0,
                         end_column0,
                         error_kind,
                         msg) {

        if (from_repl) {
            var nlines = source.split('\n').length-1;
            if (end_column0 <= 0 && end_line0 >= nlines) {
                throw 'continuable REPL input';
            }
        }

        var loc = vm.lang.Location0(container,
                                 start_line0,
                                 start_column0,
                                 end_line0,
                                 end_column0);

        vm.syntaxError(loc, error_kind + ": ", msg);
    }

    return compilationError
}

function runtime_get_syntaxError_thrower(compilationError) {
    function syntaxError(start_line0,
                         start_column0,
                         end_line0,
                         end_column0,
                         msg) {
        return compilationError(start_line0,
                         start_column0,
                         end_line0,
                         end_column0,
                         "SyntaxError",
                         msg)
    }

    return syntaxError
}

// FFI
var host_eval = eval;

var _foreign_counter = 0;
function gen_foreign() { return "___f" + _foreign_counter++; }

// Host type predicates available to pyinterp
// is_host_foo => foo is the Python type name
function is_host_bool(obj) {
    return typeof obj === "boolean";
}
function is_host_str(obj) {
    return typeof obj === "string";
}
function is_host_function(obj) {
    return typeof obj === "function";
}
function is_host_float(obj) {
    return (typeof obj === "number") && !Number.isInteger(obj);
}
function is_host_list(obj) {
    return obj instanceof Array;
}
function is_host_dict(obj) {
    return obj instanceof Object;
}
function is_host_int(obj) {
    return Number.isInteger(obj);
}

// Convert a pyinterp object to a JS object
function py2host(obj) {
    var type = (t) => pyinterp.om_isinstance(obj, t);

    if (type(pyinterp.class_int)) {
        return int_to_num(obj.value);
    }
    if (type(pyinterp.class_float)) {
        return obj.value;
    }
    if (type(pyinterp.class_str)) {
        return obj.value;
    }
    if (type(pyinterp.class_tuple)) {
        return obj.seq.map(py2host);
    }
    if (type(pyinterp.class_list)) {
        return obj.seq.map(py2host);
    }
    // TODO: dicts
    if (type(pyinterp.class_bool)) {
        return obj.value && true;
    }
    if (type(pyinterp.class_NoneType)) {
        return null
    }
}

// Convert a JS object to a pyinterp object
function host2py(obj) {
    if (typeof obj === "boolean") {
        return pyinterp.om_bool(true && obj);
    }
    if (typeof obj === "number") {
        if (Number.isInteger(obj)) {
            return pyinterp.om_int(obj);
        }
        return pyinterp.om_float(obj);
    }
    if (typeof obj === "string") {
        return pyinterp.om_str(obj);
    }
    if (typeof obj === "function") {
        return host_function2py(obj);
    }
    if (obj instanceof Array) {
        return pyinterp.om_list(obj.map(host2py));
    }
    if ((obj === null) || (obj === undefined)) {
        return pyinterp.om_None;
    }
    // This comes last to match only dicts
    if (obj instanceof Object) {
        return pyinterp.om_str("object conversion not implemented");
    }
}

// Convert a JS function to a pyinterp function
function host_function2py(fn) {
    var name = gen_foreign();
    var signature = pyinterp.make_vararg_only_signature('args');
    function code(rte, cont) {
        var fn_args = py2host(pyinterp.rte_lookup_locals(rte, 'args'));
        var result = host2py(fn.apply(null, fn_args));
        return pyinterp.unwind_return(rte, result);
    }
    return pyinterp.om_make_builtin_function_with_signature(name, code, signature);
}
