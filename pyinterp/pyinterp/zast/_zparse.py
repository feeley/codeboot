import sys
from pyinterp._runtime import *
from pyinterp.zast.ztoken import *
from pyinterp.zast.ztokenizer import *
from pyinterp.zast._zast import *

def set_end_ast(ast, end_ast):
    return set_end(ast, end_ast.end_lineno, end_ast.end_col_offset)

def set_ctx(targets, ctx):
    for i in range(len(targets)):
        set_ctx1(targets[i], ctx)

def set_ctx1(t, ctx):
    t.ctx = ctx
    if isinstance(t, Tuple):
        set_ctx(t.elts, ctx)
    elif isinstance(t, List):
        set_ctx(t.elts, ctx)

def check_assignable(ts, t):
    if isinstance(t, Constant):
        val = t.value
        if val is False:
            py_syntax_error_ast(ts, t, 'cannot assign to False')
        elif val is True:
            py_syntax_error_ast(ts, t, 'cannot assign to True')
        elif val is None:
            py_syntax_error_ast(ts, t, 'cannot assign to None')
#TODO: enable when Ellipsis implemented
#        elif val is Ellipsis:
#            py_syntax_error_ast(ts, t, 'cannot assign to Ellipsis')
        else:
            py_syntax_error_ast(ts, t, 'cannot assign to literal')
    elif isinstance(t, BinOp) or isinstance(t, UnaryOp) or isinstance(t, BoolOp):
        py_syntax_error_ast(ts, t, 'cannot assign to operator')
    elif isinstance(t, Tuple):
        for i in range(len(t.elts)):
            check_assignable(ts, t.elts[i])
    elif isinstance(t, List):
        for i in range(len(t.elts)):
            check_assignable(ts, t.elts[i])
    elif isinstance(t, Dict):
        py_syntax_error_ast(ts, t, 'cannot assign to dict display')
    elif isinstance(t, Call):
        py_syntax_error_ast(ts, t, 'cannot assign to function call')
    elif isinstance(t, IfExp):
        py_syntax_error_ast(ts, t, 'cannot assign to conditional expression')
    elif isinstance(t, Compare):
        py_syntax_error_ast(ts, t, 'cannot assign to comparison')
    elif isinstance(t, Lambda):
        py_syntax_error_ast(ts, t, 'cannot assign to lambda')

def py_syntax_error_ast(ts, ast, msg):
    if ts.context and dict_has(ts.context, 'syntaxError'):
        ts.context.syntaxError(ast.lineno-1, ast.col_offset, ast.end_lineno-1, ast.end_col_offset, msg)

def parse_function_signature(ts, posonly_and_default, args_and_defaults, vararg, kwonly_and_defaults, kwarg):
    posonlyargs = []
    args = []
    defaults = []
    for pair in posonly_and_default:
        posonlyargs.append(pair[0])
        def_val = pair[1]
        if def_val is None:
            if len(defaults) > 0:
                return py_syntax_error(ts, "non-default argument follows default argument")
        else:
            defaults.append(def_val)

    for pair in args_and_defaults:
        args.append(pair[0])
        def_val = pair[1]
        if def_val is None:
            if len(defaults) > 0:
                return py_syntax_error(ts, "non-default argument follows default argument")
        else:
            defaults.append(def_val)

    kwonlyargs = []
    kw_defaults = []
    for pair in kwonly_and_defaults:
        kwonlyargs.append(pair[0])
        kw_defaults.append(pair[1])

    return arguments(args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwarg, defaults)

def py_parse_file_input(ts):
    stmts1 = py_parse_stmts(ts)
    if ts.token == ENDMARKER:
        py_advance(ts)
    else:
        return py_syntax_error(ts, None)
    return Module(stmts1,[])

def py_parse_eval_input(ts):
    if ts.token in py_tokenset_1:
        as_list = False
        testlist1 = py_parse_testlist(ts,as_list)
        while ts.token == NEWLINE:
            py_advance(ts)
        if ts.token == ENDMARKER:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return Expression(testlist1)
    else:
        return py_syntax_error(ts, None)

def py_parse_single_input(ts):
    if ts.token in py_tokenset_2:
        stmt1 = py_parse_stmt(ts)
        if ts.token == ENDMARKER:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return Module(stmt1,[])
    else:
        return py_syntax_error(ts, None)

def py_parse_stmts(ts):
    stmts = []
    while ts.token in py_tokenset_3:
        if ts.token == NEWLINE:
            py_advance(ts)
        else:
            stmt1 = py_parse_stmt(ts)
            stmts.extend(stmt1)
    return stmts

def py_parse_testlist(ts,as_list):
    if ts.token in py_tokenset_1:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        test1 = py_parse_test(ts)
        tests = [test1]
        dangling_comma = False
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_1):
                dangling_comma = True
                break
            test2 = py_parse_test(ts)
            tests.append(test2)
        if as_list:
            return (tests, dangling_comma or len(tests) != 1)
        elif len(tests) == 1 and not dangling_comma:
            return test1
        else:
            ast = Tuple(tests, Load())
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_stmt(ts):
    if ts.token in py_tokenset_4:
        simple_stmt1 = py_parse_simple_stmt(ts)
        return simple_stmt1
    elif ts.token in py_tokenset_5:
        compound_stmt1 = py_parse_compound_stmt(ts)
        return [compound_stmt1]
    else:
        return py_syntax_error(ts, None)

def py_parse_test(ts):
    if ts.token in py_tokenset_6:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        or_test1 = py_parse_or_test(ts)
        if ts.token == IF:
            py_advance(ts)
            or_test2 = py_parse_or_test(ts)
            if ts.token == ELSE:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
            test1 = py_parse_test(ts)
            ast = IfExp(or_test2, or_test1, test1)
            return set_start_end(ts, lineno, col_offset, ast)
        return or_test1
    elif ts.token == LAMBDA:
        lambdef1 = py_parse_lambdef(ts)
        return lambdef1
    else:
        return py_syntax_error(ts, None)

def py_parse_simple_stmt(ts):
    if ts.token in py_tokenset_4:
        small_stmt1 = py_parse_small_stmt(ts)
        small_stmts = [small_stmt1]
        while ts.token == SEMI:
            py_advance(ts)
            if not (ts.token in py_tokenset_4):
                break
            small_stmt2 = py_parse_small_stmt(ts)
            small_stmts.append(small_stmt2)
        if ts.token == NEWLINE:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return small_stmts
    else:
        return py_syntax_error(ts, None)

