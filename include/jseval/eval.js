//=============================================================================

// File: "eval.js"

// Copyright (c) 2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

function js_run(code)
{
    var rte = js_run_setup(code);

    return js_eval_exec(rte);
}

function js_run_setup(code)
{
    var rte = new_global_rte();

    rte.resume = function (rte)
                 {
                     return code(rte,
                                 function (rte, result)
                                 {
                                     rte.result = result;
                                     rte.resume = null;
                                     return null; // exit trampoline
                                 });
                 };

    return rte;
}

function js_eval_exec(rte)
{
    while (!js_eval_finished(rte))
        js_eval_step(rte);

    if (rte.error !== null)
        throw rte.ast.loc.toString() + ": " + rte.error;

    return js_eval_result(rte);
}

function js_eval_finished(rte)
{
    return rte.resume === null;
}

function js_eval_result(rte)
{
    return rte.result;
}

function js_eval_error(rte)
{
    return rte.error;
}

function js_eval_step(rte, nb_steps)
{
    if (nb_steps === void 0)
        nb_steps = 999999999999;

    var resume = rte.resume;

    rte.step_limit = rte.step_count + nb_steps;

    // trampoline

    while (resume !== null)
    {
        resume = resume(rte);
    }
}

function SourceContainerInternalFile(source, tostr, start_line, start_column, stamp)
{
    this.source = source;
    this.tostr = tostr;
    this.start_line = start_line;
    this.start_column = start_column;
    this.stamp = stamp;
}

SourceContainerInternalFile.prototype.toString = function ()
{
    return this.tostr;
};

function SourceContainer(source, tostr, start_line, start_column)
{
    this.source = source;
    this.tostr = tostr;
    this.start_line = start_line;
    this.start_column = start_column;
}

SourceContainer.prototype.toString = function ()
{
    return this.tostr;
};

function js_compile(source, options)
{
    var error = function (loc, kind, msg)
    {
        if (kind !== "warning")
            print(loc.toString() + ": " + kind + " -- " + msg);
    };

    var opts = {
                 container:
                   (typeof options === "object" &&
                    options.container !== void 0)
                   ? options.container
                 : new SourceContainer(source, "<string>", 1, 1),

                 error:
                   (typeof options === "object" &&
                    options.error !== void 0)
                   ? options.error
                   : error,

                 warnings:
                   (typeof options === "object" &&
                    options.warnings !== void 0)
                   ? options.warnings
                   : {
                       autosemicolon: true,
                       non_integer: true,
                       division: true,
                       equality: true
                     }
               };

    var port = new String_input_port(source, opts.container);
    var s = new Scanner(port, opts.error, opts.container.start_line, opts.container.start_column);
    var p = new Parser(s, opts.warnings);
    var ast = p.parse();
    var cte = new_global_cte();

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

    return comp_statement(cte, ast_normalize(ast, options));
}

function new_global_cte()
{
    return new CTE(null,
                   {},
                   {},
                   null);
}

function new_global_rte()
{
    var global_obj = (function () { return this; })();

    return new RTE(global_obj,
                   null,
                   new RTFrame(global_obj,
                               null,
                               [],
                               [],
                               null,
                               null));
}

function CTE(callee, params, locals, parent)
{
    this.callee = callee;
    this.params = params;
    this.locals = locals;
    this.parent = parent;
}

function RTE(glo, stack, frame)
{
    this.glo = glo;
    this.stack = stack;
    this.frame = frame;
    this.step_count = 0;
    this.step_limit = 0;
    this.resume = null;
    this.ast = null;
    this.result = null;
    this.error = null;
}

function RTFrame(this_, callee, params, locals, parent, cte)
{
    this.this_ = this_;
    this.callee = callee;
    this.params = params;
    this.locals = locals;
    this.parent = parent;
    this.cte = cte;
}

