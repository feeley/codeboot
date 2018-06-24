/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot Bultins Functionalities --
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER INxk
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * builtins.js
 *
 * Authors:
 * - Olivier Dion <olivier.dion@polymtl.ca>
 */


// JavaScript builtins

// print
function builtin_print() {
    cb.addTranscriptREPL(Array.prototype.slice.call(arguments).join('') + '\n',
                         'cb-repl-output');
    cb.programState.rte.step_limit = -1; // force exit of trampoline
}

builtin_print.toString = function () {
    return 'function print(value) { ... }';
};


function builtin_help() {}

builtin_help.toString = function () {
    return Object.keys(cb.builtins).sort().map((k)=>{return '- '+k;}).join('\n');
}


// alert
function builtin_alert() {
    return alert.apply(cb.hostGlobalObject, arguments);
}

builtin_alert.toString = function () {
    return 'function alert(value) { ... }';
};



// prompt
function builtin_prompt() {
    return prompt.apply(cb.hostGlobalObject, arguments);
}

builtin_prompt.toString = function () {
    return 'function prompt(value) { ... }';
};



// confirm
function builtin_confirm() {
    return confirm.apply(cb.hostGlobalObject, arguments);
}

builtin_confirm.toString = function () {
    return 'function confirm(value) { ... }';
};



// load
builtin_load.toString = function () {
    return 'function load(filename) { ... }';
};



// pause
builtin_pause.toString = function () {
    return 'function pause() { ... }';
};



// assert
builtin_assert.toString = function () {
    return 'function assert(condition) { ... }';
};



// setScreenMode

builtin_setScreenMode.toString = function () {
    return 'function setScreenMode(width, height) { ... }';
};



// getScreenWidth

builtin_getScreenWidth.toString = function () {
    return 'function getScreenWidth() { ... }';
};



// getScreenHeight

builtin_getScreenHeight.toString = function () {
    return 'function getScreenHeight() { ... }';
};



// setPixel
builtin_setPixel.toString = function () {
    return 'function setPixel(x, y, color) { ... }';
};



// exportScreen
builtin_exportScreen.toString = function () {
    return 'function exportScreen() { ... }';
};



// cs
builtin_cs.toString = function () {
    return 'function cs() { ... }';
};



// pu
builtin_pu.toString = function () {
    return 'function pu() { ... }';
};



// pd
builtin_pd.toString = function () {
    return 'function pd() { ... }';
};



// st
builtin_st.toString = function () {
    return 'function st() { ... }';
};



// ht
builtin_ht.toString = function () {
    return 'function ht() { ... }';
};



// fd
builtin_fd.toString = function () {
    return 'function fd(xdistance, ydistance) { ... }';
};



// bk
builtin_bk.toString = function () {
    return 'function bk(xdistance, ydistance) { ... }';
};



// mv
builtin_mv.toString = function () {
    return 'function mv(x, y) { ... }';
};



// lt
builtin_lt.toString = function () {
    return 'function lt(angle) { ... }';
};



// rt
builtin_rt.toString = function () {
    return 'function rt(angle) { ... }';
};


// setpc
builtin_setpc.toString = function () {
    return 'function setpc(r, g, b) { ... }';
};


// setpw
builtin_setpc.toString = function () {
    return 'function setpw(width) { ... }';
};


// drawtext
builtin_drawtext.toString = function () {
    return 'function drawtext(text) { ... }';
};



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

        var result = setTimeout.apply(cb.hostGlobalObject, [f, delay]);

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

// clearTimeout
function builtin_clearTimeout(timeoutID) {
    var hostGlobalObject = (function () { return this; }());
    return clearTimeout.apply(hostGlobalObject, [timeoutID]);
}

builtin_clearTimeout.toString = function () {
    return 'function clearTimeout(timeoutID) { ... }';
};

// readFile
builtin_readFile.toString = function () {
    return 'function readFile(filename) { ... }';
};

// writeFile
builtin_writeFile.toString = function () {
    return 'function writeFile(filename, content) { ... }';
};


function __importFromHost(id) {
    cb.builtins[id] = cb.hostGlobalObject[id];
}


function __exportToHost(id) {

    cb.hostGlobalObject[id] = function () {
	var fn = cb.getGlobal(id);
	return fn.apply(cb.hostGlobalObject, arguments);
    };
}

function __registerBuiltin(name, fn) {
    cb.builtins[name] = fn;
}

CodeBoot.prototype.generateBuiltins = (function () {

    /**
     *  - To add a function to export to host:
     *        Add the function' name to export_str.
     */
    const export_str = ['clic',
			'init'];

    /**
     *  - To add a function to import to host:
     *        Add the function' name to import_str.
     */
    const import_str = ['NaN',
			'Infinity',
			'undefined',
			'parseInt',
			'parseFloat',
			'isNaN',
			'isFinite',
			'decodeURI',
			'encodeURI',
			'decodeURIComponent',
			'encodeURIComponent',
			'Object',
			'Function',
			'Array',
			'String',
			'Boolean',
			'Number',
			'Date',
			'RegExp',
			'Error',
			'EvalError',
			'RangeError',
			'ReferenceError',
			'SyntaxError',
			'TypeError',
			'URIError',
			'Math',
			'JSON',
			'document'];

    /**
     * - To add a builtin function:
     *         Add an array with the name of the function at the first index and a
     *         reference to the function to call at the second index.
     */
    const builtins = [['print', builtin_print],
		      ['help', builtin_help],
		      ['alert', builtin_alert],
		      ['prompt', builtin_prompt],
		      ['confirm', builtin_confirm],
		      ['load', builtin_load],
		      ['pause', builtin_pause],
		      ['assert', builtin_assert],
		      ['setScreenMode', builtin_setScreenMode],
		      ['getScreenWidth', builtin_getScreenWidth],
		      ['getScreenHeight', builtin_getScreenHeight],
		      ['setPixel', builtin_setPixel],
		      ['exportScreen', builtin_exportScreen],
		      ['cs', builtin_cs],
		      ['pu', builtin_pu],
		      ['pd', builtin_pd],
		      ['st', builtin_st],
		      ['ht', builtin_ht],
		      ['fd', builtin_fd],
		      ['bk', builtin_bk],
		      ['mv', builtin_mv],
		      ['lt', builtin_lt],
		      ['rt', builtin_rt],
		      ['setpc', builtin_setpc],
		      ['setpw', builtin_setpw],
		      ['drawtext', builtin_drawtext],
		      ['setTimeout', builtin_setTimeout],
		      ['clearTimeout', builtin_clearTimeout],
		      ['readFile', builtin_readFile],
		      ['writeFile', builtin_writeFile]];

    return function () {
	export_str.forEach((id)=>{__exportToHost(id);});
	import_str.forEach((id)=>{__importFromHost(id);});
	builtins.forEach((fn)=>{__registerBuiltin(fn[0], fn[1]);});
    };
}());


CodeBoot.prototype.clone = function(obj) {
    return Object.assign({}, obj);
};