def py_parse_compound_stmt(ts):
    if ts.token == IF:
        if_stmt1 = py_parse_if_stmt(ts)
        return if_stmt1
    elif ts.token == WHILE:
        while_stmt1 = py_parse_while_stmt(ts)
        return while_stmt1
    elif ts.token == FOR:
        for_stmt1 = py_parse_for_stmt(ts)
        return for_stmt1
    elif ts.token == TRY:
        try_stmt1 = py_parse_try_stmt(ts)
        return try_stmt1
    elif ts.token == WITH:
        with_stmt1 = py_parse_with_stmt(ts)
        return with_stmt1
    elif ts.token == DEF:
        funcdef1 = py_parse_funcdef(ts)
        return funcdef1
    elif ts.token == CLASS:
        classdef1 = py_parse_classdef(ts)
        return classdef1
    else:
        return py_syntax_error(ts, None)

def py_parse_or_test(ts):
    if ts.token in py_tokenset_6:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        and_test1 = py_parse_and_test(ts)
        asts = [and_test1]
        while ts.token == OR:
            py_advance(ts)
            and_test2 = py_parse_and_test(ts)
            asts.append(and_test2)
        if len(asts) == 1:
            return asts[0]
        else:
            ast = BoolOp(Or(), asts)
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_lambdef(ts):
    if ts.token == LAMBDA:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        args = None
        py_advance(ts)
        if ts.token in py_tokenset_7:
            varargslist1 = py_parse_varargslist(ts)
            args = varargslist1
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        test1 = py_parse_test(ts)
        if args is None:
            args = arguments([], [], None, [], [], None, [])
        ast = Lambda(args, test1)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_small_stmt(ts):
    if ts.token in py_tokenset_1:
        expr_stmt1 = py_parse_expr_stmt(ts)
        return expr_stmt1
    elif ts.token == PASS:
        pass_stmt1 = py_parse_pass_stmt(ts)
        return pass_stmt1
    elif ts.token in py_tokenset_8:
        flow_stmt1 = py_parse_flow_stmt(ts)
        return flow_stmt1
    elif ts.token == IMPORT:
        import_stmt1 = py_parse_import_stmt(ts)
        return import_stmt1
    elif ts.token == GLOBAL:
        global_stmt1 = py_parse_global_stmt(ts)
        return global_stmt1
    elif ts.token == NONLOCAL:
        nonlocal_stmt1 = py_parse_nonlocal_stmt(ts)
        return nonlocal_stmt1
    elif ts.token == ASSERT:
        assert_stmt1 = py_parse_assert_stmt(ts)
        return assert_stmt1
    else:
        return py_syntax_error(ts, None)

def py_parse_if_stmt(ts):
    if ts.token == IF:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        namedexpr_test1 = py_parse_namedexpr_test(ts)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        suite1 = py_parse_suite(ts)
        branches = [(lineno, col_offset, namedexpr_test1, suite1)]
        while ts.token == ELIF:
            lineno = get_lineno(ts); col_offset = get_col_offset(ts)
            py_advance(ts)
            namedexpr_test2 = py_parse_namedexpr_test(ts)
            if ts.token == COLON:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
            suite2 = py_parse_suite(ts)
            branches.append((lineno, col_offset, namedexpr_test2, suite2))
        orelse = []
        if ts.token == ELSE:
            py_advance(ts)
            if ts.token == COLON:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
            suite3 = py_parse_suite(ts)
            orelse = suite3
        while True:
            branch = branches.pop()
            lineno = branch[0]
            col_offset = branch[1]
            test = branch[2]
            body = branch[3]
            ast = If(test, body, orelse)
            set_start(ast, lineno, col_offset)
            set_end_ast(ast, (orelse if len(orelse) > 0 else body)[-1])
            if len(branches) > 0:
                orelse = [ast]
            else:
                return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_while_stmt(ts):
    if ts.token == WHILE:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        namedexpr_test1 = py_parse_namedexpr_test(ts)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        suite1 = py_parse_suite(ts)
        suite2 = []
        if ts.token == ELSE:
            py_advance(ts)
            if ts.token == COLON:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
            suite2 = py_parse_suite(ts)
        ast = While(namedexpr_test1, suite1, suite2)
        set_start(ast, lineno, col_offset)
        set_end_ast(ast, (suite2 if len(suite2) > 0 else suite1)[-1])
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_for_stmt(ts):
    if ts.token == FOR:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        type_comment = None
        py_advance(ts)
        as_list = False
        exprlist1 = py_parse_exprlist(ts,as_list)
        check_assignable(ts, exprlist1)
        if ts.token == IN:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        as_list = False
        testlist1 = py_parse_testlist(ts,as_list)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if ts.token == TYPE_COMMENT:
            py_advance(ts)
        suite1 = py_parse_suite(ts)
        suite2 = []
        if ts.token == ELSE:
            py_advance(ts)
            if ts.token == COLON:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
            suite2 = py_parse_suite(ts)
        set_ctx1(exprlist1, Store())
        ast = For(exprlist1, testlist1, suite1, suite2, type_comment)
        set_start(ast, lineno, col_offset)
        set_end_ast(ast, (suite2 if len(suite2) > 0 else suite1)[-1])
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_try_stmt(ts):
    if ts.token == TRY:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        suite1 = py_parse_suite(ts)
        if ts.token == FINALLY:
            finally_block1 = py_parse_finally_block(ts)
            ast = Try(suite1, [], [], finally_block1)
            return set_start_end(ts, lineno, col_offset, ast)
        elif ts.token == EXCEPT:
            handlers_list1 = py_parse_handlers_list(ts)
            suite2 = []
            if ts.token == ELSE:
                py_advance(ts)
                if ts.token == COLON:
                    py_advance(ts)
                else:
                    return py_syntax_error(ts, None)
                suite2 = py_parse_suite(ts)
            finally_block2 = []
            if ts.token == FINALLY:
                finally_block2 = py_parse_finally_block(ts)
            ast = Try(suite1, handlers_list1, suite2, finally_block2)
            return set_start_end(ts, lineno, col_offset, ast)
        else:
            return py_syntax_error(ts, None)
    else:
        return py_syntax_error(ts, None)

