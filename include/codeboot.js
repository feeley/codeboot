// codeBoot state

var normalStepDelay = 400; // milliseconds per step

function CodeBoot() {

    this.vms = {};
    this.vm_count = 0;

//    this.globalObject = {cb: this};
//    this.globalObject = {}; // TODO: move to Js class

//    this.language = 'js-novice';
}

CodeBoot.prototype.hostGlobalObject = (function () { return this; })();

CodeBoot.prototype.hasHostGlobal = function (id) {
    return Object.prototype.hasOwnProperty.call(CodeBoot.prototype.hostGlobalObject, id);
};

CodeBoot.prototype.getHostGlobal = function (id) {
    return CodeBoot.prototype.hostGlobalObject[id];
};

CodeBoot.prototype.setHostGlobal = function (id, val) {
    CodeBoot.prototype.hostGlobalObject[id] = val;
};

CodeBoot.prototype.setup_vms = function () {
    var cb = this;
    document.querySelectorAll('.cb-vm').forEach(function (elem) {
        cb.setup_vm(elem);
    });
};

CodeBoot.prototype.setup_vm = function (elem) {
    var cb = this;
    return new CodeBootVM(cb, elem, {});
};

CodeBoot.prototype.get_vm = function (elem) {

    var vm = void 0;
    var cb_vm_elem = elem.closest('.cb-vm'); // find enclosing cb-vm element

    if (cb_vm_elem) vm = this.vms['#' + cb_vm_elem.getAttribute('id')];

    return vm;
};

function setup_CodeBoot() {

    var cb = new CodeBoot();

    cb.setup_vms();

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

//    cb.handle_query();
};

$(document).ready(setup_CodeBoot);

// CodeBoot virtual machines encapsulate an execution environment

function CodeBootVM(cb, elem, opts) {

    var vm = this;

    var index = ++cb.vm_count;
    var id = 'cb-vm-' + index; // default id

    if (elem.hasAttribute('id')) {
        id = elem.getAttribute('id');
    } else {
        if (opts.id !== undefined)
            id = opts.id;
        elem.setAttribute('id', id);
    }

    id = '#' + id;

    cb.vms[id] = vm;

    vm.id    = id;    // id of this VM, typically '#cb-vm-N'
    vm.cb    = cb;    // CodeBoot container
    vm.elem  = elem;  // DOM element with class 'cb-vm'
    vm.index = index; // sequence number, typically the N in the id
    vm.langs = {};    // language instances in use
    vm.lang  = null;  // reference to instance of Lang
    vm.level = null;  // the selected level of the language

    vm.ui = new vm.UI();

    vm.devMode = false;
    vm.animationSpeed = 'normal';
    vm.stepDelay = normalStepDelay;

    vm.saveInProgress = false;
    vm.lastFocusedEditor = null;
    vm.allowLosingFocus = false;
    vm.options = {
        showLineNumbers: false,
        largeFont: false
    };

    vm.lastExecEvent = 'stop';

    vm.alerts = undefined;
    vm.repl = undefined;

    vm.lastAST = null;
    vm.lastSource = null;
    vm.lastResult = null;
    vm.lastResultRepresentation = null;

    vm.mousePos = { x: 0, y: 0 };
    vm.mouseDown = false;

    var id_and_level;

    if (elem.hasAttribute('data-cb-lang'))
        id_and_level = elem.getAttribute('data-cb-lang');
    else if (opts.lang !== undefined)
        id_and_level = opts.lang;
    else
        id_and_level = ''; // use default language of class Lang

    id_and_level = Lang.prototype.full(id_and_level);

    elem.setAttribute('data-cb-lang', id_and_level);

    vm.setLang(id_and_level);

    if (!elem.hasChildNodes()) { // init root element when empty
        vm.initHTML();
    }
        
    elem.classList.add('cb-vm'); // force class in case not yet set
    elem.classList.add('cb-hide-header');
    elem.classList.add('cb-hide-playground');
    elem.classList.add('cb-hide-footer');

    vm.alerts = document.getElementById('alerts');
    vm.repl = vm.createREPL();

    vm.fs = new CodeBootFileSystem(vm);

    vm.setupEventHandlers();

    vm.loadSession();

    vm.enterMode(vm.modeStopped());

    vm.setPromptREPL();
    vm.focusREPL();
};

