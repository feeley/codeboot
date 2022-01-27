// codeBoot state

function CodeBoot() {

    var cb = this;

    cb.version = '3.1.12';

    cb.cmds = null;
    cb.cmds_valid = false;
    cb.privkey = null;

    cb.mouse = { x: 0,
                 y: 0,
                 button: 0,
                 shift: false,
                 ctrl: false,
                 alt: false
               };

    document.addEventListener('DOMContentLoaded', e => cb.loaded());
}

// Dispatch the preinit event depending on environnement and setup environnement
CodeBoot.prototype.loaded = function () {

    var cb = this

    if (typeof Reveal !== 'undefined'){
        console.log("Reveal js detected... initilizing codeboot after its initialization")

        // Only start initilizing codeboot once reveal.js is ready
        Reveal.on('ready', e => cb.preInit())

        // refresh codemirror each time we change page see
        // https://github.com/codemirror/CodeMirror/issues/61
        Reveal.on('slidechanged', e =>
            e.currentSlide.querySelectorAll('.CodeMirror')
             .forEach(x => x.CodeMirror.refresh()))
    }
    else{
        cb.preInit()
    }

}

// Function that pre-initialize codeboot
CodeBoot.prototype.preInit = function () {

    var cb = this

    cb.rewrite_event_handlers(null, document.body);

    function done() {
        cb.init();
    }

    var search = window.location.search;

    if (search && search.slice(0, 6) === '?init=') {

        var init_str = search.slice(6);
        var parts = init_str.split(',');
        var cmds = parts.slice(1);
        var cmds_str = cmds.join(',');
        var signature = fromSafeBase64ToUint8Array(parts[0]);
        var i = 0;

        cb.cmds = cmds;

        cb.verify(toUint8Array(cmds_str),
            signature,
            function (isValid) {
                cb.cmds_valid = isValid;
                done();
            });
    } else {
        done();
    }

}

CodeBoot.prototype.cb = new CodeBoot();

CodeBoot.prototype.setupBeforeunloadHandling = function () {

    var cb = this;

    window.addEventListener('beforeunload', function (event) {
        return cb.beforeunloadHandler(event);
    });
};

CodeBoot.prototype.setupMouseMotionTracking = function (elem) {

    var cb = this;

    elem.addEventListener('mousemove', function (event) {
        cb.trackMouseMove(event);
    });
};

CodeBoot.prototype.setupMouseClickTracking = function (elem) {

    var cb = this;

    elem.addEventListener('mousemove', function (event) {
        cb.trackMouseMove(event);
    });

    elem.addEventListener('mouseup', function (event) {
        cb.trackMouseUp(event);
    });

    elem.addEventListener('mousedown', function (event) {
        cb.trackMouseDown(event, event.buttons>1 ? 2 : event.buttons);
    });

    elem.addEventListener('contextmenu', function (event) {
        cb.preventContextMenu(event);
    });
};

CodeBoot.prototype.trackMouseMove = function (event) {

    var cb = this;

    cb.mouse.x = event.pageX;
    cb.mouse.y = event.pageY;
};

CodeBoot.prototype.trackMouseUp = function (event) {

    var cb = this;

    cb.mouse.button = 0;
};

CodeBoot.prototype.trackMouseDown = function (event, button) {

    var cb = this;

    cb.mouse.button = button;
    cb.mouse.shift  = event.shiftKey;
    cb.mouse.ctrl   = event.ctrlKey;
    cb.mouse.alt    = event.altKey;
};

CodeBoot.prototype.preventContextMenu = function (event) {

    var cb = this;

    if (event.buttons & 2) {
        // secondary button was probably pressed
        cb.trackMouseDown(event, 2);
    }

    event.preventDefault(); // don't show context menu
};

CodeBoot.prototype.keyAlgo = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 768,
    publicExponent: new Uint8Array([1,0,1]),
    hash: {
        name: 'SHA-1'
    }
};

CodeBoot.prototype.pubkeys = [
    'MHwwDQYJKoZIhvcNAQEBBQADawAwaAJhAK2DURk0UzQSBUG8He9PziYJGn-Rkv68jEORAhmskprssApZHSADNK4hdQndCOGtbAvQqjRpf2Qq0MM2UIRxruUKApxX9hfw1ShNbijY5NgUugA9ON4KpxzFEY8_fk6WDQIDAQAB',
    'MHwwDQYJKoZIhvcNAQEBBQADawAwaAJhAMbz-ADO_hOhaSYQ9YsX9YNEorprFex30r42SB-ImT1TtsHl2uO9ciRDcFSAbj5ocZlrcL3v961L6TcUAzny7EdDGD8NoLe8q2IiCWfGzgroyVffnECdOJw8VaO3_1HWdQIDAQAB',
    'MHwwDQYJKoZIhvcNAQEBBQADawAwaAJhALyZszW7qTwl39Cc3xOYNbA9G_-ignhoCWlKPupsLpXGpmKmZuffcEAM8GbmeGBoEWv2SDzITVBlEf2okVf3ipx_JHcEG-tCvxugkwyS_uk8CiFZn9SpKM6VHFXDuOfYHQIDAQAB'
];

CodeBoot.prototype.keyGen = function () {

    var cb = this;

    function succeed(privkey, pubkey) {
        console.log('privkey: ' +
                    toSafeBase64FromUint8Array(new Uint8Array(privkey)));
        console.log('pubkey: ' +
                    toSafeBase64FromUint8Array(new Uint8Array(pubkey)));
    }

    function fail(err) {
        console.log(err);
        console.log('failed to generate keys');
    }

    if (window.crypto && window.crypto.subtle) {

        var crypto = window.crypto.subtle;

        crypto.generateKey(
            CodeBoot.prototype.keyAlgo,
            true,
            ['sign', 'verify']).then(
                function (key) {
                    console.log(key);
                    crypto.exportKey(
                        'pkcs8',
                        key.privateKey).then(function (privkey) {
                            console.log(privkey);
                            crypto.exportKey(
                                'spki',
                                key.publicKey).then(function (pubkey) {
                                    console.log(pubkey);
                                    succeed(privkey, pubkey);
                                }).catch(function (err) {
                                    fail(err);
                                })
                        }).catch(function (err) {
                            fail(err);
                        })
                }).catch(function (err) {
                    fail(err);
                })
    } else {
        fail(null);
    }
};

CodeBoot.prototype.withKey = function (b64, priv, succeed, fail) {

    var cb = this;

    if (window.crypto && window.crypto.subtle) {

        var crypto = window.crypto.subtle;

        crypto.importKey(
            priv ? 'pkcs8' : 'spki',
            fromSafeBase64ToUint8Array(b64),
            CodeBoot.prototype.keyAlgo,
            false, // not extractable
            [priv ? 'sign' : 'verify']).then(succeed).catch(fail);
    } else {
        fail(null);
    }
};

CodeBoot.prototype.signWithKey = function (data, key, cont) {

    var cb = this;

    function fail(err) {
        cont(null);
    }

    if (window.crypto && window.crypto.subtle) {

        var crypto = window.crypto.subtle;

        function succeed(privkey) {

            crypto.sign(
                CodeBoot.prototype.keyAlgo,
                privkey,
                toUint8Array(data)).then(function (signature) {
                    cont(new Uint8Array(signature));
                }).catch(fail);
        }

        cb.withKey(key, true, succeed, fail);
    } else {
        fail(null);
    }
};

CodeBoot.prototype.verifyWithKey = function (data, key, signature, cont) {

    var cb = this;

    function fail(err) {
        cont(false);
    }

    if (window.crypto && window.crypto.subtle) {

        var crypto = window.crypto.subtle;

        function succeed(pubkey) {

            crypto.verify(
                CodeBoot.prototype.keyAlgo,
                pubkey,
                signature,
                toUint8Array(data)).then(function (isValid) {
                    cont(isValid);
                }).catch(fail);
        }

        cb.withKey(key, false, succeed, fail);
    } else {
        fail(null);
    }
};

CodeBoot.prototype.verify = function (data, signature, cont) {

    var cb = this;
    var i = 0;

    function try_next_key() {
        if (i < CodeBoot.prototype.pubkeys.length) {
            cb.verifyWithKey(
                data,
                CodeBoot.prototype.pubkeys[i],
                signature,
                function (isValid) {
                    if (!isValid) {
                        i++;
                        try_next_key();
                    } else {
                        cont(true);
                    }
                });
        } else {
            cont(false);
        }
    }

    try_next_key();
};

CodeBoot.prototype.ajax = function (url, data, timeout, success, fail) {

    var cb = this;
    var xhr = new XMLHttpRequest();

    xhr.timeout = timeout;

    xhr.onload    = function () { success(xhr.responseText); };
    xhr.ontimeout = function () { fail('timeout'); };
    xhr.onerror   = function () { fail('error'); };

    if (data === null) {
        console.log('GET ' + url);
        xhr.open('GET', url, true);
    } else {
        console.log('POST ' + url);
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.send(data);

    return xhr;
};

CodeBoot.prototype.init = function () {

    var cb = this;

    cb.setupBeforeunloadHandling();
    cb.setupMouseMotionTracking(document.body);

    cb.setupAllVM(document);

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    })

/*
    window.onbeforeunload = function () {
        if (cb.saveInProgress) {
            cb.saveInProgress = false;
            return undefined;
        }
        if (!cb.devMode) {
            return 'Your codeBoot session will be lost.'
        } else {
            return undefined;
        }
    };

    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }
*/
//    cb.handle_query();
}

CodeBoot.prototype.saveAllVM = function () {

    var cb = this;

    for (var id in CodeBoot.prototype.vms) {
        var vm = CodeBoot.prototype.vms[id];
        vm.saveSession();
    }
};

CodeBoot.prototype.collectScripts = function (elem, script_type, cont) {

    var cb = this;

    var nb_scripts = 0;
    var source = '';
    var script_elems = elem.querySelectorAll('script');
    var index = 0;

    function loop() {
        if (index < script_elems.length) {
            var script = script_elems[index++];
            if (script.getAttribute('type') !== script_type) {
                loop();
            } else if (script.hasAttribute('src')) {
                cb.ajax(script.getAttribute('src'),
                        null,
                        10000, // timeout = 10 seconds
                        function (text) {
                            nb_scripts++;
                            source += text;
                            loop();
                        },
                        function (reason) {
                            loop();
                        });
            } else {
                nb_scripts++;
                source += script.innerText + '\n';
                loop();
            }
        } else if (nb_scripts === 0) {
            cont(null);
        } else {
            cont(source);
        }
    }

    loop();
};

CodeBoot.prototype.setupAllVM = function (elem) {

    var cb = this;

    function done() {
        elem.querySelectorAll('.cb-vm').forEach(function (root) {
            if (!getCodeBootVM(root)) {
                var opts = { root: root };
                var cmds = CodeBoot.prototype.cb.cmds;
                if (cmds) {
                    CodeBoot.prototype.cb.cmds = null;
                    opts.cmds = cmds;
                }
                new CodeBootVM(opts);
            }
        });
    }

    var langs = [];
    var index = 0;
    Lang.prototype.forEachRegisteredLang(function (lang) { langs.push(lang); });

    function loop() {
        if (index < langs.length) {
            var lang = langs[index++];
            var script_type = lang.prototype.getScriptType();
            cb.collectScripts(
                document,
                script_type,
                function (source) {
                    if (source !== null) {
                        var levels = lang.prototype.getLevels();
                        var exts = lang.prototype.getExts();
                        var cmds = ['F' + toSafeBase64('script' + exts[0]),
                                    toSafeBase64(source),
                                    'e'];
                        var opts = {
                            lang: lang.prototype.getId() + '-' +
                                Object.keys(levels)[0],
                            cmds: cmds,
                            hidden: true,
                            floating: true,
                            persistent: false
                        };
                        new CodeBootVM(opts);
                    }
                    loop();
                });
        } else {
            done();
        }
    }

    loop();
};

CodeBoot.prototype.vms = {};
CodeBoot.prototype.vmsCreated = 0;
CodeBoot.prototype.vmCount = 0;

CodeBoot.prototype.zIndexFromLevel = function (level) {
    return 1000 * level;
};

CodeBoot.prototype.registerVM = function (vm) {

    var cb = this;

    vm.zIndex = cb.zIndexFromLevel(CodeBoot.prototype.vmCount);

    if (vm.zIndex !== 0) {
        vm.root.style.zIndex = vm.zIndex;
    }

    CodeBoot.prototype.vms[vm.id] = vm;
    CodeBoot.prototype.vmCount++;
};

CodeBoot.prototype.bringToFront = function (vm) {

    var cb = this;

    var vms = Object.values(CodeBoot.prototype.vms);

    //console.log('==> ' + vm.zIndex + ' ' + vm.root.style.zIndex + ' ' + cb.zIndexFromLevel(CodeBoot.prototype.vmCount-1));

    if (vm.zIndex === cb.zIndexFromLevel(CodeBoot.prototype.vmCount-1))
        return false;

    vm.zIndex = Infinity;

    cb.refreshZIndex();

    return true;
};

CodeBoot.prototype.refreshZIndex = function () {

    var cb = this;

    var vms = Object.values(CodeBoot.prototype.vms);

    vms.sort(function (a, b) {
        return (a.zIndex < b.zIndex) ? -1 : 1;
    });

    for (var level=0; level<vms.length; level++) {
        var vm = vms[level];
        var zIndex = cb.zIndexFromLevel(level);
        vm.zIndex = zIndex;
        vm.root.style.zIndex = zIndex;
    }
};

function getCodeBootVM(elem) {

    var vm = undefined;

    if (elem !== undefined) {
        var root = elem.closest('.cb-vm'); // find enclosing cb-vm element
        if (!root) {
            root = elem.querySelector('.cb-vm'); // find enclosed cb-vm element
        }
        if (root) {
            vm = CodeBoot.prototype.vms['#' + root.getAttribute('id')];
        }
    }

    return vm;
};

CodeBoot.prototype.beforeunloadHandler = function (event) {

    var cb = this;

    cb.saveAllVM();
    event.preventDefault();
    event.returnValue = '';
    return 'your session will be lost';
};

// CodeBoot virtual machines encapsulate an execution environment

function CodeBootVM(opts) {

    var vm = this;

    if (opts === undefined)
        opts = {};

    var cb;

    if (opts.cb === undefined)
        cb = CodeBoot.prototype.cb;
    else
        cb = opts.cb;

    var root;

    if (opts.root === undefined)
        root = document.createElement('div');
    else
        root = opts.root;

    var index = ++cb.vmsCreated;
    var id = 'cb-vm-' + index; // default id

    if (root.hasAttribute('id')) {
        id = root.getAttribute('id');
    } else {
        if (opts.id)
            id = opts.id;
        root.setAttribute('id', id);
    }

    function get_option(name, attr, default_value) {
        var result = opts[name];
        if (result === undefined && attr !== null) {
            if (root.hasAttribute(attr)) {
                if (typeof(default_value) === 'boolean') {
                    result = true;
                } else if (typeof(default_value) === 'number') {
                    result = +root.getAttribute(attr);
                } else {
                    result = root.getAttribute(attr);
                }
            } else {
                result = default_value;
            }
        } else if (typeof(result) == 'string') {
            if (typeof(default_value) === 'boolean') {
                result = (result === 'true');
            } else if (typeof(default_value) === 'number') {
                result = +result;
            }
        }
        return result;
    }

    function get_option_attr(name, attr, default_value) {
        var result = get_option(name, attr, default_value);
        vm.setAttribute(attr, result);
        return result;
    }

    function set_options(opts) {
        var cmds = opts.cmds;
        if (cmds) {
            opts.persistent = false; // default is to not load/save session
            opts.cmds = [];
            for (var i=0; i<cmds.length; i++) {
                var cmd = cmds[i];
                var colon = cmd.indexOf(':');
                if (colon > 0) {
                    var name = cmd.slice(0, colon);
                    var value = cmd.slice(colon+1);
                    opts[name] = value;
                } else {
                    opts.cmds.push(cmd);
                }
            }
        }
    }

    set_options(opts);

    id = '#' + id;

    vm.id    = id;     // id of this VM, typically '#cb-vm-N'
    vm.cb    = cb;     // CodeBoot container
    vm.root  = root;   // DOM element with class 'cb-vm'
    vm.index = index;  // sequence number, typically the N in the id
    vm.langs = {};     // language instances in use
    vm.lang  = null;   // reference to instance of Lang
    vm.level = null;   // the selected level of the language
    vm.vmClone = null;
    vm.isOpen = true;
    vm.embedded = false; // assume the vm is not embedded. Will be if pre tag is used

    vm.storageId = get_option_attr('storageId', 'data-cb-storage-id', id);
    vm.minWidth  = get_option_attr('minWidth', 'data-cb-min-width', 575);
    vm.minHeight = get_option_attr('minHeight', 'data-cb-min-height', 400);
    vm.resizable = get_option_attr('resizable', 'data-cb-resizable', false);
    vm.editable  = get_option_attr('editable', 'data-cb-editable', true);

    get_option_attr('showHeader', 'data-cb-show-header', false);
    get_option_attr('showFooter', 'data-cb-show-footer', false);
    get_option_attr('showConsole', 'data-cb-show-console', false);
    get_option_attr('showReplContainer', 'data-cb-show-repl-container', false);
    get_option_attr('showPlayground', 'data-cb-show-playground', false);
    get_option_attr('showEditors', 'data-cb-show-editors', false);

    get_option_attr('showClone', 'data-cb-show-clone', false);

    new CodeBootFileSystem(vm); // initializes vm.fs

    vm.devMode = false;
    vm.showLineNumbers = undefined;
    vm.largeFont = undefined;
    vm.animationSpeed = undefined;
    vm.stepDelay = normalStepDelay;
    vm.stepDelayForEventHandler = normalStepDelay;
    vm.pauseAtStepCount = Infinity;

    vm.saveInProgress = false;
    vm.lastFocusedEditor = null;
    vm.allowLosingFocus = true;

    vm.latestProcessEvent = '';
    vm.latestProcessEventRepeat = 0;
    vm.latestExecEvent = '';

    vm.force_reset = true;

    vm.repl = null;

    vm.lastAST = null;
    vm.lastSource = null;
    vm.lastResult = null;
    vm.lastResultRepresentation = null;

    vm.setClass('cb-vm', true); // force class in case not yet set

    // get language (default to first registered language and level)
    var id_and_level = get_option('lang', 'data-cb-lang', '');

    id_and_level = Lang.prototype.full(id_and_level);

    vm.setLang(id_and_level);

    var floating =
        get_option_attr('floating', 'data-cb-floating', false);

    var initLast = vm.initRoot(opts, floating);

    if (opts.root === undefined) {
        var parent;
        if (opts.parent === undefined)
            parent = document.body;
        else
            parent = opts.parent;
        parent.appendChild(vm.root);
    }

    cb.registerVM(vm);

    if (cb.vmsCreated === 1 && !vm.embedded) {
        vm.initCommon(opts);
    }

    vm.initUI();

    vm.setLangUI();

    vm.setupTooltip();

    vm.setupEventHandlers();

    vm.enterMode(vm.modeStopped());

    vm.replAllowInput();
    vm.replFocus();

    vm.setDevMode(
        get_option('devMode', 'data-cb-dev-mode', false));

    vm.setShowLineNumbers(
        get_option('showLineNumbers', 'data-cb-show-line-numbers', false));

    vm.setLargeFont(
        get_option('largeFont', 'data-cb-large-font', false));

    vm.setAnimationSpeed(
        get_option('animationSpeed', 'data-cb-animation-speed', 'normal'));

    vm.setHidden(
        get_option_attr('hidden', 'data-cb-hidden', false));

    vm.setFloating(floating);

    if (get_option('persistent', 'data-cb-persistent', true)) {
        vm.beginSession();
    }

    vm.updatePlayground();

    initLast();

    if (opts.input !== undefined)
        vm.replSetInput(opts.input);

    if (opts.event !== undefined)
        vm.execEvent(opts.event);

    if (opts.cmds !== undefined)
        vm.execCommands(opts.cmds);

    if (cb.vmsCreated === 1) {
        var handlers = CodeBoot.prototype.onload_handlers;
        CodeBoot.prototype.onload_handlers = [];
        handlers.forEach(function (descr) {
            CodeBoot.prototype.event_handle({ target: descr.elem }, descr.id);
        });
    }
};