def py_parse_with_stmt(ts):
    if ts.token == WITH:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        type_comment = None
        withitems = []
        py_advance(ts)
        with_item1 = py_parse_with_item(ts)
        withitems.append(with_item1)
        while ts.token == COMMA:
            py_advance(ts)
            with_item2 = py_parse_with_item(ts)
            withitems.append(with_item2)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if ts.token == TYPE_COMMENT:
            py_advance(ts)
        suite1 = py_parse_suite(ts)
        ast = With(withitems, suite1, type_comment)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_funcdef(ts):
    if ts.token == DEF:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        type_comment = None
        py_advance(ts)
        if ts.token == NAME:
            name = token(ts)
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        parameters1 = py_parse_parameters(ts)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if ts.token == TYPE_COMMENT:
            py_advance(ts)
        func_body_suite1 = py_parse_func_body_suite(ts)
        ast = FunctionDef(name, parameters1, func_body_suite1, [], None, type_comment)
        set_start(ast, lineno, col_offset)
        set_end_ast(ast, func_body_suite1[-1])
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_classdef(ts):
    if ts.token == CLASS:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        
        py_advance(ts)
        if ts.token == NAME:
            name = token(ts)
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        bases, keywords = [[], []]
        if ts.token == LPAR:
            py_advance(ts)
            if ts.token in py_tokenset_9:
                arglist1 = py_parse_arglist(ts)
                bases, keywords = arglist1
            if ts.token == RPAR:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        suite1 = py_parse_suite(ts)
        ast = ClassDef(name, bases, keywords, suite1, [])
        set_start(ast, lineno, col_offset)
        set_end_ast(ast, suite1[-1])
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_and_test(ts):
    if ts.token in py_tokenset_6:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        not_test1 = py_parse_not_test(ts)
        asts = [not_test1]
        while ts.token == AND:
            py_advance(ts)
            not_test2 = py_parse_not_test(ts)
            asts.append(not_test2)
        if len(asts) == 1:
            return asts[0]
        else:
            ast = BoolOp(And(), asts)
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_varargslist(ts):
    if ts.token in py_tokenset_7:
        varargslist_before_slash1 = py_parse_varargslist_before_slash(ts)
        parsed_signature = varargslist_before_slash1[0]  # second element indicates if a slash was seen, it is no longer needed at this point
        posonly_and_default = list_reversed(parsed_signature[0])
        args_and_defaults = list_reversed(parsed_signature[1])
        vararg = parsed_signature[2]
        kwonly_and_defaults = list_reversed(parsed_signature[3])
        kwarg = parsed_signature[4]
        return parse_function_signature(ts, posonly_and_default, args_and_defaults, vararg, kwonly_and_defaults, kwarg)
    else:
        return py_syntax_error(ts, None)

def py_parse_expr_stmt(ts):
    if ts.token in py_tokenset_1:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        testlist_star_expr1 = py_parse_testlist_star_expr(ts)
        target = testlist_star_expr1
        type_comment = None
        # WARNING! ambiguous first sets in Alt
        if ts.token in py_tokenset_10:
            augassign1 = py_parse_augassign(ts)
            check_assignable(ts, target)
            as_list = False
            testlist1 = py_parse_testlist(ts,as_list)
            ast = AugAssign(target, augassign1, testlist1)
            set_ctx1(target, Store())
            return set_start_end(ts, lineno, col_offset, ast)
        else:
            if ts.token == EQUAL:
                while True:
                    py_advance(ts)
                    check_assignable(ts, target)
                    as_list = False
                    testlist_star_expr2 = py_parse_testlist_star_expr(ts)
                    if not (ts.token == EQUAL):
                        break
                check_assignable(ts, target)
                ast = Assign([target], testlist_star_expr2, type_comment)
                set_ctx1(target, Store())
                return set_start_end(ts, lineno, col_offset, ast)
                if ts.token == TYPE_COMMENT:
                    py_advance(ts)
        ast = Expr(testlist_star_expr1)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_pass_stmt(ts):
    if ts.token == PASS:
        ast = set_start_end_1token(ts, Pass())
        py_advance(ts)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_flow_stmt(ts):
    if ts.token == BREAK:
        break_stmt1 = py_parse_break_stmt(ts)
        return break_stmt1
    elif ts.token == CONTINUE:
        continue_stmt1 = py_parse_continue_stmt(ts)
        return continue_stmt1
    elif ts.token == RETURN:
        return_stmt1 = py_parse_return_stmt(ts)
        return return_stmt1
    elif ts.token == RAISE:
        raise_stmt1 = py_parse_raise_stmt(ts)
        return raise_stmt1
    else:
        return py_syntax_error(ts, None)

def py_parse_import_stmt(ts):
    if ts.token == IMPORT:
        import_name1 = py_parse_import_name(ts)
        return import_name1
    else:
        return py_syntax_error(ts, None)

def py_parse_global_stmt(ts):
    if ts.token == GLOBAL:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        if ts.token == NAME:
            names = [token(ts)]
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        while ts.token == COMMA:
            py_advance(ts)
            if ts.token == NAME:
                names.append(token(ts))
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
        ast = Global(names)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_nonlocal_stmt(ts):
    if ts.token == NONLOCAL:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        if ts.token == NAME:
            names = [token(ts)]
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        while ts.token == COMMA:
            py_advance(ts)
            if ts.token == NAME:
                names.append(token(ts))
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
        ast = Nonlocal(names)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_assert_stmt(ts):
    if ts.token == ASSERT:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        test1 = py_parse_test(ts)
        msg = None
        if ts.token == COMMA:
            py_advance(ts)
            test2 = py_parse_test(ts)
            msg = test2
        ast = Assert(test1, msg)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_namedexpr_test(ts):
    if ts.token in py_tokenset_1:
        test1 = py_parse_test(ts)
        return test1
    else:
        return py_syntax_error(ts, None)

def py_parse_suite(ts):
    if ts.token in py_tokenset_4:
        simple_stmt1 = py_parse_simple_stmt(ts)
        return simple_stmt1
    elif ts.token == NEWLINE:
        py_advance(ts)
        if ts.token == INDENT:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        stmts = []
        while True:
            stmt1 = py_parse_stmt(ts)
            stmts.extend(stmt1)
            if not (ts.token in py_tokenset_2):
                break
        if ts.token == DEDENT:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return stmts
    else:
        return py_syntax_error(ts, None)

