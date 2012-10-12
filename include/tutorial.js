function cp_tutorial() {
    if (cp.inTutorial) return;
    cp.inTutorial = true;
    cp_tutorial1();
}

function cp_tutorial_setREPLExpression() {
    cp.cancel();
    cp.query("replay=1+2*3");
    cp.handle_query();
    focusREPL();
}

function cp_tutorial1() {
	$("#repl").popover({
		animation: true,
		placement: "bottom",
		trigger: "manual",
		title: "REPL",
		content: '<p>This is the Read-Eval-Print Loop (REPL).  After the prompt, enter the JavaScript code you wish to execute.</p> ' + 
		         '<p><a class="btn btn-primary" onclick="cp_tutorial_setREPLExpression();">Show me</a> ' +
		         '<a class="btn btn-primary" onclick="cp_tutorial2();">Next</a></p>',
		html: true,
	});
	
	$("#repl").popover('show');
    focusREPL();
}

function cp_tutorial2() {
    $("#repl").popover('destroy');
	$("#play-button").popover({
		animation: true,
		placement: "bottom",
		trigger: "manual",
		title: "Play button",
		content: '<p>Use this button to evaluate the code entered at the REPL, or simply press the Enter key.</p>' +
		    '<p><a class="btn btn-primary" onclick="cp_tutorial_setREPLExpression();' + "$('#play-button').click();" + '">Show me</a> ' +
			'<a class="btn btn-primary" onclick="cp_tutorial3();">Next</a></p>',
		html: true,
	});
	
	$("#play-button").popover('show');
    focusREPL();
}

function cp_tutorial3() {
    $("#play-button").popover('destroy');
	$("#step-button").popover({
		animation: true,
		placement: "bottom",
		trigger: "manual",
		title: "Step button",
		content: '<p>Use this button to execute one step of the code.</p>' +
		         '<p><a class="btn btn-primary" onclick="cp_tutorial_setREPLExpression();' + "$('#step-button').click(); cp_tutorial4();" + '">Show me</a>  ' +
		         '<a class="btn btn-primary" onclick="cp_tutorial_end();">Done</a></p>',
		html: true,
	});
	
	$("#step-button").popover('show');
    focusREPL();
}

function cp_tutorial4() {
    $("#step-button").popover('destroy');
	$("#step-button").popover({
		animation: false,
		placement: "bottom",
		trigger: "manual",
		title: "Step button",
		content: '<p>Press the button again to execute the next step. Repeat until the code is fully evaluated, or press the Play button.</p>' +
		         '<p><a class="btn btn-primary" onclick="cp_tutorial_end();">Done</a></p>',
		html: true,
	});
	
	$("#step-button").popover('show');
    focusREPL();
}

function cp_tutorial_end() {
	$("#step-button").popover('destroy');
    focusREPL();
    cp.inTutorial = false;
}
