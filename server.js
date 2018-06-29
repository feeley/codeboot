
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
const __path    = require('path');
const __exec    = require('child_process').execFile;
const __body    = require('body-parser');

const EINTERNAL = 500;

const EXIT_SUCCESS = 0;
const EXIT_FAIL    = 1
const EXIT_SIGINT  = 2;
const EXIT_SIGUSR1 = 3;
const EXIT_SIGUSR2 = 4;
const EXIT_EXCEPT  = 5;

const EXIT_MESSAGE = [
    "EXIT_SUCCESS",
    "EXIT_FAIL",
    "EXIT_SIGINT",
    "EXIT_SIGUSR1",
    "EXIT_SIGUSR2",
    "EXIT_EXCEPT"
];




var cb_config = {

    port:8080,

    get:[{route:"/", handle:route_root},
	     {route:"/query.cgi", handle:route_query_cgi},
         {route:"/feedback.cgi", handle:route_feedback_cgi}],

    post:[{route:"/download", handle:route_download},
          {route:"/corrector.cgi", handle:route_corrector_cgi}],

    stack:[{route:"/include", handle:__express.static(absp("include"))},
           {route:"/feedbacks", handle:__express.static(absp("feedbacks"))},
           {route:"/scripts", handle:__express.static(absp("scripts"))},
	       {route:"", handle:__body.urlencoded({extended:false})}]
};


var cb_server = __express();


/*  ================================ Utils =================================  */

/**
 * Return the absolute path of a file.
 */
function absp(path) {

    return __path.join(__dirname + "/" + path);
}


function log(message) {

    var timestamp = new Date();

    console.log(message);

    __exec(absp("scripts/log.cgi"), [absp("log"), timestamp, message], function (error, stdout, stderr) {

        if (error !== null) {
            console.error(error);
        }
    });

    //__fs.appendFileSync(absp(CBLOG), (timestamp + '\n' +
      //                                message + '\n\n'));
}




/*  =============================== Routing ================================  */

function route_root(req, res) {

    res.sendFile(absp("index.html"));
}

function route_query_cgi(req, res) {

    var query_string = "REPLAY=" + req.query["REPLAY"];

    __exec(absp("scripts/query.cgi"), [query_string], (error, stdout, stderr) => {

        if (error !== null) {
            log(error);
            res.status(EINTERNAL).sendFile(absp("index.html"));
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

    var sha1_id = "feedbacks/" + req.query["id"] + ".html";

    __exec(absp("scripts/feedback.cgi"), [sha1_id], function (error, stdout, stderr) {

        if (error !== null) {
            log(error);
            res.status(EINTERNAL).sendFile(absp("index.html"));
        }
        else {
            res.send(stdout);
        }
    });
}

function route_corrector_cgi(req, res) {

}




/*  ================================ Server ================================  */

function init_server() {

    cb_config.stack.forEach((m) => cb_server.use(m.route, m.handle));
    cb_config.get.forEach((g) => cb_server.get(g.route, g.handle));
    cb_config.post.forEach((p) => cb_server.post(p.route, p.handle));
}


function run_server() {

    var port = cb_config.port;

    log("Starting server...");

    cb_server.listen(port,
		             () => {log("CodeBoot is listening on port " + port);});
}


function main() {

    init_server();
    run_server();
}


function at_exit(exit_code) {

    if (exit_code === undefined)
        process.exit(EXIT_FAIL);

    var message = "Shutting down server... ";

    log(message + EXIT_MESSAGE[exit_code]);

    process.exit(exit_code);
}

function config_process() {
    process.stdin.resume();
    process.on("SIGINT", () => {at_exit(EXIT_SIGINT);});
    process.on("SIGUSR1", at_exit.bind(null, EXIT_SIGUSR1));
    process.on("SIGUSR2", at_exit.bind(null, EXIT_SIGUSR2));
    process.on("uncaughException", at_exit.bind(null, EXIT_EXCEPT));
}


config_process();

main();