CodeBootVM.prototype.execCommands = function (cmds) {

    var vm = this;

    var fileToActivate = null;

    for (var i=0; i<cmds.length; i++) {
        var cmd = cmds[i];
        var op = cmd[0];
        switch (op) {
        case 'i': // add input
            var input = fromSafeBase64(cmd.slice(1));
            vm.replSetInput(input);
            vm.repl.focus();
            fileToActivate = null;
            break;
        case 'f': // create a file
        case 'F':
            i++;
            if (i<cmds.length) {
                var filename = fromSafeBase64(cmd.slice(1));
                var content = fromSafeBase64(cmds[i]);
                var file = vm.fs.createFile(filename, content);
                file.fe.edit();
                if (op === 'F') {
                    fileToActivate = file;
                } else if (fileToActivate !== null) {
                    fileToActivate.fe.activate();
                }
            }
            break;
        case 'e': // eval
        case 'a': // animate
            var pauseAtStepCount = Infinity;
            if (cmd.length > 1) {
                pauseAtStepCount = +cmd.slice(1);
            }
            if (!(pauseAtStepCount > 0)) {
                vm.showTryMeTooltip();
            } else {
                vm.pauseAtStepCount = pauseAtStepCount;
            }
            if (op === 'e') {
                vm.execEvent('eval');
            } else {
                vm.execEvent('animate');
            }
            break;
        }
    }
};

CodeBootVM.prototype.toURL = function (executable, cont) {

    var vm = this;

    var loc = window.location;
    var location = loc.protocol + '//' + loc.host + loc.pathname;

    var cmds = [];

    if (vm.root.hasAttribute('data-cb-show-line-numbers')) {
        cmds.push('showLineNumbers:true');
    }

    if (vm.root.hasAttribute('data-cb-large-font')) {
        cmds.push('largeFont:true');
    }

    if (vm.root.hasAttribute('data-cb-hidden')) {
        cmds.push('hidden:true');
    }

    if (vm.root.hasAttribute('data-cb-floating')) {
        cmds.push('floating:true');
    }

    vm.forEachElem('.cb-file-tab', function (elem) {
        var label = elem.querySelector('.cb-tab-label');
        if (label) {
            var file = vm.fs.getByName(label.innerText);
            if (file) {
                cmds.push((file.fe.isActivated() ? 'F' : 'f') +
                          toSafeBase64(file.filename) + ',' +
                          toSafeBase64(file.getContent()));
            }
        }
    });

    if (executable) {
        cmds.push('e');
    } else if (vm.ui.mode === vm.modeStepping()) {
        cmds.push('e' + vm.lang.getStepCount());
    } else if (vm.ui.mode === vm.modeAnimating() && vm.stepDelay > 0) {
        if (vm.animationSpeed !== 'normal') {
            cmds.push('animationSpeed:' + vm.animationSpeed);
        }
        cmds.push('a');
    }

    var cmds_str = ',' + cmds.join(',');

    function fail() {
        alert('Error while signing commands');
    }

    if (vm.cb.privkey) {
        vm.cb.signWithKey(
            toUint8Array(cmds_str),
            vm.cb.privkey,
            function (signature) {
                if (signature) {
                    var url = location + '?init=' + toSafeBase64FromUint8Array(signature) + cmds_str;
                    cont(url);
                } else {
                    cont(null);
                }
            });
    } else {
        cont(null);
    }
};

CodeBootVM.prototype.beginSession = function () {

    var vm = this;

    vm.loadSession();
    vm.setupNextSaveSession();
};

CodeBootVM.prototype.setupNextSaveSession = function () {

    var vm = this;

    vm.afterDelay(function () {
        vm.setupNextSaveSession();
        vm.saveSession();
    }, 60000); // save session every minute
};

CodeBootVM.prototype.cloneIsOpen = function () {

    var vm = this;

    return vm.vmClone && vm.vmClone.isOpen;
};

CodeBootVM.prototype.clone = function () {

    var vm = this;

    if (vm.cloneIsOpen()) return;

    var input = vm.replGetInput();
    var fe = vm.fs.fem.currentlyActivated();
    var filename;
    var content;

    if (fe) {
        filename = fe.filename;
        content = fe.file.getContent();
    }

    vm.vmClone =
        new CodeBootVM({
            parent: vm.root,
            lang: vm.lang.getId() + '-' + vm.level,
            input: input ? input : undefined,
            filename: filename ? filename : undefined,
            content: content ? content : undefined,
            floating: true,
            resizable: true
        });
};

CodeBootVM.prototype.close = function () {

    var vm = this;

    vm.remove();
};

CodeBootVM.prototype.remove = function () {

    var vm = this;

    vm.fs.removeAllEditors();

    if (vm.root.parentNode) {
        vm.root.parentNode.removeChild(vm.root);
    }

    vm.isOpen = false;

    delete CodeBoot.prototype.vms[vm.id];

    CodeBoot.prototype.vmCount--;
};

CodeBootVM.prototype.initUI = function () {

    var vm = this;

    new vm.UI(vm); // initializes vm.ui

    vm.fs.init();
};

// Access to host's globals

CodeBootVM.prototype.hostGlobalObject = (function () {
    if (typeof self !== 'undefined') { return self; }
    else if (typeof window !== 'undefined') { return window; }
    else if (typeof global !== 'undefined') { return global; }
    else return this;
})();

CodeBootVM.prototype.hasHostGlobal = function (id) {
    return Object.prototype.hasOwnProperty.call(CodeBootVM.prototype.hostGlobalObject, id);
};

CodeBootVM.prototype.getHostGlobal = function (id) {
    return CodeBootVM.prototype.hostGlobalObject[id];
};

CodeBootVM.prototype.setHostGlobal = function (id, val) {
    CodeBootVM.prototype.hostGlobalObject[id] = val;
};

// CodeBoot UI

CodeBootVM.prototype.UI = function (vm) {

    var ui = this;

    ui.errorMark = null;
    ui.execStepCounter = vm.root.querySelector('.cb-exec-step-counter');
    ui.execPointMark = null;
    ui.execPointBubble = new CodeBootExecPointBubble(vm);
    ui.timeoutId = null;
    ui.stepDelay = 0;
    ui.mode = null;
    ui.event_queue = [];

    ui.playground_to_show = null;
    ui.playground_showing = undefined;

    ui.dw = new DrawingWindow(vm, 360, 240, 1);
    ui.pw = new PixelsWindow(vm, 16, 12, 20);

    vm.ui = ui;

    var dw_parent = vm.root.querySelector('.cb-drawing-window');

    if (dw_parent) {

        vm.cb.setupMouseClickTracking(dw_parent);

        dw_parent.addEventListener('dblclick', function (event) {
            ui.dw.screenshot(event);
        });
    }

    var pw_parent = vm.root.querySelector('.cb-pixels-window');

    if (pw_parent) {

        vm.cb.setupMouseClickTracking(pw_parent);

        pw_parent.addEventListener('dblclick', function (event) {
            ui.pw.screenshot(event);
        });
    }
};

CodeBootVM.prototype.updateHTMLWindow = function () {

    var vm = this;

    if (vm.root.querySelector('.cb-html-window:empty')) {
        if (vm.ui.playground_showing === 'html' ||
            vm.ui.playground_to_show === 'html') {
            vm.setPlaygroundToShow(null); // hide playground
        }
    } else {
        vm.setPlaygroundToShow('html'); // show HTML window
    }
};

CodeBootVM.prototype.setPlaygroundToShow = function (which) {

    var vm = this;

    vm.ui.playground_to_show = which;
};

CodeBootVM.prototype.updatePlayground = function () {

    var vm = this;
    var to_show = vm.ui.playground_to_show;

    if (vm.ui.playground_showing !== to_show) {

        //TODO: simplify this logic

        switch (to_show) {

        case 'drawing':
            vm.ui.dw.setShow(true);
            break;

        case 'pixels':
            vm.ui.pw.setShow(true);
            break;

        case 'chart':
            vm.ui.dw.setShow(false);
            vm.ui.pw.setShow(false);
            vm.setCheckmark('data-cb-setting-playground', 'show-chart-window', true);
            $('.cb-chart-window').css('display', 'inline');
            $('.cb-html-window').css('display', 'none');
            break;

        case 'html':
            vm.ui.dw.setShow(false);
            vm.ui.pw.setShow(false);
            vm.setCheckmark('data-cb-setting-playground', 'show-html-window', true);
            $('.cb-chart-window').css('display', 'none');
            $('.cb-html-window').css('display', 'inline');
            break;

        default:
            to_show = null;
            vm.setCheckmark('data-cb-setting-playground', 'show-chart-window', false);
            vm.setCheckmark('data-cb-setting-playground', 'show-html-window', false);
            $('.cb-chart-window').css('display', 'none');
            $('.cb-html-window').css('display', 'none');
            vm.ui.dw.setShow(false);
            vm.ui.pw.setShow(false);
            break;
        }

        vm.setAttribute('data-cb-show-playground', to_show !== null);

        vm.ui.playground_showing = to_show;
    }
/*
function update_playground_visibility(vm) {
    var drawing_window_visible =
        $('.cb-drawing-window').css('display') !== 'none';
    var pixels_window_visible =
        $('.cb-pixels-window').css('display') !== 'none';
    $('a[data-cb-setting-playground="show-drawing-window"] > span')
        .css('visibility', drawing_window_visible ? 'visible' : 'hidden');
    $('a[data-cb-setting-playground="show-pixels-window"] > span')
        .css('visibility', pixels_window_visible ? 'visible' : 'hidden');
    if (drawing_window_visible || pixels_window_visible || $('#b').html() !== '') {
        vm.setAttribute('data-cb-show-playground', true);
    } else {
        vm.setAttribute('data-cb-show-playground', false);
    }
}
*/
};

CodeBootVM.prototype.loadLang = function (id) {

    var vm = this;

    if (!Object.prototype.hasOwnProperty.call(vm.langs, id)) {
        vm.langs[id] = Lang.prototype.create(id, vm);
    }

    return vm.langs[id];
};

CodeBootVM.prototype.forEachElem = function (selector, fn) {

    var vm = this;
    var root = vm.root;

    root.querySelectorAll(selector).forEach(fn);
};

CodeBootVM.prototype.withElem = function (selector, fn) {

    var vm = this;
    var root = vm.root;
    var elem = root.querySelector(selector);

    if (elem) fn(elem);
};

CodeBootVM.prototype.setLang = function (id_and_level) {

    var vm = this;
    var x = Lang.prototype.split(id_and_level);
    var id = x.id;
    var level = x.level;

    vm.lang = vm.loadLang(id); // load language
    vm.level = level;

    vm.root.setAttribute('data-cb-lang', id_and_level);
};

CodeBootVM.prototype.setLangUI = function () {

    var vm = this;
    var id_and_level = vm.lang.getId() + '-' + vm.level;

    // Update UI to reflect selected language

    vm.setCheckmark('data-cb-setting-lang', id_and_level, true);

    var svg = vm.lang.getSVG(vm.level);

    vm.forEachElem('.cb-lang-on-light', function (elem) {
        elem.innerHTML = svg.onLight;
    });

    vm.forEachElem('.cb-lang-on-dark', function (elem) {
        elem.innerHTML = svg.onDark;
    });

    vm.replSetup(); // initializes vm.repl
};

CodeBootVM.prototype.setCheckmark = function (setting, value, show) {

    var vm = this;

    // In configuration menu, remove checkmark for this setting

    vm.forEachElem('a[' + setting + '] > .cb-svg-checkmark', function (elem) {
        elem.style.visibility = 'hidden';
    });

    if (show) {

        // In configuration menu, add checkmark for newly selected setting

        vm.forEachElem('a[' + setting + ((typeof(value) === 'string') ? '="' + value + '"' : '') +  '] > svg', function (elem) {
            elem.style.visibility = 'visible';
        });
    }
};

CodeBootVM.prototype.headerHTML = function () {

    var vm = this;

    return '\
<div class="cb-header"></div>\
';
};

CodeBootVM.prototype.menuLangHTML = function () {

    var vm = this;

    return '\
<span class="cb-menu-lang dropdown">\
  <button class="btn btn-secondary cb-button cb-menu-lang-btn" type="button" data-toggle="dropdown" ><span class="cb-lang-on-dark"></span></button>\
  <div class="dropdown-menu cb-menu-settings-lang">\
' + vm.menuSettingsLangHTML() + '\
  <div class="dropdown-divider"></div>\
  <a href="#" class="dropdown-item" data-toggle="modal" data-target="#cb-about-box">' + vm.polyglotHTML('About codeBoot {}', ['v' + CodeBoot.prototype.cb.version]) + '</a>\
  <a href="#" class="dropdown-item" data-toggle="modal" data-target="#cb-help-box">' + vm.polyglotHTML('Help') + '</a>\
  </div>\
</span>\
';
};

CodeBootVM.prototype.menuSettingsLangHTML = function () {

    var vm = this;
    var html = '';

    Lang.prototype.forEachRegisteredLang(function (lang) {
        var id = lang.prototype.getId();
        var levels = lang.prototype.getLevels();
        for (var level in levels) {
            var name = levels[level];
            var id_and_level = id + '-' + level;
            var svg = lang.prototype.getSVG(level, false);
            html += '<a href="#" class="dropdown-item" data-cb-setting-lang="' +
                    id_and_level +
                    '">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' +
                    svg.onLight + '</i>&nbsp;&nbsp;' + name + '</a>';
        }
    });

    return html;
};

CodeBootVM.prototype.menuFileHTML = function () {

    var vm = this;

    return '\
<span class="cb-menu-file dropdown">\
  <button class="btn btn-secondary cb-button cb-menu-file-btn" type="button" data-toggle="dropdown">' + vm.SVG['file'] + '</button>\
  <div class="dropdown-menu cb-file-selection"></div>\
</span>\
';
};

CodeBootVM.prototype.menuSettingsHTML = function () {

    var vm = this;

    return '\
<span class="cb-menu-settings dropdown">\
\
  <button class="btn btn-secondary cb-button cb-menu-settings-btn" type="button" data-toggle="dropdown">' + vm.SVG['gears'] + '</button>\
  <div class="dropdown-menu">\
\
    <h5 class="dropdown-header">' + vm.polyglotHTML('Animation speed') + '</h5>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="slow">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Slow') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="normal">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Normal') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="fast">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Fast') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="lightning">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Lightning') + '</a>\
\
    <div class="dropdown-divider"></div>\
