//=============================================================================

// File: "eval.js"

// Copyright (c) 2012-2015 by Marc Feeley, All Rights Reserved.

//=============================================================================

var jev = {};

jev.RTE = function (glo, stack, frame) {

    this.glo = glo;
    this.stack = stack;
    this.frame = frame;
    this.step_count = 0;
    this.step_limit = 0;
    this.resume = null;
    this.ast = null;
    this.result = null;
    this.error = null;

};

jev.newGlobalRTE = function (options) {

    var globalObject;

    if (options === void 0 ||
        options.globalObject === void 0) {
        globalObject = (function () { return this; })();
    } else {
        globalObject = options.globalObject;
    }

//    globalObject = {print: print, Object: Object};

    return new jev.RTE(globalObject,
                       null,
                       new jev.RTFrame(globalObject,
                                       null,
                                       [],
                                       [],
                                       null,
                                       null,
                                       null,
                                       null));

};

jev.RTE.prototype.runUntilFinished = function () {

    var rte = this;

    while (!rte.finished()) {
        rte.step();
    }

    if (rte.getError() !== null) {
        throw rte.ast.loc.toString() + ": " + rte.getError();
    }

    return rte.getResult();
};

jev.RTE.prototype.finished = function () {
    return this.resume === null;
};

jev.RTE.prototype.getResult = function () {
    return this.result;
};

jev.RTE.prototype.getError = function () {
    return this.error;
};

jev.RTE.prototype.step = function (nb_steps) {

    var rte = this;

    if (nb_steps === void 0)
        nb_steps = 999999999999;

    var resume = rte.resume;

    rte.step_limit = rte.step_count + nb_steps;

    // trampoline

    while (resume !== null) {
        resume = resume(rte);
    }
};

jev.eval = function (source, options) {

    var code = jev.compile(source, options);

    return jev.run(code, options);
};

jev.run = function (code, options) {

    var rte = jev.runSetup(code, options);

    return rte.runUntilFinished();
};

jev.runSetup = function (code, options) {

    var rte = jev.newGlobalRTE(options);

    rte.resume = function (rte) {
        return code(rte,
                    function (rte, result) {
                        rte.result = result;
                        rte.resume = null;
                        return null; // exit trampoline
                    });
    };

    return rte;
};

//TODO: move to jev
function SourceContainerInternalFile(source, tostr, start_line, start_column, stamp) {

    this.source = source;
    this.tostr = tostr;
    this.start_line = start_line;
    this.start_column = start_column;
    this.stamp = stamp;

}

//TODO: move to jev
SourceContainerInternalFile.prototype.toString = function () {
    return this.tostr;
};

//TODO: move to jev
function SourceContainer(source, tostr, start_line, start_column) {

    this.source = source;
    this.tostr = tostr;
    this.start_line = start_line;
    this.start_column = start_column;

}

//TODO: move to jev
SourceContainer.prototype.toString = function () {
    return this.tostr;
};

jev.compile = function (source, options) {

    var error = function (loc, kind, msg) {
        if (kind !== "warning") {
            throw loc.toString() + ": " + kind + " -- " + msg;
        }
    };

    var languageLevel = (typeof options === "object" &&
                         options.languageLevel !== void 0)
                        ? options.languageLevel
                        : "novice";

    var detectEmpty = (typeof options === "object" &&
                       options.detectEmpty !== void 0)
                      ? options.detectEmpty
                      : false;

    var filterAST = (typeof options === "object" &&
                     options.filterAST !== void 0)
                    ? options.filterAST
                    : function (ast, source) { return ast; };

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
                       autosemicolon: languageLevel === "novice",
                       non_integer: false,
                       division: false,
                       equality: false
                     },

                 languageLevel:
                   languageLevel
               };

    var port = new String_input_port(source, opts.container);
    var s = new Scanner(port, opts.error, opts.container.start_line, opts.container.start_column);
    var p = new Parser(s, opts.warnings);
    var ast = filterAST(p.parse(), source);

    if (detectEmpty) {
        if (ast instanceof Program) {
            var block = ast.block;
            if (block instanceof BlockStatement) {
                var statements = block.statements;
                if (statements.length === 0) {
                    return null; /* indicate empty program */
                }
            }
        }
    }

    var cte = jev.newGlobalCTE(opts);

    var options = {
        profile: false,
        namespace: false,
        exports: {},
        report: false,
        debug: false,
        warn: false,
        ast: false,
        nojs: false,
        simplify: true,
        languageLevel: languageLevel
    };

    return jev.compStatement(cte, ast_normalize(ast, options));
};

jev.newGlobalCTE = function (options) {

    return new jev.CTE(null,
                       {},
                       {},
                       null,
                       null,
                       null,
                       options);

};

jev.CTE = function (callee, params, locals, lex_env, ctrl_env, parent, options) {

    this.callee = callee;
    this.params = params;
    this.locals = locals;
    this.lex_env = lex_env;
    this.ctrl_env = ctrl_env;
    this.parent = parent;
    this.options = options;

};

jev.RTFrame = function (this_, callee, params, locals, lex_env, parent, ctrl_env, cte) {

    this.this_ = this_;
    this.callee = callee;
    this.params = params;
    this.locals = locals;
    this.lex_env = lex_env;
    this.parent = parent;
    this.ctrl_env = ctrl_env;
    this.cte = cte;

};

