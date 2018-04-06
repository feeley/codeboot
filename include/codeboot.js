// codeBoot state

var normalStepDelay = 400; // milliseconds per step

function CodeBoot() {

    this.builtins = {};

    this.hostGlobalObject = (function () { return this; })();

//    this.globalObject = {cb: this};
    this.globalObject = {};

    this.programState = null;

    this.languageLevel = 'novice';
    this.devMode = false;
    this.animationSpeed = 'normal';
    this.stepDelay = normalStepDelay;

    this.saveInProgress = false;
    this.lastFocusedEditor = null;
    this.allowLosingFocus = false;
    this.options = {
        showLineNumbers: false,
        largeFont: false
    };

    this.lastExecEvent = 'stop';

    this.alerts = undefined;
    this.repl = undefined;

    this.lastAST = null;
    this.lastSource = null;
    this.lastResult = null;
    this.lastResultRepresentation = null;
}

var cb = new CodeBoot();

// codeBoot globalObject getter/setter

CodeBoot.prototype.getGlobal = function (name) {
    return cb.globalObject[name];
};

CodeBoot.prototype.setGlobal = function (name, value) {
    cb.globalObject[name] = value;
};

// codeBoot UI events

CodeBoot.prototype.unload = function () {
    cb.saveSession();
};

CodeBoot.prototype.menuFileDrop = function (event) {
    if ('files' in event.dataTransfer) {
        cb.dropFiles(event.dataTransfer.files);
    }
};

CodeBoot.prototype.dropFiles = function (files, i) {
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
            cb.dropFile(filename, decodeUtf8(reader.result));
            cb.dropFiles(files, i+1);
        });

        reader.readAsArrayBuffer(file);
    }
};