function comp_statement(cte, ast)
{
    if (ast instanceof Program)
    {
        //print("Program");

        var code = comp_statement(cte, ast.block);

        return function (rte, cont)
               {
                   rte.frame.cte = cte;
                   return code(rte, cont);
               };
    }
    else if (ast instanceof FunctionDeclaration)
    {
        //print("FunctionDeclaration");

        throw "unimplemented"; /////////////////////////////////////////

        ///ast.funct = ctx.walk_expr(ast.funct);
    }
    else if (ast instanceof BlockStatement)
    {
        //print("BlockStatement");

        return comp_statements(cte, ast, ast.statements);
    }
    else if (ast instanceof VariableStatement)
    {
        //print("VariableStatement");

        throw "unimplemented"; /////////////////////////////////////////

/*
        ast.decls.forEach(function (decl, i, self)
                          {
                              decl.initializer = ctx.walk_expr(decl.initializer);
                          });
*/
    }
    else if (ast instanceof ConstStatement)
    {
        //print("ConstStatement");

        throw "unimplemented"; /////////////////////////////////////////
    }
    else if (ast instanceof ExprStatement)
    {
        //print("ExprStatement");

        return comp_expr(cte, ast.expr);
    }
    else if (ast instanceof IfStatement)
    {
        //print("IfStatement");

        var code_expr = comp_expr(cte, ast.expr);
        var code_stat0 = comp_statement(cte, ast.statements[0]);

        if (ast.statements.length === 1)
        {
            return function (rte, cont)
                   {
                       var subcont1 = function (rte, value1)
                       {
                           if (value1)
                               return code_stat0(rte, cont);
                           else
                               return cont(rte, void 0);
                       };

                       return code_expr(rte, subcont1);
                   };
        }
        else
        {
            var code_stat1 = comp_statement(cte, ast.statements[1]);

            return function (rte, cont)
                   {
                       var subcont1 = function (rte, value1)
                       {
                           if (value1)
                               return code_stat0(rte, cont);
                           else
                               return code_stat1(rte, cont);
                       };

                       return code_expr(rte, subcont1);
                   };
        }
    }
    else if (ast instanceof DoWhileStatement)
    {
        //print("DoWhileStatement");

        var code_stat = comp_statement(cte, ast.statement);
        var code_expr = comp_expr(cte, ast.expr);

        return function (rte, cont)
               {
                   var loop = function (rte)
                   {
                       var subcont1 = function (rte, value1)
                       {
                           var subcont2 = function (rte, value2)
                           {
                               if (value2)
                                   return loop(rte);
                               else
                                   return cont(rte, void 0);
                           };

                           return code_expr(rte, subcont2);
                       };

                       return code_stat(rte, subcont1);
                   };

                   return loop(rte);
               };
    }
    else if (ast instanceof WhileStatement)
    {
        //print("WhileStatement");

        var code_expr = comp_expr(cte, ast.expr);
        var code_stat = comp_statement(cte, ast.statement);

        return function (rte, cont)
               {
                   var loop = function (rte)
                   {
                       var subcont1 = function (rte, value1)
                       {
                           if (value1)
                           {
                               var subcont2 = function (rte, value2)
                               {
                                   return loop(rte);
                               }

                               return code_stat(rte, subcont2);
                           }
                           else
                               return cont(rte, void 0);
                       };

                       return code_expr(rte, subcont1);
                   };

                   return loop(rte);
               };
    }
    else if (ast instanceof ForStatement)
    {
        //print("ForStatement");

        var code_expr1 = comp_expr(cte, ast.expr1);
        var code_expr2 = comp_expr(cte, ast.expr2);
        var code_expr3 = comp_expr(cte, ast.expr3);
        var code_stat = comp_statement(cte, ast.statement);

        return function (rte, cont)
               {
                   var subcont1 = function (rte, value1)
                   {
                       var loop = function (rte)
                       {
                           var subcont2 = function (rte, value2)
                           {
                               if (value2)
                               {
                                   var subcont3 = function (rte, value3)
                                   {
                                       var subcont4 = function (rte, value4)
                                       {
                                           return loop(rte);
                                       };

                                       return code_expr3(rte, subcont4);
                                   };

                                   return code_stat(rte, subcont3);
                               }
                               else
                                   return cont(rte, void 0);
                           };

                           return code_expr2(rte, subcont2);
                       };

                       return loop(rte);
                   };

                   return code_expr1(rte, subcont1);
               };
    }
    else if (ast instanceof ForVarStatement)
    {
        //print("ForVarStatement");

        throw "unimplemented"; /////////////////////////////////////////

        /*
        for (var i=ast.decls.length-1; i>=0; i--)
        {
            var decl = ast.decls[i];
            decl.initializer = ctx.walk_expr(decl.initializer);
        }
        ast.expr2 = ctx.walk_expr(ast.expr2);
        ast.expr3 = ctx.walk_expr(ast.expr3);
        ast.statement = ctx.walk_statement(ast.statement);
        */
    }
    else if (ast instanceof ForInStatement)
    {
        //print("ForInStatement");

        throw "unimplemented"; /////////////////////////////////////////

        /*
        ast.lhs_expr = ctx.walk_expr(ast.lhs_expr);
        ast.set_expr = ctx.walk_expr(ast.set_expr);
        ast.statement = ctx.walk_statement(ast.statement);
        */
    }
    else if (ast instanceof ForVarInStatement)
    {
        //print("ForVarInStatement");

        throw "unimplemented"; /////////////////////////////////////////

        /*
        ast.initializer = ctx.walk_expr(ast.initializer);
        ast.set_expr = ctx.walk_expr(ast.set_expr);
        ast.statement = ctx.walk_statement(ast.statement);
        */
    }
    else if (ast instanceof ContinueStatement)
    {
        //print("ContinueStatement");

        throw "unimplemented"; /////////////////////////////////////////

        return ast;
    }
    else if (ast instanceof BreakStatement)
    {
        //print("BreakStatement");

        throw "unimplemented"; /////////////////////////////////////////

        return ast;
    }
    else if (ast instanceof ReturnStatement)
    {
        //print("ReturnStatement");

        if (ast.expr === null)
        {
            return function (rte, cont)
                   {
                       var cont = rte.stack.cont;
                       rte.frame = rte.stack.frame;
                       rte.stack = rte.stack.stack;
                       return cont(rte, void 0);
                   };
        }
        else
        {
            var code_expr = comp_expr(cte, ast.expr);

            return function (rte, cont)
                   {
                       return code_expr(rte,
                                        function (rte, value)
                                        {
                                            var cont = rte.stack.cont;
                                            rte.frame = rte.stack.frame;
                                            rte.stack = rte.stack.stack;
                                            return cont(rte, value);
                                        });
                   };
        };
    }
    else if (ast instanceof WithStatement)
    {
        //print("WithStatement");

        throw "unimplemented"; /////////////////////////////////////////

        //ast.expr = ctx.walk_expr(ast.expr);
        //ast.statement = ctx.walk_statement(ast.statement);
    }
    else if (ast instanceof SwitchStatement)
    {
        //print("SwitchStatement");

        throw "unimplemented"; /////////////////////////////////////////

        /*
        ast.expr = ctx.walk_expr(ast.expr);
        ast.clauses.forEach(function (c, i, asts)
                            {
                                c.expr = ctx.walk_expr(c.expr);
                                c.statements = comp_statements(c, c.statements, ctx);
                            });
        */
    }
    else if (ast instanceof LabelledStatement)
    {
        //print("LabelledStatement");

        throw "unimplemented"; /////////////////////////////////////////

        /*
        ast.statement = ctx.walk_statement(ast.statement);
        */
    }
    else if (ast instanceof ThrowStatement)
    {
        //print("ThrowStatement");

        throw "unimplemented"; /////////////////////////////////////////

        //ast.expr = ctx.walk_expr(ast.expr);
    }
    else if (ast instanceof TryStatement)
    {
        //print("TryStatement");

        throw "unimplemented"; /////////////////////////////////////////

        /*
        ast.statement = ctx.walk_statement(ast.statement);
        ast.catch_part = ctx.walk_statement(ast.catch_part);
        ast.finally_part = ctx.walk_statement(ast.finally_part);
        */
    }
    else if (ast instanceof CatchPart)
    {
        //print("CatchPart");

        throw "unimplemented"; /////////////////////////////////////////

        //ast.statement = ctx.walk_statement(ast.statement);
    }
    else if (ast instanceof DebuggerStatement)
    {
        //print("DebuggerStatement");

        throw "unimplemented"; /////////////////////////////////////////
    }
    else
        throw "unknown ast";
}