jev.compStatement = function (cte, ast) {

    if (ast instanceof Program) {

        var code = jev.compStatement(cte, ast.block);

        var declared_global_vars = [];

        for (var id_str in ast.vars) {
            var v = ast.vars[id_str];
            if (v.is_declared) {
                declared_global_vars.push(id_str);
            }
        }

        return function (rte, cont) {

            rte.frame.cte = cte;

            // Undefine all global variables that are declared in the
            // program.  This is useful to avoid restarting a program
            // in codePlay with the variables initialized to the value
            // they had at the end of the previous run, which is
            // confusing.

            for (var i=0; i<declared_global_vars.length; i++) {
                rte.glo[declared_global_vars[i]] = void 0;
            }

            return code(rte, cont);
        };

    } else if (ast instanceof FunctionDeclaration) {

        // TODO: this does not quite respect the semantics

        var id_str = ast.id.toString();
        var access = jev.cte_access(cte, id_str);
        var code_value = jev.compExpr(cte, ast.funct);

        return jev.gen_op2_assign(ast, jev.sem_var_x_equal_y, access, code_value);

    } else if (ast instanceof BlockStatement) {

        var code = jev.compStatements(cte, ast, ast.statements);

        return jev.gen_break_handler(cte, ast, code);

    } else if (ast instanceof VariableStatement) {

        throw "variable declarations are not implemented";

/*
        ast.decls.forEach(function (decl, i, self)
                          {
                              decl.initializer = ctx.walk_expr(decl.initializer);
                          });
*/

    } else if (ast instanceof ConstStatement) {

        throw "const declarations are not implemented";

    } else if (ast instanceof ExprStatement) {

        return jev.compExpr(cte, ast.expr);

    } else if (ast instanceof IfStatement) {

        var code_expr = jev.compExpr(cte, ast.expr);
        var code_stat0 = jev.compStatement(cte, ast.statements[0]);

        if (ast.statements.length === 1) {

            var code = function (rte, cont) {

                var subcont1 = function (rte, value1) {
                    if (value1) {
                        return code_stat0(rte, cont);
                    } else {
                        return cont(rte, void 0);
                    }
                };

                return code_expr(rte, subcont1);
            };

            return jev.gen_break_handler(cte, ast, code);
            
        } else {

            var code_stat1 = jev.compStatement(cte, ast.statements[1]);

            var code = function (rte, cont) {

                var subcont1 = function (rte, value1) {
                    if (value1) {
                        return code_stat0(rte, cont);
                    } else {
                        return code_stat1(rte, cont);
                    }
                };

                return code_expr(rte, subcont1);
            };

            return jev.gen_break_handler(cte, ast, code);

        }

    } else if (ast instanceof DoWhileStatement) {

        cte = jev.controlContext(cte, ast, "do-while");

        var code_stat = jev.compStatement(cte, ast.statement);
        var code_expr = jev.compExpr(cte, ast.expr);

        return function (rte, cont) {

            var subcont0 = function (rte, value0) {
                return code_stat(rte, subcont1);
            };

            var subcont1 = function (rte, value1) {
                return code_expr(rte, subcont2);
            };

            var subcont2 = function (rte, value2) {
                if (value2) {
                    return subcont0(rte, void 0);
                } else {
                    var frame = rte.frame;
                    var ctrl_env = frame.ctrl_env;
                    var break_cont = ctrl_env.break_cont;
                    frame.ctrl_env = ctrl_env.next;
                    return break_cont(rte, void 0);
                }
            };

            var frame = rte.frame;

            frame.ctrl_env = new jev.RTCtrlLabel(frame.ctrl_env,
                                                 cont,
                                                 subcont1);

            return subcont0(rte, void 0);
        };

    } else if (ast instanceof WhileStatement) {

        cte = jev.controlContext(cte, ast, "while");

        var code_expr = jev.compExpr(cte, ast.expr);
        var code_stat = jev.compStatement(cte, ast.statement);

        return function (rte, cont) {

            var subcont0 = function (rte, value0) {
                return code_expr(rte, subcont1);
            };

            var subcont1 = function (rte, value1) {
                if (value1) {
                    return code_stat(rte, subcont2);
                } else {
                    var frame = rte.frame;
                    var ctrl_env = frame.ctrl_env;
                    var break_cont = ctrl_env.break_cont;
                    frame.ctrl_env = ctrl_env.next;
                    return break_cont(rte, void 0);
                }
            };

            var subcont2 = function (rte, value2) {
                return subcont0(rte, void 0);
            };

            var frame = rte.frame;

            frame.ctrl_env = new jev.RTCtrlLabel(frame.ctrl_env,
                                                 cont,
                                                 subcont0);

            return subcont0(rte, void 0);
        };

    } else if (ast instanceof ForStatement) {

        cte = jev.controlContext(cte, ast, "for");

        var code_expr1 = jev.compExpr(cte, ast.expr1);
        var code_expr2 = jev.compExpr(cte, ast.expr2);
        var code_expr3 = jev.compExpr(cte, ast.expr3);
        var code_stat = jev.compStatement(cte, ast.statement);

        return function (rte, cont) {

            var subcont1 = function (rte, value1) {
                return code_expr2(rte, subcont2);
            };

            var subcont2 = function (rte, value2) {
                if (value2) {
                    return code_stat(rte, subcont3);
                } else {
                    var frame = rte.frame;
                    var ctrl_env = frame.ctrl_env;
                    var break_cont = ctrl_env.break_cont;
                    frame.ctrl_env = ctrl_env.next;
                    return break_cont(rte, void 0);
                }
            };

            var subcont3 = function (rte, value3) {
                return code_expr3(rte, subcont1);
            };

            var frame = rte.frame;

            frame.ctrl_env = new jev.RTCtrlLabel(frame.ctrl_env,
                                                 cont,
                                                 subcont3);

            return code_expr1(rte, subcont1);
        };

    } else if (ast instanceof ForVarStatement) {

        cte = jev.controlContext(cte, ast, "for-var");

        throw "for var statements are not implemented";

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

    } else if (ast instanceof ForInStatement) {

        cte = jev.controlContext(cte, ast, "for-in");

        var code_assign = jev.compOp2Assign(cte,
                                            ast.lhs_expr,
                                            "x = y",
                                            ast.lhs_expr,
                                            function () {
                                                return function (rte, cont) {
                                                    var frame = rte.frame;
                                                    var ctrl_env = frame.ctrl_env;
                                                    var prop = ctrl_env.props[ctrl_env.index-1];
                                                    return cont(rte, prop);
                                                };
                                            });

        var code_set_expr = jev.compExpr(cte, ast.set_expr);
        var code_stat = jev.compStatement(cte, ast.statement);

        return function (rte, cont) {

            var subcont1 = function (rte, value1) {
                var props = [];
                for (var p in value1) {
                    props.push(p);
                }
                var frame = rte.frame;
                var ctrl_env = frame.ctrl_env;
                ctrl_env.obj = value1;
                ctrl_env.props = props;
                ctrl_env.index = 0;
                return subcont2(rte, void 0);
            };

            var subcont2 = function (rte, value2) {
                var frame = rte.frame;
                var ctrl_env = frame.ctrl_env;
                if (ctrl_env.index < ctrl_env.props.length) {
                    var prop = ctrl_env.props[ctrl_env.index++];
                    if (prop in ctrl_env.obj) {
                        return code_assign(rte, subcont3);
                    } else {
                        return subcont2(rte, void 0);
                    }
                } else {
                    return subcont4(rte, void 0);
                }
            };

            var subcont3 = function (rte, value3) {
                return code_stat(rte, subcont2);
            };

            var subcont4 = function (rte, value4) {
                var frame = rte.frame;
                var ctrl_env = frame.ctrl_env;
                var break_cont = ctrl_env.break_cont;
                frame.ctrl_env = ctrl_env.next;
                return break_cont(rte, void 0);
            };

            var frame = rte.frame;

            frame.ctrl_env = new jev.RTCtrlLabel(frame.ctrl_env,
                                                 cont,
                                                 subcont2);

            return code_set_expr(rte, subcont1);
        };

    } else if (ast instanceof ForVarInStatement) {

        cte = jev.controlContext(cte, ast, "for-var-in");

        throw "for var in statements are not implemented";

        /*
        ast.initializer = ctx.walk_expr(ast.initializer);
        ast.set_expr = ctx.walk_expr(ast.set_expr);
        ast.statement = ctx.walk_statement(ast.statement);
        */

    } else if (ast instanceof ContinueStatement) {

        var depth_ast = jev.labelLookup(cte,
                                        (ast.label === null)
                                        ? "continue point"
                                        : ast.label.toString());

        if (depth_ast === null) {
            if (ast.label === null) {
                cte.options.error(ast.loc, "syntax error", "illegal continue statement");
            } else {
                cte.options.error(ast.label.loc, "syntax error", "undefined label '" + ast.label.toString() + "'");
            }
        } else {
            if (!(depth_ast.ast instanceof DoWhileStatement ||
                  depth_ast.ast instanceof WhileStatement ||
                  depth_ast.ast instanceof ForStatement ||
                  depth_ast.ast instanceof ForVarStatement ||
                  depth_ast.ast instanceof ForInStatement ||
                  depth_ast.ast instanceof ForVarInStatement)) {
                // Note: V8 gives an "undefined label" error
                cte.options.error(ast.loc, "syntax error", "illegal continue statement");
            }
        }

        var depth = depth_ast.depth;

        return function (rte, cont) {
            return jev.step_end(rte,
                                function (rte, value) {
                                    return jev.unwindContinue(rte, depth);
                                },
                                ast,
                                void 0);
        };

    } else if (ast instanceof BreakStatement) {

        var depth_ast = jev.labelLookup(cte,
                                        (ast.label === null)
                                        ? "break point"
                                        : ast.label.toString());

        if (depth_ast === null) {
            if (ast.label === null) {
                cte.options.error(ast.loc, "syntax error", "illegal break statement");
            } else {
                cte.options.error(ast.label.loc, "syntax error", "undefined label '" + ast.label.toString() + "'");
            }
        }

        var depth = depth_ast.depth;

        return function (rte, cont) {
            return jev.step_end(rte,
                                function (rte, value) {
                                    return jev.unwindBreak(rte, depth);
                                },
                                ast,
                                void 0);
        };

    } else if (ast instanceof ReturnStatement) {

        var depth_ast = jev.labelLookup(cte, "return point");

        if (depth_ast === null) {
            cte.options.error(ast.loc, "syntax error", "illegal return statement");
        }

        if (ast.expr === null) {

            return function (rte, cont) {
                return jev.unwindReturn(rte, void 0);
            };

        } else {

            var code_expr = jev.compExpr(cte, ast.expr);

            return function (rte, cont) {
                return code_expr(rte,
                                 function (rte, value) {
                                     return jev.unwindReturn(rte, value);
                                 });
            };

        };

    } else if (ast instanceof WithStatement) {

        throw "with statements are not implemented";

        //ast.expr
        //ast.statement

    } else if (ast instanceof SwitchStatement) {

        cte = jev.controlContext(cte, ast, "switch");

        var code_expr = jev.compExpr(cte, ast.expr);

        var code_clauses = [];

        var default_index = ast.clauses.length;

        ast.clauses.forEach(function (c, i, asts) {

                                var code_case_expr = null;
                                if (c.expr === null) {
                                    default_index = i;
                                } else {
                                    code_case_expr = jev.compExpr(cte, c.expr);
                                }
                                var code_case_stat;
                                if (c.statements.length === 0) {
                                    code_case_stat = jev.gen_noop();
                                } else {
                                    code_case_stat =
                                        jev.compStatements(cte,
                                                           c.statements[0],
                                                           c.statements);
                                }
                                code_clauses.push({
                                    expr: code_case_expr,
                                    stat: code_case_stat,
                                    stat_chain: null
                                });
                            });

        var code_end = function (rte, cont) {
            var frame = rte.frame;
            var ctrl_env = frame.ctrl_env;
            var break_cont = ctrl_env.break_cont;
            frame.ctrl_env = ctrl_env.next;
            return break_cont(rte, void 0);
        };

        code_clauses.push({
            expr: null,
            stat: null,
            stat_chain: code_end
        });

        for (var i=code_clauses.length-2; i>=0; i--) {

            var code_stat_chain = (function (code_stat, code_next) {
                return function (rte, cont) {
                    return code_stat(rte,
                                     function (rte, value) {
                                         return code_next(rte, cont);
                                     });
                };
            })(code_clauses[i].stat,
               code_clauses[i+1].stat_chain);

            code_clauses[i].stat_chain = code_stat_chain;
        }

        var code_expr_chain = (function (code_default) {
            return function (rte, value) {
                return code_default(rte, void 0);
            };
        })(code_clauses[default_index].stat_chain);

        for (var i=code_clauses.length-2; i>=0; i--) {

            if (code_clauses[i].expr !== null) {
                code_expr_chain = (function (code_expr, code_stat_chain, code_next) {
                    return function (rte, value) {
                        return code_expr(rte,
                                         function (rte, value2) {
                                             if (value2 === value) {
                                                 return code_stat_chain(rte, void 0);
                                             } else {
                                                 return code_next(rte, value);
                                             }
                                         });
                    };
                })(code_clauses[i].expr,
                   code_clauses[i].stat_chain,
                   code_expr_chain);
            }
        }

        return function (rte, cont) {

            var frame = rte.frame;

            frame.ctrl_env = new jev.RTCtrlLabel(frame.ctrl_env,
                                                 cont,
                                                 null);

            return code_expr(rte,
                             code_expr_chain);
        };

    } else if (ast instanceof LabelledStatement) {

        var ids = {};

        var ctrl_env = new jev.CTCtrlLabel(cte.ctrl_env, ids, ast);

        var new_cte = new jev.CTE(cte.callee,
                                  cte.params,
                                  cte.locals,
                                  cte.lex_env,
                                  ctrl_env,
                                  cte.parent,
                                  cte.options);

        var statement = ast;

        while (statement instanceof LabelledStatement) {
            var id_str = statement.label.toString();
            if (jev.labelLookup(new_cte, id_str) !== null) {
                cte.options.error(statement.label.loc, "syntax error", "duplicate label " + id_str);
            }
            ids[id_str] = true;
            statement = statement.statement;
        }

        ctrl_env.ast = statement;

        return jev.compStatement(new_cte, statement);

    } else if (ast instanceof ThrowStatement) {

        var code_expr = jev.compExpr(cte, ast.expr);

        return function (rte, cont) {
            return code_expr(rte,
                             function (rte, value) {
                                 return jev.unwindThrow(rte,
                                                        new jev.Exception(value));
                             });
        };

    } else if (ast instanceof TryStatement) {

        var ctrl_env_finally = new jev.CTCtrlFinally(cte.ctrl_env);
        var ctrl_env_catch = new jev.CTCtrlCatch(ctrl_env_finally);

        var new_cte_try = new jev.CTE(cte.callee,
                                      cte.params,
                                      cte.locals,
                                      cte.lex_env,
                                      (ast.catch_part === null)
                                      ? ctrl_env_finally
                                      : ctrl_env_catch,
                                      cte.parent,
                                      cte.options);

        var code_stat = jev.compStatement(new_cte_try, ast.statement);

        var code_catch = null;

        if (ast.catch_part !== null) {
            var id_str = ast.catch_part.id.toString();
            var new_cte_catch = new jev.CTE(cte.callee,
                                            cte.params,
                                            cte.locals,
                                            {name: id_str, next: cte.lex_env},
                                            ctrl_env_finally,
                                            cte.parent,
                                            cte.options);

            code_catch = jev.compStatement(new_cte_catch,
                                           ast.catch_part.statement);
        }

        var code_finally;

        if (ast.finally_part === null) {
            code_finally = jev.gen_noop();
        } else {
            code_finally = jev.compStatement(cte, ast.finally_part);
        }

        var code = function (rte, cont) {

            var frame = rte.frame;
            var ctrl_env = frame.ctrl_env;

            ctrl_env = new jev.RTCtrlFinally(ctrl_env,
                                             code_finally,
                                             cont);

            if (code_catch !== null) {
                ctrl_env = new jev.RTCtrlCatch(ctrl_env,
                                               code_catch,
                                               frame.lex_env);
            }

            frame.ctrl_env = ctrl_env;

            return code_stat(rte,
                             function (rte, value) {
                                 var frame = rte.frame;
                                 var ctrl_env = frame.ctrl_env;
                                 if (ctrl_env instanceof jev.RTCtrlCatch) {
                                     ctrl_env = ctrl_env.next;
                                 }
                                 var code_finally = ctrl_env.code_finally;
                                 var cont = ctrl_env.cont;
                                 frame.ctrl_env = ctrl_env.next;
                                 return code_finally(rte, cont);
                             });
        };

        return jev.gen_break_handler(cte, ast, code);

    } else if (ast instanceof DebuggerStatement) {

        return jev.gen_noop();

    } else {
        throw "unknown ast";
    }
};