def py_parse_exprlist(ts,as_list):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        expr1 = py_parse_expr(ts)
        exprs = [expr1]
        dangling_comma = False
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_11):
                dangling_comma = True
                break
            expr2 = py_parse_expr(ts)
            exprs.append(expr2)
        if as_list:
            return (exprs, dangling_comma or len(exprs) != 1)
        elif len(exprs) == 1 and not dangling_comma:
            return expr1
        else:
            ast = Tuple(exprs, Load())
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_finally_block(ts):
    if ts.token == FINALLY:
        py_advance(ts)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        suite1 = py_parse_suite(ts)
        return suite1
    else:
        return py_syntax_error(ts, None)

def py_parse_handlers_list(ts):
    if ts.token == EXCEPT:
        except_block1 = py_parse_except_block(ts)
        handlers = [except_block1]
        while ts.token == EXCEPT:
            except_block2 = py_parse_except_block(ts)
            handlers.append(except_block2)
        return handlers
    else:
        return py_syntax_error(ts, None)

def py_parse_with_item(ts):
    if ts.token in py_tokenset_1:
        expr1 = None
        test1 = py_parse_test(ts)
        if ts.token == AS:
            py_advance(ts)
            expr1 = py_parse_expr(ts)
            check_assignable(ts, expr1)
            set_ctx1(expr1, Store())
        return withitem(test1, expr1)
    else:
        return py_syntax_error(ts, None)

def py_parse_parameters(ts):
    if ts.token == LPAR:
        py_advance(ts)
        varargslist1 = None
        if ts.token in py_tokenset_7:
            varargslist1 = py_parse_varargslist(ts)
        if ts.token == RPAR:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if varargslist1 is None:
            return arguments([], [], None, [], [], None, [])
        else:
            return varargslist1
    else:
        return py_syntax_error(ts, None)

def py_parse_func_body_suite(ts):
    if ts.token in py_tokenset_4:
        simple_stmt1 = py_parse_simple_stmt(ts)
        return simple_stmt1
    elif ts.token == NEWLINE:
        py_advance(ts)
        if ts.token == TYPE_COMMENT:
            py_advance(ts)
            if ts.token == NEWLINE:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
        if ts.token == INDENT:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        stmts = []
        while True:
            stmt1 = py_parse_stmt(ts)
            stmts.extend(stmt1)
            if not (ts.token in py_tokenset_2):
                break
        if ts.token == DEDENT:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return stmts
    else:
        return py_syntax_error(ts, None)

def py_parse_arglist(ts):
    if ts.token in py_tokenset_9:
        only_keywords = False; only_kwargs = False
        args = []; keywords = []
        argument1 = py_parse_argument(ts)
        if isinstance(argument1, keyword):
            only_kwargs = argument1.arg is None
            only_keywords = not only_kwargs
            keywords.append(argument1)
        else:
            args.append(argument1)
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_9):
                break
            argument2 = py_parse_argument(ts)
            if isinstance(argument2, keyword):
                is_kwarg = argument2.arg is None
                only_kwargs = only_kwargs or is_kwarg
                only_keywords = only_keywords or not is_kwarg
                keywords.append(argument2)
            elif isinstance(argument2, Starred):
                if only_kwargs:
                    return py_syntax_error(ts, 'iterable argument unpacking follows keyword argument unpacking')
                else:
                    args.append(argument2)
            else:
                if only_keywords:
                    return py_syntax_error(ts, 'positional argument follows keyword argument')
                else:
                    args.append(argument2)
        return args, keywords
    else:
        return py_syntax_error(ts, None)

def py_parse_not_test(ts):
    if ts.token == NOT:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        not_test1 = py_parse_not_test(ts)
        ast = UnaryOp(Not(), not_test1)
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token in py_tokenset_11:
        comparison1 = py_parse_comparison(ts)
        return comparison1
    else:
        return py_syntax_error(ts, None)

def py_parse_varargslist_before_slash(ts):
    if ts.token == STAR:
        args1 = py_parse_args(ts)
        return list_concat([[], []], args1), False
    elif ts.token == DOUBLESTAR:
        kwargs1 = py_parse_kwargs(ts)
        return [[], [], None, [], kwargs1], False  # [posonly, args, vararg, kw_only, kwargs]
    elif ts.token == NAME:
        simple_arg1 = py_parse_simple_arg(ts)
        varargslist_before_slash_tail1 = None
        if ts.token == COMMA:
            varargslist_before_slash_tail1 = py_parse_varargslist_before_slash_tail(ts)
        if varargslist_before_slash_tail1 is None:
            return [[], [simple_arg1], None, [], None], False
        else:
            tail = varargslist_before_slash_tail1[0]
            before_slash = varargslist_before_slash_tail1[1]
            if before_slash:
                tail[0].append(simple_arg1)
            else:
                tail[1].append(simple_arg1)
            return varargslist_before_slash_tail1
    else:
        return py_syntax_error(ts, None)

def py_parse_testlist_star_expr(ts):
    if ts.token in py_tokenset_1:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        test1 = py_parse_test(ts)
        test1 = test1
        tests = [test1]
        dangling_comma = False
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_1):
                dangling_comma = True
                break
            test2 = py_parse_test(ts)
            tests.append(test2)
        if len(tests) == 1 and not dangling_comma:
            return test1
        else:
            ast = Tuple(tests, Load())
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_augassign(ts):
    if ts.token == PLUSEQUAL:
        py_advance(ts)
        return Add()
    elif ts.token == MINEQUAL:
        py_advance(ts)
        return Sub()
    elif ts.token == STAREQUAL:
        py_advance(ts)
        return Mult()
    elif ts.token == ATEQUAL:
        py_advance(ts)
        return MatMult()
    elif ts.token == SLASHEQUAL:
        py_advance(ts)
        return Div()
    elif ts.token == PERCENTEQUAL:
        py_advance(ts)
        return Mod()
    elif ts.token == AMPEREQUAL:
        py_advance(ts)
        return BitAnd()
    elif ts.token == VBAREQUAL:
        py_advance(ts)
        return BitOr()
    elif ts.token == CIRCUMFLEXEQUAL:
        py_advance(ts)
        return BitXor()
    elif ts.token == LEFTSHIFTEQUAL:
        py_advance(ts)
        return LShift()
    elif ts.token == RIGHTSHIFTEQUAL:
        py_advance(ts)
        return RShift()
    elif ts.token == DOUBLESTAREQUAL:
        py_advance(ts)
        return Pow()
    elif ts.token == DOUBLESLASHEQUAL:
        py_advance(ts)
        return FloorDiv()
    else:
        return py_syntax_error(ts, None)

