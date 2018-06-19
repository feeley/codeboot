
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




/*  ================================ Utils =================================  */

/**
 * Return the absolute path of a file.
 */
function absp(path) {

    return __path.join(__dirname + "/" + path);
}




/*  =============================== Routing ================================  */

function route_root(req, res) {

    res.sendFile(absp("index.html"));
}

function route_query_cgi(req, res) {

    var query_string = "REPLAY=" + req.query["REPLAY"];

    __exec(absp("query.cgi"), [query_string], (error, stdout, stderr) => {
	res.send(stdout);
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




/*  ================================ Server ================================  */

function initServer(server, config) {

    config.stack.forEach((m) => server.use(m.route, m.handle));
    config.get.forEach((g) => server.get(g.route, g.handle));
    config.post.forEach((p) => server.post(p.route, p.handle));
}


function runServer(server, port) {

    server.listen(port,
		  () => {
		      console.log("CodeBoot is listening on port " + port);
		  });
}


function main(server, config) {

    initServer(server, config);
    runServer(server, config.port);
}


var cb_config = {

    port:8080,

    get:[{route:"/", handle:route_root},
	 {route:"/query.cgi", handle:route_query_cgi}],

    post:[{route:"/download", handle:route_download}],

    stack:[{route:"/include", handle:__express.static(absp("include"))},
	   {route:"", handle:__body.urlencoded({extended:false})}]
};


var cb_server = __express();


main(cb_server,
     cb_config);