jev.gen_noop = function () {
    return function (rte, cont) {
        return cont(rte, void 0); // do nothing
    };
};

jev.Exception = function (value) {

    this.value = value;

};

jev.unwindThrow = function (rte, exc) {

    var loop = function (rte) {

        for (;;) {

            var frame = rte.frame;
            var ctrl_env = frame.ctrl_env;

            while (ctrl_env !== null) {

                if (ctrl_env instanceof jev.RTCtrlCatch) {

                    var lex_env = ctrl_env.lex_env;
                    var code_catch = ctrl_env.code_catch;
                    frame.lex_env = {value: exc.value, next: lex_env};
                    frame.ctrl_env = ctrl_env.next;
                    return code_catch(rte,
                                      function (rte, value) {
                                          var frame = rte.frame;
                                          var ctrl_env = frame.ctrl_env;
                                          var code_finally = ctrl_env.code_finally;
                                          var cont = ctrl_env.cont;
                                          frame.lex_env = frame.lex_env.next;
                                          frame.ctrl_env = ctrl_env.next;
                                          return code_finally(rte, cont);
                                      });

                } else if (ctrl_env instanceof jev.RTCtrlFinally) {

                    var code_finally = ctrl_env.code_finally;
                    frame.ctrl_env = ctrl_env.next;
                    return code_finally(rte,
                                        function (rte, value) {
                                            return loop(rte);
                                        });

                }

                ctrl_env = ctrl_env.next;
            }

            if (rte.stack === null) {
                // nothing left to unwind and exception not caught
                throw exc.value; // throw the exception normally
            }

            // propagate exception to caller

            var cont = rte.stack.cont;
            rte.frame = rte.stack.frame;
            rte.stack = rte.stack.stack;
        }

    };

    return loop(rte);
};