\
    <h5 class="dropdown-header">' + vm.polyglotHTML('Editing') + '</h5>\
    <a href="#" class="dropdown-item" data-cb-setting-show-line-numbers>' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Line numbers') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-large-font>' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Large font') + '</a>\
\
    <div class="dropdown-divider"></div>\
\
    <h5 class="dropdown-header">' + vm.polyglotHTML('Playground') + '</h5>\
    <a href="#" class="dropdown-item" data-cb-setting-playground="show-drawing-window">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Show drawing window') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-playground="show-pixels-window">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Show pixels window') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-playground="show-chart-window">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Show chart window') + '</a>\
    <a href="#" class="dropdown-item" data-cb-setting-playground="show-html-window">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.polyglotHTML('Show HTML window') + '</a>\
\
    <div class="dropdown-divider"></div>\
\
    <h5 class="dropdown-header">' + vm.polyglotHTML('Language') + '</h5>\
' + vm.langsUI.map(function (x) { return '    <a href="#" class="dropdown-item" data-cb-setting-ui-lang="' + x[0] + '">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;' + vm.escapeHTML(x[1]) + '</a>\n'; }).join('') + '\
\
  </div>\
</span>\
';
};

CodeBootVM.prototype.menuContextHTML = function () {

    var vm = this;

    return '\n\
<div class="cb-menu-context dropdown-menu" style="display: none;">\n\
\n\
  <a href="#" class="dropdown-item" data-cb-context-presentation="full">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Full window</a>\n\
\n\
  <a href="#" class="dropdown-item" data-cb-context-presentation="floating">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Floating window</a>\n\
\n\
  <a href="#" class="dropdown-item" data-cb-context-presentation="hidden">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Hide codeBoot</a>\n\
\n\
  <a href="#" class="dropdown-item" data-cb-context-bundle-state>' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Bundle state to clipboard</a>\n\
\n\
  <a href="#" class="dropdown-item" data-cb-context-bundle-executable>' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Bundle executable to clipboard</a>\n\
\n\
</div>\n\
';
};

CodeBootVM.prototype.menuHTML = function () {

    var vm = this;

    return '\
<div class="cb-menu">\
' + vm.menuLangHTML() + vm.menuFileHTML() + vm.menuSettingsHTML() + '\
</div>\
';
};

CodeBootVM.prototype.modalDialogHTML = function () {

    var vm = this;

    return '\
\
<div class="cb-modal-dialog modal" role="dialog" tabindex="-1">\
  <div class="modal-dialog modal-dialog-centered">\
    <div class="modal-content">\
      <div class="modal-body"></div>\
      <div class="modal-footer"></div>\
    </div>\
  </div>\
</div>\
\
';
}

