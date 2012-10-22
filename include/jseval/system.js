//=============================================================================

// File: "system.js"

// Copyright (c) 2010-2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

var command_line_arguments = [];

if ("arguments" in this) /* make it work in the browser */
    command_line_arguments = this.arguments;
else if ("process" in this) /* support node.js as an alternative */
    command_line_arguments = this.process.argv.slice(2);

function command_line()
{
    return command_line_arguments;
}

//-----------------------------------------------------------------------------

// I/O.

// Support node.js and V8.

var global_obj = this;

var read_file;
var write_file;

if ("exports" in global_obj) {

    var fs = this.require("fs");

    read_file = function (filename)
    {
        return fs.readFileSync(filename, 'utf-8');
    };

    write_file = function (filename, str)
    {
        var stream = fs.createWriteStream(filename, {flags : 'w'});

        stream.write(str, 'utf-8');

        stream.end();
        stream.destroySoon();
    };
} else {

    read_file = function (filename)
    {
        return global_obj.readFile(filename);
    };

    write_file = function (filename, str)
    {
        global_obj.writeFile(filename, str);

    };
}

var EOF = -1;

function File_input_port(filename)
{
    return new String_input_port(read_file(filename), filename);
}

function File_output_port(filename, init)
{
    var port = new String_output_port(init, filename);

    port.filename = filename;

    port.flush = function ()
    {
        write_file(this.filename, this.get_output_string());
    };

    port.close = function ()
    {
        // TODO: support real closing
        this.flush();
    };

    return port;
}

function String_input_port(content, container)
{
    if (container === void 0)
        container = '<string>';

    this.container = container;
    this.content = content;
    this.pos = 0;

    this.read_char = function ()
    {
        var content = this.content;
        if (this.pos < content.length)
            return content.charCodeAt(this.pos++);
        else
            return EOF;
    };
}

function String_output_port(init)
{
    this.char_buffer = [];
    this.string_buffer = [];

    // method write_char(c)

    this.empty_char_buffer = function ()
    {
        if (this.char_buffer.length > 0)
        {
            this.string_buffer.push(String.fromCharCode.apply(null, this.char_buffer));
            this.char_buffer = [];
        }
    };

    // method write_char(c)

    this.write_char = function (c)
    {
        this.char_buffer.push(c);
        if (this.char_buffer.length > 500)
            this.empty_char_buffer();
    };

    // method write_string(str)

    this.write_string = function (str)
    {
        for (var i=0; i<str.length; i++)
            this.write_char(str.charCodeAt(i));
    };

    // method get_output_string()

    this.get_output_string = function ()
    {
        this.empty_char_buffer();
        return String.prototype.concat.apply("", this.string_buffer);
    };

    if (init !== void 0)
        this.write_string(init);
}

//=============================================================================
