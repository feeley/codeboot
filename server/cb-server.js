
/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot Server --
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
 * CodeBoot Server
 *
 * Authors:
 * - Olivier Dion <olivier.dion@polymtl.ca>
 */


/*  =============================== Modules ================================  */

const __express = require('express');
const __exec    = require('child_process').execFile;
const __body    = require('body-parser');


/*  ============================== Constants ===============================  */

/*  -------------------------- HTTP Status Codes ---------------------------  */
const OK        = 200;
const EREQUEST  = 400;
const EFOUND    = 404;
const EINTERNAL = 500;

/*  -------------------------- Exit Status Codes ---------------------------  */
const EXIT_SUCCESS = 0;
const EXIT_FAIL    = 1
const EXIT_SIGINT  = 2;
const EXIT_SIGUSR1 = 3;
const EXIT_SIGUSR2 = 4;
const EXIT_EXCEPT  = 5;

/*  ---------------------------- Exit Messages -----------------------------  */
const EXIT_MESSAGE = [
    "EXIT_SUCCESS",
    "EXIT_FAIL",
    "EXIT_SIGINT",
    "EXIT_SIGUSR1",
    "EXIT_SIGUSR2",
    "EXIT_EXCEPT"
];

/*  -------------------------------- Others --------------------------------  */
const PORT = process.env.CB_PORT;


/*  =========================== Global Variables ===========================  */

var cb_config = {

    get:[{route:"/", handle:route_root},
	 {route:"/query.cgi", handle:route_query_cgi},
         {route:"/feedbacks", handle:route_feedback_cgi}],

    post:[{route:"/download", handle:route_download},
          {route:"/corrector", handle:route_corrector_cgi},
	  {route:"/export_file", handle:route_export_file}],

    stack:[{route:"/include", handle:__express.static(root("include"))},
	   {route:"", handle:__body.urlencoded({extended:false})}]
};


var cb_app = __express();

var cb_server = null;


/*  ================================ Utils =================================  */

function exec_script(name, args, callback) {
    __exec(process.env.CB_SCRIPTS + '/' + name, args, callback);
}

function include(name) {
    return process.env.CB_INCLUDE + '/' + name;
}

function root(name) {
    return process.env.CB_TOP_DIR + '/' + name;
}

function log(message) {

    console.log(message);

    exec_script("log.cgi", [message], function (error, stdout, stderr) {

	if (error !== null)
	    console.error(error);
    });
}




/*  =============================== Routing ================================  */

function route_root(req, res) {

    res.sendFile(root("index.html"));
}

function route_query_cgi(req, res) {

    var query_string = "REPLAY=" + req.query["REPLAY"];

    exec_script("query.cgi", [query_string], function(error, stdout, stderr) {

	if (error !== null) {
            log(error);
            res.status(EINTERNAL).sendFile(root("index.html"));
        }
        else {
            res.send(stdout);
        }
    });
}

function route_download(req, res) {

    var content  = req.body.content;
    var filename = req.body.filename;

    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader("Content-Length", content.length);
    res.send(content);
}

function route_feedback_cgi(req, res) {

    var sha1_id = "feedbacks/" + req.query["ID"] + ".html";

    exec_script("feedback.cgi", [sha1_id], function (error, stdout, stderr) {

        if (error !== null) {
            log(error);
            res.status(EINTERNAL).sendFile(root("index.html"));
        }
        else {
            res.send(stdout);
        }
    });
}

function route_export_file(req, res) {

    exec_script("import_file.cgi", [req.body.metadata, req.body.html], function (error, stdout, stderr) {

	if (error !== null) {
	    log(error);
	    res.status(EINTERNAL).send("EINTERNAL");
	}
	else {
	    var link = "localhost:8080/feedbacks?ID=" + stdout;

	    res.status(OK).send(link);
	}
    });


}

function route_corrector_cgi(req, res) {

}




/*  ================================ Server ================================  */

function init_server() {

    cb_config.stack.forEach((m) => cb_app.use(m.route, m.handle));
    cb_config.get.forEach((g) => cb_app.get(g.route, g.handle));
    cb_config.post.forEach((p) => cb_app.post(p.route, p.handle));
}


function start_server() {

    log("Starting server ...");

    cb_server =  cb_app.listen(PORT,
			       function () {log("CodeBoot is listening on port " + PORT);});
}


function main() {

    config_process();
    init_server();
    start_server();
}


function at_exit(exit_code) {

    if (exit_code === undefined)
        process.exit(EXIT_FAIL);

    var message = "Shutting down server... ";

    log(message + EXIT_MESSAGE[exit_code]);

    process.exit(exit_code);
}

function restart_server() {
    log("Restarting Server ...")
    cb_server.close();
    cb_server = cb_app.listen(PORT,
			      function () {log("CodeBoot is listening on port " + PORT);});
}

function config_process() {

    process.stdin.resume();
    process.on("SIGINT", () => {at_exit(EXIT_SIGINT);});
    process.on("SIGUSR1", restart_server.bind(null));
    process.on("SIGUSR2", at_exit.bind(null, EXIT_SIGUSR2));
    process.on("uncaughException", at_exit.bind(null, EXIT_EXCEPT));
}

main();


