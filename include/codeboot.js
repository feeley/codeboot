// codeBoot state

document.addEventListener('DOMContentLoaded', function () {
    new CodeBoot();
});

function CodeBoot() {

    var cb = this;

    window.addEventListener('beforeunload', function (event) {
        return cb.beforeunload(event);
    });

    cb.vms = {};
    cb.vmCount = 0;

    cb.setupAllVM(document);

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    })

/*TODO: fix
    $('body').on('mousemove', function (event) {
        vm.mousePos = { x: event.pageX, y: event.pageY };
    });

    $('body').on('mousedown', function (event) {
        vm.mouseDown = true;
    });

    $('body').on('mouseup', function (event) {
        vm.mouseDown = false;
    });

*/

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

CodeBoot.prototype.setupAllVM = function (elem) {

    var cb = this;

    elem.querySelectorAll('.cb-vm').forEach(function (root) {
        cb.setupVM(root);
    });
};

CodeBoot.prototype.setupVM = function (root) {

    var cb = this;

    return new CodeBootVM(cb, root, {});
};

CodeBoot.prototype.getVM = function (elem) {

    var vm = undefined;
    var root = elem.closest('.cb-vm'); // find enclosing cb-vm element

    if (root) vm = this.vms['#' + root.getAttribute('id')];

    return vm;
};

CodeBoot.prototype.beforeunload = function (event) {
    console.log('beforeunload');
    event.preventDefault();
    event.returnValue = '';
    return 'your session will be lost';
};

// CodeBoot virtual machines encapsulate an execution environment

function CodeBootVM(cb, root, opts) {

    var vm = this;

    var index = ++cb.vmCount;
    var id = 'cb-vm-' + index; // default id

    if (root.hasAttribute('id')) {
        id = root.getAttribute('id');
    } else {
        if (opts.id)
            id = opts.id;
        root.setAttribute('id', id);
    }

    id = '#' + id;

    cb.vms[id] = vm;

    vm.id    = id;    // id of this VM, typically '#cb-vm-N'
    vm.cb    = cb;    // CodeBoot container
    vm.root  = root;  // DOM element with class 'cb-vm'
    vm.index = index; // sequence number, typically the N in the id
    vm.langs = {};    // language instances in use
    vm.lang  = null;  // reference to instance of Lang
    vm.level = null;  // the selected level of the language

    new CodeBootFileSystem(vm); // initializes vm.fs

    vm.devMode = false;
    vm.showLineNumbers = undefined;
    vm.largeFont = undefined;
    vm.animationSpeed = undefined;
    vm.stepDelay = normalStepDelay;

    vm.saveInProgress = false;
    vm.lastFocusedEditor = null;
    vm.allowLosingFocus = true;

    vm.lastExecEvent = 'stop';

    vm.repl = null;

    vm.lastAST = null;
    vm.lastSource = null;
    vm.lastResult = null;
    vm.lastResultRepresentation = null;

    vm.mousePos = { x: 0, y: 0 };
    vm.mouseDown = false;

    vm.setClass('cb-vm', true); // force class in case not yet set

    vm.setAttribute('data-cb-hide-header', true);
    vm.setAttribute('data-cb-hide-playground', true);
    vm.setAttribute('data-cb-hide-footer', true);

    var id_and_level;

    if (opts.lang !== undefined)
        id_and_level = opts.lang;
    else if (root.hasAttribute('data-cb-lang'))
        id_and_level = root.getAttribute('data-cb-lang');
    else
        id_and_level = ''; // use first language and level registered

    id_and_level = Lang.prototype.full(id_and_level);

    vm.setLang(id_and_level);

    var initLast = vm.initRoot();

    vm.initUI();

    vm.setLangUI();

    vm.setupEventHandlers();

    vm.loadSession();

    vm.enterMode(vm.modeStopped());

    vm.replSetPrompt(true);
    vm.replFocus();

    vm.setDevMode(opts.devMode !== undefined
                  ? opts.devMode
                  : root.hasAttribute('data-cb-dev-mode'));

    vm.setShowLineNumbers(opts.showLineNumbers !== undefined
                          ? opts.showLineNumbers
                          : root.hasAttribute('data-cb-show-line-numbers'));
    
    vm.setLargeFont(opts.largeFont !== undefined
                    ? opts.largeFont
                    : root.hasAttribute('data-cb-large-font'));

    vm.setAnimationSpeed(opts.animationSpeed !== undefined
                         ? opts.animationSpeed
                         : (root.getAttribute('data-cb-animation-speed') ||
                            'normal'));

    initLast();
};