CodeBootVM.prototype.helpHTML = function () {

    var vm = this;

    return '\
\
<div id="cb-about-box" class="modal fade" role="dialog">\
  <div class="modal-dialog modal-dialog-centered">\
    <div class="modal-content">\
      <div class="modal-header">\
        <h4 class="modal-title">About codeBoot</h4>\
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
          <span aria-hidden="true">&times;</span>\
        </button>\
      </div>\
      <div class="modal-body">\
        <svg class="cb-svg-udem-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 102"><g><path fill="#0059AB" d="M208.673,49.313v13.49l0.028,0.502l-0.521-0.033h-6.538l-0.516,0.033l0.028-0.502v-12.3 c0-3.59-2.063-5.301-4.612-5.301c-2.541,0-4.599,1.711-4.599,5.301v12.3l0.023,0.502l-0.516-0.033h-6.539l-0.521,0.033l0.038-0.502 v-12.3c0-6.698,5.423-12.126,12.112-12.126c2.85,0,5.47,0.994,7.537,2.634l0.149,0.45l0.141-0.441 c0.216-0.234,0.427-0.45,0.666-0.661l0.44-0.108l-0.412-0.178c-1.786-2.001-2.893-4.631-2.893-7.514V5.664l-0.023-0.515 l0.521,0.023h6.534l0.516-0.023L209.7,5.664V32.56c0,2.92,1.668,4.308,3.745,4.308c2.063,0,3.74-1.387,3.74-4.308V5.664 l-0.028-0.515l0.525,0.023h6.543l0.511-0.023l-0.037,0.515V32.56c0,2.883-1.097,5.512-2.878,7.514l-0.417,0.178l0.454,0.108 c0.226,0.211,0.44,0.426,0.656,0.661l0.146,0.441l0.136-0.45c2.081-1.641,4.697-2.634,7.542-2.634 c6.698,0,12.117,5.428,12.117,12.126v12.3l0.037,0.502l-0.521-0.033h-6.538l-0.521,0.033l0.032-0.502v-12.3 c0-3.59-2.063-5.301-4.607-5.301c-2.55,0-4.612,1.711-4.612,5.301v12.3l0.028,0.502l-0.511-0.033h-6.544l-0.516,0.033l0.038-0.502 v-13.49c0-3.717-2.147-5.489-4.776-5.489C210.806,43.824,208.673,45.596,208.673,49.313"/><path fill="#051922" d="M61.243,96.467h6.923v-0.74l-2.568-0.596V71.572h-7.111v0.812l2.756,0.764v7.95 c-1.209-1.013-3.038-1.843-5.47-1.843c-4.317,0-7.504,3.797-7.504,9.065c0,5.391,2.911,8.531,7.537,8.531 c2.259,0,4.13-0.877,5.438-2.063V96.467 M61.243,93.261c-0.961,0.76-2.142,1.406-3.938,1.406c-2.372,0-4.401-1.72-4.401-6.389 c0-4.805,1.659-7.031,4.369-7.031c1.814,0,3.094,0.651,3.97,1.632V93.261z"/><polyline fill="#051922" points="126.326,71.572 126.326,72.332 123.729,73.025 123.729,95.023 126.326,95.688 126.326,96.467 115.518,96.467 115.518,95.665 118.981,95.023 118.981,77.497 110.91,96.467 109.03,96.467 101.099,77.423 101.099,95.023 104.432,95.581 104.432,96.467 96.614,96.467 96.614,95.688 98.835,95.056 98.835,72.988 96.614,72.332 96.614,71.572 103.574,71.572 111.313,90.627 119.263,71.572 126.326,71.572"/><path fill="#051922" d="M137.191,79.255c-4.898,0-9.3,3.408-9.3,8.799c0,5.23,4.439,8.798,9.3,8.798 c4.889,0,9.328-3.567,9.328-8.798C146.52,82.663,142.08,79.255,137.191,79.255 M137.191,80.488c2.981,0,4.547,3.328,4.547,7.532 c0,4.167-1.565,7.612-4.547,7.612c-2.943,0-4.551-3.445-4.551-7.612S134.248,80.488,137.191,80.488z"/><path fill="#051922" d="M227.23,84.458v2.869l-3.872,0.191c-3.73,0.113-6.065,2.143-6.065,4.937c0,2.816,2.101,4.396,4.889,4.396 c2.293,0,3.938-1.125,5.049-1.913v1.528h6.337v-0.74l-2.063-0.596V83.731c0-2.484-1.631-4.477-5.343-4.477 c-3.793,0-6.159,1.078-7.495,1.655v3.933h1.884l0.628-3.281c0.437-0.179,1.612-0.586,3.487-0.432 C226.921,81.317,227.188,82.888,227.23,84.458 M227.23,93.674c-0.886,0.576-1.646,1.152-3.028,1.152 c-2.212,0.033-2.826-1.34-2.826-2.953c0-1.641,1.11-2.756,3.141-3.084l2.714-0.313V93.674z"/><polyline fill="#051922" points="245,95.727 245,96.467 235.531,96.467 235.531,95.727 238.101,95.131 238.101,73.03 235.531,72.379 235.531,71.572 242.455,71.572 242.455,95.131 245,95.727"/><path fill="#051922" d="M25.793,39.905l-3.708-0.722v-0.806h8.61v0.759l-2.639,0.769V54.97c0,6.263-3.417,8.808-10.406,8.808 c-7.176,0-10.087-2.751-10.087-8.418V39.792L5,39.136v-0.759h11.01v0.844l-3.74,0.647V55.12c0,4.622,1.575,6.896,6.384,6.896 c5.217,0,7.139-2.358,7.139-7.304V39.905"/><path fill="#051922" d="M40.609,62.545v0.727h-9.29v-0.727l2.521-0.609v-14.23l-2.292-0.656v-0.788h6.656v2.597 c0.764-0.647,3.173-2.789,6.267-2.789c3.216,0,4.856,1.791,4.856,4.931v10.894l2.447,0.623v0.755h-9.019v-0.755l2.254-0.581V51.497 c0-1.65-0.501-3.099-2.559-3.099c-1.842,0-3.717,1.298-4.247,1.646v11.892L40.609,62.545"/><polyline fill="#051922" points="60.212,61.936 62.738,62.545 62.738,63.271 53.289,63.271 53.289,62.545 55.857,61.936 55.857,47.705 53.561,47.049 53.561,46.261 60.212,46.261 60.212,61.936"/><path fill="#051922" d="M60.446,40.402c0,1.308-1.144,2.372-2.522,2.372c-1.34,0-2.526-1.064-2.526-2.372 c0-1.298,1.186-2.409,2.526-2.409C59.303,37.993,60.446,39.104,60.446,40.402"/><polyline fill="#051922" points="135.331,61.936 137.862,62.545 137.862,63.271 128.403,63.271 128.403,62.545 130.972,61.936 130.972,47.705 128.68,47.049 128.68,46.261 135.331,46.261 135.331,61.936"/><path fill="#051922" d="M135.551,40.402c0,1.308-1.144,2.372-2.512,2.372c-1.341,0-2.531-1.064-2.531-2.372 c0-1.298,1.19-2.409,2.531-2.409C134.407,37.993,135.551,39.104,135.551,40.402"/><polyline fill="#051922" points="64.121,47.442 62.893,46.945 62.893,46.261 71.157,46.261 71.157,46.945 68.513,47.602 72.31,57.956 76.069,47.518 73.772,46.945 73.772,46.261 79.435,46.261 79.435,46.945 78.057,47.602 71.579,63.543 70.172,63.543 64.121,47.442"/><path fill="#051922" d="M84.474,53.714h11.245c-0.117-4.701-2.564-7.645-7.495-7.645c-4.861,0-8.451,4.2-8.451,8.793 c0,5.311,3.473,8.789,8.489,8.789c4.284,0,6.497-1.679,7.8-2.635l-0.727-1.148c-0.994,0.619-2.991,1.96-6.271,1.763 C85.776,61.401,84.126,57.956,84.474,53.714 M91.434,52.373h-6.769c0.384-2.906,1.528-5.053,3.558-5.053 C90.52,47.32,91.275,50.001,91.434,52.373z"/><path fill="#051922" d="M124.981,46.941l-0.38,4.171h-1.561l-0.384-2.831c-0.577-0.305-1.34-0.961-3.019-0.961 c-1.383,0-2.452,0.731-2.452,2.217c0,1.767,1.95,2.456,3.9,3.337c1.875,0.797,4.936,1.95,4.936,4.969 c0,3.436-2.831,5.808-6.229,5.808c-3.146,0-4.973-0.722-5.517-0.919l-0.3-4.617l1.603-0.159l0.918,3.141 c0.464,0.342,1.729,1.336,3.253,1.303c2.18,0,3.211-1.148,3.211-2.798c0-1.95-2.714-2.789-4.509-3.628 c-1.683-0.812-4.284-1.528-4.284-5.016c0-2.859,2.372-4.889,5.583-4.889C122.506,46.069,124.222,46.716,124.981,46.941"/><polyline fill="#051922" points="166.834,40.636 165.18,38.189 159.335,42.783 160.291,44.152 166.834,40.636"/><path fill="#051922" d="M156.658,53.714h11.24c-0.117-4.701-2.564-7.645-7.5-7.645c-4.852,0-8.446,4.2-8.446,8.793 c0,5.311,3.482,8.789,8.498,8.789c4.274,0,6.501-1.679,7.795-2.635l-0.731-1.148c-0.993,0.619-2.977,1.96-6.271,1.763 C157.956,61.401,156.316,57.956,156.658,53.714 M163.614,52.373h-6.764c0.379-2.906,1.527-5.053,3.548-5.053 C162.7,47.32,163.464,50.001,163.614,52.373z"/><path fill="#051922" d="M110.104,46.092c-2.447,0-4.209,1.969-5.203,4.176h-0.075v-4.007h-6.933v0.703l2.569,0.741v14.23 l-2.569,0.609v0.727h10.636v-0.839l-3.703-0.604v-9.675c1.008-2.222,2.503-3.126,3.455-3.126c0.717,0,0.984,0.136,1.542,0.619 c0.197,0.159,0.924,0.366,1.369,0.168c0.825-0.347,1.06-0.965,1.06-1.861C112.25,46.974,111.294,46.092,110.104,46.092"/><path fill="#051922" d="M157.534,95.727v0.74h-9.295v-0.74l2.518-0.596V80.91l-2.287-0.661v-0.792h6.655v2.597 c0.765-0.656,3.169-2.799,6.263-2.799c3.216,0,4.86,1.805,4.86,4.94v10.894l2.447,0.6v0.778h-9.023v-0.778l2.255-0.558V84.688 c0-1.645-0.492-3.094-2.564-3.094c-1.828,0-3.707,1.294-4.237,1.641v11.896L157.534,95.727"/><path fill="#051922" d="M195.708,79.283c-2.451,0-4.214,1.974-5.212,4.186h-0.075v-4.012h-6.923v0.703l2.563,0.75v14.221 l-2.563,0.596v0.74h10.626v-0.834l-3.703-0.609v-9.67c1.013-2.231,2.513-3.136,3.464-3.136c0.713,0,0.979,0.136,1.528,0.628 c0.206,0.154,0.938,0.365,1.364,0.159c0.839-0.36,1.068-0.961,1.068-1.86C197.846,80.169,196.898,79.283,195.708,79.283"/><path fill="#051922" d="M150.621,61.373c-0.633,0.422-1.294,0.727-2.265,0.727c-1.527,0-2.024-1.111-2.024-3.638V47.747 l4.359-0.642v-0.844h-4.359v-7.884h-1.43c-0.281,4.514-1.875,7.472-5.906,7.884h-0.661v0.844l3.633,0.642v10.945 c0,3.464,0.839,4.959,4.097,4.959c2.339,0,4.224-0.872,4.987-1.599L150.621,61.373"/><path fill="#051922" d="M181.506,94.568c-0.638,0.413-1.299,0.731-2.255,0.731c-1.542,0-2.029-1.12-2.029-3.642V80.942l4.359-0.646 v-0.839h-4.359v-7.885h-1.425c-0.291,4.505-1.88,7.472-5.906,7.885h-0.666v0.839l3.628,0.646v10.94 c0,3.478,0.844,4.969,4.097,4.969c2.339,0,4.214-0.877,4.982-1.604L181.506,94.568"/><path fill="#051922" d="M74.138,86.909h11.245c-0.112-4.701-2.559-7.654-7.5-7.654c-4.847,0-8.447,4.214-8.447,8.799 c0,5.319,3.478,8.798,8.484,8.798c4.284,0,6.506-1.683,7.8-2.64l-0.727-1.147c-0.994,0.609-2.977,1.959-6.267,1.762 C75.441,94.597,73.796,91.151,74.138,86.909 M81.099,85.573H74.33c0.38-2.91,1.533-5.058,3.553-5.058 C80.18,80.516,80.949,83.202,81.099,85.573z"/><path fill="#051922" d="M202.945,86.905h11.24c-0.107-4.697-2.563-7.65-7.485-7.65c-4.861,0-8.456,4.214-8.456,8.799 c0,5.319,3.473,8.798,8.488,8.798c4.28,0,6.497-1.683,7.805-2.64l-0.736-1.147c-0.988,0.609-2.976,1.959-6.267,1.762 C204.244,94.597,202.599,91.146,202.945,86.905 M213.117,73.832l-1.641-2.447l-5.85,4.589l0.956,1.369L213.117,73.832z M209.906,85.573h-6.764c0.379-2.91,1.523-5.058,3.558-5.058C208.987,80.516,209.751,83.202,209.906,85.573z"/></g></svg>\
        <p>codeBoot was created by Marc Feeley and Bruno Dufour.  The following people have also contributed to its development:</p>\
        <blockquote>\
          Marc-André Bélanger,\
          Antoine Doucet,\
          Frédéric Hamel,\
          Nicolas Hurtubise,\
          Olivier Melançon,\
          Léonard Oest O\'Leary,\
          Roselyne Painchaud\
        </blockquote>\
      </div>\
    </div>\
  </div>\
</div>\
\
<div id="cb-help-box" class="modal fade" role="dialog">\
  <div class="modal-dialog cb-modal-dialog">\
    <div class="modal-content">\
      <div class="modal-header">\
        <h4 class="modal-title">codeBoot help</h4>\
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
          <span aria-hidden="true">&times;</span>\
        </button>\
      </div>\
      <div class="modal-body">\
        <!-- WORKED ON TABS -->\
        <ul class="nav nav-tabs" id="helpTab" role="tablist">\
          <li class="nav-item">\
            <a class="nav-link active" id="keybindings-tab" data-toggle="tab" href="#keybindings" role="tab" aria-controls="keybindings" aria-selected="true">Key bindings</a>\
          </li>\
          <li class="nav-item">\
            <a class="nav-link" id="files-tab" data-toggle="tab" href="#files" role="tab" aria-controls="files" aria-selected="false">Files</a>\
          </li>\
          <li class="nav-item">\
            <a class="nav-link" id="grammar-tab" data-toggle="tab" href="#grammar" role="tab" aria-controls="grammar" aria-selected="false">Grammar</a>\
          </li>\
        </ul>\
\
        <div class="tab-content" id="helpTabContent">\
          <div class="tab-pane fade show active" id="keybindings" role="tabpanel" aria-labelledby="keybindings-tab">\
            <h5>Console</h5>\
            <p>Enter a command at the console and then:</p>\
            <table class="cb-keybindings">\
              <tr>\
                <td><kbd>Enter</kbd>&nbsp;/&nbsp;<kbd>Shift</kbd> <kbd>Ctrl</kbd> <kbd>Enter</kbd>&nbsp;/&nbsp;<kbd>F7</kbd></td>\
                <td>: execute it fully and display result (unless command is incomplete)</td>\
              </tr>\
              <tr>\
                <td><kbd>F6</kbd></td>\
                <td>: animate execution of command (single steps repeated automatically)</td>\
              </tr>\
              <tr>\
                <td><kbd>Shift</kbd> <kbd>Enter</kbd>&nbsp;/&nbsp;<kbd>F5</kbd></td>\
                <td>: execute the first step (continue with <kbd>Shift</kbd> <kbd>Enter</kbd> or <kbd>Enter</kbd>)</td>\
              </tr>\
              <tr>\
                <td><kbd>↑</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>P</kbd></td>\
                <td>: move back in command history or cursor up</td>\
              </tr>\
              <tr>\
                <td><kbd>↓</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>N</kbd></td>\
                <td>: move forward in command history or cursor down</td>\
              </tr>\
            </table>\
            <br/>\
            <h5>Editor</h5>\
            <p>When the cursor is in an editor:</p>\
            <table class="cb-keybindings">\
              <tr>\
                <td><kbd>Enter</kbd></td>\
                <td>: insert line break, move to next line and smart indent</td>\
              </tr>\
              <tr>\
                <td><kbd>Shift</kbd> <kbd>Ctrl</kbd> <kbd>Enter</kbd>&nbsp;/&nbsp;<kbd>F7</kbd></td>\
                <td>: execute the current file</td>\
              <tr>\
                <td><kbd>F6</kbd></td>\
                <td>: animate execution of current file (single steps repeated automatically)</td>\
              </tr>\
              <tr>\
                <td><kbd>Shift</kbd> <kbd>Enter</kbd>&nbsp;/&nbsp;<kbd>F5</kbd></td>\
                <td>: execute the first step of current file (continue with <kbd>Shift</kbd> <kbd>Enter</kbd> or <kbd>Enter</kbd>)</td>\
              </tr>\
              <tr>\
                <td><kbd>↑</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>P</kbd></td>\
                <td>: move cursor up</td>\
              </tr>\
              <tr>\
                <td><kbd>↓</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>N</kbd></td>\
                <td>: move cursor down</td>\
              </tr>\
            </table>\
            <br/>\
            <h5>Console and Editor</h5>\
            <table class="cb-keybindings">\
              <tr>\
                <td><kbd>Esc</kbd>&nbsp;/&nbsp;<kbd>F8</kbd></td>\
                <td>: stop the execution (reset execution when repeated 3 times)</td>\
              </tr>\
              <tr>\
                <td><kbd>Ctrl</kbd> <kbd>L</kbd></td>\
                <td>: clear the console</td>\
              </tr>\
              <tr>\
                <td><kbd>←</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>B</kbd></td>\
                <td>: move cursor left</td>\
              </tr>\
              <tr>\
                <td><kbd>→</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>F</kbd></td>\
                <td>: move cursor right</td>\
              </tr>\
              <tr>\
                <td><kbd>Alt</kbd> <kbd>←</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>A</kbd></td>\
                <td>: move cursor to beginning of line</td>\
              </tr>\
              <tr>\
                <td><kbd>Alt</kbd> <kbd>→</kbd>&nbsp;/&nbsp;<kbd>Ctrl</kbd> <kbd>E</kbd></td>\
                <td>: move cursor to end of line</td>\
              </tr>\
              <tr>\
                <td><kbd>Ctrl</kbd> <kbd>J</kbd></td>\
                <td>: insert line break and move to next line</td>\
              </tr>\
              <tr>\
                <td><kbd>Ctrl</kbd> <kbd>O</kbd></td>\
                <td>: insert line break</td>\
              </tr>\
            </table>\
          </div>\
\
          <div class="tab-pane fade" id="files" role="tabpanel" aria-labelledby="grammar-tab">\
            <p>Importing a file from the desktop is done using drag-and-drop.</p>\
            <p>Saving a file to the desktop is done using the download icon next\
              to its name in the Files menu.</p>\
            <p>Renaming a file is done by double clicking its editor tab.<p>\
          </div>\
\
          <div class="tab-pane fade" id="grammar" role="tabpanel" aria-labelledby="grammar-tab">\
            <div class="js-novice js-standard">\
              <h5>Grammar for "JavaScript <span class="js-novice">novice</span><span class="js-standard">standard</span>"</h5>\
              <p class="js-novice">All statements must be terminated with a semicolon.</p>\
\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Literal</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">null</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">true</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">false</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">NUMBER</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">STRING</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Property</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-token">:</span> <span class="grammar-category">AssignmentExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">STRING</span> <span class="grammar-token">:</span> <span class="grammar-category">AssignmentExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">NUMBER</span> <span class="grammar-token">:</span> <span class="grammar-category">AssignmentExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">(</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">(</span> <span class="grammar-category">FormalParameterList</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">PropertyList</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">Property</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">PropertyList</span> <span class="grammar-token">,</span> <span class="grammar-category">Property</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">PrimaryExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">PrimaryExprNoBrace</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-category">PropertyList</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-category">PropertyList</span> <span class="grammar-token">,</span> <span class="grammar-token">}</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">PrimaryExprNoBrace</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">this</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">Literal</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ArrayLiteral</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ArrayLiteral</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">[</span> <span class="grammar-category">ElisionOpt</span> <span class="grammar-token">]</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">[</span> <span class="grammar-category">ElementList</span> <span class="grammar-token">]</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">[</span> <span class="grammar-category">ElementList</span> <span class="grammar-token">,</span> <span class="grammar-category">ElisionOpt</span> <span class="grammar-token">]</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ElementList</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ElisionOpt</span> <span class="grammar-category">AssignmentExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ElementList</span> <span class="grammar-token">,</span> <span class="grammar-category">ElisionOpt</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ElisionOpt</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">/* nothing */</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">Elision</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Elision</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">,</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">Elision</span> <span class="grammar-token">,</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">MemberExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">PrimaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">FunctionExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MemberExpr</span> <span class="grammar-token">[</span> <span class="grammar-category">Expr</span> <span class="grammar-token">]</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MemberExpr</span> <span class="grammar-token">.</span> <span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">new</span> <span class="grammar-category">MemberExpr</span> <span class="grammar-category">Arguments</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">MemberExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">PrimaryExprNoBrace</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MemberExprNoBF</span> <span class="grammar-token">[</span> <span class="grammar-category">Expr</span> <span class="grammar-token">]</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MemberExprNoBF</span> <span class="grammar-token">.</span> <span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">new</span> <span class="grammar-category">MemberExpr</span> <span class="grammar-category">Arguments</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">NewExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">MemberExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">new</span> <span class="grammar-category">NewExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">NewExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">MemberExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">new</span> <span class="grammar-category">NewExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">CallExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">MemberExpr</span> <span class="grammar-category">Arguments</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExpr</span> <span class="grammar-category">Arguments</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExpr</span> <span class="grammar-token">[</span> <span class="grammar-category">Expr</span> <span class="grammar-token">]</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExpr</span> <span class="grammar-token">.</span> <span class="grammar-category">IDENT</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">CallExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">MemberExprNoBF</span> <span class="grammar-category">Arguments</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExprNoBF</span> <span class="grammar-category">Arguments</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExprNoBF</span> <span class="grammar-token">[</span> <span class="grammar-category">Expr</span> <span class="grammar-token">]</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExprNoBF</span> <span class="grammar-token">.</span> <span class="grammar-category">IDENT</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Arguments</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">(</span> <span class="grammar-token">)</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">(</span> <span class="grammar-category">ArgumentList</span> <span class="grammar-token">)</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ArgumentList</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">AssignmentExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ArgumentList</span> <span class="grammar-token">,</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LeftHandSideExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">NewExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LeftHandSideExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">NewExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CallExprNoBF</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">PostfixExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExpr</span> <span class="grammar-token">++</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExpr</span> <span class="grammar-token">--</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">PostfixExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExprNoBF</span> <span class="grammar-token">++</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExprNoBF</span> <span class="grammar-token">--</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">UnaryExprCommon</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">delete</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">void</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">typeof</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">++</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">++</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">--</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">--</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">+</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">-</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">~</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">!</span> <span class="grammar-category">UnaryExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">UnaryExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">PostfixExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">UnaryExprCommon</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">UnaryExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">PostfixExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">UnaryExprCommon</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">MultiplicativeExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExpr</span> <span class="grammar-token">*</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExpr</span> <span class="grammar-token">/</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExpr</span> <span class="grammar-token">%</span> <span class="grammar-category">UnaryExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">MultiplicativeExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">UnaryExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExprNoBF</span> <span class="grammar-token">*</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExprNoBF</span> <span class="grammar-token">/</span> <span class="grammar-category">UnaryExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExprNoBF</span> <span class="grammar-token">%</span> <span class="grammar-category">UnaryExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">AdditiveExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">AdditiveExpr</span> <span class="grammar-token">+</span> <span class="grammar-category">MultiplicativeExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">AdditiveExpr</span> <span class="grammar-token">-</span> <span class="grammar-category">MultiplicativeExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">AdditiveExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">MultiplicativeExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">AdditiveExprNoBF</span> <span class="grammar-token">+</span> <span class="grammar-category">MultiplicativeExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">AdditiveExprNoBF</span> <span class="grammar-token">-</span> <span class="grammar-category">MultiplicativeExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ShiftExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">AdditiveExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExpr</span> <span class="grammar-token">&lt;&lt;</span> <span class="grammar-category">AdditiveExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExpr</span> <span class="grammar-token">&gt;&gt;</span> <span class="grammar-category">AdditiveExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExpr</span> <span class="grammar-token">&gt;&gt;&gt;</span> <span class="grammar-category">AdditiveExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ShiftExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">AdditiveExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExprNoBF</span> <span class="grammar-token">&lt;&lt;</span> <span class="grammar-category">AdditiveExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExprNoBF</span> <span class="grammar-token">&gt;&gt;</span> <span class="grammar-category">AdditiveExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExprNoBF</span> <span class="grammar-token">&gt;&gt;&gt;</span> <span class="grammar-category">AdditiveExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">RelationalExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span> <span class="grammar-token">&lt;</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span> <span class="grammar-token">&gt;</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span> <span class="grammar-token">&lt;=</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span> <span class="grammar-token">&gt;=</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span> <span class="grammar-token">instanceof</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span> <span class="grammar-token">in</span> <span class="grammar-category">ShiftExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">RelationalExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoIn</span> <span class="grammar-token">&lt;</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoIn</span> <span class="grammar-token">&gt;</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoIn</span> <span class="grammar-token">&lt;=</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoIn</span> <span class="grammar-token">&gt;=</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoIn</span> <span class="grammar-token">instanceof</span> <span class="grammar-category">ShiftExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">RelationalExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ShiftExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span> <span class="grammar-token">&lt;</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span> <span class="grammar-token">&gt;</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span> <span class="grammar-token">&lt;=</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span> <span class="grammar-token">&gt;=</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span> <span class="grammar-token">instanceof</span> <span class="grammar-category">ShiftExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span> <span class="grammar-token">in</span> <span class="grammar-category">ShiftExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">EqualityExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExpr</span> <span class="grammar-token">==</span> <span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExpr</span> <span class="grammar-token">!=</span> <span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExpr</span> <span class="grammar-token">===</span> <span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExpr</span> <span class="grammar-token">!==</span> <span class="grammar-category">RelationalExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">EqualityExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoIn</span> <span class="grammar-token">==</span> <span class="grammar-category">RelationalExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoIn</span> <span class="grammar-token">!=</span> <span class="grammar-category">RelationalExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoIn</span> <span class="grammar-token">===</span> <span class="grammar-category">RelationalExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoIn</span> <span class="grammar-token">!==</span> <span class="grammar-category">RelationalExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">EqualityExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">RelationalExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoBF</span> <span class="grammar-token">==</span> <span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoBF</span> <span class="grammar-token">!=</span> <span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoBF</span> <span class="grammar-token">===</span> <span class="grammar-category">RelationalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoBF</span> <span class="grammar-token">!==</span> <span class="grammar-category">RelationalExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseANDExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseANDExpr</span> <span class="grammar-token">&amp;</span> <span class="grammar-category">EqualityExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseANDExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseANDExprNoIn</span> <span class="grammar-token">&amp;</span> <span class="grammar-category">EqualityExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseANDExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">EqualityExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseANDExprNoBF</span> <span class="grammar-token">&amp;</span> <span class="grammar-category">EqualityExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseXORExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseANDExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseXORExpr</span> <span class="grammar-token">^</span> <span class="grammar-category">BitwiseANDExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseXORExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseANDExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseXORExprNoIn</span> <span class="grammar-token">^</span> <span class="grammar-category">BitwiseANDExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseXORExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseANDExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseXORExprNoBF</span> <span class="grammar-token">^</span> <span class="grammar-category">BitwiseANDExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseORExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseXORExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseORExpr</span> <span class="grammar-token">|</span> <span class="grammar-category">BitwiseXORExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseORExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseXORExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseORExprNoIn</span> <span class="grammar-token">|</span> <span class="grammar-category">BitwiseXORExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BitwiseORExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseXORExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseORExprNoBF</span> <span class="grammar-token">|</span> <span class="grammar-category">BitwiseXORExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LogicalANDExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseORExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalANDExpr</span> <span class="grammar-token">&&</span> <span class="grammar-category">BitwiseORExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LogicalANDExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseORExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalANDExprNoIn</span> <span class="grammar-token">&&</span> <span class="grammar-category">BitwiseORExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LogicalANDExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">BitwiseORExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalANDExprNoBF</span> <span class="grammar-token">&&</span> <span class="grammar-category">BitwiseORExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LogicalORExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LogicalANDExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExpr</span> <span class="grammar-token">||</span> <span class="grammar-category">LogicalANDExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LogicalORExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LogicalANDExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExprNoIn</span> <span class="grammar-token">||</span> <span class="grammar-category">LogicalANDExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LogicalORExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LogicalANDExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExprNoBF</span> <span class="grammar-token">||</span> <span class="grammar-category">LogicalANDExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ConditionalExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExpr</span> <span class="grammar-token">?</span> <span class="grammar-category">AssignmentExpr</span> <span class="grammar-token">:</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ConditionalExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExprNoIn</span> <span class="grammar-token">?</span> <span class="grammar-category">AssignmentExprNoIn</span> <span class="grammar-token">:</span> <span class="grammar-category">AssignmentExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ConditionalExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LogicalORExprNoBF</span> <span class="grammar-token">?</span> <span class="grammar-category">AssignmentExpr</span> <span class="grammar-token">:</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">AssignmentExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ConditionalExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExpr</span> <span class="grammar-category">AssignmentOperator</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">AssignmentExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ConditionalExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExpr</span> <span class="grammar-category">AssignmentOperator</span> <span class="grammar-category">AssignmentExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">AssignmentExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ConditionalExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LeftHandSideExprNoBF</span> <span class="grammar-category">AssignmentOperator</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">AssignmentOperator</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">+=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">-=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">*=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">/=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">&lt;&lt;=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">&gt;&gt;=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">&gt;&gt;&gt;=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">&amp;=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">^=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">|=</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">%=</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Expr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">AssignmentExpr</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">Expr</span> <span class="grammar-token">,</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ExprNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">AssignmentExprNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ExprNoIn</span> <span class="grammar-token">,</span> <span class="grammar-category">AssignmentExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ExprNoBF</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">AssignmentExprNoBF</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ExprNoBF</span> <span class="grammar-token">,</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Statement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">Block</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">VariableStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ConstStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">FunctionDeclaration</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">EmptyStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ExprStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IfStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IterationStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ContinueStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">BreakStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ReturnStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">WithStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">SwitchStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">LabelledStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ThrowStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">TryStatement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">DebuggerStatement</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Block</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-category">SourceElements</span> <span class="grammar-token">}</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">VariableStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">var</span> <span class="grammar-category">VariableDeclarationList</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">VariableDeclarationList</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-category">Initializer</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">VariableDeclarationList</span> <span class="grammar-token">,</span> <span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">VariableDeclarationList</span> <span class="grammar-token">,</span> <span class="grammar-category">IDENT</span> <span class="grammar-category">Initializer</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">VariableDeclarationListNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-category">InitializerNoIn</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">VariableDeclarationListNoIn</span> <span class="grammar-token">,</span> <span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">VariableDeclarationListNoIn</span> <span class="grammar-token">,</span> <span class="grammar-category">IDENT</span> <span class="grammar-category">InitializerNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ConstStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">const</span> <span class="grammar-category">ConstDeclarationList</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ConstDeclarationList</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ConstDeclaration</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ConstDeclarationList</span> <span class="grammar-token">,</span> <span class="grammar-category">ConstDeclaration</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ConstDeclaration</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-category">Initializer</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Initializer</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">=</span> <span class="grammar-category">AssignmentExpr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">InitializerNoIn</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">=</span> <span class="grammar-category">AssignmentExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">EmptyStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ExprStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">ExprNoBF</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">IfStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">if</span> <span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">if</span> <span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span> <span class="grammar-token">else</span> <span class="grammar-category">Statement</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">IterationStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">do</span> <span class="grammar-category">Statement</span> <span class="grammar-token">while</span> <span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-token">;</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">while</span> <span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">for</span> <span class="grammar-token">(</span> <span class="grammar-category">ExprNoInOpt</span> <span class="grammar-token">;</span> <span class="grammar-category">ExprOpt</span> <span class="grammar-token">;</span> <span class="grammar-category">ExprOpt</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">for</span> <span class="grammar-token">(</span> <span class="grammar-token">var</span> <span class="grammar-category">VariableDeclarationListNoIn</span> <span class="grammar-token">;</span> <span class="grammar-category">ExprOpt</span> <span class="grammar-token">;</span> <span class="grammar-category">ExprOpt</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">for</span> <span class="grammar-token">(</span> <span class="grammar-category">LeftHandSideExpr</span> <span class="grammar-token">in</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">for</span> <span class="grammar-token">(</span> <span class="grammar-token">var</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">in</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">for</span> <span class="grammar-token">(</span> <span class="grammar-token">var</span> <span class="grammar-category">IDENT</span> <span class="grammar-category">InitializerNoIn</span> <span class="grammar-token">in</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ExprOpt</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">/* nothing */</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">Expr</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ExprNoInOpt</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">/* nothing */</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">ExprNoIn</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ContinueStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">continue</span> <span class="grammar-token">;</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">continue</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">BreakStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">break</span> <span class="grammar-token">;</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">break</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ReturnStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">return</span> <span class="grammar-token">;</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">return</span> <span class="grammar-category">Expr</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">WithStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">with</span> <span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">Statement</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">SwitchStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">switch</span> <span class="grammar-token">(</span> <span class="grammar-category">Expr</span> <span class="grammar-token">)</span> <span class="grammar-category">CaseBlock</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">CaseBlock</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-category">CaseClausesOpt</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">{</span> <span class="grammar-category">CaseClausesOpt</span> <span class="grammar-category">DefaultClause</span> <span class="grammar-category">CaseClausesOpt</span> <span class="grammar-token">}</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">CaseClausesOpt</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">/* nothing */</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CaseClauses</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">CaseClauses</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">CaseClause</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">CaseClauses</span> <span class="grammar-category">CaseClause</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">CaseClause</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">case</span> <span class="grammar-category">Expr</span> <span class="grammar-token">:</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">case</span> <span class="grammar-category">Expr</span> <span class="grammar-token">:</span> <span class="grammar-category">SourceElements</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">DefaultClause</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">default</span> <span class="grammar-token">:</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">default</span> <span class="grammar-token">:</span> <span class="grammar-category">SourceElements</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">LabelledStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span> <span class="grammar-token">:</span> <span class="grammar-category">Statement</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">ThrowStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">throw</span> <span class="grammar-category">Expr</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">TryStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">try</span> <span class="grammar-category">Block</span> <span class="grammar-token">finally</span> <span class="grammar-category">Block</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">try</span> <span class="grammar-category">Block</span> <span class="grammar-token">catch</span> <span class="grammar-token">(</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">)</span> <span class="grammar-category">Block</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">try</span> <span class="grammar-category">Block</span> <span class="grammar-token">catch</span> <span class="grammar-token">(</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">)</span> <span class="grammar-category">Block</span> <span class="grammar-token">finally</span> <span class="grammar-category">Block</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">DebuggerStatement</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">debugger</span> <span class="grammar-token">;</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">FunctionDeclaration</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">function</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">(</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">function</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">(</span> <span class="grammar-category">FormalParameterList</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">FunctionExpr</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-token">function</span> <span class="grammar-token">(</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">function</span> <span class="grammar-token">(</span> <span class="grammar-category">FormalParameterList</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">function</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">(</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                  <p class="grammar-rule"><span class="grammar-token">function</span> <span class="grammar-category">IDENT</span> <span class="grammar-token">(</span> <span class="grammar-category">FormalParameterList</span> <span class="grammar-token">)</span> <span class="grammar-token">{</span> <span class="grammar-category">FunctionBody</span> <span class="grammar-token">}</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">FormalParameterList</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">IDENT</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">FormalParameterList</span> <span class="grammar-token">,</span> <span class="grammar-category">IDENT</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">FunctionBody</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">SourceElements</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">Program</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">SourceElements</span></p>\
                </div>\
              </div>\
              <div class="grammar-production">\
                <p class="grammar-category-box"><span class="grammar-category">SourceElements</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule"><span class="grammar-category">Statement</span></p>\
                  <p class="grammar-rule"><span class="grammar-category">SourceElements</span> <span class="grammar-category">Statement</span></p>\
                </div>\
              </div>\
            </div>\
            <div class="py-novice">\
              <h5>Grammar for "Python novice"</h5>\
              <div class="grammar-production without-border-bottom">\
                <p class="grammar-category-box"><span class="grammar-category">program</span>:</p>\
                <div class="grammar-rule-group">\
                  <p class="grammar-rule">(<span class="grammar-category">NEWLINE</span> | <span class="grammar-category">stmt</span>)*</p>\
                </div>\
              </div>\
\
              <ul class="nav nav-tabs" id="grammarTab" role="tablist">\
                <li class="nav-item">\
                  <a class="nav-link active" id="statements-tab" data-toggle="tab" href="#statements" role="tab" aria-controls="statements" aria-selected="true">Statements</a>\
                </li>\
                <li class="nav-item">\
                  <a class="nav-link" id="expressions-tab" data-toggle="tab" href="#expressions" role="tab" aria-controls="expressions" aria-selected="false">Expressions</a>\
                </li>\
                <li class="nav-item">\
                  <a class="nav-link" id="tokenEx-tab" data-toggle="tab" href="#tokenEx" role="tab" aria-controls="tokenEx" aria-selected="false">Token examples</a>\
                </li>\
              </ul>\
\
              <div class="tab-content" id="grammarTabContent">\
                <div class="tab-pane fade show active" id="statements" role="tabpanel" aria-labelledby="statements-tab">\
                  <h6>Statements</h6>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">simple_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">if_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">while_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">for_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">funcdef</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">simple_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">small_stmt</span> (<span class="grammar-token">;</span> <span class="grammar-category">small_stmt</span>)* [<span class="grammar-token">;</span>] <span class="grammar-category">NEWLINE</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">small_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">expr_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">pass_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">break_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">continue_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">return_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">raise_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">global_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">nonlocal_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">assert_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">import_stmt</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">expr_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">testlist</span> (<span class="grammar-category">augassign</span> <span class="grammar-category">testlist</span> | [(<span class="grammar-token">=</span> <span class="grammar-category">testlist</span>)+] )</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">augassign</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">+=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">-=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">*=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">@=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">/=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">%=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">&amp;=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">|=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">^=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">&lt;&lt;=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">&gt;&gt;=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">**=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">//=</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">pass_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">pass</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">break_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">break</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">continue_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">continue</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">return_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">return</span> [<span class="grammar-category">testlist</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">raise_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">raise</span> [<span class="grammar-category">test</span> [<span class="grammar-token">from</span> <span class="grammar-category">test</span>]]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">global_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">global</span> <span class="grammar-category">NAME</span> (<span class="grammar-token">,</span> <span class="grammar-category">NAME</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">nonlocal_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">nonlocal</span> <span class="grammar-category">NAME</span> (<span class="grammar-token">,</span> <span class="grammar-category">NAME</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">assert_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">assert</span> <span class="grammar-category">test</span> [<span class="grammar-token">,</span> <span class="grammar-category">test</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">import_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">import</span> <span class="grammar-category">dotted_as_names</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">dotted_as_name</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">dotted_name</span> [<span class="grammar-token">as</span> <span class="grammar-category">NAME</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">dotted_as_names</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">dotted_as_name</span> (<span class="grammar-token">,</span> <span class="grammar-category">dotted_as_name</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">dotted_name</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">NAME</span> (<span class="grammar-token">.</span> <span class="grammar-category">NAME</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">if_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">if</span> <span class="grammar-category">test</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span> (<span class="grammar-token">elif</span> <span class="grammar-category">test</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span>)* [<span class="grammar-token">else</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">while_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">while</span> <span class="grammar-category">test</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span> [<span class="grammar-token">else</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">for_stmt</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">for</span> <span class="grammar-category">exprlist</span> <span class="grammar-token">in</span> <span class="grammar-category">testlist</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span> [<span class="grammar-token">else</span> <span class="grammar-token">:</span> <span class="grammar-category">suite</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">suite</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">simple_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">NEWLINE</span> <span class="grammar-category">INDENT</span> <span class="grammar-category">stmt</span>+ <span class="grammar-category">DEDENT</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">funcdef</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">def</span> <span class="grammar-category">NAME</span> <span class="grammar-token">(</span> [<span class="grammar-category">argslist</span>] <span class="grammar-token">)</span> <span class="grammar-token">:</span> <span class="grammar-category">func_body_suite</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">func_body_suite</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">simple_stmt</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">NEWLINE</span> <span class="grammar-category">INDENT</span> <span class="grammar-category">stmt</span>+ <span class="grammar-category">DEDENT</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">argslist</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">NAME</span> (<span class="grammar-token">,</span> <span class="grammar-category">NAME</span>)*</p>\
                    </div>\
                  </div>\
                </div>\
\
                <div class="tab-pane fade" id="expressions" role="tabpanel" aria-labelledby="expressions-tab">\
                  <h6>Expressions</h6>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">test</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">or_test</span> [<span class="grammar-token">if</span> <span class="grammar-category">or_test</span> <span class="grammar-token">else</span> <span class="grammar-category">test</span>]</p>\
                      <p class="grammar-rule"><span class="grammar-category">lambdef</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">test_nocond</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">or_test</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">lambdef_nocond</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">lambdef</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">lambda</span> [<span class="grammar-category">argslist</span>] <span class="grammar-token">:</span> <span class="grammar-category">test</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">lambdef_nocond</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">lambda</span> [<span class="grammar-category">argslist</span>] <span class="grammar-token">:</span> <span class="grammar-category">test_nocond</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">or_test</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">and_test</span> (<span class="grammar-token">or</span> <span class="grammar-category">and_test</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">and_test</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">not_test</span> (<span class="grammar-token">and</span> <span class="grammar-category">not_test</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">not_test</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">not</span> <span class="grammar-category">not_test</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">comparison</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">comparison</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">expr</span> (<span class="grammar-category">comp_op expr</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">comp_op</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">&lt;</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">&gt;</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">==</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">&gt;=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">&lt;=</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">!=</span></p>\
                      <p class="grammar-rule">[<span class="grammar-token">not</span>] <span class="grammar-token">in</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">is</span> [<span class="grammar-token">not</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">expr</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">xor_expr</span> (<span class="grammar-token">|</span> <span class="grammar-category">xor_expr</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">xor_expr</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">and_expr</span> (<span class="grammar-token">^</span> <span class="grammar-category">and_expr</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">and_expr</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">shift_expr</span> (<span class="grammar-token">&amp;</span> <span class="grammar-category">shift_expr</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">shift_expr</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">arith_expr</span> ((<span class="grammar-token">&lt;&lt;</span> | <span class="grammar-token">&gt;&gt;</span>) <span class="grammar-category">arith_expr</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">arith_expr</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">term</span> ((<span class="grammar-token">+</span> | <span class="grammar-token">-</span>) <span class="grammar-category">term</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">term</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">factor</span> ((<span class="grammar-token">*</span> | <span class="grammar-token">@</span> | <span class="grammar-token">/</span> | <span class="grammar-token">%</span> | <span class="grammar-token">//</span>) <span class="grammar-category">factor</span>)*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">factor</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule">(<span class="grammar-token">+</span> | <span class="grammar-token">-</span> | <span class="grammar-token">~</span>) <span class="grammar-category">factor</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">power</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">power</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">atom_expr</span> [<span class="grammar-token">**</span> <span class="grammar-category">factor</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">atom_expr</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">atom</span> <span class="grammar-category">trailer</span>*</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">atom</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">(</span> [<span class="grammar-category">testlist</span>] <span class="grammar-token">)</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">[</span> [<span class="grammar-category">testlist</span>] <span class="grammar-token">]</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">{</span> [<span class="grammar-category">dictorsetmaker</span>] <span class="grammar-token">}</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">NAME</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">NUMBER</span></p>\
                      <p class="grammar-rule"><span class="grammar-category">STRING</span>+</p>\
                      <p class="grammar-rule"><span class="grammar-token">...</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">None</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">True</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">False</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">trailer</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">(</span> [<span class="grammar-category">testlist</span>] <span class="grammar-token">)</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">[</span> <span class="grammar-category">subscriptlist</span> <span class="grammar-token">]</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">.</span> <span class="grammar-category">NAME</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">subscriptlist</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">subscript</span> (<span class="grammar-token">,</span> <span class="grammar-category">subscript</span>)* [<span class="grammar-token">,</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">subscript</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">test</span></p>\
                      <p class="grammar-rule">[<span class="grammar-category">test</span>] <span class="grammar-token">:</span> [<span class="grammar-category">test</span>] [<span class="grammar-token">:</span> [<span class="grammar-category">test</span>]]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">exprlist</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">expr</span> (<span class="grammar-token">,</span> <span class="grammar-category">expr</span>)* [<span class="grammar-token">,</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">testlist</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-category">test</span> (<span class="grammar-token">,</span> <span class="grammar-category">test</span>)* [<span class="grammar-token">,</span>]</p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">dictorsetmaker</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule">(<span class="grammar-category">test</span> <span class="grammar-token">:</span> <span class="grammar-category">test</span>) (<span class="grammar-token">,</span> (<span class="grammar-category">test</span> <span class="grammar-token">:</span> <span class="grammar-category">test</span>))* [<span class="grammar-token">,</span>]</p>\
                    </div>\
                  </div>\
                </div>\
\
                <div class="tab-pane fade" id="tokenEx" role="tabpanel" aria-labelledby="tokenEx-tab">\
                  <h6>Token examples</h6>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">NAME</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">n</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">int2string</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">int_to_string</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">itemCount</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">BaseException</span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">STRING</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">\'hi\'</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">\'he said \\\'hi!\\\'\'</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">"\'"</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">\'"\'</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">\'\\x41\\u265e\\n\'</span></p>\
		      <p class="grammar-rule"><span class="grammar-token multi"><span>"""Python</span><br><span>is awesome"""</span></span></p>\
                    </div>\
                  </div>\
                  <div class="grammar-production">\
                    <p class="grammar-category-box"><span class="grammar-category">NUMBER</span>:</p>\
                    <div class="grammar-rule-group">\
                      <p class="grammar-rule"><span class="grammar-token">42</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">0x1f00</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">0o377</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">0b10011</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">1.0</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">3.14</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">1e6</span></p>\
                      <p class="grammar-rule"><span class="grammar-token">1.2e-50</span></p>\
                    </div>\
                  </div>\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
        <!-- END -->\
      </div>\
    </div>\
  </div>\
</div>\
\
';
}

function linkToDef(elem, isInTab) {

    var innerTemp = elem.innerHTML;
    var parentTab = elem.parentNode.parentNode.parentNode.parentNode;
    var defTemp = null;

    parentTab.parentNode.querySelectorAll(".grammar-category-box .grammar-category")
        .forEach(
            function (linkTemp) {
                var nameTemp = linkTemp.innerHTML;

                if (nameTemp === innerTemp)
                    defTemp = linkTemp.parentNode.parentNode;
            });

    if (defTemp !== null) {
        elem.classList.add("grammar-clickable");
        elem.onclick = function () {
            if (isInTab) {
                var tabTemp = defTemp.parentNode;

                if (parentTab !== tabTemp) {
                    var btnTab = document.getElementById(tabTemp.id + "-tab");

                    if (btnTab !== null) {
                        btnTab.click();
                    }
                }
                else {
                    isInTab = false;
                }
            }

            setTimeout(function () {
                defTemp.scrollIntoView();
                defTemp.classList.add("grammar-highlight");
                setTimeout(function () {defTemp.classList.remove("grammar-highlight");}, 500);
            }, isInTab ? 250 : 0);
        };
    }
}

function setupHelp() {

    document.querySelectorAll(".js-novice .grammar-rule-group .grammar-category").forEach(function (catTemp) {
        linkToDef(catTemp, false);
    });

    document.querySelectorAll(".py-novice .grammar-rule-group .grammar-category").forEach(function (catTemp) {
        linkToDef(catTemp, true);
    });
}

CodeBootVM.prototype.SVG =
    {
        'file':
        '<svg class="cb-svg-file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M14.341 5.579c-0.347-0.473-0.831-1.027-1.362-1.558s-1.085-1.015-1.558-1.362c-0.806-0.591-1.197-0.659-1.421-0.659h-5.75c-0.689 0-1.25 0.561-1.25 1.25v11.5c0 0.689 0.561 1.25 1.25 1.25h9.5c0.689 0 1.25-0.561 1.25-1.25v-7.75c0-0.224-0.068-0.615-0.659-1.421zM12.271 4.729c0.48 0.48 0.856 0.912 1.134 1.271h-2.406v-2.405c0.359 0.278 0.792 0.654 1.271 1.134v0zM14 14.75c0 0.136-0.114 0.25-0.25 0.25h-9.5c-0.136 0-0.25-0.114-0.25-0.25v-11.5c0-0.135 0.114-0.25 0.25-0.25 0 0 5.749-0 5.75 0v3.5c0 0.276 0.224 0.5 0.5 0.5h3.5v7.75z"></path><path fill="#000000" d="M9.421 0.659c-0.806-0.591-1.197-0.659-1.421-0.659h-5.75c-0.689 0-1.25 0.561-1.25 1.25v11.5c0 0.604 0.43 1.109 1 1.225v-12.725c0-0.135 0.115-0.25 0.25-0.25h7.607c-0.151-0.124-0.297-0.238-0.437-0.341z"></path></svg>',

        'settings':
        '<svg class="cb-svg-settings" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path transform="translate(0,2) scale(0.3)" fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10zM20 7l30 0l0 4l-30 0l0 -4z"></path><path transform="translate(0,6) scale(0.3)" fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10zM20 7l30 0l0 4l-30 0l0 -4z"></path><path transform="translate(0,10) scale(0.3)" fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10zM20 7l30 0l0 4l-30 0l0 -4z"></path></svg>',

        'clipboard':
        '<svg class="cb-svg-clipboard" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#000000" d="M322 321l384 0c-3.376-40-19.458-70.9-55.842-80.712-0.892-0.238-2.24-0.848-3.134-1.082-24.008-6.848-42.024-15.306-42.024-41.562L605 156.454C605 105.382 563.952 64 512.98 64c-50.932 0-91.98 41.382-91.98 92.454l0 41.19c0 26.256-17.184 34.338-41.194 41.186-0.894 0.234-1.6 1.22-2.532 1.458C340.892 250.1 325.854 281 322 321zM513.98 128.79c15.23 0 27.582 12.39 27.582 27.664 0 15.308-12.352 27.7-27.582 27.7-15.228 0-27.544-12.39-27.544-27.7C486.436 141.18 498.752 128.79 513.98 128.79zM811.222 127 663 127l0 27.976c0 21.166 18.386 38.024 39.014 38.024l74.424 0c13.334 0 24.198 10.87 24.88 24.39l0.17 654.2c-0.644 12.864-10.606 23.092-23.028 24.034l-528.836 0.062c-12.422-0.942-22.298-11.39-22.944-24.252l-0.17-654.028c0.644-13.522 11.716-24.406 25.012-24.406l74.462 0c20.626 0 37.014-16.858 37.014-38.024L362.998 127l-146.262 0C186.5 127 161 152.116 161 183.15l0 720.76c0 31.004 25.5 57.09 55.738 57.09L513.98 961l297.242 0c30.276 0 53.778-26.086 53.778-57.09L865 183.15C865 152.116 841.498 127 811.222 127zM289 385l224 0 0 64-224 0 0-64ZM289 769l320 0 0 64-320 0 0-64ZM289 641l258 0 0 64-258 0 0-64ZM289 513l416 0 0 64-416 0 0-64Z"></path></svg>',

        'gears':
        '<svg class="cb-svg-gears" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M5.683 11.282l0.645-0.903-0.707-0.707-0.903 0.645c-0.168-0.094-0.347-0.168-0.535-0.222l-0.183-1.095h-1l-0.183 1.095c-0.188 0.053-0.368 0.128-0.535 0.222l-0.903-0.645-0.707 0.707 0.645 0.903c-0.094 0.168-0.168 0.347-0.222 0.535l-1.095 0.183v1l1.095 0.183c0.053 0.188 0.128 0.368 0.222 0.535l-0.645 0.903 0.707 0.707 0.903-0.645c0.168 0.094 0.347 0.168 0.535 0.222l0.183 1.095h1l0.183-1.095c0.188-0.053 0.368-0.128 0.535-0.222l0.903 0.645 0.707-0.707-0.645-0.903c0.094-0.168 0.168-0.347 0.222-0.535l1.095-0.182v-1l-1.095-0.183c-0.053-0.188-0.128-0.368-0.222-0.535zM3.5 13.5c-0.552 0-1-0.448-1-1s0.448-1 1-1 1 0.448 1 1-0.448 1-1 1zM16 6v-1l-1.053-0.191c-0.019-0.126-0.044-0.25-0.074-0.372l0.899-0.58-0.383-0.924-1.046 0.226c-0.066-0.108-0.136-0.213-0.211-0.315l0.609-0.88-0.707-0.707-0.88 0.609c-0.102-0.074-0.207-0.145-0.315-0.211l0.226-1.046-0.924-0.383-0.58 0.899c-0.122-0.030-0.246-0.054-0.372-0.074l-0.191-1.053h-1l-0.191 1.053c-0.126 0.019-0.25 0.044-0.372 0.074l-0.58-0.899-0.924 0.383 0.226 1.046c-0.108 0.066-0.213 0.136-0.315 0.211l-0.88-0.609-0.707 0.707 0.609 0.88c-0.074 0.102-0.145 0.207-0.211 0.315l-1.046-0.226-0.383 0.924 0.899 0.58c-0.030 0.122-0.054 0.246-0.074 0.372l-1.053 0.191v1l1.053 0.191c0.019 0.126 0.044 0.25 0.074 0.372l-0.899 0.58 0.383 0.924 1.046-0.226c0.066 0.108 0.136 0.213 0.211 0.315l-0.609 0.88 0.707 0.707 0.88-0.609c0.102 0.074 0.207 0.145 0.315 0.211l-0.226 1.046 0.924 0.383 0.58-0.899c0.122 0.030 0.246 0.054 0.372 0.074l0.191 1.053h1l0.191-1.053c0.126-0.019 0.25-0.044 0.372-0.074l0.58 0.899 0.924-0.383-0.226-1.046c0.108-0.066 0.213-0.136 0.315-0.211l0.88 0.609 0.707-0.707-0.609-0.88c0.074-0.102 0.145-0.207 0.211-0.315l1.046 0.226 0.383-0.924-0.899-0.58c0.030-0.122 0.054-0.246 0.074-0.372l1.053-0.191zM10.5 7.675c-1.201 0-2.175-0.974-2.175-2.175s0.974-2.175 2.175-2.175 2.175 0.974 2.175 2.175c0 1.201-0.974 2.175-2.175 2.175z"></path></svg>',

        'checkmark':
        '<svg class="cb-svg-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10z"></path></svg>',

        'trash':
        '<svg class="cb-svg-trash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M2 5v10c0 0.55 0.45 1 1 1h9c0.55 0 1-0.45 1-1v-10h-11zM5 14h-1v-7h1v7zM7 14h-1v-7h1v7zM9 14h-1v-7h1v7zM11 14h-1v-7h1v7z"></path><path fill="#000000" d="M13.25 2h-3.25v-1.25c0-0.412-0.338-0.75-0.75-0.75h-3.5c-0.412 0-0.75 0.338-0.75 0.75v1.25h-3.25c-0.413 0-0.75 0.337-0.75 0.75v1.25h13v-1.25c0-0.413-0.338-0.75-0.75-0.75zM9 2h-3v-0.987h3v0.987z"></path></svg>',

        'mail':
        '<svg class="cb-svg-mail" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M13.333 0h-10.666c-1.467 0-2.667 1.2-2.667 2.667v10.666c0 1.467 1.2 2.667 2.667 2.667h10.666c1.468 0 2.667-1.2 2.667-2.667v-10.666c0-1.467-1.199-2.667-2.667-2.667zM4 4h8c0.143 0 0.281 0.031 0.409 0.088l-4.409 5.143-4.409-5.143c0.127-0.058 0.266-0.088 0.409-0.088zM3 11v-6c0-0.021 0.001-0.042 0.002-0.063l2.932 3.421-2.9 2.9c-0.023-0.083-0.034-0.17-0.034-0.258zM12 12h-8c-0.088 0-0.175-0.012-0.258-0.034l2.846-2.846 1.413 1.648 1.413-1.648 2.846 2.846c-0.083 0.023-0.17 0.034-0.258 0.034zM13 11c0 0.088-0.012 0.175-0.034 0.258l-2.9-2.9 2.932-3.421c0.001 0.021 0.002 0.042 0.002 0.063v6z"></path></svg>',

        'download':
        '<svg class="cb-svg-download" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M9 4l-2-2h-7v13h16v-11h-7zM8 13.5l-3.5-3.5h2.5v-4h2v4h2.5l-3.5 3.5z"></path></svg>',

        'window':
        '<svg class="cb-svg-window" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 55 60 L 55 206 L 201 206 L 201 60 Z M 65 85 L 191 85 L 191 196 L 65 196 Z"/></g></svg>',

        'cross':
        '<svg class="cb-svg-cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 80 60 L 128 108 L 176 60 L 201 85 L 153 133 L 201 181 L 176 206 L 128 158 L 80 206 L 55 181 L 103 133 L 55 85 Z""/></g></svg>',

        'close':
        '<svg class="cb-svg-close" xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 44 44"><g transform="translate(36,4)"><path d="m -32,32 c -2.209,0 -4,-1.791 -4,-4 l 0,-28 c 0,-2.209 1.791,-4 4,-4 l 28,0 c 2.209,0 4,1.791 4,4 l 0,28 c 0,2.209 -1.791,4 -4,4 l -28,0 z M -28,26.5 c 0.64,0 1.262,-0.2365 1.75,-0.725 l 8.25,-8.25 8.225,8.25 c 0.977,0.977 2.574,0.977 3.55,0 0.977,-0.976 0.977,-2.574 0,-3.55 L -14.475,14 -6.225,5.75 c 0.977,-0.976 0.977,-2.548 0,-3.525 C -6.713,1.737 -7.361,1.5 -8,1.5 -8.64,1.5 -9.287,1.737 -9.775,2.225 L -18,10.45 -26.275,2.2 c -0.488,-0.489 -1.11,-0.725 -1.75,-0.725 -0.639,0 -1.287,0.236 -1.775,0.725 -0.977,0.976 -0.977,2.548 0,3.525 l 8.25,8.275 -8.225,8.225 c -0.976,0.976 -0.976,2.574 0,3.55 0.488,0.4885 1.135,0.725 1.775,0.725 z" style="fill:#000000;fill-opacity:1;fill-rule:oddeven;stroke:none" /></g></svg>',

        'rename':
        '<svg class="cb-svg-rename" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(0,512) scale(0.100000,-0.100000)" fill="#000000" stroke="none"><path d="M3520 4778 c-53 -28 -80 -75 -80 -138 0 -50 25 -100 64 -125 13 -9 51 -20 83 -25 32 -4 70 -13 84 -18 40 -16 88 -61 112 -106 l22 -41 0 -1765 0 -1765 -22 -41 c-24 -45 -72 -90 -112 -106 -14 -5 -52 -14 -84 -18 -32 -5 -70 -16 -83 -25 -61 -40 -82 -135 -46 -205 23 -43 91 -80 147 -80 99 1 238 52 313 115 l42 36 42 -34 c85 -69 216 -116 323 -117 88 0 155 66 155 154 0 92 -47 141 -147 156 -32 4 -70 13 -84 18 -42 16 -91 64 -110 107 -18 38 -19 114 -19 1805 0 1691 1 1767 19 1805 19 43 68 91 110 107 14 5 52 14 84 18 100 15 147 64 147 156 0 61 -28 108 -80 135 -85 46 -280 -2 -398 -98 l-42 -34 -42 36 c-53 45 -128 80 -210 100 -88 21 -137 19 -188 -7z"/><path d="M387 4045 c-179 -49 -336 -210 -376 -385 -14 -62 -14 -2138 0 -2200 41 -178 198 -337 380 -385 46 -13 291 -15 1592 -15 l1537 0 0 1500 0 1500 -1542 -1 c-1246 -1 -1552 -3 -1591 -14z m1670 -515 c65 -39 68 -53 71 -376 l3 -291 97 49 c53 26 124 55 157 63 70 18 240 21 308 6 361 -82 606 -419 566 -780 -30 -270 -223 -507 -484 -597 -63 -22 -104 -29 -192 -32 -146 -5 -235 14 -362 79 -53 27 -97 49 -98 49 -2 0 -3 -7 -3 -15 0 -30 -29 -73 -63 -94 -67 -41 -154 -21 -198 45 -18 28 -19 64 -19 924 0 860 1 896 19 924 43 65 132 86 198 46z m-557 -542 c18 -13 43 -36 54 -51 21 -28 21 -35 21 -645 0 -575 -1 -619 -18 -650 -67 -123 -267 -78 -267 61 0 20 -2 37 -5 37 -3 0 -35 -15 -72 -34 -121 -61 -254 -85 -379 -66 -215 32 -402 167 -495 355 -58 119 -72 187 -67 325 6 128 27 203 89 307 43 72 150 178 222 221 187 112 431 122 622 27 38 -19 72 -35 77 -35 4 0 8 15 8 33 0 102 127 171 210 115z"/><path d="M2425 2687 c-118 -39 -207 -117 -258 -225 -30 -63 -32 -73 -32 -182 0 -110 1 -118 33 -183 44 -88 110 -155 197 -198 67 -33 74 -34 185 -34 109 0 119 2 182 32 320 151 320 616 0 766 -59 28 -79 32 -167 34 -63 2 -115 -2 -140 -10z"/><path d="M808 2637 c-100 -38 -176 -106 -220 -196 -33 -69 -37 -206 -8 -283 26 -71 105 -160 169 -193 199 -100 435 -11 511 193 30 79 29 187 -1 267 -27 72 -109 159 -184 195 -62 29 -208 38 -267 17z"/><path d="M4410 2560 l0 -1500 133 0 c144 0 204 12 296 56 74 36 189 151 225 225 58 120 56 73 56 1219 0 688 -4 1071 -11 1100 -20 88 -69 172 -143 246 -119 118 -216 154 -423 154 l-133 0 0 -1500z"/></g></svg>',

        'resize':
        '<svg class="cb-svg-resize" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill=rgb(0,0,0,0.5) d="M8 16 L16 8 L16 9 L9 16 L9 16 M11 16 L16 11 L16 12 L12 16 L12 16M14 16 L16 14 L16 15 L15 16 L14 16"></path></svg>',

        'play-1':
        '<svg class="cb-exec-play-1" style="display: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 46 60 L 46 206 L 172 133 Z"/><path d="M 170.233 66.33 L 195.703 57.75 L 194.333 93.35 L 195.433 117.09 L 182.643 117.09 L 183.743 94.9 L 183.013 72.17 L 170.233 72.26 L 170.233 66.33 Z"/></g></svg>',

        'pause':
        '<svg class="cb-exec-pause" style="display: none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 75 77 L 75 187 L 115 187 L 115 77 Z"/><path d="M 139 77 L 139 187 L 179 187 L 179 77 Z"/></g></svg>',

        'play-pause':
        '<svg class="cb-exec-play-pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 46 60 L 46 206 L 172 133 Z"/><path d="M 163 60 L 163 117 L 183 117 L 183 60 Z"/><path d="M 195 60 L 195 117 L 215 117 L 215 60 Z"/></g></svg>',

        'play':
        '<svg class="cb-exec-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 65 60 L 65 206 L 191 133 Z"/></g></svg>',

        'play-inf':
        '<svg class="cb-exec-play-inf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 46 60 L 46 206 L 172 133 Z"/><path d="M 165.223 111.169 C 160.036 111.169 155.676 110.126 152.143 108.039 C 148.61 105.952 145.966 103.209 144.213 99.809 C 142.46 96.409 141.583 92.722 141.583 88.749 C 141.583 84.916 142.443 81.299 144.163 77.899 C 145.883 74.492 148.526 71.729 152.093 69.609 C 155.66 67.489 160.036 66.429 165.223 66.429 C 169.936 66.429 174.176 67.726 177.943 70.319 C 181.716 72.912 185.49 76.499 189.263 81.079 C 191.89 76.972 195.29 73.502 199.463 70.669 C 203.636 67.842 207.91 66.429 212.283 66.429 C 217.47 66.429 221.846 67.472 225.413 69.559 C 228.986 71.646 231.646 74.406 233.393 77.839 C 235.146 81.279 236.023 84.982 236.023 88.949 C 236.023 92.789 235.163 96.392 233.443 99.759 C 231.73 103.126 229.09 105.869 225.523 107.989 C 221.95 110.109 217.536 111.169 212.283 111.169 C 207.843 111.169 203.786 109.992 200.113 107.639 C 196.446 105.286 192.796 102.052 189.163 97.939 C 186.396 101.846 183.01 105.029 179.003 107.489 C 175.003 109.942 170.41 111.169 165.223 111.169 Z M 212.893 100.569 C 216.593 100.569 219.523 99.372 221.683 96.979 C 223.836 94.592 224.913 91.716 224.913 88.349 C 224.913 86.396 224.39 84.526 223.343 82.739 C 222.303 80.959 220.823 79.512 218.903 78.399 C 216.983 77.286 214.776 76.729 212.283 76.729 C 209.256 76.729 206.11 77.926 202.843 80.319 C 199.576 82.712 197.136 85.522 195.523 88.749 C 198.69 92.589 201.6 95.519 204.253 97.539 C 206.913 99.559 209.793 100.569 212.893 100.569 Z M 165.223 100.869 C 168.183 100.869 171.396 99.859 174.863 97.839 C 178.336 95.819 181.013 93.396 182.893 90.569 C 179.26 86.129 176.08 82.779 173.353 80.519 C 170.626 78.266 167.746 77.139 164.713 77.139 C 161.013 77.139 158.103 78.316 155.983 80.669 C 153.863 83.029 152.803 85.926 152.803 89.359 C 152.803 91.312 153.306 93.179 154.313 94.959 C 155.326 96.746 156.773 98.179 158.653 99.259 C 160.54 100.332 162.73 100.869 165.223 100.869 Z"/></g></svg>',

        'stop':
        '<svg class="cb-exec-stop" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><path d="M 55 60 L 55 206 L 201 206 L 201 60 Z"/></g></svg>'

    };

CodeBootVM.prototype.localHTML = function (execBtns, closeBtn, cloneBtn) {

    var vm = this;

    return vm.modalDialogHTML();
};

CodeBootVM.prototype.execControlsHTML = function (execBtns, closeBtn, cloneBtn) {

    var vm = this;

    return '\
<span class="cb-exec-controls">\
\
  <span class="cb-exec-controls-counter">\
    <span class="badge badge-primary badge-pill cb-step-counter cb-exec-step-counter" style="display: none;"></span>\
  </span>\
\
  <div class="btn-group cb-exec-controls-buttons" role="group" data-toggle="tooltip" data-delay="2000" data-trigger="manual" data-placement="left" title="">\
' + (execBtns ? '\
    <button class="btn btn-secondary cb-button cb-exec-btn-step" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" data-html="true" title="' + vm.escapeHTML(vm.polyglotHTML('Single step/Pause')) + '">' +
vm.SVG['play-1'] +
vm.SVG['pause'] +
vm.SVG['play-pause'] + '\
    </button>\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-animate" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" data-html="true" title="' + vm.escapeHTML(vm.polyglotHTML('Execute with animation')) + '">' +
vm.SVG['play'] + '\
    </button>\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-eval" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" data-html="true" title="' + vm.escapeHTML(vm.polyglotHTML('Execute to end')) + '">' +
vm.SVG['play-inf'] + '\
    </button>\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-stop" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" data-html="true" title="' + vm.escapeHTML(vm.polyglotHTML('Stop')) + '">' +
vm.SVG['stop'] + '\
    </button>\
' + (closeBtn ? '\
    <button class="btn btn-secondary cb-button cb-exec-btn-close" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" data-html="true" title="' + vm.escapeHTML(vm.polyglotHTML('Close')) + '">' +
vm.SVG['close'] + '\
    </button>\
' : '') : '') + '\
' + (cloneBtn ? '\
    <button class="btn btn-secondary cb-button cb-exec-btn-clone" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" data-html="true" title="' + vm.escapeHTML(vm.polyglotHTML('Clone')) + '">' +
vm.SVG['window'] + '\
    </button>\
' : '') + '\
  </div>\
\
</span>\
';
};

CodeBootVM.prototype.navbarHTML = function (execBtns, closeBtn, cloneBtn) {

    var vm = this;

    return '\
<div class="cb-navbar">\
\
  <div class="cb-navbar-header"></div>\
\
  <div class="cb-navbar-controls">\
\
' + vm.menuHTML() + vm.execControlsHTML(execBtns, closeBtn, cloneBtn) + '\
\
  </div>\
\
  <div class="cb-navbar-footer"></div>\
\
</div>\
';
};

CodeBootVM.prototype.consoleHTML = function () {

    var vm = this;

    return '\
<div class="cb-console cb-pane-rigid cb-h-panes">\
  <div class="cb-repl-container cb-pane-elastic">\
    <textarea class="cb-repl"></textarea>\
  </div>\
  <div class="cb-pane-splitter"></div>\
  <div class="cb-playground cb-pane-rigid">\
    <div class="cb-drawing-window"></div>\
    <div class="cb-pixels-window"></div>\
    <div class="cb-chart-window"></div>\
    <div class="cb-html-window"></div>\
  </div>\
</div>\
';
};

CodeBootVM.prototype.editorsHTML = function (enableTabs) {

    var vm = this;

    return '\
<div class="cb-editors cb-pane-elastic">\
' + (enableTabs ? '<ul class="nav nav-tabs cb-file-tabs"></ul>' : '') + '\
</div>\
';
};

CodeBootVM.prototype.bodyHTML = function (consoleAtBottom, enableTabs) {

    var vm = this;

    return '\
<div class="cb-body cb-v-panes">\
' + (consoleAtBottom ? vm.editorsHTML(enableTabs) : vm.consoleHTML()) + '\
<div class="cb-pane-splitter"></div>\
' + (!consoleAtBottom ? vm.editorsHTML(enableTabs) : vm.consoleHTML()) + '\
</div>\
';
};

CodeBootVM.prototype.footerHTML = function () {

    var vm = this;

    return '\
<div class="cb-footer"></div>\
';
};

CodeBootVM.prototype.resizeHandleHTML = function () {

    var vm = this;

    return '\
<div class="cb-resize-handle">' + vm.SVG['resize'] + '</div>\
';
};


CodeBootVM.prototype.initRoot = function (opts, floating) {

    var vm = this;
    var nChildren = vm.root.childNodes.length;
    var filename = undefined;
    var content = null;

    function initLast() {

        vm.setAttribute('data-cb-editable', vm.editable);

        if (content !== null) {
            vm.fs.newFile(filename, content);
        }

        // In order to resize the repl's height, the CodeMirror-scroll
        // element's max-height must be explicitly changed

        var bodyElem = vm.root.querySelector('.cb-body');
        if (bodyElem) {
            var replContElem = bodyElem.querySelector('.cb-repl-container');
            if (replContElem) {
                vm.setupSplitter(bodyElem, function (size) {
                    var replScrollElem = replContElem.querySelector('.CodeMirror-scroll');
                    if (replScrollElem) {
                        replScrollElem.style.maxHeight = size + 'px';
                        vm.replScrollToEnd();
                    }
                });
            }
        }

        vm.root.querySelector('.CodeMirror').CodeMirror.refresh()

        var consoleElem = vm.root.querySelector('.cb-console');
        if (consoleElem) {
            vm.setupSplitter(consoleElem);
        }

        vm.setUILanguageFromBrowser();
    }
    
    if (vm.root.tagName === 'PRE') {


        content = vm.root.innerText;
        var elem = document.createElement('div');

        elem.className = 'cb-vm';

        elem.innerHTML =
            vm.execControlsHTML(false, false, true) +
            vm.bodyHTML(true, false) +
            vm.localHTML();

        vm.root.replaceWith(elem);
        vm.root = elem;

        vm.setAttribute('data-cb-show-editors', true);
        vm.setAttribute('data-cb-runable-code', true);

        vm.embedded = true
        vm.editable = (content === null);

    } else if (nChildren === 0) {

        vm.root.innerHTML =
            vm.headerHTML() +
            vm.navbarHTML(true, floating, false) +
            vm.bodyHTML(false, true) +
            vm.footerHTML() +
            vm.resizeHandleHTML() +
            vm.localHTML();

        vm.setAttribute('data-cb-show-console', true);
        vm.setAttribute('data-cb-show-repl-container', true);
        vm.setAttribute('data-cb-show-editors', true);

        vm.editable = true;

        if (opts.filename !== undefined)
            filename = opts.filename;

        if (opts.content !== undefined)
            content = opts.content;

    } else if (nChildren === 1) {

        var child = vm.root.childNodes[0];

        if (child.tagName === 'PRE') {

            content = child.innerText;

            vm.root.innerHTML =
                vm.execControlsHTML(false, false, true) +
                vm.bodyHTML(true, false) +
                vm.localHTML();

            vm.setAttribute('data-cb-show-editors', true);
            vm.setAttribute('data-cb-runable-code', true);
        }

        vm.editable = (content === null);
    }

    return initLast;
};

CodeBootVM.prototype.setUILanguageFromBrowser = function () {

    var vm = this;

    var languages = navigator.languages;
    var lang = null;

    for (var i=vm.langsUI.length-1; i>=0; i--) {
        var langUI = vm.langsUI[i][0];
        for (var j=0; j<languages.length; j++) {
            if (langUI === languages[j]) {
                lang = langUI;
                break;
            }
        }
    }

    if (lang === null) {
        for (var i=vm.langsUI.length-1; i>=0; i--) {
            var langUI = vm.langsUI[i][0];
            for (var j=0; j<languages.length; j++) {
                if (languages[j].indexOf(langUI+'-') === 0) {
                    lang = langUI;
                    break;
                }
            }
        }
    }

    if (lang === null) {
        lang = 'en';
    }

    vm.setAttribute('lang', lang);
};

CodeBootVM.prototype.initCommon = function (opts) {

    var vm = this;

    var common = document.createElement('div');
    common.innerHTML = vm.menuContextHTML() + vm.helpHTML();

    var ctxmenu = common.querySelector('.cb-menu-context');

    if (ctxmenu) {

        var bundle_state_url = null;
        var bundle_executable_url = null;

        function dismiss() {
            ctxmenu.style.display = 'none';
        }

        ctxmenu.addEventListener('mouseleave', function (event) {
            dismiss();
        });

        common.querySelectorAll('.dropdown-item').forEach(function (elem) {
            elem.addEventListener('click', function (event) {

                var elem = event.currentTarget;
                var val;

                if (val = elem.getAttribute('data-cb-context-presentation')) {
                    if (val === 'hidden') {
                        vm.setHidden(true);
                    } else if (val === 'floating') {
                        vm.setHidden(false);
                        vm.setFloating(true);
                    } else {
                        vm.setHidden(false);
                        vm.setFloating(false);
                    }
                } else if (elem.hasAttribute('data-cb-context-bundle-state')) {
                    vm.copyTextToClipboard(bundle_state_url);
                    vm.focusLastFocusedEditor();
                } else if (elem.hasAttribute('data-cb-context-bundle-executable')) {
                    vm.copyTextToClipboard(bundle_executable_url);
                    vm.focusLastFocusedEditor();
                }

                dismiss();
                event.stopPropagation();
                event.preventDefault();
            });
        });

        document.addEventListener('contextmenu', function (event) {

            var vm = getCodeBootVM(event.target);

            function done() {
                ctxmenu.querySelectorAll('.cb-svg-checkmark').forEach(function (elem) {
                    elem.style.visibility = 'hidden';
                });
                if (vm.root.hasAttribute('data-cb-hidden')) {
                    elem = ctxmenu.querySelector('[data-cb-context-presentation="hidden"] .cb-svg-checkmark');
                } else if (vm.root.hasAttribute('data-cb-floating')) {
                    elem = ctxmenu.querySelector('[data-cb-context-presentation="floating"] .cb-svg-checkmark');
                } else {
                    elem = ctxmenu.querySelector('[data-cb-context-presentation="full"] .cb-svg-checkmark');
                }
                if (elem) {
                    elem.style.visibility = 'visible';
                }
                elem = ctxmenu.querySelector('a[data-cb-context-bundle-state]');
                if (elem) {
                    elem.style.display = (bundle_state_url === null) ? 'none' : 'inline';
                }
                elem = ctxmenu.querySelector('a[data-cb-context-bundle-executable]');
                if (elem) {
                    elem.style.display = (bundle_executable_url === null) ? 'none' : 'inline';
                }
                ctxmenu.style.left = (event.pageX - 15) + 'px';
                ctxmenu.style.top = (event.pageY - 15) + 'px';
                ctxmenu.style.display = 'block';
            }

            if (vm &&
                !(event.target.closest('.cb-drawing-window') ||
                  event.target.closest('.cb-pixels-window'))) {

                event.stopPropagation();
                event.preventDefault();

                if (ctxmenu.style.display === 'none') {
                    vm.toURL(
                        false,
                        function (state_url) {
                            vm.toURL(
                                true,
                                function (executable_url) {
                                    bundle_state_url = state_url;
                                    bundle_executable_url = executable_url;
                                    done();
                                })
                        })
                }
            }
        });
    }

    document.body.appendChild(common);

    setupHelp();
};

CodeBootVM.prototype.setupSplitter = function (containerElem, setSize) {

    function px(style, property) {
        return parseInt(style.getPropertyValue(property).slice(0, -2));
    }

    if (!containerElem) return;

    var rigidElem = containerElem.querySelector(':scope > .cb-pane-rigid');
    var elasticElem = containerElem.querySelector(':scope > .cb-pane-elastic');
    var splitterElem = containerElem.querySelector(':scope > .cb-pane-splitter');

    if (!(rigidElem && elasticElem && splitterElem)) return;

    var rigidPaneLast = splitterElem.nextElementSibling === rigidElem;
    var containerStyle = window.getComputedStyle(containerElem);
    var rigidStyle = window.getComputedStyle(rigidElem);
    var elasticStyle = window.getComputedStyle(elasticElem);

    var vert = containerStyle.getPropertyValue('flex-direction') === 'column';
    var sizeProp = vert ? 'height' : 'width';
    var sizeMinProp = vert ? 'min-height' : 'min-width';

    var rigidSizeMin = px(rigidStyle, sizeMinProp);
    var elasticSizeMin = px(elasticStyle, sizeMinProp);

    var startPos = null;
    var startSize = null;
    var currentSize = null;

    //console.log(rigidElem);
    //console.log(rigidStyle.getPropertyValue('height'));

    rigidElem.style.flexBasis = rigidStyle.getPropertyValue('height');

    function mouseDown(event) {
        startPos = vert ? event.pageY : event.pageX;
        startSize = px(rigidStyle, sizeProp);
        currentSize = startSize;
        document.body.addEventListener('mousemove', mouseMove);
        document.body.addEventListener('mouseup', mouseEnd);
        event.preventDefault();
    }

    function mouseMove(event) {
        if (event.buttons && startPos !== null) {
            var elasticSize = px(elasticStyle, sizeProp);
            var pos = vert ? event.pageY : event.pageX;
            var dist = pos - startPos;
            if (rigidPaneLast) dist = -dist;
            var delta = Math.min(dist - (currentSize - startSize),
                                 elasticSize - elasticSizeMin);
            var size = Math.max(rigidSizeMin, delta + currentSize);
            //console.log(elasticSize, pos, dist, delta, size);
            rigidElem.style.flexBasis = size + 'px';
            if (setSize) setSize(size);
            currentSize = size;
        } else {
            mouseEnd();
        }
        event.preventDefault();
    }

    function mouseEnd(event) {
        startPos = null;
        document.body.removeEventListener('mouseup', mouseEnd);
        splitterElem.removeEventListener('mousemove', mouseMove);
    }

    splitterElem.addEventListener('mousedown', mouseDown);
};

function escape_HTML(text) {
  return text.replace(/[&<>"'`]/g, function (chr) {
    return '&#' + chr.charCodeAt(0) + ';';
  });
};

// UI events

CodeBootVM.prototype.unload = function () {
    var vm = this;
    vm.saveSession();
};

CodeBootVM.prototype.menuFileDrop = function (event) {
    var vm = this;
    if ('files' in event.dataTransfer) {
        vm.dropFiles(event.dataTransfer.files);
    }
};

CodeBootVM.prototype.dropFiles = function (files, i) {
    var vm = this;
    if (i === void 0) {
        i = 0;
    }
    if (i < files.length) {

        var file = files[i];
        var filename = 'scratch';
        if ('name' in file) {
            filename = file.name;
        } else if ('fileName' in file) {
            filename = file.fileName;
        }

        var reader = new FileReader();

        reader.addEventListener('loadend', function () {
            vm.dropFile(filename, decodeUtf8(reader.result));
            vm.dropFiles(files, i+1);
        });

        reader.readAsArrayBuffer(file);
    }
};

CodeBootVM.prototype.dropFile = function (filename, content) {

    var vm = this;
    var file;

    if (vm.fs.hasFile(filename)) {
        file = vm.fs._asFile(filename);
        var oldContent = file.getContent();
        if (content !== oldContent) {
            if (confirm('You are about to replace the file "' + filename + '" with different content.  Are you sure you want to proceed with the replacement and lose your local changes to that file?')) {
                file.setContent(content);
                vm.fs.openFile(filename);
            }
        }
    } else {
        file = new CodeBootFile(vm.fs, filename, content);
        vm.fs.addFile(file);
        vm.fs.rebuildFileMenu();
        vm.fs.openFile(filename);
    }
};

function decodeUtf8(arrayBuffer) {

  var result = '';
  var i = 0;
  var c = 0;
  var c1 = 0;
  var c2 = 0;

  var data = new Uint8Array(arrayBuffer);

  // If we have a BOM skip it
  if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
    i = 3;
  }

  while (i < data.length) {
    c = data[i];

    if (c < 128) {
      result += String.fromCharCode(c);
      i++;
    } else if (c > 191 && c < 224) {
      if( i+1 >= data.length ) {
        throw 'UTF-8 Decode failed. Two byte character was truncated.';
      }
      c2 = data[i+1];
      result += String.fromCharCode( ((c&31)<<6) | (c2&63) );
      i += 2;
    } else {
      if (i+2 >= data.length) {
        throw 'UTF-8 Decode failed. Multi byte character was truncated.';
      }
      c2 = data[i+1];
      c3 = data[i+2];
      result += String.fromCharCode( ((c&15)<<12) | ((c2&63)<<6) | (c3&63) );
      i += 3;
    }
  }
  return result;
}

CodeBootVM.prototype.setupTooltip = function () {

    var vm = this;

    vm.forEachElem('[data-toggle="tooltip"]', function (elem) {
        elem.setAttribute('data-container', vm.id);
        $(elem).tooltip();
    });
};

CodeBootVM.prototype.hideTooltip = function () {

    var vm = this;

    vm.forEachElem('[data-toggle="tooltip"]', function (elem) {
        elem.setAttribute('data-container', vm.id);
        $(elem).tooltip('hide');
    });
};

CodeBootVM.prototype.setupEventHandlers = function () {

    var vm = this;

    if (vm.editable) {
        vm.setupDrop(vm.root, function (event) {
            vm.menuFileDrop(event);
        });
    } else {
        vm.root.addEventListener('mousedown', function (event) {
            if (!vm.cloneIsOpen()) {
                vm.setAttribute('data-cb-show-clone', true);
            }
        });
    }

/*
    $('body').bind('dragover', function (event) {
        //alert('dragover');
        event.stopPropagation();
        event.preventDefault();
        return false;
    });
*/

    vm.forEachElem('.cb-menu-lang .dropdown-item', function (elem) {
        elem.addEventListener('click', function (event) {

            var elem = event.currentTarget;
            var val;

            if (val = elem.getAttribute('data-cb-setting-lang')) {
                vm.setLang(val);
                vm.setLangUI();
            }

            return true;
        });
    });

    vm.forEachElem('.cb-menu-settings .dropdown-item', function (elem) {
        elem.addEventListener('click', function (event) {

            var elem = event.currentTarget;
            var val;

            if (val = elem.getAttribute('data-cb-setting-speed')) {
                vm.setAnimationSpeed(val);
            } else if (elem.hasAttribute('data-cb-setting-show-line-numbers')) {
                vm.setShowLineNumbers(!vm.showLineNumbers);
            } else if (elem.hasAttribute('data-cb-setting-large-font')) {
                vm.setLargeFont(!vm.largeFont);
            } else if (val = elem.getAttribute('data-cb-setting-playground')) {
                if (val === 'show-drawing-window') {
                    vm.setPlaygroundToShow(vm.ui.dw.showing()?null:'drawing');
                } else if (val === 'show-pixels-window') {
                    vm.setPlaygroundToShow(vm.ui.pw.showing()?null:'pixels');
                } else if (val === 'show-chart-window') {
                    vm.setPlaygroundToShow(vm.ui.playground_showing === 'chart' ? null : 'chart');
                } else if (val === 'show-html-window') {
                    vm.setPlaygroundToShow(vm.ui.playground_showing === 'html' ? null : 'html');
                }
                vm.updatePlayground();
            } else if (val = elem.getAttribute('data-cb-setting-ui-lang')) {
                vm.setAttribute('lang', val);
            }

            return true;
        });
    });

    vm.forEachElem('.cb-exec-btn-step', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            vm.eventStepPause();
        });
    });

    vm.forEachElem('.cb-exec-btn-animate', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            vm.eventAnimate();
        });
    });

    vm.forEachElem('.cb-exec-btn-eval', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            vm.eventEval();
        });
    });

    vm.forEachElem('.cb-exec-btn-stop', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            vm.eventStop();
        });
    });

    vm.forEachElem('.cb-exec-btn-close', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            vm.eventClose();
        });
    });

    vm.forEachElem('.cb-exec-btn-clone', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            if (!vm.editable) {
                vm.setAttribute('data-cb-show-clone', false);
            }
            vm.eventClone();
        });
    });



