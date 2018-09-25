/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot Macros system --
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
 * macros.js
 *
 * Authors:
 * - Olivier Dion <olivier.dion@polymtl.ca>
 */


/*============================================================================+
 |                          CodeBoot Macros Manager                           |
 +============================================================================*/
const MACROS_FILE_DIALOG = "#cb-macro-file-dialog";


function CBMacrosManager() {

    // Keys binded to macro.
    this.macros = [{kbd:"Ctrl-1", action:"cb.fm.createMark",
		    param:"Mauvaise Indentation"}];
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