CodeBootVM.prototype.initUI = function () {

    var vm = this;

    new vm.UI(vm); // initializes vm.ui

    vm.fs.init();
};

// Access to host's globals

CodeBootVM.prototype.hostGlobalObject = (function () { return this; })();

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
    ui.code_queue = [];

    vm.ui = ui;
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
  <a href="#" class="dropdown-item" data-toggle="modal" data-target="#cb-about-box">About codeBoot v3.0</a>\
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
<span class="dropdown cb-menu-settings">\
\
  <button class="btn btn-secondary cb-button cb-menu-settings-btn" type="button" data-toggle="dropdown">' + vm.SVG['checkmark'] + '</button>\
  <div class="dropdown-menu">\
\
    <h5 class="dropdown-header">Animation speed</h5>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="slow">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Slow</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="normal">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Normal</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="fast">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Fast</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="turbo">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Turbo</a>\
    <a href="#" class="dropdown-item" data-cb-setting-speed="lightning">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Lightning</a>\
\
    <div class="dropdown-divider"></div>\
\
    <h5 class="dropdown-header">Editing</h5>\
    <a href="#" class="dropdown-item" data-cb-setting-show-line-numbers>' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Show line numbers</a>\
    <a href="#" class="dropdown-item" data-cb-setting-large-font>' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Large font</a>\
\
    <div class="dropdown-divider"></div>\
\
    <h5 class="dropdown-header">Graphics</h5>\
    <a href="#" class="dropdown-item" data-cb-setting-graphics="show-drawing-window">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Show drawing window</a>\
    <a href="#" class="dropdown-item" data-cb-setting-graphics="show-pixels-window">' + vm.SVG['checkmark'] + '&nbsp;&nbsp;Show pixels window</a>\
\
  </div>\
</span>\
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