/*
    $(function () {
        $('[data-toggle="popover"]').popover();
    })

    //TODO: deprecated?
    // Stop navigation to '#'
    $('body').on('click.codeboot.restoreFocus', '[data-cb-focus="restore"]', function (e) {
      vm.focusLastFocusedEditor();
    });
    $('body').on('click.codeboot.nonav', '[href="#"]', function (event) {
        event.preventDefault();
    });
*/
    $('#openFileModal').on('show', function () {
        $('#openFileModalOKBtn').attr('disabled', 'disabled');
        var $form = $('#openFileForm');
        $form.empty().append($('<input type="file" id="openFileInput">').change(function (e) {
            $('#openFileModalOKBtn').removeAttr('disabled');
        }));
    });

    $('#openFileModalOKBtn').on('click', function (event) {
        var files = $('#openFileInput').get(0).files;
        if (!files.length) return;

        var file = files[0];

        var filename = $('#openFileModal').attr('data-cb-filename');
        vm.loadFile(vm.fs.getEditor(filename), file);
    });
/*
    vm.root.addEventListener('mousedown', function (event) {
        event = event || window.event;
        event.preventDefault();
        event.stopPropagation();
        vm.cb.bringToFront(vm);
    });
*/
    vm.setupMoveRezizeHandlers();
};