jev.unwindContinueBreakReturn = function (rte, depth, cont) {

    var loop = function (rte) {

        var frame = rte.frame;
        var ctrl_env = frame.ctrl_env;

        while (depth !== 0 && ctrl_env !== null) {

            depth--;

            if (ctrl_env instanceof jev.RTCtrlCatch) {

                var lex_env = ctrl_env.lex_env;
                frame.lex_env = lex_env;

            } else if (ctrl_env instanceof jev.RTCtrlFinally) {

                var code_finally = ctrl_env.code_finally;
                frame.ctrl_env = ctrl_env.next;
                return code_finally(rte,
                                    function (rte, value) {
                                        return loop(rte);
                                    });

            }

            ctrl_env = ctrl_env.next;
        }

        frame.ctrl_env = ctrl_env;

        return cont(rte);
    };

    return loop(rte);
};

jev.unwindContinue = function (rte, depth) {

    return jev.unwindContinueBreakReturn(
        rte,
        depth,
        function (rte) {
            var frame = rte.frame;
            var ctrl_env = frame.ctrl_env;
            var continue_cont = ctrl_env.continue_cont;
            return continue_cont(rte, void 0);
        });
};

jev.unwindBreak = function (rte, depth) {

    return jev.unwindContinueBreakReturn(
        rte,
        depth,
        function (rte) {
            var frame = rte.frame;
            var ctrl_env = frame.ctrl_env;
            var break_cont = ctrl_env.break_cont;
            frame.ctrl_env = ctrl_env.next; // remove break frame
            return break_cont(rte, void 0);
        });
};

jev.unwindReturn = function (rte, value) {

    return jev.unwindContinueBreakReturn(
        rte,
        -1,
        function (rte) {
            var cont = rte.stack.cont;
            rte.frame = rte.stack.frame;
            rte.stack = rte.stack.stack;
            return cont(rte, value);
        });
};

jev.gen_break_handler = function (cte, ast, code) {

    var ctrl_env = cte.ctrl_env;

    if (ctrl_env === null ||
        !(ctrl_env instanceof jev.CTCtrlLabel) ||
        ctrl_env.ast !== ast) {

        return code;

    } else {

        return function (rte, cont) {

            var subcont1 = function (rte, value) {
                var frame = rte.frame;
                var ctrl_env = frame.ctrl_env;
                var break_cont = ctrl_env.break_cont;
                frame.ctrl_env = ctrl_env.next; // remove break frame
                return break_cont(rte, void 0);
            };

            var frame = rte.frame;

            frame.ctrl_env = new jev.RTCtrlLabel(frame.ctrl_env,
                                                 cont,
                                                 null);

            return code(rte, subcont1);
        };

    }
};

jev.CTCtrlLabel = function (next, ids, ast) {
    this.next = next;
    this.ids = ids;
    this.ast = ast;
};

jev.RTCtrlLabel = function (next, break_cont, continue_cont) {
    this.next = next;
    this.break_cont = break_cont;
    this.continue_cont = continue_cont;
};

jev.CTCtrlCatch = function (next) {
    this.next = next;
};

jev.RTCtrlCatch = function (next, code_catch, lex_env) {
    this.next = next;
    this.code_catch = code_catch;
    this.lex_env = lex_env;
};

jev.CTCtrlFinally = function (next) {
    this.next = next;
};

jev.RTCtrlFinally = function (next, code_finally, cont) {
    this.next = next;
    this.code_finally = code_finally;
    this.cont = cont;
};

jev.controlContext = function (cte, ast, kind) {

    var ctrl_env = cte.ctrl_env;

    if (ctrl_env === null || ctrl_env.ast !== ast) {

        ctrl_env = new jev.CTCtrlLabel(ctrl_env, {}, ast);

        cte = new jev.CTE(cte.callee,
                          cte.params,
                          cte.locals,
                          cte.lex_env,
                          ctrl_env,
                          cte.parent,
                          cte.options);

    }

    ctrl_env.ids["break point"] = true;

    if (kind !== "switch") {
        ctrl_env.ids["continue point"] = true;
    }

    return cte;
};

jev.labelLookup = function (cte, id_str) {

    var ctrl_env = cte.ctrl_env;
    var depth = 0;

    while (ctrl_env !== null) {
        if (ctrl_env instanceof jev.CTCtrlLabel &&
            ctrl_env.ids[id_str] !== void 0) {
            return {depth: depth, ast: ctrl_env.ast};
        }
        ctrl_env = ctrl_env.next;
        depth++;
    }

    return null;
};

jev.compStatements = function (cte, ast, asts) {
    if (asts.length === 0) {
        return function (rte, cont) {
                   return jev.step_end(rte,
                                       cont,
                                       ast,
                                       void 0);
               };
    } else {
        return jev.compStatementsLoop(cte, asts, 0);
    }
};

jev.compStatementsLoop = function (cte, asts, i) {
    if (i < asts.length-1) {
        var code0 = jev.compStatement(cte, asts[i]);
        var code1 = jev.compStatementsLoop(cte, asts, i+1);

        return function (rte, cont) {
                   return code0(rte,
                                function (rte, value) {
                                    return code1(rte, cont);
                                });
               };
    } else {
        return jev.compStatement(cte, asts[i]);
    }
};

