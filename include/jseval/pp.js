//=============================================================================

// File: "pp.js"

// Copyright (c) 2010-2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

// AST pretty printer.

function pp(ast)
{
    pp_indent(ast, 0);
}

function pp_indent(ast, indent)
{
    if (ast === null)
        print(pp_prefix(indent) + "null");
    else if (ast instanceof Program)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "Program");

        if (ast.vars !== null)
        {
            for (var v in ast.vars)
                pp_id(ast.vars[v], indent, "var");
        }

/*
        if (ast.funcs !== null)
        {
            for (var i in ast.funcs)
            {
                if (ast.funcs[i].id !== null)
                    pp_id(ast.funcs[i].id, indent, "func");
                else
                    print(pp_prefix(indent) + "|-func anonymous");
            }
        }
*/

        pp_asts(indent, "block", [ast.block]);
    }
    else if (ast instanceof BlockStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "BlockStatement");
        pp_asts(indent, "statements", ast.statements);
    }
    else if (ast instanceof VariableStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "VariableStatement");
        pp_asts(indent, "decls", ast.decls);
    }
    else if (ast instanceof Decl)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "Decl");
        pp_id(ast.id, indent, "id");
        pp_asts(indent, "initializer", [ast.initializer]);
    }
    else if (ast instanceof ConstStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ConstStatement");
        pp_asts(indent, "decls", ast.decls);
    }
    else if (ast instanceof FunctionDeclaration)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "FunctionDeclaration");
        if (ast.id !== null)
            pp_id(ast.id, indent, "id");
        pp_asts(indent, "funct", [ast.funct]);
    }
    else if (ast instanceof ExprStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ExprStatement");
        pp_asts(indent, "expr", [ast.expr]);
    }
    else if (ast instanceof IfStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "IfStatement");
        pp_asts(indent, "expr", [ast.expr]);
        pp_asts(indent, "statements", ast.statements);
    }
    else if (ast instanceof DoWhileStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "DoWhileStatement");
        pp_asts(indent, "statement", [ast.statement]);
        pp_asts(indent, "expr", [ast.expr]);
    }
    else if (ast instanceof WhileStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "WhileStatement");
        pp_asts(indent, "expr", [ast.expr]);
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof ForStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ForStatement");
        pp_asts(indent, "expr1", [ast.expr1]);
        pp_asts(indent, "expr2", [ast.expr2]);
        pp_asts(indent, "expr3", [ast.expr3]);
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof ForVarStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ForVarStatement");
        pp_asts(indent, "decls", ast.decls);
        pp_asts(indent, "expr2", [ast.expr2]);
        pp_asts(indent, "expr3", [ast.expr3]);
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof ForInStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ForInStatement");
        pp_asts(indent, "lhs_expr", [ast.lhs_expr]);
        pp_asts(indent, "set_expr", [ast.set_expr]);
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof ForVarInStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ForVarInStatement");
        pp_id(ast.id, indent, "id");
        pp_asts(indent, "initializer", [ast.initializer]);
        pp_asts(indent, "set_expr", [ast.set_expr]);
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof ContinueStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ContinueStatement");
        if (ast.label !== null)
            print(pp_prefix(indent) + "|-label= " + ast.label.toString());
    }
    else if (ast instanceof BreakStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "BreakStatement");
        if (ast.label !== null)
            print(pp_prefix(indent) + "|-label= " + ast.label.toString());
    }
    else if (ast instanceof ReturnStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ReturnStatement");
        pp_asts(indent, "expr", [ast.expr]);
    }
    else if (ast instanceof WithStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "WithStatement");
        pp_asts(indent, "expr", [ast.expr]);
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof SwitchStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "SwitchStatement");
        pp_asts(indent, "expr", [ast.expr]);
        pp_asts(indent, "clauses", ast.clauses);
    }
    else if (ast instanceof CaseClause)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "CaseClause");
        pp_asts(indent, "expr", [ast.expr]);
        pp_asts(indent, "statements", ast.statements);
    }
    else if (ast instanceof LabelledStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "LabelledStatement");
        print(pp_prefix(indent) + "|-label= " + ast.label.toString());
        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof ThrowStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ThrowStatement");
        pp_asts(indent, "expr", [ast.expr]);
    }
    else if (ast instanceof TryStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "TryStatement");
        pp_asts(indent, "statement", [ast.statement]);
        pp_asts(indent, "catch_part", [ast.catch_part]);
        pp_asts(indent, "finally_part", [ast.finally_part]);
    }
    else if (ast instanceof CatchPart)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "CatchPart");
        pp_id(ast.id, indent, "id");

        if (ast.free_vars !== void 0)
        {
            for (var id_str in ast.free_vars)
                pp_id(ast.free_vars[id_str], indent, "free_var");
        }

        pp_asts(indent, "statement", [ast.statement]);
    }
    else if (ast instanceof DebuggerStatement)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "DebuggerStatement");
    }
    else if (ast instanceof OpExpr)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "OpExpr");
        print(pp_prefix(indent) + "|-op= \"" + ast.op + "\"");
        pp_asts(indent, "exprs", ast.exprs);
    }
    else if (ast instanceof NewExpr)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "NewExpr");
        pp_asts(indent, "expr", [ast.expr]);
        pp_asts(indent, "args", ast.args);
    }
    else if (ast instanceof CallExpr)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "CallExpr");
        pp_asts(indent, "fn", [ast.fn]);
        pp_asts(indent, "args", ast.args);
    }
    else if (ast instanceof FunctionExpr)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "FunctionExpr");

        if (ast.id !== null)
            pp_id(ast.id, indent, "id");

        for (var p in ast.params)
            pp_id(ast.params[p], indent, "param");

        for (var a in ast.annotations)
            pp_loc(ast.annotations[a].loc, pp_prefix(indent) + "|-annotation= \"" + ast.annotations[a].value + "\"");

        if (ast.vars !== null)
        {
            for (var v in ast.vars)
                pp_id(ast.vars[v], indent, "var");
        }

        if (ast.free_vars !== void 0)
        {
            for (var id_str in ast.free_vars)
                pp_id(ast.free_vars[id_str], indent, "free_var");
        }