CodeBoot.prototype.dropFile = function (filename, content) {

    var file;

    if (cb.fs.hasFile(filename)) {
        file = cb.fs._asFile(filename);
        var oldContent = file.getContent();
        if (content !== oldContent) {
            if (confirm('You are about to replace the file "' + filename + '" with different content.  Are you sure you want to proceed with the replacement and lose your local changes to that file?')) {
                file.setContent(content);
            }
        }
    } else {
        file = new CBFile(cb.fs, filename, content);
        cb.fs.addFile(file);
        cb.fs.rebuildFileMenu();
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

CodeBoot.prototype.setupEventHandlers = function () {

    cb.setupDrop(document.body, function (event) {
        cb.menuFileDrop(event);
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
            cb.fs.newFile();
        } else {
            cb.fs.openFile(filename);
        }

        return true;
    });

    $('#cb-menu-settings .dropdown-item').on('click', function (event) {

        var $item = $(event.currentTarget);
        var val;

        if (val = $item.attr('data-cb-setting-level')) {
            cb.setLanguageLevel(val);
        } else if (val = $item.attr('data-cb-setting-speed')) {
            cb.setAnimationSpeed(val);
        } else if (val = $item.attr('data-cb-setting-editor')) {
            if (val === 'line-numbers') {
                cb.setShowLineNumbers(!cb.options.showLineNumbers);
            } else if (val === 'large-font') {
                cb.setLargeFont(!cb.options.largeFont);
            }
        } else if (val = $item.attr('data-cb-setting-graphics')) {
            if (val === 'show-window') {
                var showWindow = $('a[data-cb-setting-graphics="' + val + '"] > span').css('visibility') === 'hidden';
                cb.setShowDrawingWindow(!showing_drawing_window());
            }
        }

        return true;
    });

    $('#cb-exec-btn-step').on('click', function (event) {
        $('#cb-exec-btn-step').tooltip('hide');
        cb.eventStep();
    });

    $('#cb-exec-btn-animate').on('click', function (event) {
        $('#cb-exec-btn-animate').tooltip('hide');
        cb.eventAnimate();
    });

    $('#cb-exec-btn-eval').on('click', function (event) {
        $('#cb-exec-btn-eval').tooltip('hide');
        cb.eventEval();
    });

    $('#cb-exec-btn-stop').on('click', function (event) {
        $('#cb-exec-btn-stop').tooltip('hide');
        cb.eventStop();
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
      cb.focusLastFocusedEditor();
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
        cb.loadFile(cb.fs.getEditor(filename), file);
    });

};

CodeBoot.prototype.main = function () {

    window.onbeforeunload = function () {
        if (cb.saveInProgress) {
            cb.saveInProgress = false;
            return undefined;
        }
        if (!cb.devMode) {
            return 'You codeBoot session will be lost.'
        } else {
            return undefined;
        }
    };

    if (!CodeMirror.commands.save) {
        CodeMirror.commands.save = function (cm) {
            if (cm.save) cm.save(cm);
        };
    }

    cb.alerts = document.getElementById('alerts');
    cb.repl = cb.createREPL();

    cb.fs = new CBFileManager();

    cb.setupEventHandlers();

    cb.loadSession();

    cb.enterMode(cb.modeStopped());

    cb.setPromptREPL();
    cb.focusREPL();

    cb.handle_query();
};

$(document).ready(function () {
    cb.main();
});

CodeBoot.prototype.eventStep = function (event) {
    cb.execStep();
    cb.focusLastFocusedEditor();
};

CodeBoot.prototype.setLanguageLevel = function (level) {

    var prevLevel = cb.languageLevel;

    cb.languageLevel = level;

    if ( level === "novice" ) {

      cbR.updateColor( "#7db6d5" );

    } else {

      cbR.updateColor( "#e7a555" );

    }

    $('body').attr('data-cb-lang-level', level);

    $('a[data-cb-setting-level] > span')
        .css('visibility', 'hidden');
    $('a[data-cb-setting-level="' + level + '"] > span')
        .css('visibility', 'visible');

};

CodeBoot.prototype.setDevMode = function (devMode) {

    cb.devMode = devMode;

    if (cb.devMode) {
        $('#cb-menu-brand-btn-mode').text(' (dev mode)');
    } else {
        $('#cb-menu-brand-btn-mode').text('');
    }
};

CodeBoot.prototype.toggleDevMode = function () {

    cb.setDevMode(!cb.devMode);

};

CodeBoot.prototype.setAnimationSpeed = function (speed) {

    switch (speed) {

    case 'slow':
        cb.setStepDelay(5*normalStepDelay);
        break;

    default:
        speed = 'normal';
    case 'normal':
        cb.setStepDelay(normalStepDelay);
        break;

    case 'fast':
        cb.setStepDelay(0.2*normalStepDelay);
        break;

    case 'turbo':
        cb.setStepDelay(20);
        break;

    case 'lightning':
        cb.setStepDelay(1);
        break;

    }

    this.animationSpeed = speed;

    $('a[data-cb-setting-speed] > span')
        .css('visibility', 'hidden');
    $('a[data-cb-setting-speed="' + speed + '"] > span')
        .css('visibility', 'visible');

};

CodeBoot.prototype.setStepDelay = function (delay) {

    cb.stepDelay = delay;
    cb.programState.stepDelay = delay;

}

CodeBoot.prototype.setShowLineNumbers = function (show) {

    cb.options.showLineNumbers = show;

    cb.fs.forEachEditor(function (editor) {
        editor.editor.setOption('lineNumbers', cb.options.showLineNumbers);
    });

    $('a[data-cb-setting-editor="line-numbers"] > span')
        .css('visibility', show ? 'visible' : 'hidden');

};

CodeBoot.prototype.setLargeFont = function (large) {

    cb.options.largeFont = large;

    $('a[data-cb-setting-editor="large-font"] > span')
        .css('visibility', large ? 'visible' : 'hidden');

    if (large) {
        $('body').addClass('cb-large-font');
    } else {
        $('body').removeClass('cb-large-font');
    }

    //TODO: needed?
    cb.repl.refresh();
    cb.scrollToEndREPL();

    cb.fs.forEachEditor(function (editor) {
        editor.editor.refresh();
    });

};

CodeBoot.prototype.setShowDrawingWindow = function (show) {

    if (show) {
        show_drawing_window();
    } else {
        hide_drawing_window();
    }

};

// Execution events

CodeBoot.prototype.eventAnimate = function () {
    cb.execAnimate();
    cb.focusLastFocusedEditor();
};

CodeBoot.prototype.eventEval = function () {
    cb.execEval();
    cb.focusLastFocusedEditor();
};

CodeBoot.prototype.eventStop = function () {
    cb.execStop();
    cb.focusLastFocusedEditor();
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

CodeBoot.prototype.focusREPL = function () {
//    cb.replInput.focus();
    cb.repl.focus();
};

CodeBoot.prototype.focusDestroyed = function () {
    cb.focusREPL();
};

CodeBoot.prototype.focusLastFocusedEditor = function () {
    if (cb.lastFocusedEditor !== null) {
        cb.lastFocusedEditor.focus();
    }
}
