//=============================================================================

// File: "js2js.js"

// Copyright (c) 2010-2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

function report_id(id)
{
    var tok = id;
    if (!(id instanceof Token))
        tok = id.tok;

    print("  " + tok.toString() + " (" + tok.loc.toString() + ":)");
}

function report_globals(ast)
{
    var declared = [];
    var undeclared = [];
    var ignore = { "arguments": true,
                   "Array": true,
                   "String": true,
                   "Math": true,
                   "JSON": true,
                   "print": true,
                 };

    for (var id_str in ast.vars)
    {
        if (ignore[id_str] !== true)
        {
            var v = ast.vars[id_str];
            if (v.is_declared)
                declared.push(v);
            if (!v.is_declared)
                undeclared.push(v);
        }
    }

    declared.sort(function (x,y) { return (x.toString() > y.toString()) ? 1 : -1; });
    undeclared.sort(function (x,y) { return (x.toString() > y.toString()) ? 1 : -1; });

    print("Declared globals:");
    declared.forEach(report_id);

    print();

    print("Undeclared globals:");
    undeclared.forEach(report_id);
}

function main()
{
    var args = command_line();
    var statements = [];
    var prog = null;
    var options = { profile: false,
                    namespace: false,
                    exports: {},
                    report: false,
                    debug: false,
                    warn: false,
                    ast: false,
                    nojs: false,
                    simplify: true
                  };
    var i = 0;

    while (i < args.length)
    {
        if (args[i] === "-profile")
            options.profile = true;
        else if (args[i] === "-namespace")
            options.namespace = args[++i];
        else if (args[i] === "-export")
            options.exports[args[++i]] = true;
        else if (args[i] === "-report")
            options.report = true;
        else if (args[i] === "-debug")
            options.debug = true;
        else if (args[i] === "-warn")
            options.warn = true;
        else if (args[i] === "-ast")
            options.ast = true;
        else if (args[i] === "-nojs")
            options.nojs = true;
        else if (args[i] === "-raw")
            options.simplify = false;
        else
            break;
        i++;
    }

    function error(loc, kind, msg)
    {
        print(loc.toString() + ": " + kind + " -- " + msg);
    }

    while (i < args.length)
    {
        var filename = args[i];
        var port = new File_input_port(filename);
        var s = new Scanner(port, error);
        var p = new Parser(s, options.warn ? { autosemicolon: true, non_integer: true, division: true, equality: true } : {});
        prog = p.parse();
        statements.push(prog.block.statements);
        i++;
    }

    if (prog !== null)
    {
        prog = new Program(prog.loc,
                           new BlockStatement(prog.loc,
                                              Array.prototype.concat.apply([], statements)));

        var normalized_prog = options.simplify ? ast_normalize(prog, options) : prog;

        if (options.ast)
            pp(normalized_prog);

        if (!options.nojs)
            js_pp(normalized_prog);

        if (options.report)
            report_globals(normalized_prog);
    }
}

main();

//=============================================================================