/*
        if (ast.funcs !== null)
        {
            for (var i in ast.funcs)
            {
                if (ast.funcs[i].id !== null)
                    pp_id(ast.funcs[i].id, indent, "func");
                else
                    print(pp_prefix(indent) + "|-func anonymous");
            }
        }
*/

        pp_asts(indent, "body", ast.body);
    }
    else if (ast instanceof Literal)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "Literal");
        print(pp_prefix(indent) + "|-value= " + ast.value);
    }
    else if (ast instanceof ArrayLiteral)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ArrayLiteral");
        pp_asts(indent, "exprs", ast.exprs);
    }
    else if (ast instanceof ObjectLiteral)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "ObjectLiteral");
        pp_asts(indent, "properties", ast.properties);
    }
    else if (ast instanceof Property)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "Property");
        pp_asts(indent, "name", [ast.name]);
        pp_asts(indent, "value", [ast.value]);
    }
    else if (ast instanceof Ref)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "Ref");
        pp_id(ast.id, indent, "id");
    }
    else if (ast instanceof This)
    {
        pp_loc(ast.loc, pp_prefix(indent) + "This");
    }
    else
        print(pp_prefix(indent) + "UNKNOWN AST");
}

function pp_id(id, indent, label)
{
    if (id instanceof Token)
    {
        pp_loc(id.loc, pp_prefix(indent) + "|-" + label + "= " + id.toString());
    }
    else
    {
        var kind = "unknown";

        if (id.scope instanceof Program)
            kind = "global";
        else if (id.scope instanceof FunctionExpr)
            kind = "local";
        else if (id.scope instanceof CatchPart)
            kind = "catch";

        if (id.occurs_free !== void 0)
        {
            if (id.occurs_free)
                kind += ",occurs_free";
        }

        pp_loc(id.scope.loc, pp_prefix(indent) + "|-" + label + "= " + id.toString() + " [" + kind + "]");
    }
}

function pp_loc(loc, line)
{
    print(line + pp_spaces(48-line.length) + "  (" + loc.toString() + ":)");
}

function pp_asts(indent, label, asts)
{
    if (asts !== null)
    {
        print(pp_prefix(indent) + "|-" + label + "=");
        for (var i=0; i<asts.length; i++)
            pp_indent(asts[i], indent+1);
    }
}

function pp_prefix(indent)
{
    if (indent > 0)
        return "|   " + pp_prefix(indent-1);
    else
        return "";
}

function pp_spaces(n)
{
    if (n > 0)
        return " " + pp_spaces(n-1);
    else
        return "";
}

//-----------------------------------------------------------------------------

// JavaScript pretty-printing.

function js_pp(ast)
{
    print(js_to_string(ast));
}

function js_to_string(ast)
{
    var ctx = new js_pp_ctx(new String_output_port(""), 0);
    ast_to_js(ast, ctx);
    return ctx.port.get_output_string();
}

function js_pp_ctx(port, indent)
{
    this.port = port;
    this.indent = indent;
}

function js_unparse_string(str)
{
    var port = new String_output_port("");

    port.write_string("\"");

    for (var i=0; i<str.length; i++)
    {
        var c = str.charAt(i);
        switch (c)
        {
            case "\\": c = "\\\\"; break;
            case "\"": c = "\\\""; break;
            case "\0": c = "\\0"; break;
            case "\b": c = "\\b"; break;
            case "\t": c = "\\t"; break;
            case "\n": c = "\\n"; break;
            case "\v": c = "\\v"; break;
            case "\f": c = "\\f"; break;
            case "\r": c = "\\r"; break;
        }
        port.write_string(c);
    }

    port.write_string("\"");

    return port.get_output_string();
}