function comp_statements(cte, ast, asts)
{
    if (asts.length === 0)
    {
        return function (rte, cont)
               {
                   return step_end(rte,
                                   cont,
                                   ast,
                                   void 0);
               };
    }
    else
    {
        return comp_statements_loop(cte, asts, 0);
    }
}

function comp_statements_loop(cte, asts, i)
{
    if (i < asts.length-1)
    {
        var code0 = comp_statement(cte, asts[i]);
        var code1 = comp_statements_loop(cte, asts, i+1);

        return function (rte, cont)
               {
                   return code0(rte,
                                function (rte, value)
                                {
                                    return code1(rte, cont);
                                });
               };
    }
    else
        return comp_statement(cte, asts[i]);
}

function comp_expr(cte, ast)
{
    if (ast instanceof OpExpr)
    {
        //print("OpExpr");

        if (is_assign_op1(ast.op))
        {
            var op = assign_op1_to_semfn(ast.op);

            if (is_prop_access(ast.exprs[0]))
            {
                var code_obj = comp_expr(cte, ast.exprs[0].exprs[0]);
                var code_prop = comp_expr(cte, ast.exprs[0].exprs[1]);

                return gen_op_dyn_dyn(ast,
                                      op,
                                      code_obj,
                                      code_prop);
            }
            else
            {
                var id_str = ast.exprs[0].id.toString();
                var access = cte_access(cte, id_str);

                if (access instanceof LocalAccess)
                {
                    var up = access.up;
                    var over = access.over;
                    var code_obj = function (rte, cont)
                                   {
                                       var f = rte.frame;
                                       for (var i=up; i>0; i--) f = f.parent;
                                       return cont(rte, f.locals);
                                   };

                    return gen_op_dyn_cst(ast,
                                          op,
                                          code_obj,
                                          over);
                }
                else if (access instanceof ParamAccess)
                {
                    var up = access.up;
                    var over = access.over;
                    var code_obj = function (rte, cont)
                                   {
                                       var f = rte.frame;
                                       for (var i=up; i>0; i--) f = f.parent;
                                       return cont(rte, f.params);
                                   };

                    return gen_op_dyn_cst(ast,
                                          op,
                                          code_obj,
                                          over);
                }
                else if (access instanceof CalleeAccess)
                {
                    var code_obj = function (rte, cont)
                                   {
                                       return cont(rte, [void 0]); // ignore assignment
                                   };

                    return gen_op_dyn_cst(ast,
                                          op,
                                          code_obj,
                                          0);
                }
                else if (access instanceof GlobalAccess)
                {
                    var name = access.name;

                    return gen_op_glo_cst(ast,
                                          op,
                                          name);
                }
                else
                {
                    throw "unknown access";
                }
            }
        }
        else if (is_assign_op2(ast.op))
        {
            var op = assign_op2_to_semfn(ast.op);

            if (is_prop_access(ast.exprs[0]))
            {
                var code_obj = comp_expr(cte, ast.exprs[0].exprs[0]);
                var code_prop = comp_expr(cte, ast.exprs[0].exprs[1]);
                var code_value = comp_expr(cte, ast.exprs[1]);

                return gen_op_dyn_dyn_dyn(ast,
                                          op,
                                          code_obj,
                                          code_prop,
                                          code_value);
            }
            else
            {
                var id_str = ast.exprs[0].id.toString();
                var access = cte_access(cte, id_str);
                var code_value = comp_expr(cte, ast.exprs[1]);

                if (access instanceof LocalAccess)
                {
                    var up = access.up;
                    var over = access.over;
                    var code_obj = function (rte, cont)
                                   {
                                       var f = rte.frame;
                                       for (var i=up; i>0; i--) f = f.parent;
                                       return cont(rte, f.locals);
                                   };

                    return gen_op_dyn_cst_dyn(ast,
                                              op,
                                              code_obj,
                                              over,
                                              code_value);
                }
                else if (access instanceof ParamAccess)
                {
                    var up = access.up;
                    var over = access.over;
                    var code_obj = function (rte, cont)
                                   {
                                       var f = rte.frame;
                                       for (var i=up; i>0; i--) f = f.parent;
                                       return cont(rte, f.params);
                                   };

                    return gen_op_dyn_cst_dyn(ast,
                                              op,
                                              code_obj,
                                              over,
                                              code_value);
                }
                else if (access instanceof CalleeAccess)
                {
                    var code_obj = function (rte, cont)
                                   {
                                       return cont(rte, [void 0]); // ignore assignment
                                   };

                    return gen_op_dyn_cst_dyn(ast,
                                              op,
                                              code_obj,
                                              0,
                                              code_value);
                }
                else if (access instanceof GlobalAccess)
                {
                    var name = access.name;

                    return gen_op_glo_cst_dyn(ast,
                                              op,
                                              name,
                                              code_value);
                }
                else
                {
                    throw "unknown access";
                }
            }
        }
        else if (is_pure_op1(ast.op))
        {
            var code0 = comp_expr(cte, ast.exprs[0]);

            return gen_op_dyn(ast,
                              pure_op1_to_semfn(ast.op),
                              code0);
        }
        else // if (is_pure_op2(ast.op))
        {
            var code0 = comp_expr(cte, ast.exprs[0]);
            var code1 = comp_expr(cte, ast.exprs[1]);

            switch (ast.op)
            {
/*
            /////////// fixme (short circuiting op)
            case "x && y":
                return ...;
            case "x || y":
                return ...;
*/
            default:
                return gen_op_dyn_dyn(ast,
                                      pure_op2_to_semfn(ast.op),
                                      code0,
                                      code1);
            }
        }
    }
    else if (ast instanceof NewExpr)
    {
        //print("NewExpr");

        var code_cons = comp_expr(cte, ast.expr);
        var code_args = comp_exprs(cte, ast.args);
        var new_semfn = get_new_semfn(ast.args.length);

        var op = function (rte, cont, ast, cons, args)
        {
            if (typeof cons !== "function")
            {
                return step_error(rte,
                                  cont,
                                  ast,
                                  "constructor is not a function");
            }
            else if ("_apply_" in cons)
            {
                var obj = Object.create(cons.prototype);
                return cons._apply_(rte,
                                    function (rte, result)
                                    {
                                        return step_end(rte,
                                                        cont,
                                                        ast,
                                                        obj);
                                    },
                                    obj,
                                    args);
            }
            else
            {
                var result = new_semfn(cons, args);
                return step_end(rte,
                                cont,
                                ast,
                                result);
            }
        };

        return gen_op_dyn_dyn(ast, op, code_cons, code_args);
    }
    else if (ast instanceof CallExpr)
    {
        //print("CallExpr");

        if (is_prop_access(ast.fn))
        {
            // method call

            var code_obj = comp_expr(cte, ast.fn.exprs[0]);
            var code_prop = comp_expr(cte, ast.fn.exprs[1]);
            var code_args = comp_exprs(cte, ast.args);

            var op = function (rte, cont, ast, obj, prop)
            {
                if (obj === void 0)
                {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      "cannot read property of undefined");
                }
                else
                {
                    var fn = obj[prop];

                    var cont2 = function (rte, fn)
                                {
                                    return code_args(rte,
                                                     function (rte, args)
                                                     {
                                                         if (typeof fn !== "function")
                                                         {
                                                             return step_error(rte,
                                                                               cont,
                                                                               ast,
                                                                               "cannot call a non function");
                                                         }
                                                         else if ("_apply_" in fn)
                                                         {
                                                             return fn._apply_(rte,
                                                                               function (rte, result)
                                                                               {
                                                                                   return step_end(rte,
                                                                                                   cont,
                                                                                                   ast,
                                                                                                   result);
                                                                               },
                                                                               obj,
                                                                               args);
                                                         }
                                                         else
                                                         {
                                                             return step_end(rte,
                                                                             cont,
                                                                             ast,
                                                                             fn.apply(obj, args));
                                                         }
                                                     });
                                };

                    return step_end(rte,
                                    cont2,
                                    ast.fn,
                                    fn);
                }
            };

            return gen_op_dyn_dyn(ast, op, code_obj, code_prop);
        }
        else
        {
            // non-method call

            var code_fn = comp_expr(cte, ast.fn);
            var code_args = comp_exprs(cte, ast.args);

            var op = function (rte, cont, ast, fn, args)
            {
                if (typeof fn !== "function")
                {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      "cannot call a non function");
                }
                else if ("_apply_" in fn)
                {
                    return fn._apply_(rte,
                                      function (rte, result)
                                      {
                                          return step_end(rte,
                                                          cont,
                                                          ast,
                                                          result);
                                      },
                                      rte.glo,
                                      args);
                }
                else
                {
                    return step_end(rte,
                                    cont,
                                    ast,
                                    fn.apply(rte.glo, args));
                }
            };

            return gen_op_dyn_dyn(ast, op, code_fn, code_args);
        }
    }
    else if (ast instanceof FunctionExpr)
    {
        //print("FunctionExpr");

        var nb_params = ast.params.length;
        var nb_locals = 0;
        var params = {};
        var locals = {};
        var i = 0;

        for (var v in ast.vars)
        {
            var id_str = v.toString();
            if (i < nb_params)
                params[id_str] = i;
            else
            {
                locals[id_str] = i-nb_params;
                nb_locals++;
            }
            i++;
        }

        var fn_cte = new CTE((ast.id !== null) ? ast.id.toString() : null,
                             params,
                             locals,
                             cte);

        var code_body = comp_statements(fn_cte, ast, ast.body);

        var loc = ast.loc;
        var start_char_offs = position_to_char_offset(loc, loc.start_pos);
        var end_char_offs = position_to_char_offset(loc, loc.end_pos);

        return function (rte, cont)
               {
                   var parent = rte.frame;

                   var closure = function ()
                   {
                       throw "unimplemented";///////////////////////////
                   };

                   closure.toString = function ()
                   {
                       var source = ast.loc.container.source;
                       return source.slice(start_char_offs, end_char_offs);
                   };

                   closure._apply_ = function (rte, cont, this_, params)
                   {
                       return exec_fn_body(code_body,
                                           closure,
                                           rte,
                                           cont,
                                           this_,
                                           params,
                                           new Array(nb_locals),
                                           parent,
                                           fn_cte);
                   };

                   return step_end(rte,
                                   cont,
                                   ast,
                                   closure);
               };
    }
    else if (ast instanceof Literal)
    {
        //print("Literal");

        return function (rte, cont)
               {
                   return step_end(rte,
                                   cont,
                                   ast,
                                   ast.value);
               };
    }
    else if (ast instanceof ArrayLiteral)
    {
        //print("ArrayLiteral");

        var code_exprs = comp_exprs(cte, ast.exprs);

        return function (rte, cont)
               {
                   return code_exprs(rte,
                                     function (rte, values)
                                     {
                                         return step_end(rte,
                                                         cont,
                                                         ast,
                                                         values);
                                     });
               };
    }
    else if (ast instanceof RegExpLiteral)
    {
        //print("RegExpLiteral");

        throw "unimplemented"; /////////////////////////////////////////
    }
    else if (ast instanceof ObjectLiteral)
    {
        //print("ObjectLiteral");

        return comp_props(cte, ast.properties);
    }
    else if (ast instanceof Ref)
    {
        //print("Ref");

        var id_str = ast.id.toString()
        var access = cte_access(cte, id_str);
        var error_msg = "cannot read the undefined variable " + id_str;

        if (access instanceof LocalAccess)
        {
            var up = access.up;
            var over = access.over;

            return function (rte, cont)
                   {
                       var f = rte.frame;
                       for (var i=up; i>0; i--) f = f.parent;
                       var result = f.locals[over];
                       if (result === void 0)
                       {
                           return step_error(rte,
                                             cont,
                                             ast,
                                             error_msg);
                       }
                       else
                       {
                           return step_end(rte,
                                           cont,
                                           ast,
                                           result);
                       }
                   };
        }
        else if (access instanceof ParamAccess)
        {
            var up = access.up;
            var over = access.over;

            return function (rte, cont)
                   {
                       var f = rte.frame;
                       for (var i=up; i>0; i--) f = f.parent;
                       var result = f.params[over];
                       if (result === void 0)
                       {
                           return step_error(rte,
                                             cont,
                                             ast,
                                             error_msg);
                       }
                       else
                       {
                           return step_end(rte,
                                           cont,
                                           ast,
                                           result);
                       }
                   };
        }
        else if (access instanceof CalleeAccess)
        {
            var up = access.up;

            return function (rte, cont)
                   {
                       var f = rte.frame;
                       for (var i=up; i>0; i--) f = f.parent;
                       var result = f.callee;
                       return step_end(rte,
                                       cont,
                                       ast,
                                       result);
                   };
        }
        else if (access instanceof GlobalAccess)
        {
            var name = access.name;

            return function (rte, cont)
                   {
                       var result = rte.glo[name];
                       if (result === void 0)
                       {
                           return step_error(rte,
                                             cont,
                                             ast,
                                             error_msg);
                       }
                       else
                       {
                           return step_end(rte,
                                           cont,
                                           ast,
                                           result);
                       }
                   };
        }
        else
        {
            throw "unknown access";
        }
    }
    else if (ast instanceof This)
    {
        //print("This");

        return function (rte, cont)
               {
                   return step_end(rte,
                                   cont,
                                   ast,
                                   rte.frame.this_);
               };
    }
    else if (ast === null)
    {
        return function (rte, cont)
               {
                   return cont(rte, true); // useful for the for (;;) statement
               };
    }
    else
    {
        throw "unknown ast";
    }
}

