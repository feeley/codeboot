/* ----- UI helpers ----- */

var NAVBAR_HEIGHT = 40;
var EDITOR_SPACING = 20;

function makeCloseButton() {
    return $("<button/>").addClass("close").append("&times;");
}

function makeMenuSeparator() {
    return $('<li class="divider"></li>');
}

function scrollTo(elementOrSelector) {
    var elementOffset = $(elementOrSelector).offset().top - NAVBAR_HEIGHT - EDITOR_SPACING;
    $("body").animate({scrollTop: elementOffset}, 400);
}

function makeToolbar() {
    /*
      <div class="btn-toolbar pull-right">
        <div class="btn-group">
          <button id="step-button" title="Step" class="btn" onclick="cp.animate(0);"><i class="icon-play"></i><img id="step-mode-icon" src="icons/exp_pause.png"><img id="single-step-icon" class="hide" src="icons/exp_1.png"></button>
          <button id="play-button" title="Execute" class="btn" onclick="cp.play();"><i class="icon-play"></i><img src="icons/exp_inf.png"></button>
          <div class="btn-group">
            <button id="animate-button" title="Animate" class="btn" onclick="cp.animate(500);"><i class="icon-play"></i></button>
            <button id="animate-dropdown" class="btn dropdown-toggle hide" data-toggle="dropdown">
              <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
              <li><a href="#" onclick="cp.animate(2000);">Animate slowly</a></li>
              <li><a href="#" onclick="cp.animate(500);">Animate</a></li>
              <li><a href="#" onclick="cp.animate(125);">Animate quickly</a></li>
            </ul>
          </div>
          <button id="pause-button" title="Pause" class="btn disabled" onclick="cp.animate(0);"><i class="icon-pause"></i></button>
          <button id="cancel-button" title="Stop" class="btn disabled" onclick="cp.cancel();"><i class="icon-stop"></i></button>
        </div>
      </div>
    */

    var $toolbar = $('<div class="btn-toolbar pull-right"/>');

    return $toolbar;
}

function makeTBGroup() {
    return $('<div class="btn-group"/>');
}

function makeTBButton($contents, props) {
    var $btn = $('<button class="btn"/>');

    for (var key in props) {
        $btn.attr(key, props[key]);
    }

    if (contents) {
        $btn.append($contents);
    }

    return $btn;
}

/* ----- Internal file system ----- */

var NEW_FILE_DEFAULT_CONTENT = "// Enter JavaScript code here";

if (cp.fs === (void 0)) {
    cp.fs = {};
    cp.fs.builtins = {
            'sample/hello' : 'println("Hello, world!\\n")',
            'sample/fact'  : 'function fact(n) {\n' +
                             '    if (n <= 0) return 1;\n' +
                             '    return n * fact(n-1);\n' +
                             '}',
            'sample/fib'   : 'function fib(n) {\n' +
                             '    if (n <= 2) return n;\n' +
                             '    return fib(n-1) + fib(n-2);\n' +
                             '}',
    };
    cp.fs.files = Object.create(cp.fs.builtins);
    cp.fs.editors = {};
}

cp.addFileToMenu = function (filename, builtin) {
    var $file_item = $('<li/>');
    $file_item.attr("data-cp-filename", filename);
    var $file_link = $('<a href="#"/>');
    $file_link.click(function () {
        cp.openFile(filename);
    });
    $file_link.text(filename);
    $file_item.append($file_link);

    if (!builtin) {
        var $deleteButton = $('<i class="icon-trash pull-right"/>');
        $file_link.append($deleteButton);
        $deleteButton.click(function () {
            cp.deleteFile(filename);
        });
    }

    $("#file-list").prepend($file_item);
};

cp.rebuildFileMenu = function () {
    $("#file-list").empty();
    for (var filename in cp.fs.files) {
        var isBuiltin = cp.fs.builtins.hasOwnProperty(filename);
        cp.addFileToMenu(filename, isBuiltin);
    }
};

cp.initFS = function () {
    cp.rebuildFileMenu();
};

cp.generateUniqueFilename = function () {
    var prefix = "script";
    for (var index = 1; ; index++) {
        var candidateName = prefix + index;
        if (!(candidateName in cp.fs.files)) {
            return candidateName;
        }
    }
};

cp.getContainerFor = function (filename) {
    return $('.row[data-cp-filename="' + filename + '"]').get(0);
};

cp.openFile = function (filename) {
    var container = cp.getContainerFor(filename);
    if (container) {
        scrollTo(container);
    } else {
        cp.newTab(filename);
    }
};

cp.closeFile = function (filename) {
    if (cp.fs.editors.hasOwnProperty(filename)) {
        cp.fs.files[filename] = cp.fs.editors[filename].getValue();
        delete cp.fs.editors[filename];
    }

    $(cp.getContainerFor(filename)).remove();
};

cp.deleteFile = function (filename) {
    $('[data-cp-filename="' + filename + '"]').remove();

    delete cp.fs.editors[filename];
    delete cp.fs.files[filename];
};

cp.makeEditorToolbar = function (filename) {
    var $toolbar = makeToolbar();

    var $group = makeTBGroup();
    $group.appendTo($toolbar);

    var $loadButton = makeTBButton("load");
    $loadButton.appendTo($group);

    return $toolbar;
};

cp.newTab = function (filename) {
	/*
     * <div class="row">
     *   <ul class="nav nav-tabs">
     *     <li class="active"><a href="#">Untitled.js<button class="close">&times;</button></a></li>
     *   </ul>
     *   <pre class="tab-content"></pre>
     * </div>
    */

	var $row = $('<div class="row"/>');
	$row.attr("data-cp-filename", filename);

	var $toolbar = cp.makeEditorToolbar(filename);
	$row.append($toolbar);

	var $nav = $('<ul class="nav nav-tabs"/>');

	var $closeButton = makeCloseButton();
	$closeButton.click(function () {
	    cp.closeFile(filename);
	});
	$tab_label = $('<a href="#"/>').text(filename).append($closeButton);
	$nav.append($('<li class="active"/>').append($tab_label));
	$row.append($nav);

	var $pre = $('<pre class="tab-content file-editor"/>');
	$row.append($pre);

	$("#contents").prepend($row);

	var editor = createCodeEditor($pre.get(0));
    editor.setValue(cp.fs.files[filename]);
    cp.fs.editors[filename] = editor;
};

cp.newFile = function () {
    var filename = cp.generateUniqueFilename();
    cp.fs.files[filename] = NEW_FILE_DEFAULT_CONTENT || "";
    cp.addFileToMenu(filename);
    cp.newTab(filename);
};