function ast_to_js(ast, ctx)
{
    if (ast === null)
        error("null ast");
    else if (ast instanceof Program)
    {
        for (var id_str in ast.vars)
        {
            var v = ast.vars[id_str];
            if (v.is_declared)
                js_var(js_id_to_js(v.toString()), ctx);
        }
        ast_to_js(ast.block, ctx);
    }
    else if (ast instanceof BlockStatement)
    {
        for (var i=0; i<ast.statements.length; i++)
            ast_to_js(ast.statements[i], ctx);
    }
    // else if (ast instanceof VariableStatement)
    // { impossible due to pass1 transformations }
    else if (ast instanceof ConstStatement)
    {
        // TODO
        pp(ast);
        error("ConstStatement not implemented");
    }
    else if (ast instanceof FunctionDeclaration)
    {
        function_to_js(ast.funct, ast.id, ctx);
        js_out("\n", ctx);
    }
    else if (ast instanceof ExprStatement)
    {
        js_indent(ctx);
        ast_to_js(ast.expr, ctx);
        js_out(";\n", ctx);
    }
    else if (ast instanceof IfStatement)
    {
        js_indent(ctx);
        js_out("if (", ctx);
        ast_to_js(ast.expr, ctx);
        js_out(")\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statements[0], ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("}\n", ctx);

        if (ast.statements.length === 2)
        {
            js_indent(ctx);
            js_out("else\n", ctx);

            js_indent(ctx);
            js_out("{\n", ctx);
            js_indent_begin(ctx);

            ast_to_js(ast.statements[1], ctx);

            js_indent_end(ctx);
            js_indent(ctx);
            js_out("}\n", ctx);
        }
    }
    else if (ast instanceof DoWhileStatement)
    {
        js_indent(ctx);
        js_out("do\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statement, ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("} while (", ctx);
        ast_to_js(ast.expr, ctx);
        js_out(");\n", ctx);
    }
    else if (ast instanceof WhileStatement)
    {
        js_indent(ctx);
        js_out("while (", ctx);
        ast_to_js(ast.expr, ctx);
        js_out(")\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statement, ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("}\n", ctx);
    }
    else if (ast instanceof ForStatement)
    {
        js_indent(ctx);
        js_out("for (", ctx);
        if (ast.expr1 !== null)
            ast_to_js(ast.expr1, ctx);
        js_out("; ", ctx);
        if (ast.expr2 !== null)
            ast_to_js(ast.expr2, ctx);
        js_out("; ", ctx);
        if (ast.expr3 !== null)
            ast_to_js(ast.expr3, ctx);
        js_out(")\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statement, ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("}\n", ctx);
    }
    // else if (ast instanceof ForVarStatement)
    // { impossible due to pass1 transformations }
    else if (ast instanceof ForInStatement)
    {
        js_indent(ctx);
        js_out("for (", ctx);
        ast_to_js(ast.lhs_expr, ctx);
        js_out(" in ", ctx);
        ast_to_js(ast.set_expr, ctx);
        js_out(")\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statement, ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("}\n", ctx);
    }
    // else if (ast instanceof ForVarInStatement)
    // { impossible due to pass1 transformations }
    else if (ast instanceof ContinueStatement)
    {
        js_indent(ctx);
        js_out("continue", ctx);
        if (ast.label !== null)
            js_out(" " + ast.label.toString(), ctx);
        js_out(";\n", ctx);
    }
    else if (ast instanceof BreakStatement)
    {
        js_indent(ctx);
        js_out("break", ctx);
        if (ast.label !== null)
            js_out(" " + ast.label.toString(), ctx);
        js_out(";\n", ctx);
    }
    else if (ast instanceof ReturnStatement)
    {
        js_indent(ctx);
        js_out("return", ctx);
        if (ast.expr !== null)
        {
            js_out(" ", ctx);
            ast_to_js(ast.expr, ctx);
        }
        js_out(";\n", ctx);
    }
    else if (ast instanceof WithStatement)
    {
        js_indent(ctx);
        js_out("with (", ctx);
        ast_to_js(ast.expr, ctx);
        js_out(") {\n", ctx);

        js_indent_begin(ctx);
        if (ast.statement !== null) {
            ast_to_js(ast.statement, ctx);
        }
        js_indent_end(ctx);

        js_indent(ctx);
        js_out("}\n", ctx);
    }
    else if (ast instanceof SwitchStatement)
    {
        js_indent(ctx);
        js_out("switch (", ctx);
        ast_to_js(ast.expr, ctx);
        js_out(")\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        for (var i=0; i<ast.clauses.length; i++)
        {
            var clause_i = ast.clauses[i];
            js_indent(ctx);
            if (clause_i.expr === null)
                js_out("default:\n", ctx);
            else
            {
                js_out("case ", ctx);
                ast_to_js(clause_i.expr, ctx);
                js_out(":\n", ctx);
            }
            js_indent(ctx);
            js_out("{\n", ctx);
            js_indent_begin(ctx);

            for (var j=0; j<clause_i.statements.length; j++)
                ast_to_js(clause_i.statements[j], ctx);

            js_indent_end(ctx);
            js_indent(ctx);
            js_out("}\n", ctx);
        }

        js_indent_end(ctx);

        js_indent(ctx);
        js_out("}\n", ctx);
    }
    // else if (ast instanceof CaseClause)
    // { impossible due to handling of SwitchStatement }
    else if (ast instanceof LabelledStatement)
    {
        js_indent(ctx);
        js_out(ast.label.toString() + ":\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statement, ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("}\n", ctx);
    }
    else if (ast instanceof ThrowStatement)
    {
        js_indent(ctx);
        js_out("throw ", ctx);
        ast_to_js(ast.expr, ctx);
        js_out(";\n", ctx);
    }
    else if (ast instanceof TryStatement)
    {
        js_indent(ctx);
        js_out("try\n", ctx);

        js_indent(ctx);
        js_out("{\n", ctx);
        js_indent_begin(ctx);

        ast_to_js(ast.statement, ctx);

        js_indent_end(ctx);
        js_indent(ctx);
        js_out("}\n", ctx);

        if (ast.catch_part !== null)
        {
            js_indent(ctx);
            js_out("catch (", ctx);
            js_out(js_id_to_js(ast.catch_part.id.toString()), ctx);
            js_out(")\n", ctx);

            js_indent(ctx);
            js_out("{\n", ctx);
            js_indent_begin(ctx);

            ast_to_js(ast.catch_part.statement, ctx);

            js_indent_end(ctx);
            js_indent(ctx);
            js_out("}\n", ctx);
        }

        if (ast.finally_part !== null)
        {
            js_indent(ctx);
            js_out("finally\n", ctx);

            js_indent(ctx);
            js_out("{\n", ctx);
            js_indent_begin(ctx);

            ast_to_js(ast.finally_part, ctx);

            js_indent_end(ctx);
            js_indent(ctx);
            js_out("}\n", ctx);
        }
    }
    // else if (ast instanceof CatchPart)
    // { impossible due to handling of TryStatement }
    else if (ast instanceof DebuggerStatement)
    {
        js_indent(ctx);
        js_out("debugger\n", ctx);
    }
    else if (ast instanceof OpExpr)
    {
        js_out("(", ctx);
        if (ast.op === "x ? y : z")
        {
            ast_to_js(ast.exprs[0], ctx);
            js_out("?", ctx);
            ast_to_js(ast.exprs[1], ctx);
            js_out(":", ctx);
            ast_to_js(ast.exprs[2], ctx);
        }
        else if (ast.op === "x [ y ]")
        {
            ast_to_js(ast.exprs[0], ctx);
            js_out("[", ctx);
            ast_to_js(ast.exprs[1], ctx);
            js_out("]", ctx);
        }
        else if (ast.op === "var x = y")
        {
            ast_to_js(ast.exprs[0], ctx);
            js_out(" = ", ctx);
            ast_to_js(ast.exprs[1], ctx);
        }
        else
        {
            var len = ast.op.length;
            var last = ast.op.charAt(len-1);

            if (last === "y")
            {
                ast_to_js(ast.exprs[0], ctx);
                js_out(ast.op.substring(1, len-1), ctx);
                ast_to_js(ast.exprs[1], ctx);
            }
            else if (last === "x")
            {
                js_out(ast.op.substring(0, len-1), ctx);
                ast_to_js(ast.exprs[0], ctx);
            }
            else if (ast.op.charAt(0) === "x")
            {
                ast_to_js(ast.exprs[0], ctx);
                js_out(ast.op.substring(1, len), ctx);
            }
            else
                error("unknown op " + ast.op);
        }
        js_out(")", ctx);
    }
    else if (ast instanceof NewExpr)
    {
        js_out("new ", ctx);
        ast_to_js(ast.expr, ctx);
        js_out("(", ctx);
        var sep = "";
        for (var i=0; i<ast.args.length; i++)
        {
            js_out(sep, ctx);
            ast_to_js(ast.args[i], ctx);
            sep = ", ";
        }
        js_out(")", ctx);
    }
    else if (ast instanceof CallExpr)
    {
        ast_to_js(ast.fn, ctx);
        js_out("(", ctx);
        var sep = "";
        for (var i=0; i<ast.args.length; i++)
        {
            js_out(sep, ctx);
            ast_to_js(ast.args[i], ctx);
            sep = ", ";
        }
        js_out(")", ctx);
    }
    else if (ast instanceof FunctionExpr)
    {
        js_out("(", ctx); // FIXME: V8 seems to require extra parentheses at toplevel
        function_to_js(ast, null, ctx);
        js_out(")", ctx); // FIXME: V8 seems to require extra parentheses at toplevel
    }
    else if (ast instanceof Literal)
    {
        var val = ast.value;
        var str;
        if (val === null)
            str = "null";
        else if (typeof val === "string")
            str = js_unparse_string(val);
        else if (num_instance(val))
            str = num_to_string(val, 10);
        else
            str = ast.value.toString();
        js_out(str, ctx);
    }
    else if (ast instanceof ArrayLiteral)
    {
        js_out("[", ctx);
        var sep = "";
        for (var i=0; i<ast.exprs.length; i++)
        {
            js_out(sep, ctx);
            if (ast.exprs[i] !== null)
                ast_to_js(ast.exprs[i], ctx);
            sep = ", ";
        }
        js_out("]", ctx);
    }
    else if (ast instanceof ObjectLiteral)
    {
        js_out("{", ctx);
        var sep = "";
        for (var i=0; i<ast.properties.length; i++)
        {
            js_out(sep, ctx);
            ast_to_js(ast.properties[i].name, ctx);
            js_out(": ", ctx);
            ast_to_js(ast.properties[i].value, ctx);
            sep = ", ";
        }
        js_out("}", ctx);
    }
    else if (ast instanceof RegExpLiteral)
    {
        js_out(ast.regexp, ctx);
    }
    else if (ast instanceof Ref)
    {
        js_out(js_id_to_js(ast.id.toString()), ctx);
    }
    else if (ast instanceof This)
    {
        js_out("this", ctx);
    }
    else
    {
//        for (var k in ast)
//            print(k);
        error("UNKNOWN AST");
    }
}

function function_to_js(ast, id, ctx)
{
    if (id === null)
        id = ast.id;

    js_out("function ", ctx);

    if (id !== null)
        js_out(js_id_to_js(id.toString()), ctx);

    js_out("(", ctx);

    var sep = "";
    for (var i=0; i<ast.params.length; i++)
    {
        js_out(sep, ctx);
        js_out(js_id_to_js(ast.params[i].toString()), ctx);
        sep = ", ";
    }
    js_out(")\n", ctx);

    js_indent(ctx);
    js_out("{\n", ctx);
    js_indent_begin(ctx);

    for (var a in ast.annotations)
        js_annotation(ast.annotations[a].value, ctx);

    for (var v in ast.vars)
        if (!ast.vars[v].is_param)
            js_var(js_id_to_js(v), ctx);

    for (var i=0; i<ast.body.length; i++)
        ast_to_js(ast.body[i], ctx);

    js_indent_end(ctx);
    js_indent(ctx);
    js_out("}", ctx);
}

function js_id_to_js(id)
{
    return id;
}

function js_out(str, ctx)
{
    ctx.port.write_string(str);
}

function js_indent(ctx)
{
    for (var i=0; i<ctx.indent; i++)
        js_out("    ", ctx);
}

function js_indent_begin(ctx)
{
    ctx.indent++;
}

function js_indent_end(ctx)
{
    ctx.indent--;
}

function js_annotation(annotation, ctx)
{
    js_indent(ctx);
    js_out("\"" + annotation + "\";\n", ctx);
}

function js_var(id, ctx)
{
    js_indent(ctx);
    js_out("var " + id + ";\n", ctx);
}

function js_var_assign(id, ctx)
{
    js_indent(ctx);
    js_out(id + " = ", ctx);
}

//-----------------------------------------------------------------------------

// HTML pretty-printing.

function string_to_id(str)
{
    var chars = [];

    for (var i=0; i<str.length; i++)
    {
        var c = str.charCodeAt(i);
        if ((c >= LOWER_A_CH && c <= LOWER_Z_CH) ||
            (c >= UPPER_A_CH && c <= UPPER_Z_CH) ||
            (c >= ZERO_CH && c <= NINE_CH) ||
            (c === MINUS_CH))
        {
            chars.push(String.fromCharCode(c));
        }
        else
        {
            chars.push("_" + c + "_");
        }
    }

    return chars.join("");
}

function id_to_string(str)
{
    var chars = [];
    var i = 0;

    while (i < str.length)
    {
        var c = str.charCodeAt(i);
        if (c === 95) // '_'
        {
            var n = 0;
            i++;
            while (i < str.length &&
                   str.charCodeAt(i) >= 48 && // '0'
                   str.charCodeAt(i) <= 57)   // '9'
            {
                n = n*10 + (str.charCodeAt(i) - 48);
                i++;
            }
            if (i < str.length && str.charCodeAt(i) === 95) // '_'
            {
                i++;
                chars.push(n);
            }
            else
            {
                error('illformed location identifier');
            }
        }
        else
        {
            chars.push(c);
            i++;
        }
    }

    return String.fromCharCode.apply(null,chars);
}

function loc_to_Location(loc)
{
    var i = 0;
    var end = loc.length - 1;

    function expect(c)
    {
        if (i < loc.length && loc.charCodeAt(i) === c)
            i++;
        else
            error("illformed location");
    }

    function number()
    {
        var n = 0;
        while (i < loc.length &&
               loc.charCodeAt(i) >= ZERO_CH &&
               loc.charCodeAt(i) <= NINE_CH)
        {
            n = n*10 + (loc.charCodeAt(i) - ZERO_CH);
            i++;
        }
        return n;
    }

    while (end > 0 && loc.charCodeAt(end) !== DOUBLEQUOTE_CH)
        end--;

    expect(DOUBLEQUOTE_CH);

    i = end;

    expect(DOUBLEQUOTE_CH);

    var container = loc.substr(1,end-1);

    expect(AT_CH);

    var start_line = number();

    expect(PERIOD_CH);

    var start_column = number();

    expect(MINUS_CH);

    var end_line = number();

    expect(PERIOD_CH);

    var end_column = number();

    if (i !== loc.length)
        error("illformed location");

    return new Location(container,
                        line_and_column_to_position(start_line, start_column),
                        line_and_column_to_position(end_line, end_column));
}

function generate_html_listing(input_filenames, options)
{
    if (options === void 0)
        options = {};

    options = { output_filename:
                  (options.output_filename === void 0)
                  ? input_filenames[input_filenames.length-1] + ".html"
                  : options.output_filename,
                start_line:
                  (options.start_line === void 0)
                  ? function (input_filename, line) { return ""; }
                  : options.start_line,
                lineno_width:
                  (options.lineno_width === void 0)
                  ? 6
                  : options.lineno_width,
                page_width:
                  (options.page_width === void 0)
                  ? 80
                  : options.page_width,
                xml:
                  (options.xml === void 0)
                  ? false
                  : options.xml,
                full_html:
                  options.full_html,
                get_insertions:
                  (options.get_insertions === void 0)
                  ? function (filename) { return []; }
                  : options.get_insertions
              };

    var oport = new File_output_port(options.output_filename);

    if (options.full_html !== void 0)
    {
        oport.write_string(html_highlighting_prefix1);
        oport.write_string(options.full_html.css);
        oport.write_string(html_highlighting_prefix2);
        oport.write_string(options.full_html.js);
        oport.write_string(html_highlighting_prefix3);
    }

    for (var i=0; i<input_filenames.length; i++)
        generate_html_listing_to_port(input_filenames[i], oport, options);

    if (options.full_html !== void 0)
        oport.write_string(html_highlighting_suffix);

    oport.close();
}

function generate_html_listing_to_port(input_filename, oport, options)
{
    var iport = new File_input_port(input_filename);
    var insertions = options.get_insertions(input_filename);
    var line = 0;
    var column = 0;
    var i = 0;

    var c = iport.read_char();

    if (!options.xml) {
        oport.write_string("<h1>" + input_filename + "</h1>\n");

        oport.write_string("<div id=\"" + string_to_id("\"" + input_filename + "\"") + "\">\n");
        oport.write_string("<pre>\n");
    }

    if (c >= 0)
    {
        function start_line(line)
        {
            if (options.xml) {
                oport.write_string("<line>");
            } else {
                oport.write_string(options.start_line(input_filename, line+1));
            }
        }

        function end_line(line)
        {
            if (options.xml) {
                oport.write_string("</line>");
            }
        }

        function pad_right()
        {
            // pad line to page width

            if (options.page_width > 0)
            {
                while (column === 0 || column % options.page_width !== 0)
                {
                    oport.write_char(32);
                    column++;
                }
            }
        }

        start_line(line);

        while (c >= 0)
        {
            while (i < insertions.length)
            {
                var insertion = insertions[i];
                var insertion_line = position_to_line(insertion.pos)-1;

                if (line < insertion_line ||
                    (line === insertion_line &&
                     column < position_to_column(insertion.pos)-1))
                    break;

                oport.write_string(insertion.text);

                i++;
            }

            if (c === LF_CH || c === CR_CH)
            {
                pad_right();

                if (c === CR_CH)
                {
                    c = iport.read_char();
                    if (c === LF_CH)
                    {
                        c = iport.read_char();
                    }
                }
                else
                    c = iport.read_char();

                end_line(line);

                oport.write_string("\n");

                line++;
                column = 0;

                if (c === 0)
                    c = -1;
                else
                    start_line(line);
            }
            else
            {
                if (options.page_width > 0 && ~options.xml)
                {
                    if (column > 0 && column % options.page_width === 0)
                    {
                        oport.write_string("<small><span style=\"color:red;\">&#8617;</span></small>\n"); // LEFTWARDS ARROW WITH HOOK
                        start_line(-1);
                    }
                }

                if (c === LT_CH)
                    oport.write_string("&lt;");
                else if (c === GT_CH)
                    oport.write_string("&gt;");
                else if (c === AMPERSAND_CH)
                    oport.write_string("&amp;");
                else if (c < SPACE_CH || (c >= 127 && c <= 255))
                    oport.write_string("&#x" + (c+256).toString(16).slice(1) + ";");
                else if (c >= 256)
                    oport.write_string("&#x" + (c+65536).toString(16).slice(1) + ";");
                else
                    oport.write_char(c);

                c = iport.read_char();
                column++;
            }
        }

        if (c !== 0)
            end_line(line);
    }

    if (!options.xml) {
        oport.write_string("</pre>\n");
        oport.write_string("</div>\n");
    }
}

function syntax_highlighting(input_filenames, options)
{
    function start_line(input_filename, line)
    {
        var lineno_width = options.lineno_width;

        if (lineno_width === 0)
            return "";

        var blanks = Array(lineno_width+1).join(" ");

        if (line === 0)
        {
            if (options.xml) {
                return "<lineinfo>" +
                       "<lineno>" + blanks + " </lineno>" +
                       "<linespace> </linespace>" +
                       "</lineinfo>";
            } else {
                return "<span class=\"lineinfo\">" +
                       "<span class=\"lineno\">" + blanks + " </span>" +
                       "<span class=\"linespace\"> </span>" +
                       "</span>";
            }
        }
        else
        {
            if (options.xml) {
                return "<lineinfo>" +
                       "<lineno>" + (blanks+line).substr(-lineno_width) + ":</lineno>" +
                       "<linespace> </linespace>" +
                       "</lineinfo>";
            } else {
                var id = string_to_id("\"" + input_filename + "\"@" + line);
                return "<span class=\"lineinfo\" id=\"" + id + "\">" +
                       "<span class=\"lineno\">" + (blanks+line).substr(-lineno_width) + ":</span>" +
                       "<span class=\"linespace\"> </span>" +
                       "</span>";
            }
        }
    }

    function get_insertions(input_filename)
    {
        var sh_highlights = syntax_highlighting_highlights(input_filename, options);

        var st_highlights = options.xml ? [] : syntax_tree_highlights(input_filename);

        return highlights_to_insertions(sh_highlights.concat(st_highlights), options);
    }

    if (options === void 0)
        options = {};

    options = { output_filename:
                  (options.output_filename === void 0)
                  ? input_filenames[input_filenames.length-1] + ".html"
                  : options.output_filename,
                start_line:
                  (options.start_line === void 0)
                  ? start_line
                  : options.start_line,
                lineno_width:
                  (options.lineno_width === void 0)
                  ? 6
                  : options.lineno_width,
                page_width:
                  (options.page_width === void 0)
                  ? 80
                  : options.page_width,
                xml:
                  (options.xml === void 0)
                  ? false
                  : options.xml,
                full_html:
                  options.full_html,
                get_insertions:
                  get_insertions
              };

    generate_html_listing(input_filenames, options);
}

function syntax_tree_highlights(input_filename)
{
    var port = new File_input_port(input_filename);
    var scanner = new Scanner(port);
    var p = new Parser(scanner, false);
    var ast = p.parse();

    return ast_highlights(ast);
}

function ast_highlights(ast)
{
    function ast_highlights_ctx()
    {
        this.highlights = [];
    }

    ast_highlights_ctx.prototype.add_ast = function (ast)
    {
        if (ast !== null)
        {
            this.highlights.push({ loc: ast.loc, text: " id=\"" + string_to_id(ast.loc.toString()) + "\" class=\"unselected\"" });
        }
    };

    ast_highlights_ctx.prototype.walk_statement = function (ast)
    {
        this.add_ast(ast);
        return ast_walk_statement(ast, this);
    };

    ast_highlights_ctx.prototype.walk_expr = function (ast)
    {
        this.add_ast(ast);
        return ast_walk_expr(ast, this);
    };

    var ctx = new ast_highlights_ctx();
    ctx.walk_statement(ast);

    return ctx.highlights;
}

function syntax_highlighting_highlights(input_filename, options)
{
    var iport = new File_input_port(input_filename);
    var scanner = new Scanner(iport);
    var tokens = [];
    var highlights = [];

    var get_token_orig = scanner.get_token;

    scanner.get_token = function ()
    {
        var tok;
        for (;;) {
            tok = get_token_orig.call(scanner,true);
            tokens.push(tok);
            if (tok.cat !== COMMENT_CAT)
                break;
        }
        return tok;
    };

    var p = new Parser(scanner, false);
    var ast = p.parse();

    tokens.forEach(function (tok)
                   {
                       var kind = "";
                       if (tok.cat === NUMBER_CAT) {
                           kind = "number";
                       } else if (tok.cat === IDENT_CAT) {
                           kind = "ident";
                       } else if (tok.cat === STRING_CAT) {
                           kind = "string";
                       } else if (tok.cat === COMMENT_CAT) {
                           kind = "comment";
                       } else {
                           var h = token_highlights[tok.cat];
                           if (h !== void 0) {
                               if (options.xml) {
                                   kind = "token";
                               } else {
                                   kind = h;
                               }
                           }
                       }
                       if (kind !== "") {
                           if (options.xml) {
                               highlights.push({ loc: tok.loc, text: kind })
                           } else {
                               highlights.push({ loc: tok.loc, text: " class=\"token_" + kind + "\"" })
                           };
                       }
                   });

    return highlights;
}

var token_highlights = [];

token_highlights[NULL_CAT]            = "null";
token_highlights[TRUE_CAT]            = "true";
token_highlights[FALSE_CAT]           = "false";
token_highlights[BREAK_CAT]           = "break";
token_highlights[CASE_CAT]            = "case";
token_highlights[DEFAULT_CAT]         = "default";
token_highlights[FOR_CAT]             = "for";
token_highlights[NEW_CAT]             = "new";
token_highlights[VAR_CAT]             = "var";
token_highlights[CONST_CAT]           = "const";
token_highlights[CONTINUE_CAT]        = "continue";
token_highlights[FUNCTION_CAT]        = "function";
token_highlights[RETURN_CAT]          = "return";
token_highlights[VOID_CAT]            = "void";
token_highlights[DELETE_CAT]          = "delete";
token_highlights[IF_CAT]              = "if";
token_highlights[THIS_CAT]            = "this";
token_highlights[DO_CAT]              = "do";
token_highlights[WHILE_CAT]           = "while";
token_highlights[IN_CAT]              = "in";
token_highlights[INSTANCEOF_CAT]      = "instanceof";
token_highlights[TYPEOF_CAT]          = "typeof";
token_highlights[SWITCH_CAT]          = "switch";
token_highlights[WITH_CAT]            = "with";
token_highlights[RESERVED_CAT]        = "reserved";
token_highlights[THROW_CAT]           = "throw";
token_highlights[TRY_CAT]             = "try";
token_highlights[CATCH_CAT]           = "catch";
token_highlights[FINALLY_CAT]         = "finally";
token_highlights[DEBUGGER_CAT]        = "debugger";

token_highlights[CLASS_CAT]           = "class";
token_highlights[ENUM_CAT]            = "enum";
token_highlights[EXPORT_CAT]          = "export";
token_highlights[EXTENDS_CAT]         = "extends";
token_highlights[IMPORT_CAT]          = "import";
token_highlights[SUPER_CAT]           = "super";
token_highlights[IMPLEMENTS_CAT]      = "implements";
token_highlights[INTERFACE_CAT]       = "interface";
token_highlights[LET_CAT]             = "let";
token_highlights[PACKAGE_CAT]         = "package";
token_highlights[PRIVATE_CAT]         = "private";
token_highlights[PROTECTED_CAT]       = "protected";
token_highlights[PUBLIC_CAT]          = "public";
token_highlights[STATIC_CAT]          = "static";
token_highlights[YIELD_CAT]           = "yield";

token_highlights[ELSE_CAT]            = "else";

function stable_sort(o, comparefn)
{
    var len = o.length;

    /* Iterative mergesort algorithm */

    if (len >= 2)
    {
        /* Sort pairs in-place */

        for (var start=((len-2)>>1)<<1; start>=0; start-=2)
        {
            if (comparefn(o[start], o[start+1]) > 0)
            {
                var tmp = o[start];
                o[start] = o[start+1];
                o[start+1] = tmp;
            }
        }

        if (len > 2)
        {
            /*
             * For each k>=1, merge each pair of groups of size 2^k to
             * form a group of size 2^(k+1) in a second array.
             */

            var a1 = o;
            var a2 = new Array(len);

            var k = 1;
            var size = 2;

            do
            {
                var start = ((len-1)>>(k+1))<<(k+1);
                var j_end = len;
                var i_end = start+size;

                if (i_end > len)
                    i_end = len;

                while (start >= 0)
                {
                    var i = start;
                    var j = i_end;
                    var x = start;

                    for (;;)
                    {
                        if (i < i_end)
                        {
                            if (j < j_end)
                            {
                                if (comparefn(a1[i], a1[j]) > 0)
                                    a2[x++] = a1[j++];
                                else
                                    a2[x++] = a1[i++];
                            }
                            else
                            {
                                while (i < i_end)
                                    a2[x++] = a1[i++];
                                break;
                            }
                        }
                        else
                        {
                            while (j < j_end)
                                a2[x++] = a1[j++];
                            break;
                        }
                    }

                    j_end = start;
                    start -= 2*size;
                    i_end = start+size;
                }

                var t = a1;
                a1 = a2;
                a2 = t;

                k++;
                size *= 2;
            } while (len > size);

            if ((k & 1) === 0)
            {
                /* Last merge was into second array, so copy it back to o. */

                for (var i=len-1; i>=0; i--)
                    o[i] = a1[i];
            }
        }
    }

    return o;
}

function highlights_to_insertions(highlights, options)
{
    var sorted_highlights =
        stable_sort(highlights,
                    function (x, y)
                    { if (pos_lt(x.loc.start_pos, y.loc.start_pos))
                        return -1;
                      if (!pos_eq(x.loc.start_pos, y.loc.start_pos))
                          return 1;
                      if (pos_lt(y.loc.end_pos, x.loc.end_pos))
                          return -1;
                      if (!pos_eq(y.loc.end_pos, x.loc.end_pos))
                          return 1;
                      return 0;
                    });

    var insertions = [];
    var stack = [];
    var i;

    function pop()
    {
        var highlight = stack.pop();
        var end_pos = highlight.loc.end_pos;

        if (options.xml) {
            insertions.push({ pos: end_pos, text: "</" + highlight.text + ">" });
        } else {
            insertions.push({ pos: end_pos, text: "</span>" });
        }
    }

    for (i=0; i<sorted_highlights.length; i++)
    {
        var start_pos = sorted_highlights[i].loc.start_pos;
        var text = sorted_highlights[i].text;

        while (stack.length > 0 &&
               !pos_lt(start_pos, stack[stack.length-1].loc.end_pos))
            pop();

        stack.push(sorted_highlights[i]);
        if (options.xml) {
            insertions.push({ pos: start_pos, text: "<" + text + ">" });
        } else {
            insertions.push({ pos: start_pos, text: "<span" + text + ">" });
        }
    }

    while (stack.length > 0)
        pop();

    return insertions;
}

function pos_eq(pos1, pos2)
{
    return position_to_line(pos1) === position_to_line(pos2) &&
           position_to_column(pos1) === position_to_column(pos2);
}

function pos_lt(pos1, pos2)
{
    return position_to_line(pos1) < position_to_line(pos2) ||
           (position_to_line(pos1) === position_to_line(pos2) &&
            position_to_column(pos1) < position_to_column(pos2));
}

var html_highlighting_prefix1 =
"<html>\n\
\n\
<head>\n\
\n\
<style type='text/css'>\n\
\n\
/* for syntax highlighting */\n\
\n\
span.token_null            { font-weight: bold; }\n\
span.token_true            { font-weight: bold; }\n\
span.token_false           { font-weight: bold; }\n\
span.token_break           { font-weight: bold; }\n\
span.token_case            { font-weight: bold; }\n\
span.token_default         { font-weight: bold; }\n\
span.token_for             { font-weight: bold; }\n\
span.token_new             { font-weight: bold; }\n\
span.token_var             { font-weight: bold; }\n\
span.token_const           { font-weight: bold; }\n\
span.token_continue        { font-weight: bold; }\n\
span.token_function        { font-weight: bold; }\n\
span.token_return          { font-weight: bold; }\n\
span.token_void            { font-weight: bold; }\n\
span.token_delete          { font-weight: bold; }\n\
span.token_if              { font-weight: bold; }\n\
span.token_this            { font-weight: bold; }\n\
span.token_do              { font-weight: bold; }\n\
span.token_while           { font-weight: bold; }\n\
span.token_in              { font-weight: bold; }\n\
span.token_instanceof      { font-weight: bold; }\n\
span.token_typeof          { font-weight: bold; }\n\
span.token_switch          { font-weight: bold; }\n\
span.token_with            { font-weight: bold; }\n\
span.token_reserved        { font-weight: bold; }\n\
span.token_throw           { font-weight: bold; }\n\
span.token_try             { font-weight: bold; }\n\
span.token_catch           { font-weight: bold; }\n\
span.token_finally         { font-weight: bold; }\n\
span.token_debugger        { font-weight: bold; }\n\
span.token_class           { font-weight: bold; }\n\
span.token_enum            { font-weight: bold; }\n\
span.token_export          { font-weight: bold; }\n\
span.token_extends         { font-weight: bold; }\n\
span.token_import          { font-weight: bold; }\n\
span.token_super           { font-weight: bold; }\n\
span.token_implements      { font-weight: bold; }\n\
span.token_interface       { font-weight: bold; }\n\
span.token_let             { font-weight: bold; }\n\
span.token_package         { font-weight: bold; }\n\
span.token_private         { font-weight: bold; }\n\
span.token_protected       { font-weight: bold; }\n\
span.token_public          { font-weight: bold; }\n\
span.token_static          { font-weight: bold; }\n\
span.token_yield           { font-weight: bold; }\n\
span.token_else            { font-weight: bold; }\n\
\n\
/* for selection of AST subtrees */\n\
\n\
span.unselected {                          }\n\
span.selected   { color: #f08;             }\n\
span.lineinfo   { background-color: #eee; color: #000; }\n\
span.lineno     { background-color: #ccc;  }\n\
span.linespace  { background-color: white; }\n\
\n\
/* for AST subtree tooltip */\n\
\n\
.tooltip {\n\
        background-color: #ffd;\n\
        -webkit-box-shadow: 0 0 10px #000;\n\
}\n\
";

var html_highlighting_prefix2 =
"\n\
</style>\n\
\n\
<script>\n\
\n\
/* helper functions */\n\
\n\
function getPosition(event)\n\
{\n\
    var cursor = { x:0, y:0 };\n\
    if (event.pageX || event.pageY) {\n\
        cursor.x = event.pageX;\n\
        cursor.y = event.pageY;\n\
    } \n\
    else {\n\
        var de = document.documentElement;\n\
        var b = document.body;\n\
        cursor.x = event.clientX + \n\
            (de.scrollLeft || b.scrollLeft) - (de.clientLeft || 0);\n\
        cursor.y = event.clientY + \n\
            (de.scrollTop || b.scrollTop) - (de.clientTop || 0);\n\
    }\n\
\n\
    return cursor;\n\
} \n\
\n\
function id_to_string(str)\n\
{\n\
    var chars = [];\n\
    var i = 0;\n\
\n\
    while (i < str.length)\n\
    {\n\
        var c = str.charCodeAt(i);\n\
        if (c === 95) // '_'\n\
        {\n\
            var n = 0;\n\
            i++;\n\
            while (i < str.length &&\n\
                   str.charCodeAt(i) >= 48 && // '0'\n\
                   str.charCodeAt(i) <= 57)   // '9'\n\
            {\n\
                n = n*10 + (str.charCodeAt(i) - 48);\n\
                i++;\n\
            }\n\
            if (i < str.length && str.charCodeAt(i) === 95) // '_'\n\
            {\n\
                i++;\n\
                chars.push(n);\n\
            }\n\
            else\n\
            {\n\
                error('illformed location identifier')\n\
            }\n\
        }\n\
        else\n\
        {\n\
            chars.push(c);\n\
            i++;\n\
        }\n\
    }\n\
\n\
    return String.fromCharCode.apply(null,chars);\n\
}\n\
\n\
/* for selection of AST subtrees */\n\
\n\
function mouseover()\n\
{\n\
  var event = window.event;\n\
  var target = event.target;\n\
  while (target instanceof HTMLElement)\n\
  {\n\
    if (target.className === 'unselected')\n\
    {\n\
      target.setAttribute('class', 'selected');\n\
      show_tooltip(target, getPosition(event));\n\
      break;\n\
    }\n\
    else if (target.className === 'selected')\n\
    {\n\
      break;\n\
    }\n\
    else\n\
    {\n\
      target = target.parentNode;\n\
    }\n\
  }\n\
}\n\
\n\
function mouseout()\n\
{\n\
  var event = window.event;\n\
  var target = event.target;\n\
  while (target instanceof HTMLElement)\n\
  {\n\
    if (target.className === 'unselected')\n\
    {\n\
      break;\n\
    }\n\
    else if (target.className === 'selected')\n\
    {\n\
      target.setAttribute('class', 'unselected');\n\
      hide_tooltip();\n\
      break;\n\
    }\n\
    else\n\
    {\n\
      target = target.parentNode;\n\
    }\n\
  }\n\
}\n\
\n\
document.addEventListener( 'mouseover', mouseover, false );\n\
document.addEventListener( 'mouseout', mouseout, false );\n\
\n\
/* for AST subtree tooltip */\n\
\n\
var tooltip = null;\n\
\n\
function get_tooltip()\n\
{\n\
  if (tooltip === null)\n\
  {\n\
    tooltip = document.createElement('div');\n\
    tooltip.setAttribute('class', 'tooltip');\n\
    document.body.appendChild(tooltip);\n\
    tooltip.style.position = 'absolute';\n\
    tooltip.style.visibility = 'hidden';\n\
  }\n\
\n\
  return tooltip;\n\
}\n\
\n\
function show_tooltip(target, pos)\n\
{\n\
  var text = tooltip_info(id_to_string(target.id));\n\
  if (typeof text !== 'undefined')\n\
  {\n\
    var tooltip = get_tooltip();\n\
    tooltip.style.left = pos.x + 20;\n\
    tooltip.style.top = pos.y + 20;\n\
    tooltip.innerHTML = text;\n\
    tooltip.style.visibility = 'visible';\n\
  }\n\
}\n\
\n\
function hide_tooltip()\n\
{\n\
  var tooltip = get_tooltip();\n\
  tooltip.style.visibility = 'hidden';\n\
}\n\
\n\
function tooltip_info(loc)\n\
{\n\
  // Customize this function to return a string which contains the\n\
  // HTML code for the tooltip associated with the AST subtree\n\
  // whose location is 'loc'.  Return undefined to prevent showing a\n\
  // tooltip for this AST subtree.\n\
\n\
  return 'AST subtree location: <code>' + loc + '</code>';\n\
}\n\
";

var html_highlighting_prefix3 =
"\n\
</script>\n\
\n\
<script type='text/javascript' src='highlight-hooks.js'></script>\n\
\n\
</head>\n\
\n\
<body>\n\
\n\
";

var html_highlighting_suffix =
"\n\
</body>\n\
\n\
</html>\n\
";

//-----------------------------------------------------------------------------

function get_input_filenames(analysis_output, options)
{
    var results = analysis_output.results;
    var input_filenames = [];
    var filenames_seen = {};

    for (var loc in results)
    {
        var x = loc_to_Location(loc);
        if (filenames_seen[x.filename] === void 0)
        {
            filenames_seen[x.filename] = true;
            input_filenames.push(x.filename);
        }
    }

    return input_filenames;
}

function get_css(analysis_output, options)
{
    var results = analysis_output.results;
    var freq_css = [];
    var counts = [];

    for (var loc in results)
    {
        var r = results[loc];

        if (r.count !== void 0)
            counts.push(r.count);
    }

    counts.sort(function (x,y) { return (x > y) ? 1 : -1; });

    var hi_freq_count = counts[Math.floor(counts.length * 99/100)];

    for (var loc in results)
    {
        var r = results[loc];

        if (r.count !== void 0 && r.count > 1)
        {
            var id = string_to_id(loc);
            var x = r.count / hi_freq_count * 80/100;
            freq_css.push("#" + id + " { background-color: " + frequency_to_color(x) + " }");
        }
    }

    return freq_css.join("\n");
}

function frequency_to_color(x)
{
    var n = frequency_colors.length;
    return frequency_colors[Math.min(n-1,Math.floor(n * x))];
}

var frequency_colors = ["#dff","#aee","#9db","#4b4","#161"];

function get_js(analysis_output, options)
{
    return js_prefix + JSON.stringify(analysis_output) + js_suffix;
}

var js_prefix = "var analysis_output = ";

var js_suffix = ";\n\
\n\
function tooltip_info(loc)\n\
{\n\
  var results = analysis_output.results;\n\
  var r = results[loc];\n\
\n\
  if (typeof r === 'undefined')\n\
    return r;\n\
\n\
  var info = [];\n\
\n\
  var count = r.count;\n\
\n\
  if (typeof count !== 'undefined')\n\
    info.push('count: ' + count);\n\
\n\
  if (typeof r.absval !== 'undefined')\n\
  {\n\
    info.push('absval:')\n\
    r.absval.forEach(function (x)\n\
                     {\n\
                       var name = x.name;\n\
                       var prop = Math.round(x.count * 100 / count);\n\
                       var prefix = '&nbsp;&nbsp;' + prop + '%&nbsp;';\n\
                       var m = analysis_output.maps[name];\n\
                       if (typeof m === 'undefined')\n\
                         info.push(prefix + name);\n\
                       else\n\
                         info.push(prefix + name + ' = ' + m);\n\
                     });\n\
  }\n\
\n\
  return info.join('<br>\\n');\n\
}\n\
";

function profile2html(analysis_output, options)
{
    var input_filenames = get_input_filenames(analysis_output, options);
    var css = get_css(analysis_output, options);
    var js = get_js(analysis_output, options);

    syntax_highlighting(input_filenames,
                        { output_filename:
                            options.output,
                          lineno_width:
                            options.lineno_width,
                          page_width:
                            options.page_width,
                          full_html:
                            { css: css, js: js }
                        });
}

//=============================================================================
