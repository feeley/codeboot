/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot Corrector system --
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
 * corrector.js
 *
 * Authors:
 * - Olivier Dion <olivier.dion@polymtl.ca>
 */


/*============================================================================+
 |                         CodeBoot Corrector Manager                         |
 +============================================================================*/
const TEMPLATE_FILE_DIALOG ="#cb-corrector-file-dialog";
const IMPORT_FILE_DIALOG = "#cb-import-file-dialog";
const CORRECTION_WIDTH = "250px";


function CBCorrectorManager() {

    this.main = {fs:cb.fs, go:cb.globalObject};
    this.contexts = {"main":this.main};

    this.currentContext = "main";
    this.lastContext    = "main";

    this.correction_file = null;
}


CBCorrectorManager.prototype.loadTemplateDialog = function() {
    $(TEMPLATE_FILE_DIALOG).click();
};

CBCorrectorManager.prototype.importFileDialog = function() {
    $(IMPORT_FILE_DIALOG).click();
};


/*
 * File dialog
 */
CBCorrectorManager.prototype.handleFiles = function(files) {

    if (!files.length)
        return;

    var file = files[0];

    var reader = new FileReader();

    var self = this;

    $(reader).on('loadend', function() {

	for (key in self.contexts) {
	    var fs = self.contexts[key].fs;
	    var f = new CBFile(fs,
			       file.name,
			       reader.result,
			       null);

	    fs.addFile(f);

	    if (fs == cb.fs)
		f.editor.enable();
	}

	cb.fs.rebuildFileMenu();
    });

    setTimeout(function() {reader.readAsText(file);}, 0);
};


CBCorrectorManager.prototype.toggleNav = (function() {

    var isOpen = false;

    return function() {

        if (isOpen)
            cb.cm.closeNav();
        else
            cb.cm.openNav();

        isOpen = !isOpen;
    }
}());


CBCorrectorManager.prototype.closeNav = function() {
    $("#cb-sidenav").width("0");
    $("main").css("margin-left", "0");
    $("#check-correction-mode").css("visibility", "hidden");
    this.switchContext("main");
};


CBCorrectorManager.prototype.openNav = function() {
    $("#cb-sidenav").width(CORRECTION_WIDTH);
    $("main").css("margin-left", CORRECTION_WIDTH);
    $("#check-correction-mode").css("visibility", "visible");
    this.switchContext(this.lastContext);
};



function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const CM_WAIT_TIME = 250;

CBCorrectorManager.prototype.createContext = async function(student) {

    var fs = new CBFileManager();

    // Reference new file manager and create new global object context by cloning
    // the main.
    this.contexts[student.id] = {fs:fs,
				 go:cb.clone(cb.builtins)};

    // Wait until all files have been loaded
    while (student.sem)
	await delay(CM_WAIT_TIME);

    for (var i=0; i<student.files.length; ++i) {

	var f = student.files[i];

        var file = new CBFile(fs,
			      f.filename,
			      f.content,
			      {meta:f.meta});

        fs.addFile(file);
    }

    if (this.correction_file !== null)
	fs.addFile(new CBFile(fs,
			      this.correction_file.filename,
			      this.correction_file.content,
			      null));

    return fs.files;
};


CBCorrectorManager.prototype.switchContext = function(id) {

    var context = this.contexts[id];

    cb.fs.editorManager.removeAllEditors();

    cb.fs = context.fs;
    cb.globalObject = context.go;

    for (file in cb.fs.files) {
        cb.fs.files[file].editor.enable();
    }

    cb.fs.rebuildFileMenu();

    this.lastContext    = this.currentContext;
    this.currentContext = id;
};


CBCorrectorManager.prototype.addStudent = (function() {

    // WARNING: Arcane code is following

    const card_template = '<div class="card"> <div class="card-header"> <h5 class="mb-0"> <button class="btn btn-link" data-toggle="collapse" aria-expanded="true"></button> </h5> </div> <div class="collapse" data-parent="#cb-accordion"> <div class="card-body"></div> </div></div>';

    var accordion = $("#cb-accordion");

    return function(student) {

	this.createContext(student);

        var card = $(card_template);
        var id  = student.id;
	var body = card.find(".card-body");

        card.find(".card-header")
            .attr("id", "heading-" + id);

        card.find(".card-header >  h5 > button")
            .attr("data-target", "#" + id)
            .attr("aria-controls", id)
	    .after('<input ' + 'data-onstyle="success" data-offstyle="danger" data-toggle="toggle" data-style="android" data-off="Not Corrected" data-on="Corrected" type="checkbox">')
            .text(id)
            .click($.proxy(this.switchContext, this, id));

	for (var i=0; i<student.files.length; ++i) {

	    var file = student.files[i];

	    body.append('<h5 class="card-subtitle mb-2 text-muted">' + file.filename + '</h5>');

	    for (var m in file.meta) {
		var meta = $('<div><label>' + m + '</label>' + '<input style="width:90%;" type="' +   file.meta[m].type + '" value="' + file.meta[m].value + '"' + (file.meta[m].readonly === true ? "readonly":"") + '></div><br>');
		// This is where all the magic happens... Plz refactor me.
		var input = meta[0].children[1];
		$(input).change((
		    function() {
			var f  = file;
			var _m = m;
			var __m = input;

			return function() {
			    f.meta[_m].value = __m.value;
			};
		    }
		)());

		body.append(meta);
	    }

	    body.append($('<hr>'));
	}

        card.children("div:nth-child(2)")
            .attr("id", id)
            .attr("aria-labelledby", "heading-" + id);

        accordion.append(card);
    };
}());