jev.compExpr = function (cte, ast) {

    if (ast instanceof OpExpr) {

        if (is_assign_op1(ast.op)) {

            return jev.compOp1Assign(cte,
                                     ast,
                                     ast.op,
                                     ast.exprs[0]);

        } else if (is_assign_op2(ast.op)) {

            return jev.compOp2Assign(cte,
                                     ast,
                                     ast.op,
                                     ast.exprs[0],
                                     function () {
                                         return jev.compExpr(cte, ast.exprs[1]);
                                     });

        } else if (is_pure_op1(ast.op)) {

            var code_expr0 = jev.compExpr(cte, ast.exprs[0]);

            return jev.gen_op_dyn(ast,
                                  jev.pure_op1_to_semfn(cte, ast.op),
                                  code_expr0);

        } else if (ast.op === "x ? y : z") {

            var code_expr0 = jev.compExpr(cte, ast.exprs[0]);
            var code_expr1 = jev.compExpr(cte, ast.exprs[1]);
            var code_expr2 = jev.compExpr(cte, ast.exprs[2]);

            return function (rte, cont) {
                return code_expr0(rte,
                                  function (rte, res0) {
                                      if (res0) {
                                          return code_expr1(rte, cont);
                                      } else {
                                          return code_expr2(rte, cont);
                                      }
                                  });
            }

        } else {

            var code_expr0 = jev.compExpr(cte, ast.exprs[0]);
            var code_expr1;

            if (ast.op === "x . y") {
                var value = ast.exprs[1].value;
                code_expr1 = function (rte, cont) {
                    return cont(rte, value);
                };
            } else {
                code_expr1 = jev.compExpr(cte, ast.exprs[1]);
            }

            switch (ast.op) {

            case "x && y":
                return function (rte, cont) {
                    return code_expr0(rte,
                                      function (rte, res0) {
                                          if (res0) {
                                              return code_expr1(rte, cont);
                                          } else {
                                              return cont(rte, res0);
                                          }
                                      });
                };

            case "x || y":
                return function (rte, cont) {
                    return code_expr0(rte,
                                      function (rte, res0) {
                                          if (res0) {
                                              return cont(rte, res0);
                                          } else {
                                              return code_expr1(rte, cont);
                                          }
                                      });
                };

            case "x , y":
                return function (rte, cont) {
                    return code_expr0(rte,
                                      function (rte, res0) {
                                          return code_expr1(rte, cont);
                                      });
                };

            default:
                return jev.gen_op_dyn_dyn(ast,
                                          jev.pure_op2_to_semfn(cte, ast.op),
                                          code_expr0,
                                          code_expr1);

            }
        }

    } else if (ast instanceof NewExpr) {

        var code_cons = jev.compExpr(cte, ast.expr);
        var code_args = jev.compExprs(cte, ast.args);

        var op = function (rte, cont, ast, cons, args) {

            return jev.step_construct(rte,
                                      cont,
                                      ast,
                                      cons,
                                      args);
        };

        return jev.gen_op_dyn_dyn(ast, op, code_cons, code_args);

    } else if (ast instanceof CallExpr) {

        if (is_prop_access(ast.fn)) {

            // method call

            var code_obj = jev.compExpr(cte, ast.fn.exprs[0]);

            var code_prop;

            if (ast.fn.op === "x . y") {
                var value = ast.fn.exprs[1].value;
                code_prop = function (rte, cont) {
                    return cont(rte, value);
                };
            } else {
                code_prop = jev.compExpr(cte, ast.fn.exprs[1]);
            }

            var code_args = jev.compExprs(cte, ast.args);

            var op = function (rte, cont, ast, obj, prop) {
                if (obj === void 0) {
                    return jev.step_error(rte,
                                          cont,
                                          ast,
                                          "cannot read property of undefined");
                } else {

                    var fn = obj[prop];

                    var cont2 = function (rte, fn) {

                                    return code_args(rte,
                                                     function (rte, args) {
                                                         return jev.step_apply(rte,
                                                                               cont,
                                                                               ast,
                                                                               fn,
                                                                               obj,
                                                                               args);
                                                     });
                                };

                    return jev.step_end(rte,
                                        cont2,
                                        ast.fn,
                                        fn);
                }
            };

            return jev.gen_op_dyn_dyn(ast, op, code_obj, code_prop);

        } else {

            // non-method call

            var code_fn = jev.compExpr(cte, ast.fn);
            var code_args = jev.compExprs(cte, ast.args);

            var op = function (rte, cont, ast, fn, args) {
                return jev.step_apply(rte,
                                      cont,
                                      ast,
                                      fn,
                                      rte.glo,
                                      args);
            };

            return jev.gen_op_dyn_dyn(ast, op, code_fn, code_args);
        }

    } else if (ast instanceof FunctionExpr) {

        var nb_params = ast.params.length;
        var nb_locals = 0;
        var params = {};
        var locals = {};
        var i = 0;
        var arguments_index = -1;

        for (var v in ast.vars) {
            var id_str = v.toString();
            if (i < nb_params) {
                params[id_str] = i;
            } else {
                var index = i-nb_params;
                if (id_str === "arguments") {
                    arguments_index = index;
                }
                locals[id_str] = index;
                nb_locals++;
            }
            i++;
        }

        var fn_cte = new jev.CTE((ast.id !== null) ? ast.id.toString() : null,
                                 params,
                                 locals,
                                 cte.lex_env,
                                 new jev.CTCtrlLabel(null, {"return point": true}, ast),
                                 cte,
                                 cte.options);

        var code_body = jev.compStatements(fn_cte, ast, ast.body);

        var loc = ast.loc;
        var start_char_offs = position_to_char_offset(loc, loc.start_pos);
        var end_char_offs = position_to_char_offset(loc, loc.end_pos);

        return function (rte, cont) {

            var parent = rte.frame;

            var closure = function () {

                var this_ = this;
                var args = Array.prototype.slice.call(arguments);

                var code = function (rte, cont) {
                    return closure._apply_(rte, cont, this_, args);
                };

                return jev.run(code, {globalObject: rte.glo});
            };

            closure.toString = function () {
                //var source = ast.loc.container.source;
                //return source.slice(start_char_offs, end_char_offs);
                return "function (" + ast.params.join(",") + ") { ... }";
            };

            closure._apply_ = function (rte, cont, this_, params) {
                var locals = new Array(nb_locals);
                if (arguments_index >= 0) {
                    locals[arguments_index] = params;
                }
                return jev.exec_fn_body(code_body,
                                        closure,
                                        rte,
                                        cont,
                                        this_,
                                        params,
                                        locals,
                                        parent,
                                        fn_cte);
            };

            return jev.step_end(rte,
                                cont,
                                ast,
                                closure);
        };

    } else if (ast instanceof Literal) {

        return function (rte, cont) {
            return jev.step_end(rte,
                                cont,
                                ast,
                                ast.value);
        };

    } else if (ast instanceof ArrayLiteral) {

        var code_exprs = jev.compExprs(cte, ast.exprs);

        return function (rte, cont) {
            return code_exprs(rte,
                              function (rte, values) {
                                  return jev.step_end(rte,
                                                      cont,
                                                      ast,
                                                      values);
                              });
        };

    } else if (ast instanceof RegExpLiteral) {

        var pattern = ast.pattern;
        var flags = ast.flags;

        return function (rte, cont) {
            return jev.step_end(rte,
                                cont,
                                ast,
                                new RegExp(pattern, flags));
        };

    } else if (ast instanceof ObjectLiteral) {

        return jev.compProps(cte, ast, ast.properties);

    } else if (ast instanceof Ref) {

        var id_str = ast.id.toString()
        var access = jev.cte_access(cte, id_str);
        var error_msg = (cte.options.languageLevel === "novice")
                        ? "cannot read the undefined variable " + id_str
                        : false;

        if (access instanceof jev.LexicalAccess) {

            var index = access.index;

            return function (rte, cont) {
                var e = rte.frame.lex_env;
                for (var i=index; i>0; i--) e = e.next;
                var result = e["value"];
                if (error_msg !== false && result === void 0) {
                    return jev.step_error(rte,
                                          cont,
                                          ast,
                                          error_msg);
                } else {
                    return jev.step_end(rte,
                                        cont,
                                        ast,
                                        result);
                }
            };

        } else if (access instanceof jev.LocalAccess) {

            var up = access.up;
            var over = access.over;

            return function (rte, cont) {
                var f = rte.frame;
                for (var i=up; i>0; i--) f = f.parent;
                var result = f.locals[over];
                if (error_msg !== false && result === void 0) {
                    return jev.step_error(rte,
                                          cont,
                                          ast,
                                          error_msg);
                } else {
                    return jev.step_end(rte,
                                        cont,
                                        ast,
                                        result);
                }
            };

        } else if (access instanceof jev.ParamAccess) {

            var up = access.up;
            var over = access.over;

            return function (rte, cont) {
                var f = rte.frame;
                for (var i=up; i>0; i--) f = f.parent;
                var result = f.params[over];
                if (error_msg !== false && result === void 0) {
                    return jev.step_error(rte,
                                          cont,
                                          ast,
                                          error_msg);
                } else {
                    return jev.step_end(rte,
                                        cont,
                                        ast,
                                        result);
                }
            };

        } else if (access instanceof jev.CalleeAccess) {

            var up = access.up;

            return function (rte, cont) {
                var f = rte.frame;
                for (var i=up; i>0; i--) f = f.parent;
                var result = f.callee;
                return jev.step_end(rte,
                                    cont,
                                    ast,
                                    result);
            };

        } else if (access instanceof jev.GlobalAccess) {

            var name = access.name;

            return function (rte, cont) {
                var result = void 0;
                if (Object.prototype.hasOwnProperty.call(rte.glo, name)) {
                    result = rte.glo[name];
                    if (error_msg !== false && result === void 0) {
                        return jev.step_error(rte,
                                              cont,
                                              ast,
                                              "cannot read the undefined global variable " + name);
                    }
                } else {
                    if (error_msg !== false) {
                        return jev.step_error(rte,
                                              cont,
                                              ast,
                                              "cannot read the undeclared global variable " + name);
                    }
                }
                return jev.step_end(rte,
                                    cont,
                                    ast,
                                    result);
            };

        } else {
            throw "unknown access";
        }

    } else if (ast instanceof This) {

        return function (rte, cont) {
            return jev.step_end(rte,
                                cont,
                                ast,
                                rte.frame.this_);
        };

    } else if (ast === null) {

        return function (rte, cont) {
            return cont(rte, true); // useful for the for (;;) statement
        };

    } else {
        throw "unknown ast";
    }
};

jev.LexicalAccess = function (index) {
    this.index = index;
};

jev.LocalAccess = function (up, over) {
    this.up = up;
    this.over = over;
};

jev.ParamAccess = function (up, over) {
    this.up = up;
    this.over = over;
};

jev.CalleeAccess = function (up) {
    this.up = up;
};

jev.GlobalAccess = function (name) {
    this.name = name;
};