CodeBootVM.prototype.SVG =
    {
        'file':
        '<svg class="cb-svg-file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M14.341 5.579c-0.347-0.473-0.831-1.027-1.362-1.558s-1.085-1.015-1.558-1.362c-0.806-0.591-1.197-0.659-1.421-0.659h-5.75c-0.689 0-1.25 0.561-1.25 1.25v11.5c0 0.689 0.561 1.25 1.25 1.25h9.5c0.689 0 1.25-0.561 1.25-1.25v-7.75c0-0.224-0.068-0.615-0.659-1.421zM12.271 4.729c0.48 0.48 0.856 0.912 1.134 1.271h-2.406v-2.405c0.359 0.278 0.792 0.654 1.271 1.134v0zM14 14.75c0 0.136-0.114 0.25-0.25 0.25h-9.5c-0.136 0-0.25-0.114-0.25-0.25v-11.5c0-0.135 0.114-0.25 0.25-0.25 0 0 5.749-0 5.75 0v3.5c0 0.276 0.224 0.5 0.5 0.5h3.5v7.75z"></path><path fill="#000000" d="M9.421 0.659c-0.806-0.591-1.197-0.659-1.421-0.659h-5.75c-0.689 0-1.25 0.561-1.25 1.25v11.5c0 0.604 0.43 1.109 1 1.225v-12.725c0-0.135 0.115-0.25 0.25-0.25h7.607c-0.151-0.124-0.297-0.238-0.437-0.341z"></path></svg>',

        'settings':
        '<svg class="cb-svg-settings" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path transform="translate(0,2) scale(0.3)" fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10zM20 7l30 0l0 4l-30 0l0 -4z"></path><path transform="translate(0,6) scale(0.3)" fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10zM20 7l30 0l0 4l-30 0l0 -4z"></path><path transform="translate(0,10) scale(0.3)" fill="#000000" d="M13.5 2l-7.5 7.5-3.5-3.5-2.5 2.5 6 6 10-10zM20 7l30 0l0 4l-30 0l0 -4z"></path></svg>',

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

        'trash':
        '<svg class="cb-svg-trash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M2 5v10c0 0.55 0.45 1 1 1h9c0.55 0 1-0.45 1-1v-10h-11zM5 14h-1v-7h1v7zM7 14h-1v-7h1v7zM9 14h-1v-7h1v7zM11 14h-1v-7h1v7z"></path><path fill="#000000" d="M13.25 2h-3.25v-1.25c0-0.412-0.338-0.75-0.75-0.75h-3.5c-0.412 0-0.75 0.338-0.75 0.75v1.25h-3.25c-0.413 0-0.75 0.337-0.75 0.75v1.25h13v-1.25c0-0.413-0.338-0.75-0.75-0.75zM9 2h-3v-0.987h3v0.987z"></path></svg>',

        'close':
        '<svg class="cb-svg-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#000000" d="M15.854 12.854c-0-0-0-0-0-0l-4.854-4.854 4.854-4.854c0-0 0-0 0-0 0.052-0.052 0.090-0.113 0.114-0.178 0.066-0.178 0.028-0.386-0.114-0.529l-2.293-2.293c-0.143-0.143-0.351-0.181-0.529-0.114-0.065 0.024-0.126 0.062-0.178 0.114 0 0-0 0-0 0l-4.854 4.854-4.854-4.854c-0-0-0-0-0-0-0.052-0.052-0.113-0.090-0.178-0.114-0.178-0.066-0.386-0.029-0.529 0.114l-2.293 2.293c-0.143 0.143-0.181 0.351-0.114 0.529 0.024 0.065 0.062 0.126 0.114 0.178 0 0 0 0 0 0l4.854 4.854-4.854 4.854c-0 0-0 0-0 0-0.052 0.052-0.090 0.113-0.114 0.178-0.066 0.178-0.029 0.386 0.114 0.529l2.293 2.293c0.143 0.143 0.351 0.181 0.529 0.114 0.065-0.024 0.126-0.062 0.178-0.114 0-0 0-0 0-0l4.854-4.854 4.854 4.854c0 0 0 0 0 0 0.052 0.052 0.113 0.090 0.178 0.114 0.178 0.066 0.386 0.029 0.529-0.114l2.293-2.293c0.143-0.143 0.181-0.351 0.114-0.529-0.024-0.065-0.062-0.126-0.114-0.178z"></path></svg>',

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

CodeBootVM.prototype.execControlsHTML = function () {

    var vm = this;

    return '\
<span class="cb-exec-controls">\
\
  <span class="cb-exec-controls-counter">\
    <span class="badge badge-primary badge-pill cb-step-counter cb-exec-step-counter" style="display: none;"></span>\
  </span>\
\
  <div class="btn-group cb-exec-controls-buttons" role="group" data-toggle="tooltip" data-delay="2000" data-trigger="manual" data-placement="left" title="TRY ME!">\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-step" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Single step/Pause">' +
CodeBootVM.prototype.SVG['play-1'] +
CodeBootVM.prototype.SVG['pause'] +
CodeBootVM.prototype.SVG['play-pause'] + '\
    </button>\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-animate" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Execute with animation">' +
CodeBootVM.prototype.SVG['play'] + '\
    </button>\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-eval" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Execute to end">' +
CodeBootVM.prototype.SVG['play-inf'] + '\
    </button>\
\
    <button class="btn btn-secondary cb-button cb-exec-btn-stop" type="button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Stop">' +
CodeBootVM.prototype.SVG['stop'] + '\
    </button>\
\
  </div>\
\
</span>\
';
};

CodeBootVM.prototype.navbarHTML = function () {

    var vm = this;

    return '\
<div class="cb-navbar">\
\
  <div class="cb-navbar-header"></div>\
\
  <div class="cb-navbar-controls">\
\
' + vm.menuHTML() + vm.execControlsHTML() + '\
\
  </div>\
\
  <div class="cb-navbar-footer"></div>\
\
</div>\
';
};

CodeBootVM.prototype.consoleHTML = function (display) {

    var vm = this;

    return '\
<div class="cb-console"' + (display ? '' : ' style="display: none;"') + '>\
  <div class="cb-repl-container">\
    <textarea class="cb-repl"></textarea>\
  </div>\
  <div class="cb-playground">\
    <div class="cb-drawing-window" ondblclick="drawing_window.screenshot();"></div>\
    <div class="cb-pixels-window" ondblclick="pixels_window.screenshot();"></div>\
    <div class="cb-body"></div>\
  </div>\
</div>\
';
};

CodeBootVM.prototype.editorsHTML = function (enableTabs) {

    var vm = this;

    return '\
<div class="cb-editors">\
' + (enableTabs ? '<ul class="nav nav-tabs cb-file-tabs"></ul>' : '') + '\
</div>\
';
};

CodeBootVM.prototype.footerHTML = function () {

    var vm = this;

    return '\
<div class="cb-footer"></div>\
';
};

CodeBootVM.prototype.initRoot = function () {

    var vm = this;
    var nChildren = vm.root.childNodes.length;
    var content = null;

    function initLast() {
        if (content !== null) {

            var file = vm.fs.newFile(undefined, content);

            file.setReadOnly(true);

            vm.setClass('cb-read-only', true);
        }
    }

    if (vm.root.tagName === 'PRE') {

        content = vm.root.innerText;
        var elem = document.createElement('div');

        elem.className = 'cb-vm';

        elem.innerHTML =
            vm.execControlsHTML() +
            vm.editorsHTML(false) +
            vm.consoleHTML(false);

        vm.root.replaceWith(elem);
        vm.root = elem;

        vm.setAttribute('data-cb-runable-code', true);

    } else if (nChildren === 0) {

        vm.root.innerHTML =
            vm.headerHTML() +
            vm.navbarHTML() +
            vm.consoleHTML(true) +
            vm.editorsHTML(true) +
            vm.footerHTML();

    } else if (nChildren === 1) {

        var child = vm.root.childNodes[0];

        if (child.tagName === 'PRE') {

            content = child.innerText;

            vm.root.innerHTML =
                vm.execControlsHTML() +
                vm.editorsHTML(false) +
                vm.consoleHTML(false);

            vm.setAttribute('data-cb-runable-code', true);

        }
    }

    return initLast;
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
        } else {
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
            }
        }
    } else {
        file = new CodeBootFile(vm.fs, filename, content);
        vm.fs.addFile(file);
        vm.fs.rebuildFileMenu();
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

CodeBootVM.prototype.hideTooltip = function () {

    var vm = this;

    //TODO: limit to the VM
    $('[data-toggle="tooltip"]').tooltip('hide');
};

CodeBootVM.prototype.setupEventHandlers = function () {

    var vm = this;

    vm.setupDrop(document.body, function (event) {
        vm.menuFileDrop(event);
    });

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
            } else if (val = elem.getAttribute('data-cb-setting-graphics')) {
                if (val === 'show-drawing-window') {
                    vm.setShowDrawingWindow(!showing_drawing_window());
                } else if (val === 'show-pixels-window') {
                    vm.setShowPixelsWindow(!showing_pixels_window());
                }
            }

            return true;
        });
    });

    vm.forEachElem('.cb-exec-btn-step', function (elem) {
        elem.addEventListener('click', function (event) {
            vm.hideTooltip();
            vm.eventStep();
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
    console.log('stateChanged');
};

CodeBootVM.prototype.stateAddedHistory = function (line) {
    console.log('stateAddedHistory |'+line+'|');
};

CodeBootVM.prototype.setDevMode = function (devMode) {

    var vm = this;
    var change = (devMode !== vm.devMode);

    if (change) {

        vm.devMode = devMode;

        vm.setAttribute('data-cb-dev-mode', devMode);
        if (vm.devMode) {
            $('.cb-menu-brand-btn-mode').text(' (dev mode)');
        } else {
            $('.cb-menu-brand-btn-mode').text('');
        }

        vm.stateChanged();
    }
};

CodeBootVM.prototype.toggleDevMode = function () {

    var vm = this;

    vm.setDevMode(!vm.devMode);
};

var normalStepDelay = 400; // milliseconds per step

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

        case 'turbo':
            vm.setStepDelay(20);
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

        //TODO: needed?
        vm.repl.refresh();
        vm.replScrollToEnd();

        vm.fs.forEachEditor(function (editor) {
            editor.editor.refresh();
        });

        vm.stateChanged();
    }
};

CodeBootVM.prototype.setShowDrawingWindow = function (show) {

    var vm = this;

    if (show) {
        show_drawing_window();
    } else {
        hide_drawing_window();
    }
};

CodeBootVM.prototype.setShowPixelsWindow = function (show) {

    var vm = this;

    if (show) {
        show_pixels_window();
    } else {
        hide_pixels_window();
    }
};

// Execution events

CodeBootVM.prototype.ASAP = function (thunk) {

    var vm = this;

    setTimeout(thunk, 0);
};

CodeBootVM.prototype.eventStep = function () {

    var vm = this;

    vm.ASAP(function () {
        vm.execStep();
        vm.focusLastFocusedEditor();
    });
};

CodeBootVM.prototype.eventAnimate = function () {

    var vm = this;

    vm.ASAP(function () {
        vm.execAnimate();
        vm.focusLastFocusedEditor();
    });
};

CodeBootVM.prototype.eventEval = function () {

    var vm = this;

    vm.ASAP(function () {
        vm.execEval();
        vm.focusLastFocusedEditor();
    });
};

CodeBootVM.prototype.eventStop = function () {

    var vm = this;

    vm.ASAP(function () {
        vm.execStop();
        vm.focusLastFocusedEditor();
    });
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