function GlobalAccess(name)
{
    this.name = name;
}

function LocalAccess(up, over)
{
    this.up = up;
    this.over = over;
}

function ParamAccess(up, over)
{
    this.up = up;
    this.over = over;
}

function CalleeAccess(up)
{
    this.up = up;
}

function cte_access(cte, id_str)
{
    var up = 0;

    while (cte.parent !== null)
    {
        if (id_str in cte.locals)
        {
            return new LocalAccess(up, cte.locals[id_str]);
        }
        else if (id_str in cte.params)
        {
            return new ParamAccess(up, cte.params[id_str]);
        }
        else if (id_str === cte.callee)
        {
            return new CalleeAccess(up);
        }
        cte = cte.parent;
        up++;
    }

    var ga = cte.locals[id_str];

    if (ga === void 0)
    {
        ga = (cte.locals[id_str] = new GlobalAccess(id_str));
    }

    return ga;
}

function exec_fn_body(code, callee, rte, cont, this_, params, locals, parent, cte)
{
    rte.stack = {
                  cont: cont,
                  frame: rte.frame,
                  stack: rte.stack
                };

    rte.frame = new RTFrame(this_,
                            callee,
                            params,
                            locals,
                            parent,
                            cte);

    return code(rte,
                function (rte, result)
                {
                    var cont = rte.stack.cont;
                    rte.frame = rte.stack.frame;
                    rte.stack = rte.stack.stack;
                    return cont(rte, void 0);
                });
};