jev.cte_access = function (cte, id_str) {

    var index = 0;
    var env = cte.lex_env;

    while (env !== null) {
        if (env.name === id_str) {
            return new jev.LexicalAccess(index);
        }
        env = env.next;
        index++;
    };

    var up = 0;

    while (cte.parent !== null) {

        if (Object.prototype.hasOwnProperty.call(cte.locals, id_str)) {
            return new jev.LocalAccess(up, cte.locals[id_str]);
        } else if (Object.prototype.hasOwnProperty.call(cte.params, id_str)) {
            return new jev.ParamAccess(up, cte.params[id_str]);
        } else if (id_str === cte.callee) {
            return new jev.CalleeAccess(up);
        }
        cte = cte.parent;
        up++;
    }

    if (Object.prototype.hasOwnProperty.call(cte.locals, id_str)) {
        return cte.locals[id_str];
    } else {
        return (cte.locals[id_str] = new jev.GlobalAccess(id_str));
    }
};

jev.compOp1Assign = function (cte, ast, op1, lhs) {

    var op = jev.assign_op1_to_semfn(cte, op1);

    if (is_prop_access(lhs)) {

        var code_obj = jev.compExpr(cte, lhs.exprs[0]);

        var code_prop;

        if (lhs.op === "x . y") {
            var value = lhs.exprs[1].value;
            code_prop = function (rte, cont) {
                return cont(rte, value);
            };
        } else {
            code_prop = jev.compExpr(cte, lhs.exprs[1]);
        }

        return jev.gen_op_dyn_dyn(ast,
                                  op,
                                  code_obj,
                                  code_prop);

    } else {

        var id_str = lhs.id.toString();
        var access = jev.cte_access(cte, id_str);

        return jev.gen_op1_assign(ast, op, access);

    }
};

jev.compOp2Assign = function (cte, ast, op2, lhs, get_code_value) {

    var op = jev.assign_op2_to_semfn(cte, op2);

    if (is_prop_access(lhs)) {

        var code_obj = jev.compExpr(cte, lhs.exprs[0]);

        var code_prop;

        if (lhs.op === "x . y") {
            var value = lhs.exprs[1].value;
            code_prop = function (rte, cont) {
                return cont(rte, value);
            };
        } else {
            code_prop = jev.compExpr(cte, lhs.exprs[1]);
        }

        var code_value = get_code_value();

        return jev.gen_op_dyn_dyn_dyn(ast,
                                      op,
                                      code_obj,
                                      code_prop,
                                      code_value);

    } else {

        var id_str = lhs.id.toString();
        var access = jev.cte_access(cte, id_str);
        var code_value = get_code_value();

        return jev.gen_op2_assign(ast, op, access, code_value);

    }
};

jev.gen_op1_assign = function (ast, op, access) {

    if (access instanceof jev.LexicalAccess) {

        var index = access.index;
        var code_obj = function (rte, cont) {
            var e = rte.frame.lex_env;
            for (var i=index; i>0; i--) e = e.next;
            return cont(rte, e);
        };

        return jev.gen_op_dyn_cst(ast,
                                  op,
                                  code_obj,
                                  "value");

    } else if (access instanceof jev.LocalAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.locals);
        };

        return jev.gen_op_dyn_cst(ast,
                                  op,
                                  code_obj,
                                  over);

    } else if (access instanceof jev.ParamAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.params);
        };

        return jev.gen_op_dyn_cst(ast,
                                  op,
                                  code_obj,
                                  over);

    } else if (access instanceof jev.CalleeAccess) {

        var code_obj = function (rte, cont) {
            return cont(rte, [void 0]); // ignore assignment
        };

        return jev.gen_op_dyn_cst(ast,
                                  op,
                                  code_obj,
                                  0);

    } else if (access instanceof jev.GlobalAccess) {

        var name = access.name;

        return jev.gen_op_glo_cst(ast,
                                  op,
                                  name);

    } else {
        throw "unknown access";
    }
};

jev.gen_op2_assign = function (ast, op, access, code_value) {

    if (access instanceof jev.LexicalAccess) {

        var index = access.index;
        var code_obj = function (rte, cont) {
            var e = rte.frame.lex_env;
            for (var i=index; i>0; i--) e = e.next;
            return cont(rte, e);
        };

        return jev.gen_op_dyn_cst_dyn(ast,
                                      op,
                                      code_obj,
                                      "value",
                                      code_value);

    } else if (access instanceof jev.LocalAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.locals);
        };

        return jev.gen_op_dyn_cst_dyn(ast,
                                      op,
                                      code_obj,
                                      over,
                                      code_value);

    } else if (access instanceof jev.ParamAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.params);
        };

        return jev.gen_op_dyn_cst_dyn(ast,
                                      op,
                                      code_obj,
                                      over,
                                      code_value);

    } else if (access instanceof jev.CalleeAccess) {

        var code_obj = function (rte, cont) {
            return cont(rte, [void 0]); // ignore assignment
        };

        return jev.gen_op_dyn_cst_dyn(ast,
                                      op,
                                      code_obj,
                                      0,
                                      code_value);

    } else if (access instanceof jev.GlobalAccess) {

        var name = access.name;

        return jev.gen_op_glo_cst_dyn(ast,
                                      op,
                                      name,
                                      code_value);

    } else {
        throw "unknown access";
    }
};

function exec_fn_body(code, callee, rte, cont, this_, params, locals, parent, cte) { //TODO: remove... this is deprecated
    return jev.exec_fn_body(code, callee, rte, cont, this_, params, locals, parent, cte);
}

jev.exec_fn_body = function (code, callee, rte, cont, this_, params, locals, parent, cte) {

    rte.stack = {
                  cont: cont,
                  frame: rte.frame,
                  stack: rte.stack
                };

    rte.frame = new jev.RTFrame(this_,
                                callee,
                                params,
                                locals,
                                (parent === null) ? null : parent.lex_env,
                                parent,
                                null,
                                cte);

    return code(rte,
                function (rte, result) {
                    var cont = rte.stack.cont;
                    rte.frame = rte.stack.frame;
                    rte.stack = rte.stack.stack;
                    return cont(rte, void 0);
                });
};

jev.get_new_semfn_cache = [];

jev.get_new_semfn = function (n) {

    if (jev.get_new_semfn_cache[n] === void 0) {

        var args = [];
        for (var i=0; i<n; i++) {
            args.push("a["+i+"]");
        }

        jev.get_new_semfn_cache[n] =
            eval("(function (c, a) { return new c(" +
                 args.join(",") +
                 "); })");
    }

    return jev.get_new_semfn_cache[n];
};

jev.compExprs = function (cte, asts) {

    var code = jev.compExprsLoop(cte, asts, 0);

    return function (rte, cont) {
        return code(rte, cont, []);
    };
};

jev.compExprsLoop = function (cte, asts, i) {

    if (i < asts.length) {

        var code0 = jev.compExpr(cte, asts[i]);
        var code1 = jev.compExprsLoop(cte, asts, i+1);

        return function (rte, cont, values) {

                   return code0(rte,
                                function (rte, value) {
                                    values.push(value);
                                    return code1(rte, cont, values);
                                });
               };
    } else {

        return function (rte, cont, values) {
            return cont(rte, values);
        };

    }
};

jev.compProps = function (cte, ast, props) {

    var code = jev.compPropsLoop(cte, ast, props, 0);

    return function (rte, cont) {
        return code(rte, cont, {});
    };
};

jev.compPropsLoop = function (cte, ast, props, i) {

    if (i < props.length) {

        var prop = props[i].name.value;
        var code0 = jev.compExpr(cte, props[i].value);
        var code1 = jev.compPropsLoop(cte, ast, props, i+1);

        return function (rte, cont, obj) {

                   return code0(rte,
                                function (rte, value) {
                                    obj[prop] = value;
                                    return code1(rte, cont, obj);
                                });

               };

    } else {

        return function (rte, cont, obj) {
            return jev.step_end(rte,
                                cont,
                                ast,
                                obj);
        };

    }
};

//-----------------------------------------------------------------------------

// Implementation of JavaScript operators.