CodeBootVM.prototype.toggleHidden = function () {

    var vm = this;

    vm.setHidden(!vm.root.hasAttribute('data-cb-hidden'));
};

CodeBootVM.prototype.setHidden = function (hidden) {

    var vm = this;

    vm.setAttribute('data-cb-hidden', hidden);

    if (!hidden) {
        vm.refresh();
    }
};

CodeBootVM.prototype.toggleFloating = function () {

    var vm = this;

    vm.setFloating(!vm.root.hasAttribute('data-cb-floating'));
};

CodeBootVM.prototype.setFloating = function (floating) {

    var vm = this;

    vm.setAttribute('data-cb-floating', floating);
    vm.setAttribute('data-cb-resizable', floating);

    var elem = vm.root;

    elem.removeAttribute('style');

    if (floating) {
        var maxX = window.innerWidth;
        var maxY = window.innerHeight;
        var width = Math.max(vm.minWidth, Math.floor(maxX*2/3));
        var height = Math.max(vm.minHeight, Math.floor(maxY*2/3));
        // var left = Math.max(0, (maxX - width) / 2);
        // var top = Math.max(0, maxY - height - 20);
        var left = 0
        var top = 0

        console.log(left, top)

        if (elem.latest_width_height !== undefined) {
            width = elem.latest_width_height.width;
            height = elem.latest_width_height.height;
        }

        change_width_height(elem, width, height);

        if (elem.latest_left_top !== undefined) {
            left = elem.latest_left_top.left;
            top = elem.latest_left_top.top;
        }

        change_left_top(elem, left, top);
    }
    else{
      if (!vm.embedded){
        elem.style.height = '100vh';
        elem.style.width = '100%'
      }
    }
};