var get_new_semfn_cache = [];

function get_new_semfn(n)
{
    if (get_new_semfn_cache[n] === void 0)
    {
        var args = [];
        for (var i=0; i<n; i++) {
            args.push("a["+i+"]");
        }
        get_new_semfn_cache[n] =
            eval("(function (c, a) { return new c(" +
                 args.join(",") +
                 "); })");
    }

    return get_new_semfn_cache[n];
}

function comp_exprs(cte, asts)
{
    var code = comp_exprs_loop(cte, asts, 0);

    return function (rte, cont)
           {
               return code(rte, cont, []);
           };
}

function comp_exprs_loop(cte, asts, i)
{
    if (i < asts.length)
    {
        var code0 = comp_expr(cte, asts[i]);
        var code1 = comp_exprs_loop(cte, asts, i+1);

        return function (rte, cont, values)
               {
                   return code0(rte,
                                function (rte, value)
                                {
                                    values.push(value);
                                    return code1(rte, cont, values);
                                });
               };
    }
    else
        return function (rte, cont, values)
               {
                   return cont(rte, values);
               };
}

function comp_props(cte, props)
{
    var code = comp_props_loop(cte, props, 0);

    return function (rte, cont)
           {
               return code(rte, cont, {});
           };
}

function comp_props_loop(cte, props, i)
{
    if (i < props.length)
    {
        var prop = props[i].name.value;
        var code0 = comp_expr(cte, props[i].value);
        var code1 = comp_props_loop(cte, props, i+1);

        return function (rte, cont, obj)
               {
                   return code0(rte,
                                function (rte, value)
                                {
                                    obj[prop] = value;
                                    return code1(rte, cont, obj);
                                });
               };
    }
    else
        return function (rte, cont, obj)
               {
                   return cont(rte, obj);
               };
}

