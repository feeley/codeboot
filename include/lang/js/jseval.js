//=============================================================================

// File: "jseval.js"

// Copyright (c) 2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

function main() {

    var args = command_line();
    var i = 0;

    while (i < args.length) {

        var filename = args[i++];
        var str = read_file(filename);

        try {

            jev.eval(str,
                     {
                         container: new SourceContainer(str, filename, 1, 1),
                         level: "standard"
                     });

        } catch (e) {
            print(e);
        }
    }

    jsevalExit();
}

var jsevalExit = function () {
    // noop, but can be redefined
};

main();

//=============================================================================
