//=============================================================================

// File: "eval.js"

// Copyright (c) 2012 by Marc Feeley, All Rights Reserved.

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

jev.newGlobalRTE = function () {

    var global_obj = (function () { return this; })();

    return new jev.RTE(global_obj,
                       null,
                       new RTFrame(global_obj,
                                   null,
                                   [],
                                   [],
                                   null,
                                   null,
                                   null));

};

jev.eval = function (source, options) {

    var code = js_compile(source, options);

    return jev.run(code);
};

jev.run = function (code) {

    var rte = jev.runSetup(code);

    return jev.evalExec(rte);
};

jev.runSetup = function (code) {

    var rte = jev.newGlobalRTE();

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

jev.evalExec = function (rte) {

    while (!jev.evalFinished(rte)) {
        jev.evalStep(rte);
    }

    if (rte.error !== null) {
        throw rte.ast.loc.toString() + ": " + rte.error;
    }

    return jev.evalResult(rte);
};

jev.evalFinished = function (rte) {
    return rte.resume === null;
};

jev.evalResult = function (rte) {
    return rte.result;
};

jev.evalError = function (rte) {
    return rte.error;
};

jev.evalStep = function (rte, nb_steps) {

    if (nb_steps === void 0)
        nb_steps = 999999999999;

    var resume = rte.resume;

    rte.step_limit = rte.step_count + nb_steps;

    // trampoline

    while (resume !== null) {
        resume = resume(rte);
    }
};

function SourceContainerInternalFile(source, tostr, start_line, start_column, stamp) {

    this.source = source;
    this.tostr = tostr;
    this.start_line = start_line;
    this.start_column = start_column;
    this.stamp = stamp;

}

SourceContainerInternalFile.prototype.toString = function () {
    return this.tostr;
};

function SourceContainer(source, tostr, start_line, start_column) {

    this.source = source;
    this.tostr = tostr;
    this.start_line = start_line;
    this.start_column = start_column;

}

SourceContainer.prototype.toString = function () {
    return this.tostr;
};

function js_compile(source, options) {

    var error = function (loc, kind, msg) {
//        if (kind !== "warning") {
            print(loc.toString() + ": " + kind + " -- " + msg);
//        }
    };

    var languageLevel = (typeof options === "object" &&
                         options.languageLevel !== void 0)
                        ? options.languageLevel
                        : "novice";

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
    var ast = p.parse();
    var cte = new_global_cte(opts);

    var options = { profile: false,
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

    return comp_statement(cte, ast_normalize(ast, options));
}

function new_global_cte(options) {

    return new CTE(null,
                   {},
                   {},
                   null,
                   null,
                   options);

}

function CTE(callee, params, locals, label_stack, parent, options) {

    this.callee = callee;
    this.params = params;
    this.locals = locals;
    this.label_stack = label_stack;
    this.parent = parent;
    this.options = options;

}

function RTFrame(this_, callee, params, locals, parent, ctrl_stack, cte) {

    this.this_ = this_;
    this.callee = callee;
    this.params = params;
    this.locals = locals;
    this.parent = parent;
    this.ctrl_stack = ctrl_stack;
    this.cte = cte;

}

function comp_statement(cte, ast) {

    if (ast instanceof Program) {

        var code = comp_statement(cte, ast.block);

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
        var access = cte_access(cte, id_str);
        var code_value = comp_expr(cte, ast.funct);

        return gen_op2_assign(ast, sem_var_x_equal_y, access, code_value);

    } else if (ast instanceof BlockStatement) {

        var code = comp_statements(cte, ast, ast.statements);

        return gen_break_handler(cte, ast, code);

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

        return comp_expr(cte, ast.expr);

    } else if (ast instanceof IfStatement) {

        var code_expr = comp_expr(cte, ast.expr);
        var code_stat0 = comp_statement(cte, ast.statements[0]);

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

            return gen_break_handler(cte, ast, code);
            
        } else {

            var code_stat1 = comp_statement(cte, ast.statements[1]);

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

            return gen_break_handler(cte, ast, code);

        }

    } else if (ast instanceof DoWhileStatement) {

        cte = break_continue_context(cte, ast, true);

        var code_stat = comp_statement(cte, ast.statement);
        var code_expr = comp_expr(cte, ast.expr);

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
                    var ctrl = rte.frame.ctrl_stack;
                    rte.frame.ctrl_stack = ctrl.next;
                    return ctrl.break_cont(rte, void 0);
                }
            };

            rte.frame.ctrl_stack = {
                break_cont: cont,
                continue_cont: subcont1,
                next: rte.frame.ctrl_stack
            };

            return subcont0(rte, void 0);
        };

    } else if (ast instanceof WhileStatement) {

        cte = break_continue_context(cte, ast, true);

        var code_expr = comp_expr(cte, ast.expr);
        var code_stat = comp_statement(cte, ast.statement);

        return function (rte, cont) {

            var subcont0 = function (rte, value0) {
                return code_expr(rte, subcont1);
            };

            var subcont1 = function (rte, value1) {
                if (value1) {
                    return code_stat(rte, subcont2);
                } else {
                    var ctrl = rte.frame.ctrl_stack;
                    rte.frame.ctrl_stack = ctrl.next;
                    return ctrl.break_cont(rte, void 0);
                }
            };

            var subcont2 = function (rte, value2) {
                return subcont0(rte, void 0);
            };

            rte.frame.ctrl_stack = {
                break_cont: cont,
                continue_cont: subcont0,
                next: rte.frame.ctrl_stack
            };

            return subcont0(rte, void 0);
        };

    } else if (ast instanceof ForStatement) {

        cte = break_continue_context(cte, ast, true);

        var code_expr1 = comp_expr(cte, ast.expr1);
        var code_expr2 = comp_expr(cte, ast.expr2);
        var code_expr3 = comp_expr(cte, ast.expr3);
        var code_stat = comp_statement(cte, ast.statement);

        return function (rte, cont) {

            var subcont1 = function (rte, value1) {
                return code_expr2(rte, subcont2);
            };

            var subcont2 = function (rte, value2) {
                if (value2) {
                    return code_stat(rte, subcont3);
                } else {
                    var ctrl = rte.frame.ctrl_stack;
                    rte.frame.ctrl_stack = ctrl.next;
                    return ctrl.break_cont(rte, void 0);
                }
            };

            var subcont3 = function (rte, value3) {
                return code_expr3(rte, subcont1);
            };

            rte.frame.ctrl_stack = {
                break_cont: cont,
                continue_cont: subcont3,
                next: rte.frame.ctrl_stack
            };

            return code_expr1(rte, subcont1);
        };

    } else if (ast instanceof ForVarStatement) {

        cte = break_continue_context(cte, ast, true);

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

        cte = break_continue_context(cte, ast, true);

        var code_assign = comp_op2_assign(cte,
                                          null,
                                          "x = y",
                                          ast.lhs_expr,
                                          function () {
                                              return function (rte, cont) {
                                                  var ctrl = rte.frame.ctrl_stack;
                                                  var prop = ctrl.props[ctrl.index-1];
                                                  return cont(rte, prop);
                                              };
                                          });

        var code_set_expr = comp_expr(cte, ast.set_expr);
        var code_stat = comp_statement(cte, ast.statement);

        return function (rte, cont) {

            var subcont1 = function (rte, value1) {
                var props = [];
                for (var p in value1) {
                    props.push(p);
                }
                var ctrl = rte.frame.ctrl_stack;
                ctrl.obj = value1;
                ctrl.props = props;
                ctrl.index = 0;
                return subcont2(rte, void 0);
            };

            var subcont2 = function (rte, value2) {
                var ctrl = rte.frame.ctrl_stack;
                if (ctrl.index < ctrl.props.length) {
                    var prop = ctrl.props[ctrl.index++];
                    if (prop in ctrl.obj) {
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
                var ctrl = rte.frame.ctrl_stack;
                rte.frame.ctrl_stack = ctrl.next;
                return ctrl.break_cont(rte, void 0);
            };

            rte.frame.ctrl_stack = {
                break_cont: cont,
                continue_cont: subcont2,
                next: rte.frame.ctrl_stack
            };

            return code_set_expr(rte, subcont1);
        };

    } else if (ast instanceof ForVarInStatement) {

        cte = break_continue_context(cte, ast, true);

        throw "for var in statements are not implemented";

        /*
        ast.initializer = ctx.walk_expr(ast.initializer);
        ast.set_expr = ctx.walk_expr(ast.set_expr);
        ast.statement = ctx.walk_statement(ast.statement);
        */

    } else if (ast instanceof ContinueStatement) {

        var depth_ast = label_lookup(cte,
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
            var ctrl = rte.frame.ctrl_stack;
            for (var i=depth; i>0; i--) ctrl = ctrl.next;
            rte.frame.ctrl_stack = ctrl; // keep continue frame
            return step_end(rte,
                            ctrl.continue_cont,
                            ast,
                            void 0);
        };

    } else if (ast instanceof BreakStatement) {

        var depth_ast = label_lookup(cte,
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
            var ctrl = rte.frame.ctrl_stack;
            for (var i=depth; i>0; i--) ctrl = ctrl.next;
            rte.frame.ctrl_stack = ctrl.next; // remove break frame
            return step_end(rte,
                            ctrl.break_cont,
                            ast,
                            void 0);
        };

    } else if (ast instanceof ReturnStatement) {

        var depth_ast = label_lookup(cte, "return point");

        if (depth_ast === null) {
            cte.options.error(ast.loc, "syntax error", "illegal return statement");
        }

        if (ast.expr === null) {
            return function (rte, cont) {
                var cont = rte.stack.cont;
                rte.frame = rte.stack.frame;
                rte.stack = rte.stack.stack;
                return cont(rte, void 0);
            };
        } else {
            var code_expr = comp_expr(cte, ast.expr);

            return function (rte, cont) {
                return code_expr(rte,
                                 function (rte, value) {
                                     var cont = rte.stack.cont;
                                     rte.frame = rte.stack.frame;
                                     rte.stack = rte.stack.stack;
                                     return cont(rte, value);
                                 });
            };
        };

    } else if (ast instanceof WithStatement) {

        throw "with statements are not implemented";

        //ast.expr = ctx.walk_expr(ast.expr);
        //ast.statement = ctx.walk_statement(ast.statement);

    } else if (ast instanceof SwitchStatement) {

        cte = break_continue_context(cte, ast, false);

        throw "switch statements are not implemented";

        /*
        ast.expr = ctx.walk_expr(ast.expr);
        ast.clauses.forEach(function (c, i, asts)
                            {
                                c.expr = ctx.walk_expr(c.expr);
                                c.statements = comp_statements(c, c.statements, ctx);
                            });
        */

    } else if (ast instanceof LabelledStatement) {

        var ids = {};

        var label_stack = new CtrlLabel(ids, ast, cte.label_stack);

        var new_cte = new CTE(cte.callee,
                              cte.params,
                              cte.locals,
                              label_stack,
                              cte.parent,
                              cte.options);

        var statement = ast;

        while (statement instanceof LabelledStatement) {
            var id_str = statement.label.toString();
            if (label_lookup(new_cte, id_str) !== null) {
                cte.options.error(statement.label.loc, "syntax error", "duplicate label " + id_str);
            }
            ids[id_str] = true;
            statement = statement.statement;
        }

        label_stack.ast = statement;

        return comp_statement(new_cte, statement);

    } else if (ast instanceof ThrowStatement) {

        var code_expr = comp_expr(cte, ast.expr);

        return function (rte, cont) {
            return code_expr(rte,
                             function (rte, value) {
                                 throw value;
                                 // does not return
                             });
        };

    } else if (ast instanceof TryStatement) {

        //throw "try statements are not implemented";

        var code = comp_statement(cte, ast.statement);

        return gen_break_handler(cte, ast, code);

        //return gen_break_handler(cte, ast, code);

        /*
        ast.statement = ctx.walk_statement(ast.statement);
        ast.catch_part = ctx.walk_statement(ast.catch_part);
        ast.finally_part = ctx.walk_statement(ast.finally_part);
        */
    } else if (ast instanceof CatchPart) {

        throw "unimplemented"; /////////////////////////////////////////

        //ast.statement = ctx.walk_statement(ast.statement);
    } else if (ast instanceof DebuggerStatement) {

        return function (rte, cont) {
            return cont(rte, void 0); // do nothing
        };

    } else {
        throw "unknown ast";
    }
}

function gen_break_handler(cte, ast, code) {

    var label_stack = cte.label_stack;

    if (label_stack === null || label_stack.ast !== ast) {

        return code;

    } else {

        return function (rte, cont) {

            var subcont1 = function (rte, value1) {
                var ctrl = rte.frame.ctrl_stack;
                rte.frame.ctrl_stack = ctrl.next;
                return ctrl.break_cont(rte, value1);
            };

            rte.frame.ctrl_stack = {
                break_cont: cont,
                continue_cont: null,
                next: rte.frame.ctrl_stack
            };

            return code(rte, subcont1);
        };

    }
}

function CtrlLabel(ids, ast, next) {
    this.ids = ids;
    this.ast = ast;
    this.next = next;
}

function break_continue_context(cte, ast, is_loop) {

    var label_stack = cte.label_stack;

    if (label_stack === null || label_stack.ast !== ast) {

        label_stack = new CtrlLabel({}, ast, label_stack);

        cte = new CTE(cte.callee,
                      cte.params,
                      cte.locals,
                      label_stack,
                      cte.parent,
                      cte.options);

    }

    label_stack.ids["break point"] = true;

    if (is_loop) {
        label_stack.ids["continue point"] = true;
    }

    return cte;
}

function label_lookup(cte, id_str) {

    var label_stack = cte.label_stack;
    var depth = 0;

    while (label_stack !== null) {
        if (label_stack.ids[id_str] !== void 0) {
            return {depth: depth, ast: label_stack.ast};
        }
        label_stack = label_stack.next;
        depth++;
    }

    return null;
}

function comp_statements(cte, ast, asts) {
    if (asts.length === 0) {
        return function (rte, cont) {
                   return step_end(rte,
                                   cont,
                                   ast,
                                   void 0);
               };
    } else {
        return comp_statements_loop(cte, asts, 0);
    }
}

function comp_statements_loop(cte, asts, i) {
    if (i < asts.length-1) {
        var code0 = comp_statement(cte, asts[i]);
        var code1 = comp_statements_loop(cte, asts, i+1);

        return function (rte, cont) {
                   return code0(rte,
                                function (rte, value) {
                                    return code1(rte, cont);
                                });
               };
    } else {
        return comp_statement(cte, asts[i]);
    }
}

function comp_expr(cte, ast) {

    if (ast instanceof OpExpr) {

        if (is_assign_op1(ast.op)) {

            return comp_op1_assign(cte,
                                   ast,
                                   ast.op,
                                   ast.exprs[0]);

        } else if (is_assign_op2(ast.op)) {

            return comp_op2_assign(cte,
                                   ast,
                                   ast.op,
                                   ast.exprs[0],
                                   function () {
                                       return comp_expr(cte, ast.exprs[1]);
                                   });

        } else if (is_pure_op1(ast.op)) {

            var code_expr0 = comp_expr(cte, ast.exprs[0]);

            return gen_op_dyn(ast,
                              pure_op1_to_semfn(ast.op),
                              code_expr0);

        } else if (ast.op === "x ? y : z") {

            var code_expr0 = comp_expr(cte, ast.exprs[0]);
            var code_expr1 = comp_expr(cte, ast.exprs[1]);
            var code_expr2 = comp_expr(cte, ast.exprs[2]);

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

            var code_expr0 = comp_expr(cte, ast.exprs[0]);
            var code_expr1;

            if (ast.op === "x . y") {
                var value = ast.exprs[1].value;
                code_expr1 = function (rte, cont) {
                    return cont(rte, value);
                };
            } else {
                code_expr1 = comp_expr(cte, ast.exprs[1]);
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
                return gen_op_dyn_dyn(ast,
                                      pure_op2_to_semfn(ast.op),
                                      code_expr0,
                                      code_expr1);

            }
        }

    } else if (ast instanceof NewExpr) {

        var code_cons = comp_expr(cte, ast.expr);
        var code_args = comp_exprs(cte, ast.args);
        var new_semfn = get_new_semfn(ast.args.length);

        var op = function (rte, cont, ast, cons, args)
        {
            if (typeof cons !== "function") {

                return step_error(rte,
                                  cont,
                                  ast,
                                  "constructor is not a function");

            } else if ("_apply_" in cons) {

                var obj = Object.create(cons.prototype);
                return cons._apply_(rte,
                                    function (rte, result) {
                                        return step_end(rte,
                                                        cont,
                                                        ast,
                                                        obj);
                                    },
                                    obj,
                                    args);

            } else {

                var result = new_semfn(cons, args);

                return step_end(rte,
                                cont,
                                ast,
                                result);

            }
        };

        return gen_op_dyn_dyn(ast, op, code_cons, code_args);

    } else if (ast instanceof CallExpr) {

        if (is_prop_access(ast.fn)) {

            // method call

            var code_obj = comp_expr(cte, ast.fn.exprs[0]);

            var code_prop;

            if (ast.fn.op === "x . y") {
                var value = ast.fn.exprs[1].value;
                code_prop = function (rte, cont) {
                    return cont(rte, value);
                };
            } else {
                code_prop = comp_expr(cte, ast.fn.exprs[1]);
            }

            var code_args = comp_exprs(cte, ast.args);

            var op = function (rte, cont, ast, obj, prop) {
                if (obj === void 0) {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      "cannot read property of undefined");
                } else {

                    var fn = obj[prop];

                    var cont2 = function (rte, fn) {

                                    return code_args(rte,
                                                     function (rte, args) {
                                                         if (typeof fn !== "function") {
                                                             return step_error(rte,
                                                                               cont,
                                                                               ast,
                                                                               "cannot call a non function");
                                                         } else if ("_apply_" in fn) {
                                                             return fn._apply_(rte,
                                                                               function (rte, result) {
                                                                                   return step_end(rte,
                                                                                                   cont,
                                                                                                   ast,
                                                                                                   result);
                                                                               },
                                                                               obj,
                                                                               args);
                                                         } else {
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

        } else {

            // non-method call

            var code_fn = comp_expr(cte, ast.fn);
            var code_args = comp_exprs(cte, ast.args);

            var op = function (rte, cont, ast, fn, args) {

                if (typeof fn !== "function") {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      "cannot call a non function");
                } else if ("_apply_" in fn) {
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
                } else {
                    return step_end(rte,
                                    cont,
                                    ast,
                                    fn.apply(rte.glo, args));
                }
            };

            return gen_op_dyn_dyn(ast, op, code_fn, code_args);
        }

    } else if (ast instanceof FunctionExpr) {

        var nb_params = ast.params.length;
        var nb_locals = 0;
        var params = {};
        var locals = {};
        var i = 0;

        for (var v in ast.vars) {
            var id_str = v.toString();
            if (i < nb_params) {
                params[id_str] = i;
            } else {
                locals[id_str] = i-nb_params;
                nb_locals++;
            }
            i++;
        }

        var fn_cte = new CTE((ast.id !== null) ? ast.id.toString() : null,
                             params,
                             locals,
                             new CtrlLabel({"return point": true}, ast, null),
                             cte,
                             cte.options);

        var code_body = comp_statements(fn_cte, ast, ast.body);

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

                return js_run(code);
            };

            closure.toString = function () {
                //var source = ast.loc.container.source;
                //return source.slice(start_char_offs, end_char_offs);
                return "function (" + ast.params.join(",") + ") { ... }";
            };

            closure._apply_ = function (rte, cont, this_, params) {
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

    } else if (ast instanceof Literal) {

        return function (rte, cont) {
            return step_end(rte,
                            cont,
                            ast,
                            ast.value);
        };

    } else if (ast instanceof ArrayLiteral) {

        var code_exprs = comp_exprs(cte, ast.exprs);

        return function (rte, cont) {
            return code_exprs(rte,
                              function (rte, values) {
                                  return step_end(rte,
                                                  cont,
                                                  ast,
                                                  values);
                              });
        };

    } else if (ast instanceof RegExpLiteral) {

        var pattern = ast.pattern;
        var flags = ast.flags;

        return function (rte, cont) {
            return step_end(rte,
                            cont,
                            ast,
                            new RegExp(pattern, flags));
        };

    } else if (ast instanceof ObjectLiteral) {

        return comp_props(cte, ast, ast.properties);

    } else if (ast instanceof Ref) {

        var id_str = ast.id.toString()
        var access = cte_access(cte, id_str);
        var error_msg = (cte.options.languageLevel === "novice")
                        ? "cannot read the undefined variable " + id_str
                        : false;

        if (access instanceof LocalAccess) {

            var up = access.up;
            var over = access.over;

            return function (rte, cont) {
                var f = rte.frame;
                for (var i=up; i>0; i--) f = f.parent;
                var result = f.locals[over];
                if (error_msg !== false && result === void 0) {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      error_msg);
                } else {
                    return step_end(rte,
                                    cont,
                                    ast,
                                    result);
                }
            };

        } else if (access instanceof ParamAccess) {

            var up = access.up;
            var over = access.over;

            return function (rte, cont) {
                var f = rte.frame;
                for (var i=up; i>0; i--) f = f.parent;
                var result = f.params[over];
                if (error_msg !== false && result === void 0) {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      error_msg);
                } else {
                    return step_end(rte,
                                    cont,
                                    ast,
                                    result);
                }
            };

        } else if (access instanceof CalleeAccess) {

            var up = access.up;

            return function (rte, cont) {
                var f = rte.frame;
                for (var i=up; i>0; i--) f = f.parent;
                var result = f.callee;
                return step_end(rte,
                                cont,
                                ast,
                                result);
            };

        } else if (access instanceof GlobalAccess) {

            var name = access.name;

            return function (rte, cont) {
                var result = rte.glo[name];
                if (error_msg !== false && result === void 0) {
                    return step_error(rte,
                                      cont,
                                      ast,
                                      error_msg);
                } else {
                    return step_end(rte,
                                    cont,
                                    ast,
                                    result);
                }
            };

        } else {
            throw "unknown access";
        }

    } else if (ast instanceof This) {

        return function (rte, cont) {
            return step_end(rte,
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

    while (cte.parent !== null) {

        if (id_str in cte.locals) {
            return new LocalAccess(up, cte.locals[id_str]);
        } else if (id_str in cte.params) {
            return new ParamAccess(up, cte.params[id_str]);
        } else if (id_str === cte.callee) {
            return new CalleeAccess(up);
        }
        cte = cte.parent;
        up++;
    }

    var ga = cte.locals[id_str];

    if (ga === void 0) {
        ga = (cte.locals[id_str] = new GlobalAccess(id_str));
    }

    return ga;
}

function comp_op1_assign(cte, ast, op1, lhs) {

    var op = assign_op1_to_semfn(op1);

    if (is_prop_access(lhs)) {

        var code_obj = comp_expr(cte, lhs.exprs[0]);

        var code_prop;

        if (lhs.op === "x . y") {
            var value = lhs.exprs[1].value;
            code_prop = function (rte, cont) {
                return cont(rte, value);
            };
        } else {
            code_prop = comp_expr(cte, lhs.exprs[1]);
        }

        return gen_op_dyn_dyn(ast,
                              op,
                              code_obj,
                              code_prop);

    } else {

        var id_str = lhs.id.toString();
        var access = cte_access(cte, id_str);

        return gen_op1_assign(ast, op, access);

    }
}

function comp_op2_assign(cte, ast, op2, lhs, get_code_value) {

    var op = assign_op2_to_semfn(op2);

    if (is_prop_access(lhs)) {

        var code_obj = comp_expr(cte, lhs.exprs[0]);

        var code_prop;

        if (lhs.op === "x . y") {
            var value = lhs.exprs[1].value;
            code_prop = function (rte, cont) {
                return cont(rte, value);
            };
        } else {
            code_prop = comp_expr(cte, lhs.exprs[1]);
        }

        var code_value = get_code_value();

        return gen_op_dyn_dyn_dyn(ast,
                                  op,
                                  code_obj,
                                  code_prop,
                                  code_value);

    } else {

        var id_str = lhs.id.toString();
        var access = cte_access(cte, id_str);
        var code_value = get_code_value();

        return gen_op2_assign(ast, op, access, code_value);

    }
}

function gen_op1_assign(ast, op, access) {

    if (access instanceof LocalAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.locals);
        };

        return gen_op_dyn_cst(ast,
                              op,
                              code_obj,
                              over);

    } else if (access instanceof ParamAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.params);
        };

        return gen_op_dyn_cst(ast,
                              op,
                              code_obj,
                              over);

    } else if (access instanceof CalleeAccess) {

        var code_obj = function (rte, cont) {
            return cont(rte, [void 0]); // ignore assignment
        };

        return gen_op_dyn_cst(ast,
                              op,
                              code_obj,
                              0);

    } else if (access instanceof GlobalAccess) {

        var name = access.name;

        return gen_op_glo_cst(ast,
                              op,
                              name);

    } else {
        throw "unknown access";
    }
}

function gen_op2_assign(ast, op, access, code_value) {

    if (access instanceof LocalAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.locals);
        };

        return gen_op_dyn_cst_dyn(ast,
                                  op,
                                  code_obj,
                                  over,
                                  code_value);

    } else if (access instanceof ParamAccess) {

        var up = access.up;
        var over = access.over;
        var code_obj = function (rte, cont) {
            var f = rte.frame;
            for (var i=up; i>0; i--) f = f.parent;
            return cont(rte, f.params);
        };

        return gen_op_dyn_cst_dyn(ast,
                                  op,
                                  code_obj,
                                  over,
                                  code_value);

    } else if (access instanceof CalleeAccess) {

        var code_obj = function (rte, cont) {
            return cont(rte, [void 0]); // ignore assignment
        };

        return gen_op_dyn_cst_dyn(ast,
                                  op,
                                  code_obj,
                                  0,
                                  code_value);

    } else if (access instanceof GlobalAccess) {

        var name = access.name;

        return gen_op_glo_cst_dyn(ast,
                                  op,
                                  name,
                                  code_value);

    } else {
        throw "unknown access";
    }
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
                            null,//TODO................... put cont here?
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

function get_new_semfn(n) {

    if (get_new_semfn_cache[n] === void 0) {

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

function comp_exprs(cte, asts) {

    var code = comp_exprs_loop(cte, asts, 0);

    return function (rte, cont) {
        return code(rte, cont, []);
    };
}

function comp_exprs_loop(cte, asts, i) {

    if (i < asts.length) {

        var code0 = comp_expr(cte, asts[i]);
        var code1 = comp_exprs_loop(cte, asts, i+1);

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
}

function comp_props(cte, ast, props) {

    var code = comp_props_loop(cte, ast, props, 0);

    return function (rte, cont) {
        return code(rte, cont, {});
    };
}

function comp_props_loop(cte, ast, props, i) {

    if (i < props.length) {

        var prop = props[i].name.value;
        var code0 = comp_expr(cte, props[i].value);
        var code1 = comp_props_loop(cte, ast, props, i+1);

        return function (rte, cont, obj) {

                   return code0(rte,
                                function (rte, value) {
                                    obj[prop] = value;
                                    return code1(rte, cont, obj);
                                });

               };

    } else {

        return function (rte, cont, obj) {
            return step_end(rte,
                            cont,
                            ast,
                            obj);
        };

    }
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
  case "x [ y ]": return sem_prop_index;
  case "x . y": return sem_prop_access;
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

function sem_prop_index(rte, cont, ast, x, y) // "x [ y ]"
{
    var result = (x [ y ]);
    return step_end(rte, cont, ast, result);
}

function sem_prop_access(rte, cont, ast, x, y) // "x . y"
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

function step_end(rte, cont, ast, result) {

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
}

function step_error(rte, cont, ast, error)
{
    rte.ast = ast;
    rte.error = error;
    rte.resume = null;

    return null;
}

//=============================================================================