function change_width_height(elem, width, height) {

    if (elem.latest_width_height === undefined) {
        var maxX = window.innerWidth;
        var maxY = window.innerHeight;
        elem.latest_width_height = { width: width, height: height };
    } else {
        elem.latest_width_height.width = width;
        elem.latest_width_height.height = height;
    }

    elem.style.width = width + 'px';
    elem.style.height = height + 'px';
}

function change_left_top(elem, left, top) {

    if (elem.latest_left_top === undefined) {
        var maxX = window.innerWidth;
        var maxY = window.innerHeight;
        elem.latest_left_top = { left: left, top: top };
    } else {
        elem.latest_left_top.left = left;
        elem.latest_left_top.top = top;
    }

    elem.style.left = left + 'px';
    elem.style.top = top + 'px';
}

CodeBootVM.prototype.setupMoveRezizeHandlers = function () {

    var vm = this;

    var elem = vm.root;
    var latestX = 0;
    var latestY = 0;
    var eventScope = document;
    var resize = false;

    function mousedownMove(event) {
        if (vm.root.hasAttribute('data-cb-floating')) {
            resize = false;
            mousedown(event);
        }
    }

    function mousedownResize(event) {
        if (vm.root.hasAttribute('data-cb-floating')) {
            resize = true;
            mousedown(event);
        }
    }

    function mousedown(event) {

        event = event || window.event;
        event.preventDefault();

        latestX = event.clientX; // init starting point
        latestY = event.clientY;

        eventScope.addEventListener('mouseup', mouseup);
        eventScope.addEventListener('mousemove', mousemove);
    }

    function mousemove(event) {
        
        // All positions are relative to parent element
        var boundingBox = elem.getBoundingClientRect()

        var event = event || window.event;
        event.preventDefault();

        if (event.buttons === 0) {
            mouseup();
            return;
        }

        var curW = elem.clientWidth;
        var curH = elem.clientHeight;

        var maxX = window.innerWidth;
        var maxY = window.innerHeight;

        var clientX = event.clientX;
        var clientY = event.clientY;

        var dx = clientX - latestX;
        var dy = clientY - latestY;

        var curX = elem.offsetLeft; 
        var curY = elem.offsetTop;

        // Difference between the "left" and "top" properties and the actual x,y values
        //   on the screen. We can only control the "left" and "top" values but there are
        //   sometimes not representative of the actual x,y position of the div..
        var diffXLeft = boundingBox.x - curX;
        var diffYTop = boundingBox.y - curY;

        if (resize) {
            var newW = Math.min(maxX-curX, Math.max(vm.minWidth, curW+dx));
            var newH = Math.min(maxY-curY, Math.max(vm.minHeight, curH+dy));
            dx = newW - curW;
            dy = newH - curH;
            change_width_height(elem, newW, newH);
        } else {
            var newX = Math.min(maxX-curW/2, Math.max(-curW/2, curX+diffXLeft+dx)) - diffXLeft;
            var newY = Math.min(maxY-curH/2, Math.max(0, curY+diffYTop+dy)) - diffYTop;
            dx = newX - curX;
            dy = newY - curY;
            change_left_top(elem, newX, newY);
        }

        latestX += dx;
        latestY += dy;
    }

    function mouseup() {
        eventScope.removeEventListener('mouseup', mouseup);
        eventScope.removeEventListener('mousemove', mousemove);
    }

    vm.forEachElem('.cb-navbar', function (elem) {
        elem.addEventListener('mousedown', mousedownMove);
    });

    vm.forEachElem('.cb-resize-handle', function (elem) {
        elem.addEventListener('mousedown', mousedownResize);
    });
};

