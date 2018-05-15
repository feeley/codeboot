/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot File system --
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
 * CodeBoot Feedback system
 *
 * Authors:
 * - Olivier Dion <olivier.dion@polymtl.ca>
 *
 * The feedback system implement by CodeBoot allows the user to mark
 * her source code with colors, and create feedback/memo associate
 * with it.
 *
 * The goal is to provide tools that help the corrector, in order for
 * her to give feedback during school assignement. The student can
 * then click on highlighted portions of her code to read the
 * feedback.
 */

const CONTEXT_PADDING         = 5;
const FEEDBACK_CLASS          = "feedback";
const FOCUSED_FEEDBACK_CLASS  = "focused-feedback";
const FEEDBACK_MODAL          = "#cb-feedback-modal";
const FEEDBACK_FRAC           = "#cb-feedback-frac";
const FEEDBACK_TEXTAREA       = "#cb-feedback-textarea";
const FEEDBACK_NEXT           = "#cb-feedback-next";
const FEEDBACK_PREV           = "#cb-feedback-prev";
const MARK_ATOMIC             = false;
const MARK_DEFAULT_TEXT       = "";
const MARK_IN_HISTORY         = true;
const MARK_SHARED             = true;
const SHARED_HISTORY          = true;
const MARK_TEXTAREA           = "#cb-mark-textarea";

function CBFeedbackManager(fileManager) {

    if (typeof fileManager === "undefined") {
        console.error("CBFeedback' editors manager undefined");
        return;
    }

    fileManager.feedbackManager = this;

    this.feedbackTextArea  = $(FEEDBACK_TEXTAREA);
    this.frac              = $(FEEDBACK_FRAC);
    this.manager           = fileManager;
    this.mark              = null;
    this.doc               = null;
    this.index             = null;
    this.markTextArea      = CodeMirror.fromTextArea($(MARK_TEXTAREA)[0]);
    this.modal             = $(FEEDBACK_MODAL);

    $(document).on("click", "."+FEEDBACK_CLASS,
		           $.proxy(this.markClicked, this));
    $(this.modal).on("hide.bs.modal",
		             $.proxy(this.closeFeedback, this));
    $(this.modal).on("shown.bs.modal",
		             $.proxy(this.openFeedback, this));
    $(FEEDBACK_NEXT).click($.proxy(this.next, this));
    $(FEEDBACK_PREV).click($.proxy(this.prev, this));
}

CBFeedbackManager.prototype.openFeedback = function() {

    var range = this.mark.find();

    this.mark.className = FOCUSED_FEEDBACK_CLASS;

    this.feedbackTextArea.focus();

    this.feedbackTextArea[0].value = this.mark.title;

    this.markTextArea.swapDoc(this.mark.doc.linkedDoc({sharedHist: SHARED_HISTORY,
						                               from:       range.from.line - CONTEXT_PADDING,
						                               to:         range.to.line + CONTEXT_PADDING + 1}));
}

CBFeedbackManager.prototype.closeFeedback = function(event) {

    this.mark.className = FEEDBACK_CLASS;
    this.mark.doc.unlinkDoc(this.markTextArea.doc);

    this.mark.title                = this.feedbackTextArea[0].value;
    this.mark                      = null;
    this.feedbackTextArea[0].value = "";
    this.doc                       = null;
    this.index                     = null;
    this.frac.text("");

    this.getCurrentEditor().editor.getInputField().focus();
};

CBFeedbackManager.prototype.getCurrentEditor = function() {
    return this.manager.editorManager.editors[this.manager.editorManager.activated];
};

CBFeedbackManager.prototype.openMark = function() {

    this.doc  = this.getCurrentEditor().editor.doc;

    var range = getSelectionRange(this.doc);

    var marks = this.doc.findMarks(range.begin, range.end);

    this.mark = marks[0];

    if (MARK_SHARED)
        this.mark = this.mark.primary;

    this.index = this.findMarkIndex();
    this.frac.text("" + (this.index + 1) + "/" + this.doc.getAllMarks().length);

    this.modal.modal("show");
};

CBFeedbackManager.prototype.createMark = function(text) {

    if (typeof text === "undefined")
        text = "";

    this.doc   = this.getCurrentEditor().editor.doc;

    var range = getSelectionRange(this.doc);

    var marks = this.doc.findMarks(range.begin, range.end);

    marks.forEach(function (mark) {
        if (MARK_SHARED)
            mark = mark.primary;
        mark.clear();
    });

    this.mark = this.doc.markText(range.begin, range.end,
			                      {
			                     className:    FEEDBACK_CLASS,
			                     atomic:       MARK_ATOMIC,
			                     addToHistory: MARK_IN_HISTORY,
			                     title:        text,
			                     shared:       MARK_SHARED
			                      });

    if (MARK_SHARED)
        this.mark = this.mark.primary;

    this.index = this.findMarkIndex();
    this.frac.text("" + (this.index + 1) + "/" + this.doc.getAllMarks().length);

    this.modal.modal("show");
};

CBFeedbackManager.prototype.removeMarks = function() {

    var doc       = this.getCurrentEditor().editor.doc;

    var range = getSelectionRange(doc);

    var marks = doc.findMarks(range.begin, range.end);

    marks.forEach(function(mark) {
        if (MARK_SHARED)
            mark = mark.primary;
        mark.clear();
    });
};

