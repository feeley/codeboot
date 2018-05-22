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
 * CBCorrectorManager Assignement Correction system
 *
 * Authors:
 * - Olivier Dion <olivier.dion@polymtl.ca>
 */


/*============================================================================+
 |                          CodeBoot Macros Manager                           |
 +============================================================================*/
const MACROS_FILE_DIALOG = "#file-dialog";


function CBMacrosManager() {

    // Keys binded to macro.
    this.macros = {"Ctrl-1":"Hello world!"};
}


CBMacrosManager.prototype.loadMacrosDialog = function() {
    $(MACROS_FILE_DIALOG).click();
};


CBMacrosManager.prototype.handleFiles = function(files) {

    if (!files.length)
        return;

    var json = files[0];

    if (json.type !== "application/json")
        return;

    var reader = new FileReader();

    var self = this;

    $(reader).on('loadend', function() {
        self.macros = JSON.parse(reader.result);
    });

    setTimeout(function() {reader.readAsText(json);}, 0);

};


CBMacrosManager.prototype.insertMacros = function(macro) {
    setTimeout($.proxy(cb.fm.createMark(macro), this), 0);
};




/*============================================================================+
 |                         CodeBoot Corrector Manager                         |
 +============================================================================*/
const CORRECTION_WIDTH = "250px";
const DEBUG =
      {
          students:
          [
              {
                  id:"Bar",
                  files:
                  [
                      {
                          filename:"BAR",
                          content:"BAR BAR BAR BAR",
                          meta:
                          [
                              ["Timestamp", "2018/01/02"],
                              ["Length", 15],
                              ["Corrected", false],
                              ["TODO", "Bar"]
                          ]
                      },

                      {
                          filename:"BAR2",
                          content:"BAR2 BAR2 BAR2 BAR2",
                          meta:
                          [
                              ["Timestamp", "2018/01/03"],
                              ["Length", 19],
                              ["Corrected", true],
                              ["TODO", "Bar2"]
                          ]
                      }

                  ]
              },

              {
                  id:"Foo",
                  files:
                  [
                      {
                          filename:"FOO",
                          content:"FOO FOO FOO FOO",
                          meta:
                          [
                              ["Timestamp", "2018/03/02"],
                              ["Length", 16],
                              ["Corrected", true],
                              ["TODO", "Very long long long long text"],
                              ["Others", "Foo foo foo"]
                          ]
                      }
                  ]
              }
          ]
};

function CBCorrectorManager() {

    this.contexts       = {"main":cb.fs};
    this.currentContext = "main";
    this.lastContext    = "main";
}


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


CBCorrectorManager.prototype.createContext = function(student) {

    var fs = new CBFileManager(false);

    this.contexts[student.id] = fs;

    student.files.forEach(function(f) {
        var file = new CBFile(fs, f.filename, f.content);
        fs.addFile(file);
    });
};


CBCorrectorManager.prototype.switchContext = function(id) {

    var fs = this.contexts[id];

    cb.fs.editorManager.removeAllEditors();

    cb.fs = fs;

    for (file in cb.fs.files) {
        cb.fs.files[file].editor.edit();
    }

    cb.fs.rebuildFileMenu();


    this.lastContext    = this.currentContext;
    this.currentContext = id;
};


CBCorrectorManager.prototype.addStudent = (function() {

    const card_template = '<div class="card"> <div class="card-header"> <h5 class="mb-0"> <button class="btn btn-link" data-toggle="collapse" aria-expanded="true"></button> </h5> </div> <div class="collapse" data-parent="#cb-accordion"> <div class="card-body"></div> </div></div>';

    var accordion = $("#cb-accordion");

    return function(student) {

        var card = $(card_template);
        var id  = "__" + student.id + "__";

        card.find(".card-header")
            .attr("id", "heading-" + id);

        card.find(".card-header >  h5 > button")
            .attr("data-target", "#" + id)
            .attr("aria-controls", id)
            .text(student.id)
            .click($.proxy(this.switchContext, this, student.id));

        student.files.forEach(function(file) {

            card.find(".card-body")
                .append('<h5 class="card-subtitle mb-2 text-muted">' + file.filename + '</h5>')
                .append('<p class="card-text">' + file.meta.map((m) => {return "<strong>" + m[0] + ":</strong> " + m[1];}).join("<br>") + '</p>')
                .append("<hr>");
        });

        card.children("div:nth-child(2)")
            .attr("id", id)
            .attr("aria-labelledby", "heading-" + id);

        accordion.append(card);
    };
}());


CBCorrectorManager.prototype.generateDEBUG = function() {

    for (var i = 0; i < DEBUG.students.length; i++) {
        this.addStudent(DEBUG.students[i]);
        this.createContext(DEBUG.students[i]);
    }
};