//-----------------------------------------------------------------------------

// Implementation of JavaScript operators.

function gen_op_dyn(ast, semfn, code0)
{
    return function (rte, cont)
           {
               return code0(rte,
                            function (rte, res0)
                            {
                                return semfn(rte,
                                             cont,
                                             ast,
                                             res0);
                            });
           };
}

function gen_op_dyn_dyn(ast, semfn, code0, code1)
{
    return function (rte, cont)
           {
               return code0(rte,
                            function (rte, res0)
                            {
                                return code1(rte,
                                             function (rte, res1)
                                             {
                                                 return semfn(rte,
                                                              cont,
                                                              ast,
                                                              res0,
                                                              res1);
                                             });
                            });
           };
}

function gen_op_dyn_cst(ast, semfn, code0, res1)
{
    return function (rte, cont)
           {
               return code0(rte,
                            function (rte, res0)
                            {
                                return semfn(rte,
                                             cont,
                                             ast,
                                             res0,
                                             res1);
                            });
           };
}

function gen_op_dyn_dyn_dyn(ast, semfn, code0, code1, code2)
{
    return function (rte, cont)
           {
               return code0(rte,
                            function (rte, res0)
                            {
                                return code1(rte,
                                             function (rte, res1)
                                             {
                                                 return code2(rte,
                                                              function (rte, res2)
                                                              {
                                                                  return semfn(rte,
                                                                               cont,
                                                                               ast,
                                                                               res0,
                                                                               res1,
                                                                               res2);
                                                              });
                                             });
                            });
           };
}

function gen_op_dyn_cst_dyn(ast, semfn, code0, res1, code2)
{
    return function (rte, cont)
           {
               return code0(rte,
                            function (rte, res0)
                            {
                                return code2(rte,
                                             function (rte, res2)
                                             {
                                                 return semfn(rte,
                                                              cont,
                                                              ast,
                                                              res0,
                                                              res1,
                                                              res2);
                                             });
                            });
           };
}

function gen_op_glo_cst(ast, semfn, res1)
{
    return function (rte, cont)
           {
               return semfn(rte,
                            cont,
                            ast,
                            rte.glo, //////////////////
                            res1);
           };
}

function gen_op_glo_cst_dyn(ast, semfn, res1, code2)
{
    return function (rte, cont)
           {
               return code2(rte,
                            function (rte, res2)
                            {
                                return semfn(rte,
                                             cont,
                                             ast,
                                             rte.glo, //////////////////
                                             res1,
                                             res2);
                            });
           };
}

function pure_op1_to_semfn(op)
{
  switch (op)
  {
  case "void x": return sem_void_x;
  case "typeof x": return sem_typeof_x;
  case "+ x": return sem_plus_x;
  case "- x": return sem_minus_x;
  case "~ x": return sem_bitnot_x;
  case "! x": return sem_excl_x;
  }
}

