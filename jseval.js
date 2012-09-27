//=============================================================================

// File: "jseval.js"

// Copyright (c) 2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

function main()
{
    var args = command_line();
    var i = 0;

    while (i < args.length)
    {
        var filename = args[i++];
        var str = read_file(filename);

        js_eval(str, { filename: filename });
    }
}

main();

//=============================================================================