CBFeedbackManager.prototype.mergeMarks = function() {

    this.doc  = this.getCurrentEditor().editor.doc;

    var range = getSelectionRange(this.doc);

    var marks     = this.doc.findMarks(range.begin, range.end);
    var feedbacks = [];

    if (marks.length === 0)
        return;

    marks.forEach(function (mark) {
        if (MARK_SHARED)
            mark = mark.primary;
        feedbacks.push(mark.title);
        mark.clear();
    });

    this.mark = this.doc.markText(range.begin, range.end,
			                 {
			                     className:    FEEDBACK_CLASS,
			                     atomic:       MARK_ATOMIC,
			                     addToHistory: MARK_IN_HISTORY,
			                     shared:       MARK_SHARED,
                                 title:        feedbacks.join(' ')
			                 });

    if (MARK_SHARED)
        this.mark = this.mark.primary;

    this.index = this.findMarkIndex();
    this.frac.text("" + (this.index + 1) + "/" + this.doc.getAllMarks().length);

    this.modal.modal("show");
};

CBFeedbackManager.prototype.markClicked = function(event) {

    if (this.mark !== null)
        return;

    this.doc   = this.getCurrentEditor().editor.doc;

    var pos    = this.doc.getCursor();
    var marks  = this.doc.findMarksAt(pos, pos);

    if (marks.length === 0)
        return;

    this.mark = marks[0];

    if (MARK_SHARED)
        this.mark = this.mark.primary;

    this.index = this.findMarkIndex();
    this.frac.text("" + (this.index + 1) + "/" + this.doc.getAllMarks().length);

    this.modal.modal("show");
};

CBFeedbackManager.prototype.next = function() {
    this.cycleMark(1);
};

CBFeedbackManager.prototype.prev = function() {
    this.cycleMark(-1);
};

CBFeedbackManager.prototype.cycleMark = function(i) {

    if (i !== 1 && i !== -1)
        return;

    this.mark.title = this.feedbackTextArea[0].value;
    this.mark.className = FEEDBACK_CLASS;

    var marks = this.doc.getAllMarks();

    this.index = (this.index + i + marks.length) % marks.length;
    this.frac.text("" + (this.index + 1) + "/" + marks.length);

    this.mark = marks[this.index];
    this.mark.className = FOCUSED_FEEDBACK_CLASS;

    var range = this.mark.find();

    this.feedbackTextArea[0].value = this.mark.title;

    this.mark.doc.unlinkDoc(this.markTextArea.doc);
    this.markTextArea.swapDoc(this.mark.doc.linkedDoc({sharedHist: SHARED_HISTORY,
						                               from:       range.from.line - CONTEXT_PADDING,
						                               to:         range.to.line + CONTEXT_PADDING + 1}));
};

CBFeedbackManager.prototype.findMarkIndex = function() {

    var marks = this.doc.getAllMarks();

    for (var i = 0; i < marks.length; i++) {
        if (this.mark == marks[i])
            return i;
    }

    return -1;
};

/**
 * Serialize a CodeMirror instance into an object.
 * The corresponding object as the following members:
 *
 * string text
 * Array {string title, int from, int to}
 */
CBFeedbackManager.prototype.serializeMarks = function(editor) {

    var marks = editor.editor.getAllMarks();

    var feedbackMarks = [];

    marks.forEach(function(mark) {

        if (mark.className === FEEDBACK_CLASS) {

            let range = mark.find();

            feedbackMarks.push({
                title: mark.title,
                from: range.from,
                to: range.to
            });
        }

    });

    return feedbackMarks;
}


/**
 * Deserialize an object into a new CodeMirror instance.
 * Return null on failure.
 */
CBFeedbackManager.prototype.deserializeMarks = function(cm, marks) {

    if (typeof marks === "undefined")
        return;

    for (var i = 0; i < marks.length; ++i) {
        var mark = marks[i];
        cm.doc.markText(mark.from, mark.to,
		             {
                         className:    FEEDBACK_CLASS,
			             atomic:       MARK_ATOMIC,
			             addToHistory: MARK_IN_HISTORY,
			             shared:       MARK_SHARED,
			             title:        mark.title
		             });
    }
}

/**
 * Function that return the current selection from a CodeMirror.Doc.
 * [in] doc The document to operate on.
 * Return a tuple, begin and end that have a 'line' and 'ch' members.
 */
function getSelectionRange(doc) {

    var selection = doc.sel.ranges[0];

    var range = {begin:null, end:null};

    var head   = selection.head;
    var anchor = selection.anchor;

    if (head.line < anchor.line || head.line === anchor.line && head.ch < anchor.ch)
    {
        range.begin = {line:head.line,   ch:head.ch};
        range.end   = {line:anchor.line, ch:anchor.ch};
    }
    else
    {
        range.begin = {line:anchor.line, ch:anchor.ch};
        range.end   = {line:head.line,   ch:head.ch};
    }

    // Begin and end at same position
    if (range.begin.line === range.end.line &&
        range.begin.ch === range.end.ch)
        ++range.end.ch;

    return range;
}