CodeBootVM.prototype.UI = function () {

    var ui = this;

    ui.errorMark = null;
    ui.execPointMark = null;
    ui.execPointBubble = new CodeBootExecPointBubble();
    ui.value_bubble = null; //TODO: deprecated
    ui.timeoutId = null;
    ui.stepDelay = 0;
    ui.mode = null;
    ui.code_queue = [];
};

CodeBootVM.prototype.loadLang = function (id) {

    var vm = this;

    if (!Object.prototype.hasOwnProperty.call(vm.langs, id)) {
        vm.langs[id] = Lang.prototype.create(id, vm);
    }

    return vm.langs[id];
};

CodeBootVM.prototype.setLang = function (id_and_level) {

    var vm = this;
    var x = Lang.prototype.split(id_and_level);
    var id = x.id;
    var level = x.level;

    vm.lang = vm.loadLang(id); // load language
    vm.level = level;

    // Update UI to reflect newly selected language

    vm.elem.setAttribute('data-cb-lang', id_and_level);
    vm.setCheckmark('data-cb-setting-lang', id_and_level);

    var brandImg = vm.lang.getBrandImg(level, true, '24px');
    document.querySelectorAll('.cb-lang-img-on-dark').forEach(function (e) {
        e.innerHTML = brandImg;
    });
};

CodeBootVM.prototype.setCheckmark = function (setting, value) {

    var vm = this;
    var elem = vm.elem;

    // In configuration menu, remove checkmark for this setting

    elem.querySelectorAll('a[' + setting + '] > span').forEach(function (e) {
        e.style.visibility = 'hidden';
    });

    // In configuration menu, add checkmark for newly selected setting

    var e = elem.querySelector('a[' + setting +
                               ((typeof(value) === 'string')
                                ? '="' + value + '"'
                                : '') +  '] > span');
    if (e) e.style.visibility = 'visible';
};

