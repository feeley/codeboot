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

        try
        {
            var code = js_compile(str,
                                  {
                                      container: new SourceContainer(str, filename, 1, 1)
                                  });

            js_run(code);
        }
        catch (e)
        {
            print(e);
        }
    }
}

main();

//=============================================================================