CBCorrectorManager.prototype.exportFile = function(file) {

    var data = {content:file.editor.editor.doc.getValue(),
		filename:file.filename,
		feedbacks:cb.fm.serializeMarks(file.editor)};

    $.post("/export_file",
	   {raw:JSON.stringify(data)},
	   function (_data) {
	       file.meta["sha1"] = _data;
	   },
	  "text");
};


/**************************************************************************
 *Here we receive the files imported by the corrector. This		  *
 *algorithm assume thaht the following standard hasn't			  *
 *changed. StudiUM give a .zip to the corrector, which is then		  *
 *unzipped. The corrector selects the folder that she wants to		  *
 *correct. Here's an example of such a tree.				  *
 *									  *
 *.									  *
 *|									  *
 *|-- ([A-Z][a-z]+\s[A-Z][a-z]+)_([0-9])+_assignsubmission_file_/\w+(\.js)*
 *|									  *
 *|-- Olivier Dion_12925471_assignsubmission_file_/fichier1.js		  *
 *|									  *
 *|-- Olivier Dion_12925471_assignsubmission_file_/fichier2.js		  *
 *									  *
 *Remark that only files ending with .js will be imported.		  *
 *									  *
 *									  *
 *The parser will parse the first regex group, which is the "first	  *
 *name 'space' last name" of the student. Creating a new context	  *
 *for each new student or pushing new files to the context if the	  *
 *student already existed. To avoid ambiguity between similar name,	  *
 *the second group, which is "the number of the assignation" will	  *
 *be use to match with a context. Finally, file not ending with the	  *
 *extension .js are ignored. Although, this can be adjust with the	  *
 *value of CM_JS_ONLY.	               					  *
 **************************************************************************/

const CM_JS_ONLY = true;

CBCorrectorManager.prototype.importFiles = function(files) {

    var students = {};

    for (var i=0; i<files.length; ++i) {

	var file = files[i];

	let student_id = file.webkitRelativePath.split('/')[1];

	/* We skip none js files */
	if (CM_JS_ONLY && (file.name.slice(-3) !== ".js"))
	    continue;

	/* Student doesn't exist yet */
	if ((typeof students[student_id]) === "undefined")
	    students[student_id] = new Student(student_id, file);

	/* Else, we push the file to the list of files of the student */
	else
	    students[student_id].pushFile(file);
    }

    /* Now we have all are students, we can create context for them */
    for (var key in students) {
	this.addStudent(students[key]);
    }
};



function Student(id, file) {
    this.id = id;
    this.files = [];
    this.sem = 0;		/* Semaphore */

    if (file)
	this.pushFile(file);
}

Student.prototype.pushFile = function(file) {

    var reader = new FileReader();

    var _file = {
	meta: {
	    note: {type:"number", value:0},
	    sha1: {type:"string", value:"", readonly:true},
	}
    };

    var self = this;

    this.files.push(_file);

    $(reader).on("loadend", function (e) {
	_file.filename = file.name;
	_file.content  = reader.result;
	--self.sem;
    });

    ++this.sem;
    reader.readAsText(file);
};



CodeBoot.prototype.feedback = function(f) {

    cb.saved_feedback = f;
};


CodeBoot.prototype.handle_feedback = function () {

    var f = cb.saved_feedback;

    if (f === null)
	return;

    f = JSON.parse(f);

    var name = f.filename;

    cb.fs.newFile(name);

    var doc = cb.fs.getByName(name).editor.editor.doc;

    doc.setValue(f.content);

    var feedbacks = f.feedbacks;

    for (var i=0; i<feedbacks.length; ++i) {

	var tmp = feedbacks[i];

	cb.fm.createMark(tmp.title, {begin:tmp.from, end:tmp.to}, false);
    }
};