CodeBootVM.prototype.initHTML = function () {

    var vm = this;

    vm.elem.innerHTML = '\n\
\n\
  <div id="cb-header"></div>\n\
\n\
  <div id="cb-navbar">\n\
\n\
    <div id="cb-navbar-header"></div>\n\
\n\
    <div id="cb-navbar-controls">\n\
\n\
      <!-- Menus -->\n\
\n\
      <div id="cb-menu">\n\
\n\
        <span id="cb-menu-brand">\n\
          <button class="btn btn-secondary cb-button" type="button" id="cb-menu-brand-btn" data-toggle="modal" data-target="#cb-about-box"><span class="cb-lang-img-on-dark">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;&nbsp;&nbsp;codeBoot v3.0<span id="cb-menu-brand-btn-mode"></span></button>\n\
        </span>\n\
\n\
        <span id="cb-menu-file" class="dropdown">\n\
          <button class="btn btn-secondary cb-button" type="button" id="cb-menu-file-btn" data-toggle="dropdown">&nbsp;&nbsp;<i class="fa fa-file"></i>&nbsp;</button>\n\
          <div id="cb-file-selection" class="dropdown-menu">\n\
          </div>\n\
        </span>\n\
\n\
        <span id="cb-menu-settings" class="dropdown">\n\
\n\
          <button id="cb-menu-settings-btn" class="btn btn-secondary cb-button" type="button" data-toggle="dropdown">&nbsp;&nbsp;<i class="fa fa-cogs"></i>&nbsp;</button>\n\
          <div class="dropdown-menu">\n\
\n\
            <h5 class="dropdown-header">Language</h5>\n\
\n\
            <div id="cb-menu-settings-lang">\n\
              <a href="#" class="dropdown-item" data-cb-setting-lang="js-novice"><span><i class="fa fa-check"></i></span>&nbsp;&nbsp;<img src="include/lang/js/js-img-black.svg" width="20px"></i>&nbsp;&nbsp;JavaScript (novice)</a>\n\
              <a href="#" class="dropdown-item" data-cb-setting-lang="js-standard"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;<img src="include/lang/js/js-img-color.svg" width="20px"></i>&nbsp;&nbsp;JavaScript (standard)</a>\n\
              <a href="#" class="dropdown-item" data-cb-setting-lang="py-novice"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;<img src="include/lang/py/py-img-black.svg" width="20px"></i>&nbsp;&nbsp;Python (novice)</a>\n\
            </div>\n\
\n\
            <div class="dropdown-divider"></div>\n\
\n\
            <h5 class="dropdown-header">Animation speed</h5>\n\
            <a href="#" class="dropdown-item" data-cb-setting-speed="slow"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Slow</a>\n\
            <a href="#" class="dropdown-item" data-cb-setting-speed="normal"><span><i class="fa fa-check"></i></span>&nbsp;&nbsp;Normal</a>\n\
            <a href="#" class="dropdown-item" data-cb-setting-speed="fast"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Fast</a>\n\
            <a href="#" class="dropdown-item" data-cb-setting-speed="turbo"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Turbo</a>\n\
            <a href="#" class="dropdown-item" data-cb-setting-speed="lightning"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Lightning</a>\n\
\n\
            <div class="dropdown-divider"></div>\n\
\n\
            <h5 class="dropdown-header">Editing</h5>\n\
            <a href="#" class="dropdown-item" data-cb-setting-editor="line-numbers"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Show line numbers</a>\n\
            <a href="#" class="dropdown-item" data-cb-setting-editor="large-font"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Large font</a>\n\
\n\
            <div class="dropdown-divider"></div>\n\
\n\
            <h5 class="dropdown-header">Graphics</h5>\n\
            <a href="#" class="dropdown-item" data-cb-setting-graphics="show-drawing-window"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Show drawing window</a>\n\
            <a href="#" class="dropdown-item" data-cb-setting-graphics="show-pixels-window"><span style="visibility: hidden;"><i class="fa fa-check"></i></span>&nbsp;&nbsp;Show pixels window</a>\n\
\n\
          </div>\n\
        </span>\n\
\n\
      </div>\n\
\n\
      <!-- Execution control buttons -->\n\
\n\
      <div id="cb-exec-controls">\n\
\n\
        <div id="cb-exec-controls-counter">\n\
          <span id="cb-exec-step-counter" class="badge badge-primary badge-pill cb-step-counter"></span>\n\
        </div>\n\
\n\
        <div id="cb-exec-controls-buttons" class="btn-group" role="group" data-toggle="tooltip" data-delay="2000" data-trigger="manual" data-placement="left" title="TRY ME!">\n\
\n\
          <button id="cb-exec-btn-step" type="button" class="btn btn-secondary cb-button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Single step/Pause">\n\
            <img id="cb-exec-img-play-1" src="include/img/play-1.png"></img>\n\
            <img id="cb-exec-img-pause" src="include/img/pause.png"></img>\n\
            <img id="cb-exec-img-play-pause" src="include/img/play-pause.png"></img>\n\
          </button>\n\
\n\
          <button id="cb-exec-btn-animate" type="button" class="btn btn-secondary cb-button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Execute with animation">\n\
            <img id="cb-exec-img-play" src="include/img/play.png"></img>\n\
          </button>\n\
\n\
          <button id="cb-exec-btn-eval" type="button" class="btn btn-secondary cb-button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Execute to end">\n\
            <img id="cb-exec-img-play-inf" src="include/img/play-inf.png"></img>\n\
          </button>\n\
\n\
          <button id="cb-exec-btn-stop" type="button" class="btn btn-secondary cb-button" data-toggle="tooltip" data-delay="750" data-placement="bottom" title="Stop">\n\
            <img id="cb-exec-img-stop" src="include/img/stop.png"></img>\n\
          </button>\n\
\n\
        </div>\n\
\n\
      </div>\n\
\n\
    </div>\n\
\n\
    <div id="cb-navbar-footer"></div>\n\
\n\
  </div>\n\
\n\
  <div id="cb-console">\n\
    <div id="cb-repl-container">\n\
      <textarea id="cb-repl"></textarea>\n\
    </div>\n\
    <div class="cb-playground">\n\
      <div id="cb-drawing-window" ondblclick="drawing_window.screenshot();"></div>\n\
      <div id="cb-pixels-window" ondblclick="pixels_window.screenshot();"></div>\n\
      <div id="b"></div>\n\
    </div>\n\
  </div>\n\
\n\
  <div id="cb-editors">\n\
    <ul id="cb-file-tabs" class="nav nav-tabs"></ul>\n\
  </div>\n\
    \n\
  <div id="cb-footer"></div>\n\
    \n\
<!---------------------------------------------------------------------------->\n\
\n\
<!-- Hidden elements -->\n\
\n\
<div id="cb-exec-point-bubble-template"></div>\n\
\n\
<div id="cb-about-box" class="modal fade" role="dialog">\n\
  <div class="modal-dialog">\n\
\n\
    <div class="modal-content">\n\
      <div class="modal-header">\n\
        <h4 class="modal-title">About codeBoot</h4>\n\
      </div>\n\
      <div class="modal-body">\n\
        <p>codeBoot is developped by Marc Feeley and Bruno Dufour using the following components:</p>\n\
        <ul>\n\
          <li><a href="http://github.com/twbs/bootstrap" target="_blank">Bootstrap</a></li>\n\
          <li><a href="http://jquery.com/" target="_blank">jQuery</a></li>\n\
          <li><a href="http://codemirror.net/" target="_blank">CodeMirror</a></li>\n\
        </ul>\n\
        <p>The code is freely <a href="https://github.com/udem-dlteam/codeboot" target="_blank">available on Github</a>. Feel free\n\
          to <a href="https://github.com/udem-dlteam/codeboot/issues/new" target="_blank">report issues</a> or contribute.</p>\n\
      </div>\n\
    </div>\n\
  </div>\n\
</div>\n\
\n\
<form id="cb-form-download" class="hide" action="download.php" method="post">\n\
  <textarea id="cb-form-download-content" name="content"></textarea>\n\
  <textarea id="cb-form-download-filename" name="filename"></textarea>\n\
</form>\n\
';
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

    $('#cb-menu-file .dropdown-item').on('click', function (event) {

        var $item = $(event.currentTarget);
        var filename = $item.attr('data-cb-filename');

        if (filename === void 0) {
            vm.fs.newFile();
        } else {
            vm.fs.openFile(filename);
        }

        return true;
    });

    $('#cb-menu-settings .dropdown-item').on('click', function (event) {

        var elem = event.currentTarget;
        //var vm = vm.cb.get_vm(elem); // get event's vm

        if (vm) {

            var val;

            if (val = elem.getAttribute('data-cb-setting-lang')) {
                vm.setLang(val);
            } else if (val = elem.getAttribute('data-cb-setting-speed')) {
                vm.setAnimationSpeed(val);
            } else if (val = elem.getAttribute('data-cb-setting-editor')) {
                if (val === 'line-numbers') {
                    vm.setShowLineNumbers(!vm.options.showLineNumbers);
                } else if (val === 'large-font') {
                    vm.setLargeFont(!vm.options.largeFont);
                }
            } else if (val = elem.getAttribute('data-cb-setting-graphics')) {
                if (val === 'show-drawing-window') {
                    vm.setShowDrawingWindow(!showing_drawing_window());
                } else if (val === 'show-pixels-window') {
                    vm.setShowPixelsWindow(!showing_pixels_window());
                }
            }
        }

        return true;
    });

    $('#cb-exec-btn-step').on('click', function (event) {
        $('#cb-exec-btn-step').tooltip('hide');
        vm.eventStep();
    });

    $('#cb-exec-btn-animate').on('click', function (event) {
        $('#cb-exec-btn-animate').tooltip('hide');
        vm.eventAnimate();
    });

    $('#cb-exec-btn-eval').on('click', function (event) {
        $('#cb-exec-btn-eval').tooltip('hide');
        vm.eventEval();
    });

    $('#cb-exec-btn-stop').on('click', function (event) {
        $('#cb-exec-btn-stop').tooltip('hide');
        vm.eventStop();
    });

    $('body').on('mousemove', function (event) {
        vm.mousePos = { x: event.pageX, y: event.pageY };
    });

    $('body').on('mousedown', function (event) {
        vm.mouseDown = true;
    });

    $('body').on('mouseup', function (event) {
        vm.mouseDown = false;
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    })

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

CodeBootVM.prototype.setDevMode = function (devMode) {

    var vm = this;

    vm.devMode = devMode;

    if (vm.devMode) {
        $('#cb-menu-brand-btn-mode').text(' (dev mode)');
    } else {
        $('#cb-menu-brand-btn-mode').text('');
    }
};

CodeBootVM.prototype.toggleDevMode = function () {

    var vm = this;

    vm.setDevMode(!cb.devMode);

};

CodeBootVM.prototype.setAnimationSpeed = function (speed) {

    switch (speed) {

    case 'slow':
        this.cb.setStepDelay(5*normalStepDelay);
        break;

    default:
        speed = 'normal';
    case 'normal':
        this.cb.setStepDelay(normalStepDelay);
        break;

    case 'fast':
        this.cb.setStepDelay(0.2*normalStepDelay);
        break;

    case 'turbo':
        this.cb.setStepDelay(20);
        break;

    case 'lightning':
        this.cb.setStepDelay(1);
        break;
    }

    this.cb.animationSpeed = speed;

    // Update UI to reflect newly selected speed

    this.setCheckmark('data-cb-setting-speed', speed);
};

CodeBootVM.prototype.setStepDelay = function (delay) {

    var vm = this;

    vm.stepDelay = delay;
    vm.ui.stepDelay = delay;

}

CodeBootVM.prototype.setShowLineNumbers = function (show) {

    var vm = this;

    vm.cb.options.showLineNumbers = show;

    vm.cb.fs.forEachEditor(function (editor) {
        editor.editor.setOption('lineNumbers', cb.options.showLineNumbers);
    });

    vm.setCheckmark('data-cb-setting-editor', 'line-numbers', show);
};

CodeBootVM.prototype.setLargeFont = function (large) {

    var vm = this;

    vm.cb.options.largeFont = large;

    vm.setCheckmark('data-cb-setting-editor', 'large-font', large);

    if (large) {
        $('body').addClass('cb-large-font');
    } else {
        $('body').removeClass('cb-large-font');
    }

    //TODO: needed?
    vm.cb.repl.refresh();
    vm.cb.scrollToEndREPL();

    vm.cb.fs.forEachEditor(function (editor) {
        editor.editor.refresh();
    });

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

CodeBootVM.prototype.eventStep = function () {
    var vm = this;
    setTimeout(function () {
        vm.execStep();
        vm.focusLastFocusedEditor();
    }, 0);
};

CodeBootVM.prototype.eventAnimate = function () {
    var vm = this;
    setTimeout(function () {
        vm.execAnimate();
        vm.focusLastFocusedEditor();
    }, 0);
};

CodeBootVM.prototype.eventEval = function () {
    var vm = this;
    setTimeout(function () {
        vm.execEval();
        vm.focusLastFocusedEditor();
    }, 0);
};

CodeBootVM.prototype.eventStop = function () {
    var vm = this;
    setTimeout(function () {
        vm.execStop();
        vm.focusLastFocusedEditor();
    }, 0);
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

CodeBootVM.prototype.focusREPL = function () {
    var vm = this;
//    vm.replInput.focus();
    vm.repl.focus();
};

CodeBootVM.prototype.focusDestroyed = function () {
    var vm = this;
    vm.focusREPL();
};

CodeBootVM.prototype.focusLastFocusedEditor = function () {
    var vm = this;
    if (vm.lastFocusedEditor !== null) {
        vm.lastFocusedEditor.focus();
    }
}