function assign_op1_to_semfn(op)
{
  switch (op)
  {
  case "delete x": return sem_delete_x;
  case "++ x": return sem_plusplus_x;
  case "-- x": return sem_minusminus_x;
  case "x ++": return sem_x_plusplus;
  case "x --": return sem_x_minusminus;
  }
}

function pure_op2_to_semfn(op)
{
  switch (op)
  {
  case "x [ y ]": return sem_prop_access;
  case "x * y": return sem_x_mult_y;
  case "x / y": return sem_x_div_y;
  case "x % y": return sem_x_mod_y;
  case "x + y": return sem_x_plus_y;
  case "x - y": return sem_x_minus_y;
  case "x << y": return sem_x_lshift_y;
  case "x >> y": return sem_x_rshift_y;
  case "x >>> y": return sem_x_urshift_y;
  case "x < y": return sem_x_lt_y;
  case "x > y": return sem_x_gt_y;
  case "x <= y": return sem_x_le_y;
  case "x >= y": return sem_x_ge_y;
  case "x instanceof y": return sem_x_instanceof_y;
  case "x in y": return sem_x_in_y;
  case "x == y": return sem_x_eqeq_y;
  case "x != y": return sem_x_ne_y;
  case "x === y": return sem_x_streq_y;
  case "x !== y": return sem_x_strneq_y;
  case "x & y": return sem_x_bitand_y;
  case "x ^ y": return sem_x_bitxor_y;
  case "x | y": return sem_x_bitor_y;
  case "x && y": return sem_x_and_y; /////////// fixme (short cirtuiting op)
  case "x || y": return sem_x_or_y; /////////// fixme (short cirtuiting op)
  case "x , y": return sem_x_comma_y;
  }
}

function assign_op2_to_semfn(op)
{
  switch (op)
  {
  case "var x = y": return sem_var_x_equal_y
  case "x = y": return sem_x_equal_y;
  case "x += y": return sem_x_plusequal_y;
  case "x -= y": return sem_x_minusequal_y;
  case "x *= y": return sem_x_multequal_y;
  case "x /= y": return sem_x_divequal_y;
  case "x <<= y": return sem_x_lshiftequal_y;
  case "x >>= y": return sem_x_rshiftequal_y;
  case "x >>>= y": return sem_x_urshiftequal_y;
  case "x &= y": return sem_x_bitandequal_y;
  case "x ^= y": return sem_x_bitxorequal_y;
  case "x |= y": return sem_x_bitorequal_y;
  case "x %= y": return sem_x_modequal_y;
  }
}

// Semantic functions.

function sem_delete_x(rte, cont, ast, obj, prop) // "delete x"
{
    var result = (delete obj[prop]);
    return step_end(rte, cont, ast, result);
}

function sem_plusplus_x(rte, cont, ast, obj, prop) // "++ x"
{
    var result = (++ obj[prop]);
    return step_end(rte, cont, ast, result);
}

function sem_minusminus_x(rte, cont, ast, obj, prop) // "-- x"
{
    var result = (-- obj[prop]);
    return step_end(rte, cont, ast, result);
}

function sem_x_plusplus(rte, cont, ast, obj, prop) // "x ++"
{
    var result = (obj[prop] ++);
    return step_end(rte, cont, ast, result);
}

function sem_x_minusminus(rte, cont, ast, obj, prop) // "x --"
{
    var result = (obj[prop] --);
    return step_end(rte, cont, ast, result);
}

function sem_void_x(rte, cont, ast, x) // "void x"
{
    var result = (void x);
    return step_end(rte, cont, ast, result);
}

function sem_typeof_x(rte, cont, ast, x) // "typeof x"
{
    var result = (typeof x);
    return step_end(rte, cont, ast, result);
}

function sem_plus_x(rte, cont, ast, x) // "+ x"
{
    var result = (+ x);
    return step_end(rte, cont, ast, result);
}

function sem_minus_x(rte, cont, ast, x) // "- x"
{
    var result = (- x);
    return step_end(rte, cont, ast, result);
}

function sem_bitnot_x(rte, cont, ast, x) // "~ x"
{
    var result = (~ x);
    return step_end(rte, cont, ast, result);
}

function sem_excl_x(rte, cont, ast, x) // "! x"
{
    var result = (! x);
    return step_end(rte, cont, ast, result);
}

function sem_prop_access(rte, cont, ast, x, y) // "x [ y ]"
{
    var result = (x [ y ]);
    return step_end(rte, cont, ast, result);
}

function sem_x_mult_y(rte, cont, ast, x, y) // "x * y"
{
    var result = (x * y);
    return step_end(rte, cont, ast, result);
}

function sem_x_div_y(rte, cont, ast, x, y) // "x / y"
{
    var result = (x / y);
    return step_end(rte, cont, ast, result);
}

function sem_x_mod_y(rte, cont, ast, x, y) // "x % y"
{
    var result = (x % y);
    return step_end(rte, cont, ast, result);
}

function sem_x_plus_y(rte, cont, ast, x, y) // "x + y"
{
    var result = (x + y);
    return step_end(rte, cont, ast, result);
}

function sem_x_minus_y(rte, cont, ast, x, y) // "x - y"
{
    var result = (x - y);
    return step_end(rte, cont, ast, result);
}

function sem_x_lshift_y(rte, cont, ast, x, y) // "x << y"
{
    var result = (x << y);
    return step_end(rte, cont, ast, result);
}