CodeBootVM.prototype.setClass = function (cls, add) {

    var vm = this;

    if (add) {
        vm.root.classList.add(cls);
    } else {
        vm.root.classList.remove(cls);
    }
};

CodeBootVM.prototype.setAttribute = function (attr, value) {

    var vm = this;

    if (value === true)
        vm.root.setAttribute(attr, '');
    else if (value === false)
        vm.root.removeAttribute(attr);
    else
        vm.root.setAttribute(attr, value);
};

CodeBootVM.prototype.stateChanged = function () {
//    console.log('stateChanged');
};

CodeBootVM.prototype.stateAddedHistory = function (line) {
//    console.log('stateAddedHistory |'+line+'|');
};

CodeBootVM.prototype.setDevMode = function (devMode) {

    var vm = this;
    var change = (devMode !== vm.devMode);

    if (change) {

        if (devMode) {
            var privkey = prompt('Private key?');
            if (privkey !== null && privkey !== '')
                vm.cb.privkey = privkey;
        }

        vm.devMode = devMode;

        vm.setAttribute('data-cb-dev-mode', devMode);

        vm.stateChanged();
    }
};

CodeBootVM.prototype.toggleDevMode = function () {

    var vm = this;

    vm.setDevMode(!vm.devMode);
};

var normalStepDelay = 500; // milliseconds per step

CodeBootVM.prototype.setAnimationSpeed = function (speed) {

    var vm = this;
    var change = (speed !== vm.animationSpeed);

    if (change) {

        switch (speed) {

        case 'slow':
            vm.setStepDelay(5*normalStepDelay);
            break;

        default:
            speed = 'normal';
        case 'normal':
            vm.setStepDelay(normalStepDelay);
            break;

        case 'fast':
            vm.setStepDelay(0.2*normalStepDelay);
            break;

        case 'lightning':
            vm.setStepDelay(1);
            break;
        }

        vm.animationSpeed = speed;

        vm.setAttribute('data-cb-animation-speed', speed);

        // Update UI to reflect newly selected speed

        vm.setCheckmark('data-cb-setting-speed', speed, true);

        vm.stateChanged();
    }
};

CodeBootVM.prototype.setStepDelay = function (delay) {

    var vm = this;

    vm.stepDelay = delay;
    vm.ui.stepDelay = delay;
}

CodeBootVM.prototype.setShowLineNumbers = function (show) {

    var vm = this;
    var change = (show !== vm.showLineNumbers);

    if (change) {

        vm.showLineNumbers = show;

        vm.setCheckmark('data-cb-setting-show-line-numbers', null, show);

        vm.setAttribute('data-cb-show-line-numbers', show);

        vm.fs.forEachEditor(function (editor) {
            editor.editor.setOption('lineNumbers', vm.showLineNumbers);
        });

        vm.stateChanged();
    }
};

CodeBootVM.prototype.setLargeFont = function (large) {

    var vm = this;
    var change = (large !== vm.largeFont);

    if (change) {

        vm.largeFont = large;

        vm.setCheckmark('data-cb-setting-large-font', null, large);

        vm.setAttribute('data-cb-large-font', large);

        vm.refresh();

        vm.stateChanged();
    }
};

CodeBootVM.prototype.refresh = function () {

    var vm = this;

    vm.repl.refresh();
    vm.replScrollToEnd();

    vm.fs.forEachEditor(function (editor) {
        editor.editor.refresh();
    });
};

// Execution related events

CodeBootVM.prototype.afterDelay = function (thunk, delay) {

    var vm = this;

    return setTimeout(thunk, Math.max(1, (delay === undefined ? 0 : delay)));
};

CodeBootVM.prototype.trackProcessEvent = function (event) {

    var vm = this;

    if (event === vm.latestProcessEvent) {
        vm.latestProcessEventRepeat++;
    } else {
        vm.latestProcessEvent = event;
        vm.latestProcessEventRepeat = 1;
    }
};

CodeBootVM.prototype.processEvent = function (event) {

    var vm = this;

    vm.afterDelay(function () {

        switch (event) {

        case 'steppause':
            vm.trackProcessEvent(event);
            vm.execStepPause();
            vm.focusLastFocusedEditor();
            break;

        case 'animate':
            vm.trackProcessEvent(event);
            vm.execAnimate();
            vm.focusLastFocusedEditor();
            break;

        case 'eval':
            vm.trackProcessEvent(event);
            vm.execEval();
            vm.focusLastFocusedEditor();
            break;

        case 'clearconsole':
            vm.trackProcessEvent(event);
            vm.execStop();
            vm.replReset();
            vm.focusLastFocusedEditor();
            break;

        case 'stop':
            vm.trackProcessEvent(event);
            vm.execStop();
            if (vm.latestProcessEventRepeat < 3) {
                vm.focusLastFocusedEditor();
                break;
            }
            // fallthrough to 'reset' when stop repeated 3 times in a row
            event = 'reset';

        case 'reset':
            var new_force_reset = !vm.force_reset;
            vm.trackProcessEvent(event);
            vm.execReset();
            vm.focusLastFocusedEditor();
            vm.force_reset = new_force_reset;
            if (new_force_reset) {
                vm.showExecControlsMessage('Reset', 400);
            } else {
                vm.showExecControlsMessage('Reset cancelled', 400);
            }
            break;

        case 'clone':
            vm.clone();
            vm.focusLastFocusedEditor();
            break;

        case 'close':
            vm.close();
            break;
        }
    });
};

CodeBootVM.prototype.eventClearConsole = function () {
    var vm = this;
    vm.processEvent('clearconsole');
};

CodeBootVM.prototype.eventStepPause = function () {
    var vm = this;
    vm.processEvent('steppause');
};

CodeBootVM.prototype.eventAnimate = function () {
    var vm = this;
    vm.processEvent('animate');
};

CodeBootVM.prototype.eventEval = function () {
    var vm = this;
    vm.processEvent('eval');
};

CodeBootVM.prototype.eventStop = function () {
    var vm = this;
    vm.processEvent('stop');
};

CodeBootVM.prototype.eventReset = function () {
    var vm = this;
    vm.processEvent('reset');
};

CodeBootVM.prototype.eventClone = function () {
    var vm = this;
    vm.processEvent('clone');
};

CodeBootVM.prototype.eventClose = function () {
    var vm = this;
    vm.processEvent('close');
};

function cb_internal_getBounds($element) {
    var offset = $element.offset();
    var w = $element.width();
    var h = $element.height();
    return {
        left: offset.left,
        top: offset.top,
        width: w,
        clientWidth: w,
        height: h,
        clientHeight: h
    };
}

CodeBootVM.prototype.replFocus = function () {

    var vm = this;

    if (!vm.repl) return;

//    vm.replInput.focus();
    vm.repl.focus();
};

CodeBootVM.prototype.focusDestroyed = function () {

    var vm = this;

    vm.replFocus();
};

CodeBootVM.prototype.focusLastFocusedEditor = function () {

    var vm = this;

    if (vm.lastFocusedEditor !== null) {
        vm.lastFocusedEditor.focus();
    }
}
