function cb_tutorial() {
    if (cb.inTutorial) return;
    cb.inTutorial = true;
    cb_tutorial1();
}

function cb_tutorial_setREPLExpression() {
    cb.stop();
    cb.query('replay=1+2*3');
    cb.handle_query();
    cb.focusREPL();
}

function cb_tutorial1() {
    $('#cb-repl').popover({
	animation: true,
	placement: 'bottom',
	trigger: 'manual',
	title: 'Console',
	content:
            '<p>This is the Console.  After the prompt, enter the JavaScript code you wish to execute.</p> ' +
	    '<p><a class="btn btn-primary" onclick="cb_tutorial_setREPLExpression();">Show me</a> ' +
	    '<a class="btn btn-primary" onclick="cb_tutorial2();">Next</a></p>',
	html: true,
    });

    $('#cb-repl').popover('show');
    cb.focusREPL();
}

function cb_tutorial2() {
    $('#cb-repl').popover('destroy');
    $('#play-button').popover({
	animation: true,
	placement: 'bottom',
	trigger: 'manual',
	title: 'Play button',
	content:
            '<p>Use this button to evaluate the code entered at the Console, or simply press the Enter key.</p>' +
	    '<p><a class="btn btn-primary" onclick="cb_tutorial_setREPLExpression();' + "setTimeout(function () { $('#play-button').click(); }, 100);" + '">Show me</a> ' +
	    '<a class="btn btn-primary" onclick="cb_tutorial3();">Next</a></p>',
	html: true,
    });

    $('#play-button').popover('show');
    cb.focusREPL();
}

function cb_tutorial3() {
    $('#play-button').popover('destroy');
    $('#step-button').popover({
	animation: true,
	placement: 'bottom',
	trigger: 'manual',
	title: 'Step button',
	content:
            '<p>Use this button to execute one step of the code.</p>' +
	    '<p><a class="btn btn-primary" onclick="cb_tutorial_setREPLExpression();' + "setTimeout(function () { $('#step-button').click(); }, 100); cb_tutorial4();" + '">Show me</a>  ' +
	    '<a class="btn btn-primary" onclick="cb_tutorial_end();">Done</a></p>',
	html: true,
    });

    $('#step-button').popover('show');
    cb.focusREPL();
}

function cb_tutorial4() {
    $('#step-button').popover('destroy');
    $('#step-button').popover({
	animation: false,
	placement: 'bottom',
	trigger: 'manual',
	title: 'Step button',
	content:
            '<p>Press the button again to execute the next step. Repeat until the code is fully evaluated, or press the Play button.</p>' +
	    '<p><a class="btn btn-primary" onclick="cb_tutorial_end();">Done</a></p>',
	html: true,
    });

    $('#step-button').popover('show');
    cb.focusREPL();
}

function cb_tutorial_end() {
    $('#step-button').popover('destroy');
    cb.focusREPL();
    cb.inTutorial = false;
}