function sem_x_rshift_y(rte, cont, ast, x, y) // "x >> y"
{
    var result = (x >> y);
    return step_end(rte, cont, ast, result);
}

function sem_x_urshift_y(rte, cont, ast, x, y) // "x >>> y"
{
    var result = (x >>> y);
    return step_end(rte, cont, ast, result);
}

function sem_x_lt_y(rte, cont, ast, x, y) // "x < y"
{
    var result = (x < y);
    return step_end(rte, cont, ast, result);
}

function sem_x_gt_y(rte, cont, ast, x, y) // "x > y"
{
    var result = (x > y);
    return step_end(rte, cont, ast, result);
}

function sem_x_le_y(rte, cont, ast, x, y) // "x <= y"
{
    var result = (x <= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_ge_y(rte, cont, ast, x, y) // "x >= y"
{
    var result = (x >= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_instanceof_y(rte, cont, ast, x, y) // "x instanceof y"
{
    var result = (x instanceof y);
    return step_end(rte, cont, ast, result);
}

function sem_x_in_y(rte, cont, ast, x, y) // "x in y"
{
    var result = (x in y);
    return step_end(rte, cont, ast, result);
}

function sem_x_eqeq_y(rte, cont, ast, x, y) // "x == y"
{
    var result = (x == y);
    return step_end(rte, cont, ast, result);
}

function sem_x_ne_y(rte, cont, ast, x, y) // "x != y"
{
    var result = (x != y);
    return step_end(rte, cont, ast, result);
}

function sem_x_streq_y(rte, cont, ast, x, y) // "x === y"
{
    var result = (x === y);
    return step_end(rte, cont, ast, result);
}

function sem_x_strneq_y(rte, cont, ast, x, y) // "x !== y"
{
    var result = (x !== y);
    return step_end(rte, cont, ast, result);
}

function sem_x_bitand_y(rte, cont, ast, x, y) // "x & y"
{
    var result = (x & y);
    return step_end(rte, cont, ast, result);
}

function sem_x_bitxor_y(rte, cont, ast, x, y) // "x ^ y"
{
    var result = (x ^ y);
    return step_end(rte, cont, ast, result);
}

function sem_x_bitor_y(rte, cont, ast, x, y) // "x | y"
{
    var result = (x | y);
    return step_end(rte, cont, ast, result);
}

function sem_x_and_y(rte, cont, ast, x, y) // "x && y"
{
    var result = (x && y); /////////////////// fixme (short circuiting op)
    return step_end(rte, cont, ast, result);
}

function sem_x_or_y(rte, cont, ast, x, y) // "x || y"
{
    var result = (x || y); /////////////////// fixme (short circuiting op)
    return step_end(rte, cont, ast, result);
}

function sem_x_comma_y(rte, cont, ast, x, y) // "x , y"
{
    var result = (x , y);
    return step_end(rte, cont, ast, result);
}

function sem_var_x_equal_y(rte, cont, ast, obj, prop, y) // "var x = y"
{
    var result = (obj[prop] = y, void 0);
    return step_end(rte, cont, ast, result);
}

function sem_x_equal_y(rte, cont, ast, obj, prop, y) // "x = y"
{
    var result = (obj[prop] = y);
    return step_end(rte, cont, ast, result);
}

function sem_x_plusequal_y(rte, cont, ast, obj, prop, y) // "x += y"
{
    var result = (obj[prop] += y);
    return step_end(rte, cont, ast, result);
}

function sem_x_minusequal_y(rte, cont, ast, obj, prop, y) // "x -= y"
{
    var result = (obj[prop] -= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_multequal_y(rte, cont, ast, obj, prop, y) // "x *= y"
{
    var result = (obj[prop] *= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_divequal_y(rte, cont, ast, obj, prop, y) // "x /= y"
{
    var result = (obj[prop] /= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_lshiftequal_y(rte, cont, ast, obj, prop, y) // "x <<= y"
{
    var result = (obj[prop] <<= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_rshiftequal_y(rte, cont, ast, obj, prop, y) // "x >>= y"
{
    var result = (obj[prop] >>= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_urshiftequal_y(rte, cont, ast, obj, prop, y) // "x >>>= y"
{
    var result = (obj[prop] >>>= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_bitandequal_y(rte, cont, ast, obj, prop, y) // "x &= y"
{
    var result = (obj[prop] &= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_bitxorequal_y(rte, cont, ast, obj, prop, y) // "x ^= y"
{
    var result = (obj[prop] ^= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_bitorequal_y(rte, cont, ast, obj, prop, y) // "x |= y"
{
    var result = (obj[prop] |= y);
    return step_end(rte, cont, ast, result);
}

function sem_x_modequal_y(rte, cont, ast, obj, prop, y) // "x %= y"
{
    var result = (obj[prop] %= y);
    return step_end(rte, cont, ast, result);
}

//-----------------------------------------------------------------------------

function step_end(rte, cont, ast, result)
{
    rte.ast = ast;
    rte.result = result;

    var resume = function ()
    {
        return cont(rte, result);
    };

    if (++rte.step_count < rte.step_limit)
    {
        return resume;
    }
    else
    {
        rte.resume = resume;
        return null;
    }
}

function step_error(rte, cont, ast, error)
{
    rte.ast = ast;
    rte.error = error;
    rte.resume = null;

    return null;
}

//=============================================================================