def py_parse_break_stmt(ts):
    if ts.token == BREAK:
        ast = set_start_end_1token(ts, Break())
        py_advance(ts)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_continue_stmt(ts):
    if ts.token == CONTINUE:
        ast = set_start_end_1token(ts, Continue())
        py_advance(ts)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_return_stmt(ts):
    if ts.token == RETURN:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        value = None
        py_advance(ts)
        if ts.token in py_tokenset_1:
            testlist_star_expr1 = py_parse_testlist_star_expr(ts)
            value = testlist_star_expr1
            
        ast = Return(value)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_raise_stmt(ts):
    if ts.token == RAISE:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        exc = None
        cause = None
        py_advance(ts)
        if ts.token in py_tokenset_1:
            test1 = py_parse_test(ts)
            exc = test1
            if ts.token == FROM:
                py_advance(ts)
                test2 = py_parse_test(ts)
                cause = test2
        ast = Raise(exc, cause)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_import_name(ts):
    if ts.token == IMPORT:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        dotted_as_names1 = py_parse_dotted_as_names(ts)
        ast = Import(dotted_as_names1)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_expr(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        xor_expr1 = py_parse_xor_expr(ts)
        ast = xor_expr1
        while ts.token == VBAR:
            py_advance(ts)
            xor_expr2 = py_parse_xor_expr(ts)
            ast = BinOp(ast, BitOr(), xor_expr2)
            set_start_end(ts, lineno, col_offset, ast)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_except_block(ts):
    if ts.token == EXCEPT:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts); name = None; type = None
        py_advance(ts)
        if ts.token in py_tokenset_1:
            test1 = py_parse_test(ts)
            type = test1
            if ts.token == AS:
                py_advance(ts)
                if ts.token == NAME:
                    name = token(ts)
                    py_advance(ts)
                else:
                    return py_syntax_error(ts, None)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        suite1 = py_parse_suite(ts)
        ast = ExceptHandler(type, name, suite1)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_argument(ts):
    if ts.token in py_tokenset_1:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        test1 = py_parse_test(ts)
        if ts.token == EQUAL:
            py_advance(ts)
            test2 = py_parse_test(ts)
            if isinstance(test1, Name):
                ast = keyword(test1.id, test2)
                return set_start_end(ts, lineno, col_offset, ast)
            else:
                return py_syntax_error(ts, 'expression cannot contain assignment, perhaps you meant "=="?')
        return test1
    elif ts.token == DOUBLESTAR:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        test1 = py_parse_test(ts)
        ast = keyword(None, test1)
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token == STAR:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        test1 = py_parse_test(ts)
        ast = Starred(test1, Load())
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_comparison(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        expr1 = py_parse_expr(ts)
        ops = []
        comparators = []
        while ts.token in py_tokenset_12:
            comp_op1 = py_parse_comp_op(ts)
            expr2 = py_parse_expr(ts)
            ops.append(comp_op1)
            comparators.append(expr2)
        if len(ops) == 0:
            return expr1
        else:
            ast = Compare(expr1, ops, comparators)
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_args(ts):
    if ts.token == STAR:
        py_advance(ts)
        vararg = None
        if ts.token == NAME:
            vararg = set_start_end_1token(ts, arg(token(ts), None, None))
            py_advance(ts)
        kw_args = None
        if ts.token == COMMA:
            args_tail1 = py_parse_args_tail(ts)
            kw_args = args_tail1
        if kw_args is None:
            return [vararg, [], None]
        else:
            return list_concat([vararg], kw_args) # [vararg, kw_only, kwarg]
    else:
        return py_syntax_error(ts, None)

def py_parse_kwargs(ts):
    if ts.token == DOUBLESTAR:
        py_advance(ts)
        if ts.token == NAME:
            a = arg(token(ts), None, None)
            set_start_end_1token(ts, a)
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if ts.token == COMMA:
            py_advance(ts)
        return a
    else:
        return py_syntax_error(ts, None)

def py_parse_simple_arg(ts):
    if ts.token == NAME:
        a = arg(token(ts), None, None); default_ = None
        set_start_end_1token(ts, a)
        py_advance(ts)
        if ts.token == EQUAL:
            py_advance(ts)
            test1 = py_parse_test(ts)
            default_ = test1
        return [a, default_]
    else:
        return py_syntax_error(ts, None)

def py_parse_varargslist_before_slash_tail(ts):
    if ts.token == COMMA:
        py_advance(ts)
        if ts.token in py_tokenset_13:
            if ts.token in py_tokenset_7:
                varargslist_before_slash1 = py_parse_varargslist_before_slash(ts)
                return varargslist_before_slash1
            else:
                py_advance(ts)
                if ts.token in py_tokenset_14:
                    if ts.token == STAR:
                        args1 = py_parse_args(ts)
                        return list_concat([[], []], args1), True
                    elif ts.token == DOUBLESTAR:
                        kwargs1 = py_parse_kwargs(ts)
                        return [[], [], None, [], kwargs1], True
                    else:
                        py_advance(ts)
                        if ts.token == NAME:
                            varargslist_after_slash1 = py_parse_varargslist_after_slash(ts)
                            return varargslist_after_slash1, True
                return [[], [], None, [], None], True
    else:
        return py_syntax_error(ts, None)

def py_parse_dotted_as_names(ts):
    if ts.token == NAME:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        dotted_as_name1 = py_parse_dotted_as_name(ts)
        names = [dotted_as_name1]
        while ts.token == COMMA:
            py_advance(ts)
            dotted_as_name2 = py_parse_dotted_as_name(ts)
            names.append(dotted_as_name2)
        return names
    else:
        return py_syntax_error(ts, None)

def py_parse_xor_expr(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        and_expr1 = py_parse_and_expr(ts)
        ast = and_expr1
        while ts.token == CIRCUMFLEX:
            py_advance(ts)
            and_expr2 = py_parse_and_expr(ts)
            ast = BinOp(ast, BitXor(), and_expr2)
            set_start_end(ts, lineno, col_offset, ast)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_comp_op(ts):
    if ts.token == LESS:
        py_advance(ts)
        return Lt()
    elif ts.token == GREATER:
        py_advance(ts)
        return Gt()
    elif ts.token == EQEQUAL:
        py_advance(ts)
        return Eq()
    elif ts.token == GREATEREQUAL:
        py_advance(ts)
        return GtE()
    elif ts.token == LESSEQUAL:
        py_advance(ts)
        return LtE()
    elif ts.token == NOTEQUAL:
        py_advance(ts)
        return NotEq()
    elif ts.token == IN:
        py_advance(ts)
        return In()
    elif ts.token == NOT:
        py_advance(ts)
        if ts.token == IN:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return NotIn()
    elif ts.token == IS:
        py_advance(ts)
        if ts.token == NOT:
            py_advance(ts)
            return IsNot()
        return Is()
    else:
        return py_syntax_error(ts, None)

def py_parse_args_tail(ts):
    if ts.token == COMMA:
        py_advance(ts)
        args_tail_after_comma1 = py_parse_args_tail_after_comma(ts)
        return args_tail_after_comma1
    else:
        return py_syntax_error(ts, None)

def py_parse_varargslist_after_slash(ts):
    if ts.token == NAME:
        simple_arg1 = py_parse_simple_arg(ts)
        varargslist_after_slash_tail1 = None
        if ts.token == COMMA:
            varargslist_after_slash_tail1 = py_parse_varargslist_after_slash_tail(ts)
        if varargslist_after_slash_tail1 is None:
            return [[], [simple_arg1], None, [], None] # [posonly, args, vararg, kw_only, kwargs]
        else:
            varargslist_after_slash_tail1[1].append(simple_arg1)
            return varargslist_after_slash_tail1
    else:
        return py_syntax_error(ts, None)

def py_parse_dotted_as_name(ts):
    if ts.token == NAME:
        dotted_name1 = py_parse_dotted_name(ts)
        asname = None
        if ts.token == AS:
            py_advance(ts)
            if ts.token == NAME:
                asname = token(ts)
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
        return alias(dotted_name1, asname)
    else:
        return py_syntax_error(ts, None)

def py_parse_and_expr(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        shift_expr1 = py_parse_shift_expr(ts)
        ast = shift_expr1
        while ts.token == AMPER:
            py_advance(ts)
            shift_expr2 = py_parse_shift_expr(ts)
            ast = BinOp(ast, BitAnd(), shift_expr2)
            set_start_end(ts, lineno, col_offset, ast)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_args_tail_after_comma(ts):
    if ts.token == NAME:
        simple_arg1 = py_parse_simple_arg(ts)
        if ts.token == COMMA:
            py_advance(ts)
            if ts.token == NAME:
                args_tail_after_comma1 = py_parse_args_tail_after_comma(ts)
                args_tail_after_comma1[0].append(simple_arg1) # must be reversed later
                return args_tail_after_comma1
            elif ts.token == DOUBLESTAR:
                kwargs1 = py_parse_kwargs(ts)
                return [[simple_arg1], kwargs1]
            else:
                return py_syntax_error(ts, None)
    else:
        return py_syntax_error(ts, None)

def py_parse_varargslist_after_slash_tail(ts):
    if ts.token == COMMA:
        py_advance(ts)
        if ts.token in py_tokenset_7:
            if ts.token == NAME:
                varargslist_after_slash1 = py_parse_varargslist_after_slash(ts)
                return varargslist_after_slash1
            elif ts.token == STAR:
                args1 = py_parse_args(ts)
                return list_concat([[], []], args1)
            else:
                kwargs1 = py_parse_kwargs(ts)
                return [[], [], None, [], kwargs1]
        return [[], [], None, [], None] # [posonly, args, vararg, kw_only, kwargs]
    else:
        return py_syntax_error(ts, None)

def py_parse_dotted_name(ts):
    if ts.token == NAME:
        dotted_name = token(ts)
        py_advance(ts)
        while ts.token == DOT:
            py_advance(ts)
            if ts.token == NAME:
                dotted_name = dotted_name + '.' + token(ts)
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
        return dotted_name
    else:
        return py_syntax_error(ts, None)

def py_parse_shift_expr(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        arith_expr1 = py_parse_arith_expr(ts)
        ast = arith_expr1
        while ts.token == LEFTSHIFT or ts.token == RIGHTSHIFT:
            if ts.token == LEFTSHIFT:
                op = LShift()
            else:
                op = RShift()
            py_advance(ts)
            arith_expr2 = py_parse_arith_expr(ts)
            ast = BinOp(ast, op, arith_expr2)
            set_start_end(ts, lineno, col_offset, ast)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_arith_expr(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        term1 = py_parse_term(ts)
        ast = term1
        while ts.token == PLUS or ts.token == MINUS:
            if ts.token == PLUS:
                op = Add()
            else:
                op = Sub()
            py_advance(ts)
            term2 = py_parse_term(ts)
            ast = BinOp(ast, op, term2)
            set_start_end(ts, lineno, col_offset, ast)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_term(ts):
    if ts.token in py_tokenset_11:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        factor1 = py_parse_factor(ts)
        ast = factor1
        while ts.token in py_tokenset_15:
            if ts.token == STAR:
                op = Mult()
            elif ts.token == SLASH:
                op = Div()
            elif ts.token == AT:
                op = MatMult()
            elif ts.token == DOUBLESLASH:
                op = FloorDiv()
            else:
                op = Mod()
            py_advance(ts)
            factor2 = py_parse_factor(ts)
            ast = BinOp(ast, op, factor2)
            set_start_end(ts, lineno, col_offset, ast)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_factor(ts):
    if ts.token in py_tokenset_16:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        if ts.token == PLUS:
            op = UAdd()
        elif ts.token == MINUS:
            op = USub()
        else:
            op = Invert()
        py_advance(ts)
        factor1 = py_parse_factor(ts)
        ast = UnaryOp(op, factor1)
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token in py_tokenset_17:
        power1 = py_parse_power(ts)
        return power1
    else:
        return py_syntax_error(ts, None)

def py_parse_power(ts):
    if ts.token in py_tokenset_17:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        atom_expr1 = py_parse_atom_expr(ts)
        if ts.token == DOUBLESTAR:
            py_advance(ts)
            factor1 = py_parse_factor(ts)
            ast = BinOp(atom_expr1, Pow(), factor1)
            return set_start_end(ts, lineno, col_offset, ast)
        return atom_expr1
    else:
        return py_syntax_error(ts, None)

def py_parse_atom_expr(ts):
    if ts.token in py_tokenset_17:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        
        atom1 = py_parse_atom(ts)
        ast = atom1
        while ts.token in py_tokenset_18:
            trailer1 = py_parse_trailer(ts,lineno,col_offset,ast)
            ast = trailer1
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_atom(ts):
    if ts.token == LPAR:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        x = ([], True)
        if ts.token in py_tokenset_1:
            as_list = True
            testlist_comp1 = py_parse_testlist_comp(ts,as_list)
            x = testlist_comp1
        if ts.token == RPAR:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if x[1]:
            ast = Tuple(x[0], Load())
            set_start_end(ts, lineno, col_offset, ast)
        else:
            ast = x[0][0]
        return ast
    elif ts.token == LSQB:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        ast = None
        if ts.token in py_tokenset_1:
            as_list = True
            testlist_comp1 = py_parse_testlist_comp(ts,as_list)
            ast = List(testlist_comp1[0], Load())
        if ts.token == RSQB:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if ast is None:
            ast = List([], Load())
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token == LBRACE:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        py_advance(ts)
        ast = None
        if ts.token in py_tokenset_1:
            dictorsetmaker1 = py_parse_dictorsetmaker(ts)
            ast = dictorsetmaker1
        if ts.token == RBRACE:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        if ast is None:
            ast = Dict([], [])
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token == NAME:
        ast = set_start_end_1token(ts, Name(token(ts), Load()))
        py_advance(ts)
        return ast
    elif ts.token == NUMBER:
        ast = set_start_end_1token(ts, Constant(get_value(ts), None))
        py_advance(ts)
        return ast
    elif ts.token == STRING:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        end_lineno = 0
        end_col_offset = 0
        value = None
        current_kind = get_kind(ts)
        
        while True:
            temp = get_value(ts)
            temp_kind = get_kind(ts)
            if value is None:
                value = temp
            elif current_kind != temp_kind:
                py_syntax_error(ts, 'cannot mix bytes and nonbytes literals')
            else:
                value += temp
            end_lineno = get_end_lineno(ts)
            end_col_offset = get_end_col_offset(ts)
            
            py_advance(ts)
            if not (ts.token == STRING):
                break
        ast = Constant(value, None)
        ast.lineno = lineno
        ast.col_offset = col_offset
        ast.end_lineno = end_lineno
        ast.end_col_offset = end_col_offset
        return ast
    elif ts.token == ELLIPSIS:
        ast = set_start_end_1token(ts, Constant(..., None))
        py_advance(ts)
        return ast
    elif ts.token == NONE:
        ast = set_start_end_1token(ts, Constant(None, None))
        py_advance(ts)
        return ast
    elif ts.token == TRUE:
        ast = set_start_end_1token(ts, Constant(True, None))
        py_advance(ts)
        return ast
    elif ts.token == FALSE:
        ast = set_start_end_1token(ts, Constant(False, None))
        py_advance(ts)
        return ast
    else:
        return py_syntax_error(ts, None)

def py_parse_trailer(ts,lineno,col_offset,ast):
    if ts.token == LPAR:
        py_advance(ts)
        arglist1 = [[], []]
        if ts.token in py_tokenset_9:
            arglist1 = py_parse_arglist(ts)
        ast = Call(ast, arglist1[0], arglist1[1])
        if ts.token == RPAR:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token == LSQB:
        py_advance(ts)
        subscriptlist1 = py_parse_subscriptlist(ts)
        ast = Subscript(ast, subscriptlist1, Load())
        if ts.token == RSQB:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return set_start_end(ts, lineno, col_offset, ast)
    elif ts.token == DOT:
        py_advance(ts)
        if ts.token == NAME:
            ast = Attribute(ast, token(ts), Load())
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_testlist_comp(ts,as_list):
    if ts.token in py_tokenset_1:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        namedexpr_test1 = py_parse_namedexpr_test(ts)
        namedexpr_tests = [namedexpr_test1]
        dangling_comma = False
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_1):
                dangling_comma = True
                break
            namedexpr_test2 = py_parse_namedexpr_test(ts)
            namedexpr_tests.append(namedexpr_test2)
        if as_list:
            return (namedexpr_tests, dangling_comma or len(namedexpr_tests) != 1)
        elif len(namedexpr_tests) == 1 and not dangling_comma:
            return namedexpr_test1
        else:
            ast = Tuple(namedexpr_tests, Load())
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_dictorsetmaker(ts):
    if ts.token in py_tokenset_1:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        test1 = py_parse_test(ts)
        if ts.token == COLON:
            py_advance(ts)
        else:
            return py_syntax_error(ts, None)
        test2 = py_parse_test(ts)
        keys = [test1]
        values = [test2]
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_1):
                break
            test3 = py_parse_test(ts)
            if ts.token == COLON:
                py_advance(ts)
            else:
                return py_syntax_error(ts, None)
            test4 = py_parse_test(ts)
            keys.append(test3)
            values.append(test4)
        ast = Dict(keys, values)
        return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_subscriptlist(ts):
    if ts.token in py_tokenset_19:
        lineno = get_lineno(ts); col_offset = get_col_offset(ts)
        subscript1 = py_parse_subscript(ts)
        subscripts = [subscript1]
        has_slice = isinstance(subscript1, Slice)
        dangling_comma = False
        while ts.token == COMMA:
            py_advance(ts)
            if not (ts.token in py_tokenset_19):
                dangling_comma = True
                break
            subscript2 = py_parse_subscript(ts)
            subscripts.append(subscript2)
            has_slice = has_slice or isinstance(subscript2, Slice)
            
        if len(subscripts) == 1 and not dangling_comma:
            return subscripts[0]
        elif has_slice:
            ast = ExtSlice(subscripts)
            return set_start_end(ts, lineno, col_offset, ast)
        else:
            items = []
            for s in items:
                items.append(s.value)
            ast = Tuple(items, Load())
            set_start_end(ts, lineno, col_offset, ast)
            ast = Index(ast)
            return set_start_end(ts, lineno, col_offset, ast)
    else:
        return py_syntax_error(ts, None)

def py_parse_subscript(ts):
    if ts.token in py_tokenset_1:
        test1 = py_parse_test(ts)
        if ts.token == COLON:
            lower = test1
            subscript_tail1 = py_parse_subscript_tail(ts,lower)
            return subscript_tail1
        return Index(test1)
    elif ts.token == COLON:
        lower = None
        subscript_tail1 = py_parse_subscript_tail(ts,lower)
        return subscript_tail1
    else:
        return py_syntax_error(ts, None)

def py_parse_subscript_tail(ts,lower):
    if ts.token == COLON:
        py_advance(ts)
        test1 = None
        if ts.token in py_tokenset_1:
            test1 = py_parse_test(ts)
        sliceop1 = None
        if ts.token == COLON:
            sliceop1 = py_parse_sliceop(ts)
        return Slice(lower, test1, sliceop1)
    else:
        return py_syntax_error(ts, None)

def py_parse_sliceop(ts):
    if ts.token == COLON:
        py_advance(ts)
        if ts.token in py_tokenset_1:
            test1 = py_parse_test(ts)
            return test1
        return None
    else:
        return py_syntax_error(ts, None)


@nocompile
def py_tokenset(*elements):
    return elements

py_tokenset_1 = py_tokenset(TILDE,NAME,NUMBER,STRING,LBRACE,LPAR,LSQB,PLUS,MINUS,NOT,LAMBDA,ELLIPSIS,FALSE,NONE,TRUE)
py_tokenset_2 = py_tokenset(NAME,NUMBER,STRING,LPAR,LSQB,PLUS,MINUS,LBRACE,TILDE,ELLIPSIS,FALSE,NONE,TRUE,ASSERT,BREAK,CLASS,CONTINUE,DEF,FOR,GLOBAL,IF,IMPORT,LAMBDA,NONLOCAL,NOT,PASS,RAISE,RETURN,TRY,WHILE,WITH)
py_tokenset_3 = py_tokenset(NAME,NUMBER,STRING,NEWLINE,LPAR,LSQB,PLUS,MINUS,LBRACE,TILDE,ELLIPSIS,FALSE,NONE,TRUE,ASSERT,BREAK,CLASS,CONTINUE,DEF,FOR,GLOBAL,IF,IMPORT,LAMBDA,NONLOCAL,NOT,PASS,RAISE,RETURN,TRY,WHILE,WITH)
py_tokenset_4 = py_tokenset(NAME,NUMBER,STRING,LPAR,LSQB,PLUS,MINUS,LBRACE,TILDE,ELLIPSIS,FALSE,NONE,TRUE,ASSERT,BREAK,CONTINUE,GLOBAL,IMPORT,LAMBDA,NONLOCAL,NOT,PASS,RAISE,RETURN)
py_tokenset_5 = py_tokenset(DEF,FOR,IF,TRY,WHILE,WITH,CLASS)
py_tokenset_6 = py_tokenset(TILDE,NAME,NUMBER,STRING,LBRACE,LPAR,LSQB,PLUS,MINUS,NOT,ELLIPSIS,FALSE,NONE,TRUE)
py_tokenset_7 = py_tokenset(STAR,NAME,DOUBLESTAR)
py_tokenset_8 = py_tokenset(CONTINUE,RAISE,RETURN,BREAK)
py_tokenset_9 = py_tokenset(TILDE,NAME,NUMBER,STRING,DOUBLESTAR,TRUE,LPAR,LSQB,PLUS,MINUS,NOT,LAMBDA,STAR,ELLIPSIS,FALSE,NONE,LBRACE)
py_tokenset_10 = py_tokenset(PLUSEQUAL,MINEQUAL,STAREQUAL,SLASHEQUAL,PERCENTEQUAL,AMPEREQUAL,VBAREQUAL,CIRCUMFLEXEQUAL,LEFTSHIFTEQUAL,RIGHTSHIFTEQUAL,DOUBLESTAREQUAL,DOUBLESLASHEQUAL,ATEQUAL)
py_tokenset_11 = py_tokenset(TILDE,NAME,NUMBER,STRING,TRUE,LPAR,LSQB,PLUS,MINUS,ELLIPSIS,FALSE,NONE,LBRACE)
py_tokenset_12 = py_tokenset(IN,IS,NOT,LESS,GREATER,EQEQUAL,NOTEQUAL,LESSEQUAL,GREATEREQUAL)
py_tokenset_13 = py_tokenset(STAR,NAME,DOUBLESTAR,SLASH)
py_tokenset_14 = py_tokenset(STAR,DOUBLESTAR,COMMA)
py_tokenset_15 = py_tokenset(STAR,SLASH,AT,DOUBLESLASH,PERCENT)
py_tokenset_16 = py_tokenset(TILDE,PLUS,MINUS)
py_tokenset_17 = py_tokenset(NAME,NUMBER,STRING,LBRACE,LPAR,LSQB,ELLIPSIS,FALSE,NONE,TRUE)
py_tokenset_18 = py_tokenset(LSQB,LPAR,DOT)
py_tokenset_19 = py_tokenset(TILDE,NAME,NUMBER,STRING,LBRACE,LPAR,LSQB,COLON,PLUS,MINUS,NOT,LAMBDA,ELLIPSIS,FALSE,NONE,TRUE)

def py_parse(source, mode, context):

    # mode = 'exec'/'eval'/'single'

    init_stats()
    ts = TokenizerState(source, context)
    py_advance(ts)

    if mode == 'exec':
        if True:
            return py_parse_file_input(ts)
        else:
            return py_syntax_error(ts, None)

    elif mode == 'eval':
        if ts.token in py_tokenset_1:
            return py_parse_eval_input(ts)
        else:
            return py_syntax_error(ts, None)

    elif mode == 'single':
        if ts.token in py_tokenset_2:
            return py_parse_single_input(ts)
        else:
            return py_syntax_error(ts, None)


def py_syntax_error(ts, msg):
    if msg is None:
        msg = "invalid syntax"
    if ts.context and dict_has(ts.context, "syntaxError"):
        ts.context.syntaxError(get_lineno(ts)-1, get_col_offset(ts), get_end_lineno(ts)-1, get_end_col_offset(ts), msg);
        return
    line_num = ts.line_num
    line_start = 0
    while line_num > 0:
        line_start = 1+ts.buf.find("\n", line_start)
        line_num -= 1
    line_end = ts.buf.find("\n", line_start)
    line = source(ts, line_start, line_end)
    stripped_line = line.lstrip()
    print("  File \"" + "unknown.py" + "\", line " + str(ts.line_num+1))
    print("    " + stripped_line)
    print("    " + " "*(ts.start - line_start - (len(line) - len(stripped_line))) + "^")
    # print("SyntaxError: " + msg)
    # exit()
    raise SyntaxError(msg)

def py_advance(ts):
    ts.prev_end_lineno = get_end_lineno(ts)
    ts.prev_end_col_offset = get_end_col_offset(ts)
    get_token(ts)
    # py_show_token(ts)

def py_show_token(ts):
    t = ts.token
    name = tok_name[t]
    if t == NAME or t == STRING or t == NUMBER:
        print(name + " " + token(ts))
    else:
        print(name)