jev.gen_op_dyn = function (ast, semfn, code0) {

    return function (rte, cont) {
               return code0(rte,
                            function (rte, res0) {
                                return semfn(rte,
                                             cont,
                                             ast,
                                             res0);
                            });
           };
};

jev.gen_op_dyn_dyn = function (ast, semfn, code0, code1) {

    return function (rte, cont) {
               return code0(rte,
                            function (rte, res0) {
                                return code1(rte,
                                             function (rte, res1) {
                                                 return semfn(rte,
                                                              cont,
                                                              ast,
                                                              res0,
                                                              res1);
                                             });
                            });
           };
};

jev.gen_op_dyn_cst = function (ast, semfn, code0, res1) {

    return function (rte, cont) {
               return code0(rte,
                            function (rte, res0) {
                                return semfn(rte,
                                             cont,
                                             ast,
                                             res0,
                                             res1);
                            });
           };
};

jev.gen_op_dyn_dyn_dyn = function (ast, semfn, code0, code1, code2) {

    return function (rte, cont) {
               return code0(rte,
                            function (rte, res0) {
                                return code1(rte,
                                             function (rte, res1) {
                                                 return code2(rte,
                                                              function (rte, res2) {
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
};

jev.gen_op_dyn_cst_dyn = function (ast, semfn, code0, res1, code2) {

    return function (rte, cont) {
               return code0(rte,
                            function (rte, res0) {
                                return code2(rte,
                                             function (rte, res2) {
                                                 return semfn(rte,
                                                              cont,
                                                              ast,
                                                              res0,
                                                              res1,
                                                              res2);
                                             });
                            });
           };
};

jev.gen_op_glo_cst = function (ast, semfn, res1) {

    return function (rte, cont) {
               return semfn(rte,
                            cont,
                            ast,
                            rte.glo,
                            res1);
           };
};

jev.gen_op_glo_cst_dyn = function (ast, semfn, res1, code2) {

    return function (rte, cont) {
               return code2(rte,
                            function (rte, res2) {
                                return semfn(rte,
                                             cont,
                                             ast,
                                             rte.glo,
                                             res1,
                                             res2);
                            });
           };
};

jev.pure_op1_to_semfn = function (cte, op) {

  switch (op) {
  case "void x": return jev.sem_void_x;
  case "typeof x": return jev.sem_typeof_x;
  case "+ x": return jev.sem_plus_x;
  case "- x": return jev.sem_minus_x;
  case "~ x": return jev.sem_bitnot_x;
  case "! x": return jev.sem_excl_x;
  }
};

jev.assign_op1_to_semfn = function (cte, op) {

    if (cte.options.languageLevel === "novice") {

        switch (op) {
        case "delete x": return jev.sem_delete_x;
        case "++ x": return jev.sem_plusplus_x_with_setter_check;
        case "-- x": return jev.sem_minusminus_x_with_setter_check;
        case "x ++": return jev.sem_x_plusplus_with_setter_check;
        case "x --": return jev.sem_x_minusminus_with_setter_check;
        }

    } else {

        switch (op) {
        case "delete x": return jev.sem_delete_x;
        case "++ x": return jev.sem_plusplus_x;
        case "-- x": return jev.sem_minusminus_x;
        case "x ++": return jev.sem_x_plusplus;
        case "x --": return jev.sem_x_minusminus;
        }

    }
};

jev.pure_op2_to_semfn = function (cte, op) {

  switch (op) {
  case "x [ y ]":
      return (cte.options.languageLevel === "novice")
             ? jev.sem_prop_index_with_getter_check
             : jev.sem_prop_index;
  case "x . y": return jev.sem_prop_access;
  case "x * y": return jev.sem_x_mult_y;
  case "x / y": return jev.sem_x_div_y;
  case "x % y": return jev.sem_x_mod_y;
  case "x + y": return jev.sem_x_plus_y;
  case "x - y": return jev.sem_x_minus_y;
  case "x << y": return jev.sem_x_lshift_y;
  case "x >> y": return jev.sem_x_rshift_y;
  case "x >>> y": return jev.sem_x_urshift_y;
  case "x < y": return jev.sem_x_lt_y;
  case "x > y": return jev.sem_x_gt_y;
  case "x <= y": return jev.sem_x_le_y;
  case "x >= y": return jev.sem_x_ge_y;
  case "x instanceof y": return jev.sem_x_instanceof_y;
  case "x in y": return jev.sem_x_in_y;
  case "x == y": return jev.sem_x_eqeq_y;
  case "x != y": return jev.sem_x_ne_y;
  case "x === y": return jev.sem_x_streq_y;
  case "x !== y": return jev.sem_x_strneq_y;
  case "x & y": return jev.sem_x_bitand_y;
  case "x ^ y": return jev.sem_x_bitxor_y;
  case "x | y": return jev.sem_x_bitor_y;
  }
};

jev.assign_op2_to_semfn = function (cte, op) {

    if (cte.options.languageLevel === "novice") {

        switch (op) {
        case "var x = y": return jev.sem_var_x_equal_y;
        case "x = y": return jev.sem_x_equal_y_with_setter_check;
        case "x += y": return jev.sem_x_plusequal_y_with_setter_check;
        case "x -= y": return jev.sem_x_minusequal_y_with_setter_check;
        case "x *= y": return jev.sem_x_multequal_y_with_setter_check;
        case "x /= y": return jev.sem_x_divequal_y_with_setter_check;
        case "x <<= y": return jev.sem_x_lshiftequal_y_with_setter_check;
        case "x >>= y": return jev.sem_x_rshiftequal_y_with_setter_check;
        case "x >>>= y": return jev.sem_x_urshiftequal_y_with_setter_check;
        case "x &= y": return jev.sem_x_bitandequal_y_with_setter_check;
        case "x ^= y": return jev.sem_x_bitxorequal_y_with_setter_check;
        case "x |= y": return jev.sem_x_bitorequal_y_with_setter_check;
        case "x %= y": return jev.sem_x_modequal_y_with_setter_check;
        }

    } else {

        switch (op) {
        case "var x = y": return jev.sem_var_x_equal_y;
        case "x = y": return jev.sem_x_equal_y;
        case "x += y": return jev.sem_x_plusequal_y;
        case "x -= y": return jev.sem_x_minusequal_y;
        case "x *= y": return jev.sem_x_multequal_y;
        case "x /= y": return jev.sem_x_divequal_y;
        case "x <<= y": return jev.sem_x_lshiftequal_y;
        case "x >>= y": return jev.sem_x_rshiftequal_y;
        case "x >>>= y": return jev.sem_x_urshiftequal_y;
        case "x &= y": return jev.sem_x_bitandequal_y;
        case "x ^= y": return jev.sem_x_bitxorequal_y;
        case "x |= y": return jev.sem_x_bitorequal_y;
        case "x %= y": return jev.sem_x_modequal_y;
        }

    }
};

// Semantic functions.

jev.sem_delete_x = function (rte, cont, ast, obj, prop) { // "delete x"
    var result = (delete obj[prop]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_plusplus_x = function (rte, cont, ast, obj, prop) { // "++ x"
    var result = (++ obj[prop]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_plusplus_x_with_setter_check = function (rte, cont, ast, obj, prop) { // "++ x"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (++ obj[prop]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_minusminus_x = function (rte, cont, ast, obj, prop) { // "-- x"
    var result = (-- obj[prop]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_minusminus_x_with_setter_check = function (rte, cont, ast, obj, prop) { // "-- x"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (-- obj[prop]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_plusplus = function (rte, cont, ast, obj, prop) { // "x ++"
    var result = (obj[prop] ++);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_plusplus_with_setter_check = function (rte, cont, ast, obj, prop) { // "x ++"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] ++);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_minusminus = function (rte, cont, ast, obj, prop) { // "x --"
    var result = (obj[prop] --);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_minusminus_with_setter_check = function (rte, cont, ast, obj, prop) { // "x --"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] --);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_void_x = function (rte, cont, ast, x) { // "void x"
    var result = (void x);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_typeof_x = function (rte, cont, ast, x) { // "typeof x"
    var result = (typeof x);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_plus_x = function (rte, cont, ast, x) { // "+ x"
    var result = (+ x);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_minus_x = function (rte, cont, ast, x) { // "- x"
    var result = (- x);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_bitnot_x = function (rte, cont, ast, x) { // "~ x"
    var result = (~ x);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_excl_x = function (rte, cont, ast, x) { // "! x"
    var result = (! x);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_prop_index = function (rte, cont, ast, x, y) { // "x [ y ]"
    var result = (x [ y ]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_prop_index_with_getter_check = function (rte, cont, ast, x, y) { // "x [ y ]"
    var status = jev.sem_getter_check(rte, cont, ast, x, y);
    if (status !== true) return status;
    var result = (x [ y ]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_prop_access = function (rte, cont, ast, x, y) { // "x . y"
    var result = (x [ y ]);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_mult_y = function (rte, cont, ast, x, y) { // "x * y"
    var result = (x * y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_div_y = function (rte, cont, ast, x, y) { // "x / y"
    var result = (x / y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_mod_y = function (rte, cont, ast, x, y) { // "x % y"
    var result = (x % y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_plus_y = function (rte, cont, ast, x, y) { // "x + y"
    var result = (x + y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_minus_y = function (rte, cont, ast, x, y) { // "x - y"
    var result = (x - y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_lshift_y = function (rte, cont, ast, x, y) { // "x << y"
    var result = (x << y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_rshift_y = function (rte, cont, ast, x, y) { // "x >> y"
    var result = (x >> y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_urshift_y = function (rte, cont, ast, x, y) { // "x >>> y"
    var result = (x >>> y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_lt_y = function (rte, cont, ast, x, y) { // "x < y"
    var result = (x < y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_gt_y = function (rte, cont, ast, x, y) { // "x > y"
    var result = (x > y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_le_y = function (rte, cont, ast, x, y) { // "x <= y"
    var result = (x <= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_ge_y = function (rte, cont, ast, x, y) { // "x >= y"
    var result = (x >= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_instanceof_y = function (rte, cont, ast, x, y) { // "x instanceof y"
    var result = (x instanceof y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_in_y = function (rte, cont, ast, x, y) { // "x in y"
    var result = (x in y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_eqeq_y = function (rte, cont, ast, x, y) { // "x == y"
    var result = (x == y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_ne_y = function (rte, cont, ast, x, y) { // "x != y"
    var result = (x != y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_streq_y = function (rte, cont, ast, x, y) { // "x === y"
    var result = (x === y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_strneq_y = function (rte, cont, ast, x, y) { // "x !== y"
    var result = (x !== y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitand_y = function (rte, cont, ast, x, y) { // "x & y"
    var result = (x & y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitxor_y = function (rte, cont, ast, x, y) { // "x ^ y"
    var result = (x ^ y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitor_y = function (rte, cont, ast, x, y) { // "x | y"
    var result = (x | y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_var_x_equal_y = function (rte, cont, ast, obj, prop, y) { // "var x = y"
    var result = (obj[prop] = y, void 0);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_equal_y = function (rte, cont, ast, obj, prop, y) { // "x = y"
    var result = (obj[prop] = y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_equal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x = y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] = y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_plusequal_y = function (rte, cont, ast, obj, prop, y) { // "x += y"
    var result = (obj[prop] += y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_plusequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x += y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] += y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_minusequal_y = function (rte, cont, ast, obj, prop, y) { // "x -= y"
    var result = (obj[prop] -= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_minusequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x -= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] -= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_multequal_y = function (rte, cont, ast, obj, prop, y) { // "x *= y"
    var result = (obj[prop] *= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_multequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x *= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] *= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_divequal_y = function (rte, cont, ast, obj, prop, y) { // "x /= y"
    var result = (obj[prop] /= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_divequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x /= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] /= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_lshiftequal_y = function (rte, cont, ast, obj, prop, y) { // "x <<= y"
    var result = (obj[prop] <<= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_lshiftequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x <<= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] <<= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_rshiftequal_y = function (rte, cont, ast, obj, prop, y) { // "x >>= y"
    var result = (obj[prop] >>= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_rshiftequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x >>= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] >>= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_urshiftequal_y = function (rte, cont, ast, obj, prop, y) { // "x >>>= y"
    var result = (obj[prop] >>>= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_urshiftequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x >>>= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] >>>= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitandequal_y = function (rte, cont, ast, obj, prop, y) { // "x &= y"
    var result = (obj[prop] &= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitandequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x &= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] &= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitxorequal_y = function (rte, cont, ast, obj, prop, y) { // "x ^= y"
    var result = (obj[prop] ^= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitxorequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x ^= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] ^= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitorequal_y = function (rte, cont, ast, obj, prop, y) { // "x |= y"
    var result = (obj[prop] |= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_bitorequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x |= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] |= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_modequal_y = function (rte, cont, ast, obj, prop, y) { // "x %= y"
    var result = (obj[prop] %= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_x_modequal_y_with_setter_check = function (rte, cont, ast, obj, prop, y) { // "x %= y"
    var status = jev.sem_setter_check(rte, cont, ast, obj, prop);
    if (status !== true) return status;
    var result = (obj[prop] %= y);
    return jev.step_end(rte, cont, ast, result);
};

jev.sem_setter_check = function (rte, cont, ast, x, y) {
    if (x === rte.glo) {
        if (!Object.prototype.hasOwnProperty.call(x, y)) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  "cannot set the undeclared global variable "+y);
        }
    } else {
        return jev.sem_bounds_check(rte, cont, ast, x, y);
    }
    return true;
};

jev.sem_getter_check = function (rte, cont, ast, x, y) {
    return jev.sem_bounds_check(rte, cont, ast, x, y);
};

jev.sem_bounds_check = function (rte, cont, ast, x, y) {
    if (typeof x === "object" && x instanceof Array) {
        if (!(typeof y === "number" && y === Math.floor(y))) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  "array index must be an integer");
        } else if (!(y >= 0 && y < x.length)) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  "array index is out of bounds");
        }
    }
    return true;
};

//-----------------------------------------------------------------------------

jev.step_construct = function (rte, cont, ast, cons, args) {

    if (typeof cons !== "function") {

        return jev.step_error(rte,
                              cont,
                              ast,
                              "constructor is not a function");

    } else if ("_apply_" in cons) {

        var obj = Object.create(cons.prototype);

        var cont2 = function (rte, result) {

            return jev.step_end(rte,
                                cont,
                                ast,
                                obj); // constructor returns the object!
        };

        try {
            return cons._apply_(rte,
                                cont2,
                                obj,
                                args);
        }
        catch (e) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  String(e));
        }

    } else {

        var result;

        try {
            var new_semfn = jev.get_new_semfn(ast.args.length);
            result = new_semfn(cons, args);
        }
        catch (e) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  String(e));
        }

        return jev.step_end(rte,
                            cont,
                            ast,
                            result);

    }
};

jev.step_apply = function (rte, cont, ast, fn, obj, args) {

    if (typeof fn !== "function") {

        return jev.step_error(rte,
                              cont,
                              ast,
                              "cannot call a non function");

    } else if ("_apply_" in fn) {

        var cont2 = function (rte, result) {

            return jev.step_end(rte,
                                cont,
                                ast,
                                result); // function returns the result
        };

        try {
            return fn._apply_(rte,
                              cont2,
                              obj,
                              args);
        }
        catch (e) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  String(e));
        }

    } else {

        var result;

        try {
            result = fn.apply(obj, args);
        }
        catch (e) {
            return jev.step_error(rte,
                                  cont,
                                  ast,
                                  String(e));
        }

        return jev.step_end(rte,
                            cont,
                            ast,
                            result);
    }
};

jev.step_end = function (rte, cont, ast, result) {

    if (ast === null) {

        return cont(rte, result);

    } else {

        rte.ast = ast;
        rte.result = result;

        var resume = function () {
            return cont(rte, result);
        };

        if (++rte.step_count < rte.step_limit) {
            return resume;
        } else {
            rte.resume = resume;
            return null;
        }

    }
};

jev.step_error = function (rte, cont, ast, error) {

    rte.ast = ast;
    rte.error = error;
    rte.resume = null;

    return null;
};

//=============================================================================
