from pyinterp._runtime import *
from pyinterp.pyinterp.asciidata import *

# NOTE: required to be able to instantiate ast nodes from pyinterp
from pyinterp.zast._zast import *

import pyinterp.zast._zast as AST
import pyinterp.zast as zast
AST.parse = zast.parse

debug = False
single_step = True

# Sentinel for marking an attribute as absent
class Absent:
    def __str__(self):
        return "<absent>"

absent = Absent()

# Sentinel returned by next for marking the end of a for-loop
class ForLoopEndMarker:
    def __str__(self):
        return "<for loop terminate marker>"

for_loop_end_marker = ForLoopEndMarker()

# Sentinel for marking empty cells in the dynamic array of a list
class EmptyCell:
    def __str__(self):
        return "<empty cell>"

empty_cell = EmptyCell()

class Context:
    def __init__(self, rte, cont, ast):
        self.rte = rte
        self.cont = cont
        self.ast = ast

    # NOTE: unused for now
    def copy(self):
        return Context(self.rte.copy(), self.cont, self.ast)

    def call(self):
        return self.cont(self.rte)

# Label depth is use to limit the unwinding of
# the ctrl constructs (while, try/catch/finally, with, etc)
# NOTE: inspired from codeboot JS
class CTCtrlLabel:
    def __init__(self, ctrl_next, ids, ast):
        self.ctrl_next = ctrl_next
        self.ids = ids
        self.ast = ast

# class RTE:
#     def __init__(self, global_env, locals_env, builtins, stack, ctrl_env):
#         self.globals_env = globals_env
#         self.locals_env = locals_env
#         self.builtins = builtins
#         self.stack = stack
#         self.ctrl_env = ctrl_env

class CTE:
    def __init__(self, callee, callee_type, locals_env, closure_table, lex_env, ctrl_env, external_context, parent):
        self.callee = callee
        self.callee_type = callee_type
        self.locals_env = locals_env
        self.closure_table = closure_table
        self.lex_env = lex_env
        self.ctrl_env = ctrl_env
        self.external_context = external_context
        self.parent = parent

def make_function_cte(callee, locals_env, closure_table, lex_env, ctrl_env, external_context, parent):
    return CTE(callee, "function", locals_env, closure_table, lex_env, ctrl_env, external_context, parent)

def make_class_cte(callee, locals_env, closure_table, lex_env, ctrl_env, external_context, parent):
    return CTE(callee, "class", locals_env, closure_table, lex_env, ctrl_env, external_context, parent)

def cte_is_in_function(cte):
    return cte.callee_type == "function"

def cte_is_in_class(cte):
    return cte.callee_type == "class"

def get_cte_function_parent(cte):
    parent = cte
    while True:
        parent = parent.parent

        if parent is None:
            return None
        elif cte_is_in_function(parent):
            return parent
        elif cte_is_in_class(parent):
            pass
        else:
            # fail safe
            assert False, "cte callee type in unknown"
            break

def get_cte_locals_env(cte):
    return cte.locals_env

def get_cte_closure_table(cte):
    return cte.closure_table

def get_cte_locals_env_var(cte, name):
    le = get_cte_locals_env(cte)
    return dict_get(le, name, None)

def get_cte_safe_for_space(cte):
    return dict_get(cte.external_context, 'safe_for_space', True)

# NOTE: inspired from codeboot JS
def CTCtrl_controlContext(cte, ast):
    ctrl_env = cte.ctrl_env
    if ctrl_env is None or ctrl_env.ast is not ast:
        ids = make_dict()
        ctrl_env = CTCtrlLabel(ctrl_env, ids, ast)
        cte = CTE(cte.callee,
                  cte.callee_type,
                  cte.locals_env,
                  cte.closure_table,
                  cte.lex_env,
                  ctrl_env,
                  cte.external_context,
                  cte.parent)
    # Could be simplify
    dict_set(ctrl_env.ids, 'break point', True)
    dict_set(ctrl_env.ids, 'continue point', True)
    return cte

def CTCtrl_labelLookup(cte, id_str):
    ctrl_env = cte.ctrl_env
    depth = 0
    while ctrl_env is not None:
        if isinstance(ctrl_env, CTCtrlLabel) and dict_get(ctrl_env.ids, id_str, False):
            result = make_dict()
            dict_set(result, 'depth', depth)
            dict_set(result, 'ast', ctrl_env.ast)
            return result
        ctrl_env = ctrl_env.ctrl_next
        depth += 1
    return None

def CT_raise_with_msg(cte, ast, error_kind, msg):
    compilationError = dict_get(cte.external_context,
                            'compilationError',
                            default_compilation_error)
    return compilationError(ast.lineno-1,
                        ast.col_offset,
                        ast.end_lineno-1,
                        ast.end_col_offset,
                        error_kind,
                        msg)

def CT_raise_syntax_error_with_msg(cte, ast, msg):
    return CT_raise_with_msg(cte, ast, "SyntaxError", msg)

# continuation call helper
def cont_no_val(ctx):
    return ctx.cont(ctx.rte)

def cont_obj(ctx, val):
    return ctx.cont(ctx.rte, val)

def cont_bool(ctx, val):
    return ctx.cont(ctx.rte, om_bool(val))

def cont_int(ctx, val):
    return ctx.cont(ctx.rte, om_int(val))

def cont_int_from_num(ctx, val):
    return ctx.cont(ctx.rte, om_int_from_num(val))

def cont_float(ctx, val):
    return ctx.cont(ctx.rte, om_float(val))

def cont_str(ctx, val):
    return ctx.cont(ctx.rte, om_str(val))

def cont_list(ctx, val, len_):
    return ctx.cont(ctx.rte, om_list(val, len_))

def cont_list_of_str(ctx, val, len_):
    inner_len = get_list_inner_len(len_)
    new_lst = list_new(inner_len, empty_cell)
    i = 0
    while i < len_:
        new_lst[i] = om_str(val[i])
        i += 1
    return ctx.cont(ctx.rte, om_list(new_lst, len_))

def cont_method(ctx, fn, instance):
    return ctx.cont(ctx.rte, om_method(fn, instance))

def cont_DOMElement(ctx, elem):
    return ctx.cont(ctx.rte, om_DOMElement(elem))

def cont_tuple(ctx, val):
    return ctx.cont(ctx.rte, om_tuple(val))

def with_rte(ctx, rte):
    return Context(rte, ctx.cont, ctx.ast)

def with_cont(ctx, cont):
    return Context(ctx.rte, cont, ctx.ast)

def with_catch(ctx, catcher_cont):
    unhandled_rte = ctx.rte
    def cont(_, val):
        return ctx.cont(unhandled_rte, val)
    next_rte = make_rte_with_handler(unhandled_rte, catcher_cont)
    return Context(next_rte, cont, ctx.ast)

def with_cont_and_catch(ctx, cont, catcher_cont):
    unhandled_rte = ctx.rte
    def exit_cont(_, val):
        return cont(unhandled_rte, val)
    next_rte = make_rte_with_handler(unhandled_rte, catcher_cont)
    return Context(next_rte, exit_cont, ctx.ast)

def make_out_of_ast_context(rte, cont):
    # Note use only if there is no access to the ctx or the ast
    # only the ctx and the rte are available, use 'with_rte', this will use the ast stored in the ctx
    return Context(rte, cont, None)

def make_out_of_ast_context_with_catch(rte, cont, catcher_cont):
    return with_catch(Context(rte, cont, None), catcher_cont)

def with_rte(ctx, rte):
    return Context(rte, ctx.cont, ctx.ast)


class OM_object:
    """
    klass: the __class__ attribute of the object
    attribs: the attributes of the object
    serial: the serial number of the object.
    """

class OM_getset_descriptor(OM_object):
    """
    This type serves a similar role to the cPython getset_descriptor
    Its behaviour is not documented in cPython doc, so it may differ

    getset_name: name of the attribute this getset_descriptor handles
    getter: native procedure ctx -> OM_object -> cont(OM_object) used by __get__
    setter: native procedure ctx -> OM_object -> OM_object -> cont(OM_None) used by __set__
    objclass: slot for the __objclass__ of the getset_descriptor
    """

class OM_type(OM_object):
    """
    mro: the __mro__ attribute of class type
    bases: the bases of the class
    instance_creator: function which creates instances of this base type
    is_builtin: indicates if this type is a builtin type (bool)
    """

    def __str__(self):
        name = OM_get_object_class_name(self)
        return "<OM_type (" + name + ")>"

class OM_NotImplemented(OM_object):
    pass

# bool, int, str, ...
class OM_box(OM_object):
    """
    value: the inner value wrapped into the object model.
    """

    def __str__(self):
        value = OM_get_boxed_value(self)
        return "<OM_box (" + str(value) + ")>"

class OM_tuple(OM_object):
    """
    seq: the inner sequence of objects
    """

class OM_list(OM_object):
    """
    len: virtual number of elements in the list
    seq: the inner sequence of objects
    """

class OM_struct(OM_object):
    """
    Used to implement the more_builtins.struct class
    """

class OM_DOMDocument(OM_object):
    pass

class OM_DOMElement(OM_object):
    """
    elem: in codeBoot, stores the JS DOM element object
    """

class OM_range(OM_object):
    """
    start: start of the range (om int)
    stop: stop of the range (om int)
    step: step of the range (om int)
    """

class OM_map(OM_object):
    """
    iterators: the underlying iterators being mapped onto (list)
    fn: the function being mapped onto
    """

class OM_filter(OM_object):
    """
    iterator: the underlying iterator being fitlered
    fn: the filter function
    """

class OM_slice(OM_object):
    """
    start: start of the slice
    stop: stop of the slice
    step: step of the slice
    """

class OM_dict(OM_object):
    pass

class OM_iterator(OM_object):
    """
    obj: object the iterator is iterating over
    index: current index
    """

class OM_module(OM_object):
    pass

class OM_function(OM_box):
    """
    arity: the arity of the function object
    signature: the signature of the function object
    body: the code of the function object
    closure: array of variable closure
    locals: names of local variables
    var_context: context of all accessible variables in scope
    parent_lexical_scope: in non safe_for_space mode, stores the parent scope
    """

class OM_method(OM_box):
    """
    self: bound instance
    func: function to which the instance is bound
    """

# value is either class or instance
class OM_WrapperDescriptor(OM_object):
    """
    cls: the class which hold this WrapperDescriptor object
    code: the code of the WrapperDescriptor object
    """

class OM_MethodWrapper(OM_object):
    """
    instance: the obj from which the method is invoke
    code: the code of the method-wrapper
    """

class OM_NoneType(OM_object):
    pass

class OM_BaseException(OM_object):
    """
    locations: stack of ast nodes where the exception was thrown
    """

class OM_TextIOWrapper(OM_object):
    """
    name: filename
    mode: file mode
    """

class OM_csv_reader(OM_object):
    """
    lines: lines iterator
    """

def make_frame(rte, cont, ast):
    return [rte, cont, ast]

def frame_rte(frame):
    return frame[0]

def frame_cont(frame):
    return frame[1]

def frame_ast(frame):
    return frame[2]

def make_rte_from_parent(rte, globals_env, locals_env, current_func, stack, ctrl_env):
    serial_counter = rte_serial_counter(rte)
    sys_modules = rte_sys_modules(rte)
    seen_repr_stack = rte_get_seen_repr_stack(rte)
    vm = rte_vm(rte)
    options = rte_options(rte)
    builtins = rte_builtins(rte)
    builtins_module = rte_builtins_module(rte)
    class_parent_locals = rte_class_parent_locals(rte)

    new_rte = make_struct()

    struct_set(new_rte, "serial_counter", serial_counter)
    struct_set(new_rte, "globals", globals_env)
    struct_set(new_rte, "locals", locals_env)
    struct_set(new_rte, 'current_func', current_func)
    struct_set(new_rte, "builtins", builtins)
    struct_set(new_rte, "builtins_module", builtins_module)
    struct_set(new_rte, "stack", stack)
    struct_set(new_rte, "ctrl_env", ctrl_env)
    struct_set(new_rte, "sys_modules", sys_modules)
    struct_set(new_rte, "class_parent_locals", class_parent_locals)
    rte_set_current_exc(new_rte, rte_get_current_exc(rte))
    rte_set_handler(new_rte, rte_get_handler(rte))
    rte_set_finally(new_rte, rte_get_finally(rte))
    rte_set_break_cont(new_rte, rte_get_break_cont(rte))
    rte_set_continue_cont(new_rte, rte_get_continue_cont(rte))

    # Used to accumulate objects repr seen when calling sem_repr, to avoid infinite loops in nested objects
    struct_set(new_rte, "seen_repr_stack", seen_repr_stack)

    struct_set(new_rte, "vm", vm)
    struct_set(new_rte, "options", options)

    return new_rte


def make_class_rte(rte, locals_env):
    new_rte = make_rte_from_parent(rte, rte_globals(rte), locals_env,
                                rte_current_func(rte), rte_stack(rte),
                                rte_ctrl_env(rte))
    class_parent_locals = rte_class_parent_locals(rte)

    # For nested classes, the parent scope is not the parent class but the parent function
    new_class_parent_locals = rte_locals(rte) if class_parent_locals is absent else class_parent_locals

    struct_set(new_rte, "class_parent_locals", new_class_parent_locals)
    rte_reset_continue_break(new_rte)
    return new_rte


def make_call_rte(rte, locals_env, called_func, stack):
    # When a call occurs, we create a new rte with new environment and stack info
    # We also remove any finally continuation which should not catch the return from the scope
    # This is ok because a finally only catched return's, whenever there is a try-finally block,
    # a handler should have been set to redirect exceptions to the finally code

    call_rte = make_rte_from_parent(rte, rte_globals(rte), locals_env, called_func, stack, rte_ctrl_env(rte))
    rte_remove_finally(call_rte)
    rte_reset_continue_break(call_rte)

    return call_rte


def make_loop_rte(rte, break_cont, continue_cont):
    new_rte = make_rte_copy(rte)
    rte_set_break_cont(new_rte, break_cont)
    rte_set_continue_cont(new_rte, continue_cont)
    return new_rte


def make_new_rte(globals_env, locals_env, builtins, builtins_module, options):
    def main_handler(exc):
        locations = OM_get_BaseException_locations(exc)
        last_location = locations[len(locations) - 1]

        dummy_ctx = Context(new_rte, lambda rte: None, last_location)

        exc_msg = om_simple_exception_format(dummy_ctx, exc)
        return expr_end_with_error(dummy_ctx, exc_msg)

    serial_counter = [0]
    sys_modules = make_dict()

    new_rte = make_struct()

    struct_set(new_rte, "serial_counter", serial_counter)
    struct_set(new_rte, "globals", globals_env)
    struct_set(new_rte, "locals", locals_env)
    struct_set(new_rte, 'current_func', absent)
    struct_set(new_rte, "builtins", builtins)
    struct_set(new_rte, "builtins_module", builtins_module)
    struct_set(new_rte, "stack", absent)
    struct_set(new_rte, "ctrl_env", absent)
    struct_set(new_rte, "sys_modules", sys_modules)
    struct_set(new_rte, "class_parent_locals", absent)
    rte_set_current_exc(new_rte, absent)
    rte_set_handler(new_rte, main_handler)
    rte_set_finally(new_rte, absent)
    rte_set_break_cont(new_rte, absent)
    rte_set_continue_cont(new_rte, absent)

    # Used to accumulate objects repr seen when calling sem_repr, to avoid infinite loops in nested objects
    struct_set(new_rte, "seen_repr_stack", [])

    struct_set(new_rte, "vm", absent)
    struct_set(new_rte, "options", options)

    return new_rte


def make_rte_copy(rte):
    new_rte = make_struct()

    struct_set(new_rte, "serial_counter", rte_serial_counter(rte))
    struct_set(new_rte, "globals", rte_globals(rte))
    struct_set(new_rte, "locals", rte_locals(rte))
    rte_set_current_func(new_rte, rte_current_func(rte))
    struct_set(new_rte, "builtins", rte_builtins(rte))
    struct_set(new_rte, "builtins_module", rte_builtins_module(rte))
    struct_set(new_rte, "stack", rte_stack(rte))
    struct_set(new_rte, "ctrl_env", rte_ctrl_env(rte))
    struct_set(new_rte, "sys_modules", rte_sys_modules(rte))
    struct_set(new_rte, "class_parent_locals", rte_class_parent_locals(rte))
    rte_set_current_exc(new_rte, rte_get_current_exc(rte))
    rte_set_handler(new_rte, rte_get_handler(rte))
    rte_set_finally(new_rte, rte_get_finally(rte))
    rte_set_break_cont(new_rte, rte_get_break_cont(rte))
    rte_set_continue_cont(new_rte, rte_get_continue_cont(rte))

    # Used to accumulate objects repr seen when calling sem_repr, to avoid infinite loops in nested objects
    struct_set(new_rte, "seen_repr_stack", rte_get_seen_repr_stack(rte))

    struct_set(new_rte, "vm", rte_vm(rte))
    struct_set(new_rte, "options", rte_options(rte))

    return new_rte


def make_rte_with_handler(rte, handler_code):
    new_rte = make_rte_copy(rte)
    rte_set_handler(new_rte, handler_code)
    return new_rte


def make_rte_with_handler_and_finally(rte, handler_code, final):
    new_rte = make_rte_copy(rte)

    break_cont = rte_get_break_cont(rte)
    continue_cont = rte_get_continue_cont(rte)

    if break_cont is not absent:
        def intercept_break():
            return final(lambda _: break_cont())
        rte_set_break_cont(new_rte, intercept_break)

    if continue_cont is not absent:
        def intercept_continue():
            return final(lambda _: continue_cont())
        rte_set_continue_cont(new_rte, intercept_continue)

    rte_set_handler(new_rte, handler_code)
    rte_set_finally(new_rte, final)
    return new_rte


def rte_serial_counter(rte):
    return struct_get(rte, 'serial_counter')

def rte_get_serial(rte):
    boxed_serial = struct_get(rte, 'serial_counter')
    serial = boxed_serial[0]
    boxed_serial[0] = serial + 1
    return serial

def rte_sys_modules(rte):
    return struct_get(rte, 'sys_modules')

def rte_add_to_sys_modules(rte, name, module):
    sys_modules = rte_sys_modules(rte)
    dict_set(sys_modules, name, module)

def rte_get_from_sys_modules(rte, name):
    sys_modules = rte_sys_modules(rte)
    return dict_get(sys_modules, name, absent)

def rte_globals(rte):
    return struct_get(rte, 'globals')

def rte_lexical_globals(rte):
    current_func = rte_current_func(rte)

    if current_func is absent:
        return rte_globals(rte)
    else:
        return OM_get_function_globals(current_func)

def rte_locals(rte):
    return struct_get(rte, 'locals')

def rte_current_func(rte):
    return struct_get(rte, 'current_func')

def rte_set_current_func(rte, fn):
    struct_set(rte, 'current_func', fn)

def rte_builtins(rte):
    return struct_get(rte, 'builtins')

def rte_builtins_module(rte):
    return struct_get(rte, 'builtins_module')

def rte_class_parent_locals(rte):
    return struct_get(rte, 'class_parent_locals')

def rte_stack(rte):
    return struct_get(rte, 'stack')

def rte_ctrl_env(rte):
    return struct_get(rte, 'ctrl_env')

def rte_vm(rte):
    return struct_get(rte, 'vm')

def rte_safe_for_space(rte):
    opt = rte_options(rte)
    if opt is None:
        return True
    else:
        return dict_get(opt, 'safe_for_space', True)

def rte_trace(rte):
    opt = rte_options(rte)
    if opt is None:
        return True
    else:
        return dict_get(opt, 'trace', True)

def rte_options(rte):
    return struct_get(rte, 'options')

# Return variable value or absent.
def rte_lookup_globals(rte, name):
    env = rte_lexical_globals(rte)
    result = dict_get(env, name, absent)
    return result

def rte_set_globals(rte, varname, val):
    env = rte_lexical_globals(rte)
    dict_set(env, varname, val)

def rte_lookup_locals(rte, name):
    env = rte_locals(rte)
    result = dict_get(env, name, absent) # should always recover a value, it may be absent
    return result

def rte_lookup_locals_boxed(rte, name):
    env = rte_locals(rte)
    result = dict_get(env, name, absent)[0] # should always recover a value, it may be absent
    return result

def rte_lookup_closure(rte, pos):
    func = rte_current_func(rte)
    value = OM_get_function_closure(func)[pos][0]

    return value

def rte_set_locals(rte, varname, val):
    env = rte_locals(rte)
    dict_set(env, varname, val)

def rte_set_locals_boxed(rte, varname, val):
    env = rte_locals(rte)
    slot = dict_get(env, varname, None) # Return None to cause crash if the varname is not present
    slot[0] = val

def rte_set_closure(rte, pos, val):
    func = rte_current_func(rte)
    slot = OM_get_function_closure(func)[pos]
    slot[0] = val

def rte_get_seen_repr_stack(rte):
    return struct_get(rte, "seen_repr_stack")

def rte_add_seen_repr(rte, obj):
    seen_repr_stack = rte_get_seen_repr_stack(rte)
    seen_repr = seen_repr_stack[len(seen_repr_stack) - 1]
    serial = OM_get_serial(obj, rte)
    dict_set(seen_repr, serial, obj)

def rte_check_seen_repr(rte, obj):
    seen_repr_stack = rte_get_seen_repr_stack(rte)
    serial = OM_get_serial(obj, rte)

    for seen_repr in seen_repr_stack:
        maybe_obj = dict_get(seen_repr, serial, absent)

        if maybe_obj is not absent and om_is(obj, maybe_obj):
            return True

    return False

def rte_repr_enter(rte):
    # Should never be None
    seen_repr_stack = rte_get_seen_repr_stack(rte)
    seen_repr_stack.append(make_dict())


def rte_repr_exit(rte):
    rte_get_seen_repr_stack(rte).pop()


def rte_set_current_exc(rte, exc):
    struct_set(rte, 'current_exc', exc)


def rte_get_current_exc(rte):
    return struct_get(rte, 'current_exc')


def rte_pop_current_exc(rte):
    exc = struct_get(rte, 'current_exc')
    struct_set(rte, 'current_exc', absent)
    return exc


def rte_set_handler(rte, handler):
    struct_set(rte, 'handler', handler)


def rte_remove_handler(rte):
    struct_set(rte, 'handler', absent)


def rte_get_handler(rte):
    return struct_get(rte, 'handler')


def rte_set_finally(rte, final):
    struct_set(rte, 'finally', final)


def rte_remove_finally(rte):
    struct_set(rte, 'finally', absent)


def rte_get_finally(rte):
    return struct_get(rte, 'finally')


def rte_set_break_cont(rte, br):
    struct_set(rte, 'break_cont', br)

def rte_get_break_cont(rte):
    return struct_get(rte, 'break_cont')


def rte_set_continue_cont(rte, cont):
    struct_set(rte, 'continue_cont', cont)


def rte_get_continue_cont(rte):
    return struct_get(rte, 'continue_cont')


def rte_reset_continue_break(rte):
    rte_set_continue_cont(rte, absent)
    rte_set_break_cont(rte, absent)


# stack operation
def unwind_return(rte, val):
    def do_return(_):
        frame = rte_stack(rte)
        ctx = Context(frame_rte(frame), frame_cont(frame), frame_ast(frame))
        return ctx.cont(ctx.rte, val)

    # First execute any finally block
    return sem_exec_all_finally(rte, do_return)


# function signature
def make_signature(args, posonlyargs, varargs, kwonlyargs, kw_defaults, kwargs, defaults):
    return (args, posonlyargs, varargs, kwonlyargs, kw_defaults, kwargs, defaults)

empty_signature = make_signature((), (), None, (), (), None, ())

def make_posonly_only_signature(posonlyargs):
    return make_signature((), posonlyargs, None, (), (), None, ())

def make_posonly_defaults_only_signature(posonlyargs, defaults):
    return make_signature((), posonlyargs, None, (), (), None, defaults)

def make_vararg_only_signature(vararg):
    return make_signature((), (), vararg, (), (), None, ())

def make_posonly_defaults_signature(posonlyargs, defaults):
    return make_signature((), posonlyargs, None, (), (), None, defaults)

def make_args_defaults_signature(args, defaults):
    return make_signature(args, (), None, (), (), None, defaults)

def signature_args(signature):
    return signature[0]

def signature_posonlyargs(signature):
    return signature[1]

def signature_varargs(signature):
    return signature[2]

def signature_kwonlyargs(signature):
    return signature[3]

def signature_kw_defaults(signature):
    return signature[4]

def signature_kwargs(signature):
    return signature[5]

def signature_defaults(signature):
    return signature[6]

def signature_arity(signature):
    args = signature_args(signature)
    posonlyargs = signature_posonlyargs(signature)
    vararg = signature_varargs(signature)
    kwonlyargs = signature_kwonlyargs(signature)
    kw_defaults = signature_kw_defaults(signature)
    kwargs = signature_kwargs(signature)
    defaults = signature_defaults(signature)

    if len(kwonlyargs) == 0 and len(kw_defaults) == 0 and \
       kwargs is absent and len(defaults) == 0:
        if vararg:
            return -1 - len(args) - len(posonlyargs)
        else:
            return len(args) + len(posonlyargs)
    else:
        return absent

def align_args_with_signature(ctx, funcname, caller_args, caller_kwargs, signature):
    # TODO: this algorithm is easier to implement but it is not very efficient
    # The main idea is to create a list (args_choices) which stores where the value for each argument may come from
    # in a tuple  of the form:
    #     ([name], [value from caller_args], [value from defaults], [value from caller_kwargs])
    # Once this is done, we can traverse args_choices and pick the value which has top priority (caller_args > default)
    # or raise an error if two values are conflicting (caller_args conflicts with caller_kwargs)
    # This requires multiple passes on the signature and arguments. It is possible to do it in one pass but is way
    # harder to implement than this abstraction.

    def format_missing_arguments_names(names):
        last_index = len(names) - 1
        if last_index == 0:
            return "'" + names[0] + "'"
        else:
            comma_separated = "'" + "', '".join(names[0:len(names) - 1]) + "'"
            return comma_separated + " and '" + names[last_index] + "'"

    def raise_missing_arguments(arg_choices):
        # Recover positional names to figure out if missing values are arguments or keyword-only

        positional_arguments_names = list_concat(posonlyargs, args)
        is_positional = make_dict()

        for n in positional_arguments_names:
            dict_set(is_positional, n, True)

        missing_args = []
        missing_kws = []
        for choices in args_choices:
            name = choices[0]
            val_from_args = choices[1]
            val_from_defaults = choices[2]
            val_from_kws = choices[3]

            if val_from_args is None and val_from_defaults is None and val_from_kws is None:
                if dict_get(is_positional, name, False):
                    missing_args.append(name)
                else:
                    missing_kws.append(name)

        missing_args_len = len(missing_args)
        missing_kws_len = len(missing_kws)

        if missing_args_len > 0:
            if missing_args_len == 1:
                error_msg = funcname + "() missing 1 required positional argument: '" + missing_args[0] + "'"
            else:
                missing_names = format_missing_arguments_names(missing_args)
                error_msg = funcname + "() missing " + str(missing_args_len) + " required positional arguments: " + missing_names
        elif missing_kws_len == 1:
            error_msg = funcname + "() missing 1 required keyword-only argument: '" + missing_kws[0] + "'"
        else:
            missing_names = format_missing_arguments_names(missing_kws)
            error_msg = funcname + "() missing " + str(missing_kws_len) + " required keyword-only arguments: " + missing_names

        return sem_raise_with_message(ctx, class_TypeError, error_msg)

    def raise_missing_positional_arguments(provided, min_required, names):
        missing_args = names[provided:min_required]
        missing_args_len = len(missing_args)

        if missing_args_len == 1:
            error_msg = funcname + "() missing 1 required positional argument: '" + missing_args[0] + "'"
        else:
            missing_names = format_missing_arguments_names(missing_args)
            error_msg = funcname + "() missing " + str(missing_args_len) + " required positional arguments: " + missing_names

        return sem_raise_with_message(ctx, class_TypeError, error_msg)

    def raise_too_many_positional_arguments(provided, required):
        verb = "was" if provided == 1 else "were"
        s = "" if required == 1 else "s"

        error_msg = funcname + "() takes " + str(required) + " positional argument" + s + " but " + str(provided) + " " + verb + " given"
        return sem_raise_with_message(ctx, class_TypeError, error_msg)

    args = signature_args(signature)
    posonlyargs = signature_posonlyargs(signature)
    vararg = signature_varargs(signature)
    kwonlyargs = signature_kwonlyargs(signature)
    kw_default = signature_kw_defaults(signature)
    kwarg = signature_kwargs(signature)
    defaults = signature_defaults(signature)

    locals_env = make_dict()

    caller_args_len = len(caller_args)
    signature_posonly_len = len(posonlyargs)
    signature_args_len = len(args)
    signature_defaults_len = len(defaults)
    signature_total_pos_arguments_len = signature_args_len + signature_posonly_len
    unprovided_pos_arguments_len = signature_total_pos_arguments_len - caller_args_len
    positional_arguments_without_defaults_len = signature_total_pos_arguments_len - signature_defaults_len
    posonly_argument_with_defaults_len = 0 if signature_args_len > signature_defaults_len else signature_defaults_len - signature_args_len
    min_requires_posonly_arguments = signature_posonly_len - posonly_argument_with_defaults_len
    rest_size = 0 if caller_args_len < signature_total_pos_arguments_len else caller_args_len - signature_total_pos_arguments_len

    # Check that the minimal number of argument which can only be given positionally is reached
    if caller_args_len < min_requires_posonly_arguments:
        return raise_missing_positional_arguments(caller_args_len, min_requires_posonly_arguments, list_concat(posonlyargs, args))

    # Check that the maximum number of argument which can only be given positionally is not exceeded
    if vararg is None and rest_size > 0:
        return raise_too_many_positional_arguments(caller_args_len, signature_total_pos_arguments_len)

    aligned_defaults = list_concat(list_new(positional_arguments_without_defaults_len, None), defaults)
    extended_caller_args = list_concat(caller_args, list_new(unprovided_pos_arguments_len, None))
    args_choices = []

    pos = 0
    for posonly in posonlyargs:
        args_choices.append((posonly, extended_caller_args[pos], aligned_defaults[pos], None))
        pos += 1

    for arg in args:
        args_choices.append((arg, extended_caller_args[pos], aligned_defaults[pos], dict_pop(caller_kwargs, arg, None)))
        pos += 1

    kw_pos = 0
    for kw in kwonlyargs:
        args_choices.append((kw, None, kw_default[kw_pos], dict_pop(caller_kwargs, kw, None)))
        kw_pos += 1

    for choices in args_choices:
        name = choices[0]
        val_from_args = choices[1]
        val_from_defaults = choices[2]
        val_from_kws = choices[3]

        if val_from_args is not None:
            if val_from_kws is not None:
                error_msg = funcname + "() got multiple values for argument '" + name + "'"
                return sem_raise_with_message(ctx, class_TypeError, error_msg)
            else:
                dict_set(locals_env, name, val_from_args)
        elif val_from_kws is not None:
            dict_set(locals_env, name, val_from_kws)
        elif val_from_defaults is not None:
            dict_set(locals_env, name, val_from_defaults)
        else:
            return raise_missing_arguments(args_choices)

    if kwarg is not None:
        # Used argument have been popped from caller_kwargs, what remains are extra args
        dict_set(locals_env, kwarg, om_dict(caller_kwargs))
    elif dict_len(caller_kwargs) > 0:
        wrong_key = dict_keys(caller_kwargs)[0]
        error_msg = funcname + "() got an unexpected keyword argument '" + wrong_key + "'"
        return sem_raise_with_message(ctx, class_TypeError, error_msg)

    if vararg is not None:
        rest = list_get_slice(caller_args, caller_args_len - rest_size, caller_args_len, 1)
        om_rest = om_tuple(rest)
        dict_set(locals_env, vararg, om_rest)

    return cont_obj(ctx, locals_env)


# object model
def make_dict_from_list(lst):
    result = make_dict()
    for e in lst:
        dict_set(result, e[0], e[1])
    return result

def class_getattr(o, attr):
    return dict_get(o, attr, absent)

def class_getattribute(o, attr):
    # TODO: does not follow sementic missing __get__.
    return dict_get(o, attr, absent)

def class_setattribute(o, attr, value):
    dict_set(o, attr, value)

def getattribute_from_class_mro(cls, name):
    mro = OM_get_type_mro(cls)
    mro_len = len(mro)
    i = 0
    while i < mro_len:
        cls = mro[i]
        attr = OM_get(cls, name)
        if attr is not absent:
            return attr
        i += 1
    return absent

def getattribute_from_class_mro_with_owner(cls, name):
    mro = OM_get_type_mro(cls)
    mro_len = len(mro)
    i = 0
    while i < mro_len:
        cls = mro[i]
        attr = OM_get(cls, name)
        if attr is not absent:
            return attr, cls
        i += 1
    return absent, absent

def getattribute_from_obj_mro(o, name):
    cls = OM_get_object_class(o)
    return getattribute_from_class_mro(cls, name)

def getattribute_from_obj_mro_with_owner(o, name):
    cls = OM_get_object_class(o)
    return getattribute_from_class_mro_with_owner(cls, name)

def compute_mro(cls, bases):
    seqs = []

    if len(bases) == 0:
        bases = [class_object]

    for el in bases:
        seqs.append(OM_get_type_mro(el))

    seqs.append(bases)

    res = []
    while True:
        non_empty = []

        for seq in seqs:
            if len(seq) > 0:
                non_empty.append(seq)

        non_empty_len = len(non_empty)

        if non_empty_len == 0:
            res_mro = [cls]

            for c in res:
                res_mro.append(c)

            return res_mro

        for seq in non_empty:
            candidate = seq[0]
            for s in non_empty:
                tail = s[1:]

                # checks "candidate in tail"
                tail_len = len(tail)
                i = 0
                while i < tail_len:
                    if candidate is tail[i]:
                        candidate = None
                        break
                    i += 1

            if candidate is not None:
                break

        if candidate is None:
            return None
        else:
            res.append(candidate)

        # TODO: use a for loop with del if zp supports it
        seqs_len = len(seqs)
        i = 0
        while i < seqs_len:
            seq = seqs[i]
            if len(seq) > 0 and seq[0] is candidate:
                seqs[i] = seq[1:]
            i += 1

def make_class(name, module, bases, metaclass):
    cls = om(metaclass)
    # TODO: some builtin class are not compatible, add checks for that
    mro = compute_mro(cls, bases)

    if mro is None:
        # mro could not be resolved, should bubble up to raise a TypeError
        return None
    else:
        OM_set(cls, '__name__', om_str(name))
        OM_set(cls, '__module__', om_str(module))
        OM_set_object_class(cls, metaclass)
        OM_set_type_bases(cls, bases)
        OM_set_type_mro(cls, mro)
        OM_set_type_is_builtin(cls, False)
        # If X ad mro (X, A, B, C, ...) we reuse the instance_creator of A
        OM_set_type_instance_creator(cls, OM_get_type_instance_creator(mro[1]))
        return cls

def make_builtin_class(name, instance_creator, bases):
    # Set base classes when they do exist
    cls = make_class(name, 'builtins', bases, class_type)
    OM_set_type_instance_creator(cls, instance_creator)
    OM_set_type_is_builtin(cls, True)
    return cls

def make_stdlib_class(name, module_name, instance_creator, bases):
    # Set base classes when they do exist
    cls = make_class(name, module_name, bases, class_type)
    OM_set_type_instance_creator(cls, instance_creator)
    OM_set_type_is_builtin(cls, False)
    return cls

def bootstrap_base_types():
    # init class_type
    class_type = om_with_instance_creator(absent, OM_type_create)
    OM_set_object_class(class_type, class_type)
    OM_set_type_instance_creator(class_type, OM_type_create)
    OM_set_type_is_builtin(class_type, True)

    # init class_str
    class_str = om_with_instance_creator(class_type, OM_type_create)
    OM_set_object_class(class_str, class_type)
    OM_set_type_instance_creator(class_str, OM_box_create)
    OM_set_type_is_builtin(class_str, True)

    # init class_object
    class_object = om_with_instance_creator(class_type, OM_object_create)
    OM_set_object_class(class_object, class_type)
    OM_set_type_instance_creator(class_object, OM_object_create)
    OM_set_type_is_builtin(class_object, True)

    # init class_WrapperDescriptor

    class_WrapperDescriptor = om_with_instance_creator(class_type, OM_WrapperDescriptor_create)
    OM_set_object_class(class_WrapperDescriptor, class_type)
    OM_set_type_instance_creator(class_WrapperDescriptor, OM_WrapperDescriptor_create)
    OM_set_type_is_builtin(class_WrapperDescriptor, True)

    def om_bootstrap_str(value):
        om_value = om_with_instance_creator(class_str, OM_box_create)
        OM_set_boxed_value(om_value, value)
        return om_value

    # populate class_str base attributes
    OM_set(class_str, '__name__', om_bootstrap_str("str"))
    OM_set(class_str, '__module__', om_bootstrap_str("builtins"))
    OM_set_type_mro(class_str, (class_str, class_object))

    OM_set(class_type, '__name__', om_bootstrap_str("type"))
    OM_set(class_type, '__module__', om_bootstrap_str("builtins"))
    OM_set_type_mro(class_type, (class_type, class_object))

    OM_set(class_object, '__name__', om_bootstrap_str("object"))
    OM_set(class_object, '__module__', om_bootstrap_str("builtins"))
    OM_set_type_mro(class_object, (class_object,))

    OM_set(class_WrapperDescriptor, '__name__', om_bootstrap_str("wrapper_descriptor"))
    OM_set(class_WrapperDescriptor, '__module__', om_bootstrap_str("builtins"))
    OM_set_type_mro(class_WrapperDescriptor, (class_WrapperDescriptor, class_object))

    return class_object, class_str, class_type, class_WrapperDescriptor

def bootstrap_populate_base_types():
    builtin_add_methods_to_class(
        class_type,
        (('__new__', om_type_new),
         ('__call__', om_type_call, True),
         ('__getattribute__', om_type_getattribute),
         ('__setattr__', om_type_setattr),
         ('__repr__', om_type_repr)))

    builtin_add_methods_to_class(
        class_object,
        (('__new__', om_object_new, True),
         ('__init__', om_object_init, True),
         ('__getattribute__', om_object_getattribute),
         ('__setattr__', om_object_setattr),
         ('__str__', om_object_str),
         ('__repr__', om_object_repr),
         ('__eq__', om_object_eq),
         ('__ne__', om_object_ne)))

    OM_set(class_object, '__class__', make_getset_readonly_slot('__class__', class_object, OM_get_object_class))

    builtin_add_methods_to_class(
        class_WrapperDescriptor,
        (('__get__', om_WrapperDescriptor_get),
         ('__call__', om_WrapperDescriptor_call, True),
         ('__repr__', om_WrapperDescriptor_repr)))

    builtin_add_methods_to_class(
        class_str,
        (('__new__', om_str_new),
         ('__repr__', om_str_repr),
         ('__str__', om_str_str),
         ('__getitem__', om_str_getitem),
         ('__eq__', om_str_eq),
         ('__ne__', om_str_ne),
         ('__gt__', om_str_gt),
         ('__ge__', om_str_ge),
         ('__lt__', om_str_lt),
         ('__le__', om_str_le),
         ('__add__', om_str_add),
         ('__mul__', om_str_mul),
         ('__rmul__', om_str_rmul),
         ('__len__', om_str_len),
         ('__contains__', om_str_contains),
         ('join', om_str_join),
         ('replace', om_str_replace),
         ('upper', om_str_upper),
         ('lower', om_str_lower),
         ('swapcase', om_str_swapcase),
         ('isalpha', om_str_isalpha),
         ('isalnum', om_str_isalnum),
         ('isascii', om_str_isascii),
         ('isdecimal', om_str_isdecimal),
         ('isdigit', om_str_isdigit),
         ('islower', om_str_islower),
         ('isnumeric', om_str_isnumeric),
         ('isupper', om_str_isupper),
         ('isspace', om_str_isspace),
         ('split', om_str_split, True),
         ('rsplit', om_str_rsplit, True),
         ('splitlines', om_str_splitlines, True),
         ('find', om_str_find),
         ('rfind', om_str_rfind),
         ('index', om_str_index),
         ('rindex', om_str_rindex),
         ('startswith', om_str_startswith),
         ('endswith', om_str_endswith),
         ('count', om_str_count),
         ('strip', om_str_strip),
         ('lstrip', om_str_lstrip),
         ('rstrip', om_str_rstrip)))

# Initialize class type objects
def builtin_add_method(o, name, code):
    wrapper = om_WrapperDescriptor(name, o, code, False)
    OM_set(o, name, wrapper)


def builtin_add_method_with_kwargs(o, name, code):
    wrapper = om_WrapperDescriptor(name, o, code, True)
    OM_set(o, name, wrapper)


def builtin_add_methods_to_class(cls, methods_table):
    for params in methods_table:
        name = params[0]
        code = params[1]
        requires_kwargs = len(params) > 2 and params[2]

        if requires_kwargs:
            builtin_add_method_with_kwargs(cls, name, code)
        else:
            builtin_add_method(cls, name, code)


def populate_builtin_getset_descriptor():
    builtin_add_methods_to_class(
        class_getset_descriptor,
        (('__get__', om_getset_descriptor_get),
         ('__set__', om_getset_descriptor_set)))


def populate_builtin_NotImplementedType():
    builtin_add_method(class_NotImplementedType, '__str__', om_NotImplementedType_str)
    builtin_add_method(class_NotImplementedType, '__repr__', om_NotImplementedType_repr)

def populate_builtin_MethodWrapper():
    builtin_add_method_with_kwargs(class_MethodWrapper, '__call__', om_MethodWrapper_call)
    builtin_add_method(class_MethodWrapper, '__repr__', om_MethodWrapper_repr)

def populate_builtin_TextIOWrapper():
    builtin_add_method(class_TextIOWrapper, '__repr__', om_TextIOWrapper_repr)
    builtin_add_method(class_TextIOWrapper, '__enter__', om_TextIOWrapper_enter)
    builtin_add_method(class_TextIOWrapper, '__exit__', om_TextIOWrapper_exit)
    builtin_add_method(class_TextIOWrapper, '__next__', om_TextIOWrapper_next)
    builtin_add_method(class_TextIOWrapper, '__iter__', om_TextIOWrapper_iter)
    builtin_add_method(class_TextIOWrapper, 'close', om_TextIOWrapper_close)
    builtin_add_method(class_TextIOWrapper, 'read', om_TextIOWrapper_read)
    builtin_add_method(class_TextIOWrapper, 'write', om_TextIOWrapper_write)
    builtin_add_method(class_TextIOWrapper, 'readline', om_TextIOWrapper_readline)

def populate_builtin_int():
    builtin_add_method(class_int, '__new__', om_int_new)
    builtin_add_method(class_int, '__int__', om_int_int)
    builtin_add_method(class_int, '__index__', om_int_index)
    builtin_add_method(class_int, '__float__', om_int_float)
    builtin_add_method(class_int, '__bool__', om_int_bool) # <class 'function'>
    # Arithmetic
    builtin_add_method(class_int, '__add__', om_int_add)
    builtin_add_method(class_int, '__radd__', om_int_radd)
    builtin_add_method(class_int, '__sub__', om_int_sub)
    builtin_add_method(class_int, '__rsub__', om_int_rsub)
    builtin_add_method(class_int, '__mul__', om_int_mul)
    builtin_add_method(class_int, '__rmul__', om_int_rmul)
    builtin_add_method(class_int, '__pow__', om_int_pow)
    builtin_add_method(class_int, '__rpow__', om_int_rpow)
    builtin_add_method(class_int, '__floordiv__', om_int_floordiv)
    builtin_add_method(class_int, '__rfloordiv__', om_int_rfloordiv)
    builtin_add_method(class_int, '__truediv__', om_int_truediv)
    builtin_add_method(class_int, '__rtruediv__', om_int_rtruediv)
    builtin_add_method(class_int, '__mod__', om_int_mod)
    builtin_add_method(class_int, '__rmod__', om_int_rmod)
    builtin_add_method(class_int, '__abs__', om_int_abs)
    builtin_add_method(class_int, '__pow__', om_int_pow)
    builtin_add_method(class_int, '__rpow__', om_int_rpow)


    # Bitwise
    builtin_add_method(class_int, '__lshift__', om_int_lshift)
    builtin_add_method(class_int, '__rlshift__', om_int_rlshift)
    builtin_add_method(class_int, '__rshift__', om_int_rshift)
    builtin_add_method(class_int, '__rrshift__', om_int_rrshift)
    builtin_add_method(class_int, '__and__', om_int_and)
    builtin_add_method(class_int, '__rand__', om_int_rand)
    builtin_add_method(class_int, '__or__', om_int_or)
    builtin_add_method(class_int, '__ror__', om_int_ror)
    builtin_add_method(class_int, '__xor__', om_int_xor)
    builtin_add_method(class_int, '__rxor__', om_int_rxor)
    # Comparison
    builtin_add_method(class_int, '__eq__', om_int_eq)
    builtin_add_method(class_int, '__ne__', om_int_ne)
    builtin_add_method(class_int, '__lt__', om_int_lt)
    builtin_add_method(class_int, '__le__', om_int_le)
    builtin_add_method(class_int, '__gt__', om_int_gt)
    builtin_add_method(class_int, '__ge__', om_int_ge)
    builtin_add_method(class_int, '__repr__', om_int_repr)
    builtin_add_method(class_int, '__neg__', om_int_neg)
    builtin_add_method(class_int, '__pos__', om_int_pos)
    builtin_add_method(class_int, '__invert__', om_int_invert)
    builtin_add_method(class_int, '__round__', om_int_round)


def populate_builtin_float():
    builtin_add_method(class_float, '__new__', om_float_new)
    builtin_add_method(class_float, '__bool__', om_float_bool)
    builtin_add_method(class_float, '__float__', om_float_float)
    builtin_add_method(class_float, '__int__', om_float_int)
    builtin_add_method(class_float, '__add__', om_float_add)
    builtin_add_method(class_float, '__radd__', om_float_radd)
    builtin_add_method(class_float, '__sub__', om_float_sub)
    builtin_add_method(class_float, '__rsub__', om_float_rsub)
    builtin_add_method(class_float, '__mul__', om_float_mul)
    builtin_add_method(class_float, '__rmul__', om_float_rmul)
    builtin_add_method(class_float, '__truediv__', om_float_truediv)
    builtin_add_method(class_float, '__rtruediv__', om_float_rtruediv)
    builtin_add_method(class_float, '__floordiv__', om_float_floordiv)
    builtin_add_method(class_float, '__rfloordiv__', om_float_rfloordiv)
    builtin_add_method(class_float, '__pow__', om_float_pow)
    builtin_add_method(class_float, '__rpow__', om_float_rpow)
    builtin_add_method(class_float, '__mod__', om_float_mod)
    builtin_add_method(class_float, '__rmod__', om_float_rmod)
    builtin_add_method(class_float, '__repr__', om_float_repr)
    builtin_add_method(class_float, '__pos__', om_float_pos)
    builtin_add_method(class_float, '__neg__', om_float_neg)
    builtin_add_method(class_float, '__abs__', om_float_abs)
    builtin_add_method(class_float, '__eq__', om_float_eq)
    builtin_add_method(class_float, '__ne__', om_float_ne)
    builtin_add_method(class_float, '__lt__', om_float_lt)
    builtin_add_method(class_float, '__le__', om_float_le)
    builtin_add_method(class_float, '__gt__', om_float_gt)
    builtin_add_method(class_float, '__ge__', om_float_ge)
    builtin_add_method(class_float, '__round__', om_float_round)


def populate_builtin_bool():
    builtin_add_method(class_bool, '__new__', om_bool_new)
    builtin_add_method(class_bool, '__bool__', om_bool_bool)
    builtin_add_method(class_bool, '__repr__', om_bool_repr)

def populate_builtin_tuple():
    builtin_add_methods_to_class(
        class_tuple,
        (('__new__', om_tuple_new),
         ('__eq__', om_tuple_eq),
         ('__repr__', om_tuple_repr),
         ('__len__', om_tuple_len),
         ('__getitem__', om_tuple_getitem),
         ('__add__', om_tuple_add),
         ('__mul__', om_tuple_mul),
         ('__rmul__', om_tuple_rmul),
         ('count', om_tuple_count),
         ('index', om_tuple_index)))

def populate_builtin_list():
    builtin_add_method(class_list, '__new__', om_list_new)
    builtin_add_method(class_list, '__repr__', om_list_repr)
    builtin_add_method(class_list, '__eq__', om_list_eq)
    builtin_add_method(class_list, '__getitem__', om_list_getitem)
    builtin_add_method(class_list, '__setitem__', om_list_setitem)
    builtin_add_method(class_list, '__len__', om_list_len)
    builtin_add_method(class_list, '__add__', om_list_add)
    builtin_add_method(class_list, '__iadd__', om_list_iadd)
    builtin_add_method(class_list, '__mul__', om_list_mul)
    builtin_add_method(class_list, '__rmul__', om_list_rmul)
    builtin_add_method(class_list, '__contains__', om_list_contains)
    builtin_add_method(class_list, 'append', om_list_append)
    builtin_add_method(class_list, 'extend', om_list_extend)
    builtin_add_method(class_list, 'pop', om_list_pop)
    builtin_add_method(class_list, 'insert', om_list_insert)
    builtin_add_method(class_list, 'index', om_list_index)
    builtin_add_method(class_list, 'remove', om_list_remove)
    builtin_add_method(class_list, 'copy', om_list_copy)
    builtin_add_method(class_list, 'clear', om_list_clear)
    builtin_add_method(class_list, 'reverse', om_list_reverse)
    builtin_add_method(class_list, 'count', om_list_count)


def populate_builtin_dict():
    pass


def populate_builtin_range():
    builtin_add_methods_to_class(
        class_range,
        (('__new__', om_range_new),
         ('__repr__', om_range_repr),
         ('__len__', om_range_len),
         ('__eq__', om_range_eq),
         ('__getitem__', om_range_getitem)))


def populate_builtin_map():
    builtin_add_methods_to_class(
        class_map,
        (('__new__', om_map_new),
         ('__iter__', om_map_iter),
         ('__next__', om_map_next)))


def populate_builtin_filter():
    builtin_add_methods_to_class(
        class_filter,
        (('__new__', om_filter_new),
         ('__iter__', om_filter_iter),
         ('__next__', om_filter_next)))


def populate_builtin_slice():
    builtin_add_methods_to_class(
        class_slice,
        (('__new__', om_slice_new),
         ('__repr__', om_slice_repr),
         ('indices', om_slice_indices)))


def populate_builtin_iterator():
    builtin_add_method(class_iterator, '__iter__', om_iterator_iter)
    builtin_add_method(class_iterator, '__next__', om_iterator_next)

def populate_builtin_dict():
    builtin_add_methods_to_class(
        class_dict,
        (('__new__', om_dict_new),
         ('__getitem__', om_dict_getitem),
         ('get', om_dict_get)))

def populate_builtin_module():
    builtin_add_method(class_module, '__getattribute__', om_module_getattribute)
    builtin_add_method(class_module, '__setattr__', om_module_setattr)
    builtin_add_method(class_module, '__repr__', om_module_repr)

def populate_builtin_NoneType():
    builtin_add_method(class_NoneType, '__new__', om_NoneType_new)
    builtin_add_method(class_NoneType, '__bool__', om_NoneType_bool)
    builtin_add_method(class_NoneType, '__repr__', om_NoneType_repr)

def populate_builtin_function():
    builtin_add_methods_to_class(
        class_function,
        (('__get__', om_function_get),
         ('__call__', om_function_call, True),
         ('__repr__', om_function_repr)))

def populate_builtin_method():
    builtin_add_methods_to_class(
        class_method,
        (('__new__', om_method_new),
         ('__call__', om_method_call, True),
         ('__repr__', om_method_repr)))

def populate_builtin_BaseException():
    builtin_add_method(class_BaseException, '__new__', om_BaseException_new)
    builtin_add_method(class_BaseException, '__str__', om_BaseException_str)

def populate_builtin_Exception():
    pass

def populate_builtin_csv_reader():
    builtin_add_method(class_csv_reader, '__iter__', om_csv_reader_iter)
    builtin_add_method(class_csv_reader, '__next__', om_csv_reader_next)

def object_class(o):
    if om_is(o, om_None):
        # This is equivalent to javascript bool
        return class_NoneType
    elif om_is(o, om_True) or om_is(o, om_False):
        return class_bool
    elif isinstance(o, str):
        return class_str
    else:
        klass = OM_get_object_class(o)

        # NOTE: this assert should never trigger
        assert klass is not absent, 'object does not have a class'
        return klass

# Object model utilities
def om_with_instance_creator(cls, maker):
    o = maker()
    OM_set_serial(o, absent)

    public_fields = make_dict()
    OM_set_object_attribs(o, public_fields)
    OM_set_object_class(o, cls)
    return o

def om(cls):
    maker = OM_get_type_instance_creator(cls)
    return om_with_instance_creator(cls, maker)

def om_getset_descriptor(name, objclass, getter, setter):
    descr = om(class_getset_descriptor)
    OM_set_getset_descriptor_name(descr, name)
    OM_set_getset_descriptor_objclass(descr, objclass)
    OM_set_getset_descriptor_getter(descr, getter)
    OM_set_getset_descriptor_setter(descr, setter)
    return descr

def om_boxval(cls, val):
    obj = om(cls)
    OM_set_boxed_value(obj, val)
    return obj

def om_bool(n):
    if n is True:
        return om_True
    elif n is False:
        return om_False
    else:
        raise ValueError("Cannot cast to bool")

def om_tuple(seq):
    obj = om(class_tuple)
    OM_set_tuple_seq(obj, seq)
    return obj

def om_tuple_subtype(cls, seq):
    obj = om(cls)
    OM_set_tuple_seq(obj, seq)
    return obj

def om_list(seq, len_):
    obj = om(class_list)
    OM_set_list_seq(obj, seq)
    OM_set_list_len(obj, len_)
    return obj

def om_slice(start, stop, step):
    obj = om(class_slice)
    OM_set_slice_start(obj, start)
    OM_set_slice_stop(obj, stop)
    OM_set_slice_step(obj, step)
    return obj

def om_range(start, stop, step):
    obj = om(class_range)
    OM_set_range_start(obj, start)
    OM_set_range_stop(obj, stop)
    OM_set_range_step(obj, step)
    return obj

def om_iterator(obj, index):
    it = om(class_iterator)

    OM_set_iterator_obj(it, obj)
    OM_set_iterator_index(it, index)

    return it

def om_map(map_cls, fn, iterators):
    map_obj = om(map_cls)

    OM_set_map_function(map_obj, fn)
    OM_set_map_iterators(map_obj, iterators)

    return map_obj

def om_filter(filter_cls, fn, iterator):
    filter_obj = om(filter_cls)

    OM_set_filter_function(filter_obj, fn)
    OM_set_filter_iterator(filter_obj, iterator)

    return filter_obj

def om_module(name, val):
    obj = om(class_module)

    dict_set(val, '__name__', om_str(name))

    OM_set(obj, '__dict__', om_dict(val))
    return obj

def om_dict(val):
    return om_boxval(class_dict, val)

def om_str(val):
    # assert isinstance(val, str), 'om_str expected str'
    return om_boxval(class_str, val)

def om_int(val):
    return om_boxval(class_int, val)

def om_int_from_num(val):
    return om_boxval(class_int, int_from_num(val))

def om_int_subtype(cls, val):
    return om_boxval(cls, val)

def om_float(val):
    return om_boxval(class_float, val)

def om_float_subtype(cls, val):
    return om_boxval(cls, val)

def om_exception(exn, args):
    obj = om(exn)
    OM_set(obj, 'args', args)
    return obj

def om_TextIOWrapper(cls, name, mode, pointer, opened):
    obj = om(cls)
    OM_set_TextIOWrapper_name(obj, name)
    OM_set_TextIOWrapper_mode(obj, mode)
    OM_set_TextIOWrapper_pointer(obj, pointer)
    OM_set_TextIOWrapper_opened(obj, opened)
    return obj

def om_csv_reader(cls, line_num, line_iterator, dialect, delimiter,
                       doublequote, escapechar, lineterminator,
                       quotechar, quoting, skipinitialspace, strict):
    obj = om(cls)
    OM_set_csv_reader_line_num(obj, line_num)
    OM_set_csv_reader_lines(obj, line_iterator)
    OM_set_csv_reader_dialect(obj, dialect)
    OM_set_csv_reader_delimiter(obj, delimiter)
    OM_set_csv_reader_doublequote(obj, doublequote)
    OM_set_csv_reader_escapechar(obj, escapechar)
    OM_set_csv_reader_lineterminator(obj, lineterminator)
    OM_set_csv_reader_quotechar(obj, quotechar)
    OM_set_csv_reader_quoting(obj, quoting)
    OM_set_csv_reader_skipinitialspace(obj, skipinitialspace)
    OM_set_csv_reader_strict(obj, strict)
    return obj

def om_WrapperDescriptor(name, cls, code, requires_kwargs):
    obj = om(class_WrapperDescriptor)
    OM_set_code(obj, code)
    OM_set_requires_kwargs(obj, requires_kwargs)
    OM_set_WrapperDescriptor_cls(obj, cls)

    OM_set(obj, '__name__', om_str(name))
    return obj


def om_MethodWrapper(name, instance, code, requires_kwargs):
    obj = om(class_MethodWrapper)
    OM_set_code(obj, code)
    OM_set_requires_kwargs(obj, requires_kwargs)
    OM_set_MethodWrapper_instance(obj, instance)

    OM_set(obj, '__name__', name)
    return obj

def om_method(fn, instance):
    method = om(class_method)
    OM_set_method_function(method, fn)
    OM_set_method_self(method, instance)
    return method

def om_DOMElement(elem):
    obj = om(class_DOMElement)

    OM_set_DOMElement_elem(obj, elem)

    return obj

def om_is(x, y):
    return x is y

def om_is_not(x, y):
    return x is not y

def om_issubclass(subcls, cls):
    subcls_mro = OM_get_type_mro(subcls)

    len_mro = len(subcls_mro)

    i = 0
    while i < len_mro:
        if om_is(cls, subcls_mro[i]):
            return True
        i += 1
    return False

def om_isinstance(obj, cls):
    return om_issubclass(OM_get_object_class(obj), cls)

def om_has_type(obj, cls):
    return om_is(OM_get_object_class(obj), cls)

# Creation of om object from class
def OM_object_create():
    return OM_object()

def OM_getset_descriptor_create():
    return OM_getset_descriptor()

def OM_module_create():
    return OM_module()

def OM_type_create():
    return OM_type()

def OM_NotImplemented_create():
    return OM_NotImplemented()

def OM_box_create():
    return OM_box()

def OM_tuple_create():
    return OM_tuple()

def OM_list_create():
    return OM_list()

def OM_struct_create():
    return OM_struct()

def OM_DOMDocument_create():
    return OM_DOMDocument()

def OM_DOMElement_create():
    return OM_DOMElement()

def OM_range_create():
    return OM_range()

def OM_map_create():
    return OM_map()

def OM_filter_create():
    return OM_filter()

def OM_dict_create():
    return OM_dict()

def OM_slice_create():
    return OM_slice()

def OM_iterator_create():
    return OM_iterator()

def OM_function_create():
    return OM_function()

def OM_method_create():
    return OM_method()

def OM_WrapperDescriptor_create():
    return OM_WrapperDescriptor()

def OM_MethodWrapper_create():
    return OM_MethodWrapper()

def OM_NoneType_create():
    return OM_NoneType()

def OM_BaseException_create():
    return OM_BaseException()

def OM_TextIOWrapper_create():
    return OM_TextIOWrapper()

def OM_csv_reader_create():
    return OM_csv_reader()

# Manipulation of om object.
def OM_set(o, name, value):
    attribs = OM_get_object_attribs(o)
    dict_set(attribs, name, value)

def OM_get(o, name):
    attribs = OM_get_object_attribs(o)
    return dict_get(attribs, name, absent)

def OM_set_object_attribs(o, attribs):
    o.attribs = attribs

def OM_get_object_attribs(o):
    return o.attribs

def OM_set_serial(self, serial):
    self.serial = serial

def OM_get_serial(o, rte):
    serial = o.serial
    if serial is absent:
        # allocate a new serial number.
        serial = rte_get_serial(rte)
        OM_set_serial(o, serial)
    return serial

def OM_set_object_class(o, cls):
    o.klass = cls

def OM_get_object_class(o):
    return o.klass

def OM_get_class_name(o):
    return OM_get_boxed_value(OM_get(o, "__name__"))

def OM_get_object_class_name(o):
    return OM_get_class_name(OM_get_object_class(o))

def OM_get_class_qualname(cls):
    # TODO: qualname should be an attribute, it should not be computed
    cls_name = OM_get(cls, '__name__')
    cls_name_value = OM_get_boxed_value(cls_name)

    if OM_get_type_is_builtin(cls):
        return cls_name_value
    else:
        cls_module = OM_get(cls, '__module__')
        cls_module_value = OM_get_boxed_value(cls_module)
        return cls_module_value + "." + cls_name_value

def OM_get_object_class_qualname(o):
    return OM_get_class_qualname(OM_get_object_class(o))

def OM_get_getset_descriptor_getter(o):
    return o.getter

def OM_set_getset_descriptor_getter(o, val):
    o.getter = val

def OM_get_getset_descriptor_objclass(o):
    return o.objclass

def OM_set_getset_descriptor_objclass(o, val):
    o.objclass = val

def OM_get_getset_descriptor_setter(o):
    return o.setter

def OM_set_getset_descriptor_setter(o, val):
    o.setter = val

def OM_get_getset_descriptor_name(o):
    return o.getset_name

def OM_set_getset_descriptor_name(o, val):
    o.getset_name = val

def OM_set_type_mro(o, val):
    o.mro = val

def OM_get_type_mro(o):
    return o.mro

def OM_get_type_bases(o):
    return o.bases

def OM_set_type_bases(o, bases):
    o.bases = bases

def OM_set_type_instance_creator(o, val):
    o.instance_creator = val

def OM_get_type_instance_creator(o):
    return o.instance_creator

def OM_set_type_is_builtin(o, val):
    o.is_builtin = val

def OM_get_type_is_builtin(o):
    return o.is_builtin

def OM_get_module_env(o):
    module_dict = OM_get(o, "__dict__")
    return OM_get_boxed_value(module_dict)

def OM_set_boxed_value(o, value):
    o.value = value

def OM_get_boxed_value(o):
    return o.value

def OM_get_tuple_seq(o):
    return o.seq

def OM_set_tuple_seq(o, value):
    o.seq = value

def OM_get_list_seq(o):
    return o.seq

def OM_set_list_seq(o, value):
    o.seq = value

def OM_get_list_len(o):
    return o.len

def OM_set_list_len(o, value):
    o.len = value

def OM_get_slice_start(o):
    return o.start

def OM_set_slice_start(o, start):
    o.start = start

def OM_get_slice_stop(o):
    return o.stop

def OM_set_slice_stop(o, stop):
    o.stop = stop

def OM_get_slice_step(o):
    return o.step

def OM_set_slice_step(o, step):
    o.step = step

def OM_get_range_start(o):
    return o.start

def OM_set_range_start(o, v):
    o.start = v

def OM_get_range_stop(o):
    return o.stop

def OM_set_range_stop(o, v):
    o.stop = v

def OM_get_range_step(o):
    return o.step

def OM_set_range_step(o, v):
    o.step = v

def OM_get_map_iterators(o):
    return o.iterators

def OM_set_map_iterators(o, iterators):
    o.iterators = iterators

def OM_get_map_function(o):
    return o.fn

def OM_set_map_function(o, fn):
    o.fn= fn

def OM_get_filter_iterator(o):
    return o.iterator

def OM_set_filter_iterator(o, iterator):
    o.iterator = iterator

def OM_get_filter_function(o):
    return o.fn

def OM_set_filter_function(o, fn):
    o.fn= fn

def OM_get_iterator_obj(o):
    return o.obj

def OM_set_iterator_obj(o, it):
    o.obj = it

def OM_get_iterator_index(o):
    return o.index

def OM_set_iterator_index(o, index):
    o.index = index

def OM_set_code(o, code):
    o.code = code

def OM_get_code(o):
    return o.code

def OM_set_requires_kwargs(o, requires_kwargs):
    o.requires_kwargs = requires_kwargs

def OM_get_requires_kwargs(o):
    return o.requires_kwargs

# hidden fields used by function
def OM_set_function_signature(o, value):
    o.signature = value

def OM_get_function_signature(o):
    return o.signature

def OM_set_function_arity(o, arity):
    o.arity = arity

def OM_get_function_arity(o):
    return o.arity

def OM_set_function_body(o, body):
    o.body = body

def OM_get_function_body(o):
    return o.body

def OM_get_function_locals(o):
    return o.locals

def OM_set_function_locals(o, locals):
    o.locals = locals

def OM_get_function_globals(o):
    return o.globals

def OM_set_function_globals(o, globals):
    o.globals = globals

def OM_get_function_closure(o):
    return o.closure

def OM_set_function_closure(o, closure):
    o.closure = closure

def OM_get_function_var_context(o):
    return o.var_context

def OM_set_function_var_context(o, var_context):
    o.var_context = var_context

def OM_get_function_lexical_scope(o):
    return o.lexical_scope

def OM_set_function_lexical_scope(o, lexical_scope):
    o.lexical_scope = lexical_scope

def OM_get_TextIOWrapper_name(o):
    return o.name

def OM_set_TextIOWrapper_name(o, name):
    o.name = name

def OM_get_TextIOWrapper_mode(o):
    return o.mode

def OM_set_TextIOWrapper_mode(o, mode):
    o.mode = mode

def OM_get_TextIOWrapper_pointer(o):
    return o.pointer

def OM_set_TextIOWrapper_pointer(o, pointer):
    o.pointer = pointer

def OM_get_TextIOWrapper_opened(o):
    return o.opened

def OM_set_TextIOWrapper_opened(o, opened):
    o.opened = opened

# csv reader

def OM_get_csv_reader_line_num(o):
    return o.line_num

def OM_set_csv_reader_line_num(o, line_num):
    o.line_num = line_num

def OM_get_csv_reader_lines(o):
    return o.lines

def OM_set_csv_reader_lines(o, lines):
    o.lines = lines

def OM_get_csv_reader_dialect(o):
    return o.dialect

def OM_set_csv_reader_dialect(o, dialect):
    o.dialect = dialect

def OM_get_csv_reader_delimiter(o):
    return o.delimiter

def OM_set_csv_reader_delimiter(o, delimiter):
    o.delimiter = delimiter

def OM_get_csv_reader_doublequote(o):
    return o.doublequote

def OM_set_csv_reader_doublequote(o, doublequote):
    o.doublequote = doublequote

def OM_get_csv_reader_escapechar(o):
    return o.escapechar

def OM_set_csv_reader_escapechar(o, escapechar):
    o.escapechar = escapechar

def OM_get_csv_reader_lineterminator(o):
    return o.lineterminator

def OM_set_csv_reader_lineterminator(o, lineterminator):
    o.lineterminator = lineterminator

def OM_get_csv_reader_quotechar(o):
    return o.quotechar

def OM_set_csv_reader_quotechar(o, quotechar):
    o.quotechar = quotechar

def OM_get_csv_reader_quoting(o):
    return o.quoting

def OM_set_csv_reader_quoting(o, quoting):
    o.quoting = quoting

def OM_get_csv_reader_skipinitialspace(o):
    return o.skipinitialspace

def OM_set_csv_reader_skipinitialspace(o, skipinitialspace):
    o.skipinitialspace = skipinitialspace

def OM_get_csv_reader_strict(o):
    return o.strict

def OM_set_csv_reader_strict(o, strict):
    o.strict = strict

# hidden fields for methods

def OM_get_method_self(o):
    return o.self

def OM_set_method_self(o, self):
    o.self = self

def OM_get_method_function(o):
    return o.func

def OM_set_method_function(o, func):
    o.func = func

# hidden fields in WrapperDescriptor
def OM_set_WrapperDescriptor_cls(o, cls):
    o.cls = cls

def OM_get_WrapperDescriptor_cls(o):
    return o.cls

def OM_set_MethodWrapper_instance(o, instance):
    o.instance = instance

def OM_get_MethodWrapper_instance(o):
    return o.instance

def OM_get_DOMElement_elem(o):
    return o.elem

def OM_set_DOMElement_elem(o, elem):
    o.elem = elem


def OM_get_BaseException_locations(o):
    return getattr(o, "locations", None)


def OM_init_BaseException_locations(o):
    stack = getattr(o, "locations", None)
    if stack is None:
        stack = []
        o.locations = stack
    return stack


def OM_set_BaseException_locations(o, stack):
    o.locations = stack


def OM_push_BaseException_location(o, loc):
    o.locations.append(loc)


# Generate BinOp semantics for python Numeric datatypes (or that which emulate)
# For the correct Python Data Model and interpreter, these are paired with
# generators for primitive operators which do the actual computation, defined later.
def gen_sem_Numeric_BinOp(op_symbol, method, rmethod):

    def sem_Numeric_BinOp(ctx, val1, val2):

        def test_method_result(rte, val):
            # C: Method not implemented for val2's type,
            #    fallback to reversed method.
            if om_is(val, om_NotImplemented):
                return call_rmethod(rte)
            else:
                # END0: val1 has method and can operate on val2.
                #       Return the result.
                return ctx.cont(rte, val)

        def test_rmethod_result(rte, val):
            # F: Rmethod not implemented for val1's type.
            #    Raise TypeError since both methods are absent (like CPython).
            if om_is(val, om_NotImplemented):
                return error(rte)
            else:
                # END1: val2 has rmethod and can operate on val1.
                #       Return the result.
                return ctx.cont(rte, val)

        def call_rmethod(rte):
            # D: Does val2 have rmethod?
            val2_rmethod = getattribute_from_obj_mro(val2, rmethod)

            # E: Yes, try val2.rmethod(val1)
            if val2_rmethod is not absent:
                ctx2 = with_cont(ctx, test_rmethod_result)
                # NOTE: self parameter is now val2
                return sem_simple_call(ctx2, val2_rmethod, [val2, val1])
            else:
                # G: Method and rmethod are absent.
                #    Raise a TypeError (like CPython).
                return error(rte)

        def error(rte):
            val1_type = OM_get_object_class(val1)
            val2_type = OM_get_object_class(val2)

            type1_name = OM_get(val1_type, "__name__")
            type2_name = OM_get(val2_type, "__name__")

            msg = "unsupported operand type(s) for " + op_symbol + ": " + om_format_str_repr(type1_name, rte) + " and "\
                  + om_format_str_repr(type2_name, rte)

            return sem_raise_with_message(ctx, class_TypeError, msg)

        # A: Does val1 have method?
        val1_method = getattribute_from_obj_mro(val1, method)

        # B: Yes, try val1.method(val2).
        if val1_method is not absent:
            ctx1 = with_cont(ctx, test_method_result)
            return sem_simple_call(ctx1, val1_method, [val1, val2])
        else:
            return call_rmethod(ctx.rte)

    return sem_Numeric_BinOp

# Arithmetic
sem_Add = gen_sem_Numeric_BinOp('+', '__add__', '__radd__')
sem_Sub = gen_sem_Numeric_BinOp('-', '__sub__', '__rsub__')
sem_Mult = gen_sem_Numeric_BinOp('*', '__mul__', '__rmul__')
sem_FloorDiv = gen_sem_Numeric_BinOp('//', '__floordiv__', '__rfloordiv__')
sem_TrueDiv = gen_sem_Numeric_BinOp('/', '__truediv__', '__rtruediv__')
sem_Mod = gen_sem_Numeric_BinOp('%', '__mod__', '__rmod__')
sem_Pow = gen_sem_Numeric_BinOp('**', '__pow__', '__rpow__')
# Bitwise
sem_LShift = gen_sem_Numeric_BinOp('<<', '__lshift__', '__rlshift__')
sem_RShift = gen_sem_Numeric_BinOp('>>', '__rshift__', '__rrshift__')
sem_Or = gen_sem_Numeric_BinOp('|', '__or__', '__ror__')
sem_And = gen_sem_Numeric_BinOp('&', '__and__', '__rand__')
sem_Xor = gen_sem_Numeric_BinOp('^', '__xor__', '__rxor__')
# Comparison
sem_Lt = gen_sem_Numeric_BinOp('<', '__lt__', '__gt__')
sem_Gt = gen_sem_Numeric_BinOp('>', '__gt__', '__lt__')
sem_LtE = gen_sem_Numeric_BinOp('<=', '__le__', '__ge__')
sem_GtE = gen_sem_Numeric_BinOp('>=', '__ge__', '__le__')

# sem_Eq and sem_NotEq are different in the sense they cannot raise a TypeError

def gen_sem_Numeric_EqComp(op_symbol, method, fall_back):

    def sem_Numeric_EqComp(ctx, val1, val2):
        def test_val1_result(rte, val):
            if om_is(val, om_NotImplemented):
                return call_val2_op(rte)
            else:
                return ctx.cont(rte, val)

        def test_val2_result(rte, val):
            if om_is(val, om_NotImplemented):
                return cont_bool(ctx, fall_back(val1, val2))
            else:
                return ctx.cont(rte, val)

        def call_val2_op(rte):
            val2_ne = getattribute_from_obj_mro(val2, method)

            if val2_ne is absent:
                return cont_bool(ctx, fall_back(val1, val2))
            else:
                return sem_simple_call(with_cont(ctx, test_val2_result), val2_ne, [val2, val1])

        val1_ne = getattribute_from_obj_mro(val1, method)

        if val1_ne is absent:
            return call_val2_op(ctx.rte)
        else:
            return sem_simple_call(with_cont(ctx, test_val1_result), val1_ne, [val1, val2])

    return sem_Numeric_EqComp

sem_Eq = gen_sem_Numeric_EqComp("==", "__eq__", om_is)
sem_NotEq = gen_sem_Numeric_EqComp("!=", "__ne__", om_is_not)


def sem_Eq_bool(ctx, val1, val2):
    def do_bool(rte, res):
        return sem_bool(with_rte(ctx, rte), res)
    return sem_Eq(with_cont(ctx, do_bool), val1, val2)


def sem_NotEq_bool(ctx, val1, val2):
    def do_bool(rte, res):
        return sem_bool(with_rte(ctx, rte), res)
    return sem_NotEq(with_cont(ctx, do_bool), val1, val2)


def sem_Eq_bool_with_return_to_trampoline(ctx, val1, val2):
    def do_step(rte, val):
        return stmt_end(Context(rte, lambda rte: ctx.cont(rte, val), ctx.ast), 0)
    return sem_Eq_bool(with_cont(ctx, do_step), val1, val2)


def sem_Round(ctx, obj, ndigits):
    obj_round = getattribute_from_obj_mro(obj, "__round__")

    if obj_round is absent:
        return sem_raise_with_message(ctx, class_TypeError, "type doesn't define __round__ method")
    elif ndigits is absent:
        return sem_simple_call(ctx, obj_round, [obj, ])
    else:
        return sem_simple_call(ctx, obj_round, [obj, ndigits])

def sem_PowMod(ctx, base, power, mod):

    def test_method_result(rte, val):
        if om_is(val, om_NotImplemented):
            return call_rmethod(rte)
        else:
            return ctx.cont(rte, val)

    def test_rmethod_result(rte, val):
        if om_is(val, om_NotImplemented):
            return sem_raise_with_message(ctx, class_TypeError, "unsupported operand type(s) for pow()")

        else:
            return ctx.cont(rte, val)

    def call_rmethod(rte):
        power_rmethod = getattribute_from_obj_mro(power, "__rpow__")

        if power_rmethod is not absent:
            ctx2 = with_cont(ctx, test_rmethod_result)
            return sem_simple_call(ctx2, power_rmethod, [power, base, mod])
        else:
            return sem_raise_with_message(ctx, class_TypeError, "unsupported operand type(s) for pow()")

    base_method = getattribute_from_obj_mro(base, "__pow__")

    if base_method is not absent:
        ctx1 = with_cont(ctx, test_method_result)
        return sem_simple_call(ctx1, base_method, [base, power, mod])
    else:
        return call_rmethod(ctx.rte)

# Create builtins classes
__base_types = bootstrap_base_types()

class_object = __base_types[0]
class_str = __base_types[1]
class_type = __base_types[2]
class_WrapperDescriptor = __base_types[3]

class_NotImplementedType = make_builtin_class('NotImplementedType', OM_NoneType_create, ())
class_MethodWrapper = make_builtin_class('method-wrapper', OM_MethodWrapper_create, ())

class_getset_descriptor = make_builtin_class("getset_descriptor", OM_getset_descriptor_create, ())

class_int = make_builtin_class('int', OM_box_create, ())
class_float = make_builtin_class('float', OM_box_create, ())
class_bool = make_builtin_class('bool', OM_box_create, (class_int,))
class_NoneType = make_builtin_class('NoneType', OM_NoneType_create, ())

class_tuple = make_builtin_class('tuple', OM_tuple_create, ())
class_iterator = make_builtin_class('iterator', OM_iterator_create, ())
class_list = make_builtin_class('list', OM_list_create, ())
class_range = make_builtin_class('range', OM_range_create, ())
class_map = make_builtin_class('map', OM_map_create, ())
class_filter = make_builtin_class('filter', OM_filter_create, ())
class_dict = make_builtin_class('dict', OM_dict_create, ())
class_module = make_builtin_class('module', OM_module_create, ())
class_function = make_builtin_class('function', OM_function_create, ())
class_method = make_builtin_class('method', OM_method_create, ())
class_slice = make_builtin_class('slice', OM_slice_create, ())

# _io classes, TODO: put in an _io module
class_TextIOWrapper = make_stdlib_class('TextIOWrapper', "_io", OM_TextIOWrapper_create, ())

# _csv classes, TODO: put in an _csv module
class_csv_reader = make_stdlib_class('reader', "_csv", OM_csv_reader_create, ())

# class available and populated in 'more_builtins' module
class_struct = make_builtin_class('struct', OM_struct_create, ())
class_DOMDocument = make_builtin_class('DOMDocument', OM_DOMDocument_create, ())
class_DOMElement = make_builtin_class('DOMElement', OM_DOMElement_create, ())

# Exception classes
class_BaseException = make_builtin_class('BaseException', OM_BaseException_create, ())
class_Exception = make_builtin_class('Exception', OM_BaseException_create, (class_BaseException,))
class_RuntimeError = make_builtin_class('RuntimeError', OM_BaseException_create, (class_Exception,))
class_NameError = make_builtin_class('NameError', OM_BaseException_create, (class_Exception,))
class_UnboundLocalError = make_builtin_class('UnboundLocalError:', OM_BaseException_create, (class_Exception,))
class_SyntaxError = make_builtin_class('SyntaxError', OM_BaseException_create, (class_Exception,))
class_TypeError = make_builtin_class('TypeError', OM_BaseException_create, (class_Exception,))
class_ValueError = make_builtin_class('ValueError', OM_BaseException_create, (class_Exception,))
class_StopIteration = make_builtin_class('StopIteration', OM_BaseException_create, (class_Exception,))
class_NotImplementedError = make_builtin_class('NotImplementedError', OM_BaseException_create, (class_Exception,))
class_LookupError = make_builtin_class('LookupError', OM_BaseException_create, (class_Exception,))
class_EOFError = make_builtin_class('EOFError', OM_BaseException_create, (class_Exception,))
class_IndexError = make_builtin_class('IndexError', OM_BaseException_create, (class_LookupError,))
class_KeyError = make_builtin_class('KeyError', OM_BaseException_create, (class_LookupError,))
class_AttributeError = make_builtin_class('AttributeError', OM_BaseException_create, (class_Exception,))
class_ArithmeticError = make_builtin_class('ArithmeticError', OM_BaseException_create, (class_Exception,))
class_OverflowError = make_builtin_class('OverflowError', OM_BaseException_create, (class_ArithmeticError,))
class_ZeroDivisionError = make_builtin_class('ZeroDivisionError', OM_BaseException_create, (class_ArithmeticError,))
class_AssertionError = make_builtin_class('AssertionError', OM_BaseException_create, (class_Exception,))
class_ImportError = make_builtin_class('ImportError', OM_BaseException_create, (class_Exception,))
class_ModuleNotFoundError = make_builtin_class('ModuleNotFoundError', OM_BaseException_create, (class_ImportError,))
class_OSError = make_builtin_class('OSError', OM_BaseException_create, (class_Exception,))
class_FileNotFoundError = make_builtin_class('FileNotFoundError', OM_BaseException_create, (class_OSError,))

# Constants
om_None = om(class_NoneType)
om_True = om_boxval(class_bool, int_from_num(1))
om_False = om_boxval(class_bool, int_from_num(0))
om_NotImplemented = om(class_NotImplementedType)

# Non top-level exceptions
# io module
class_UnsupportedOperation = make_stdlib_class("UnsupportedOperation", "io", OM_BaseException_create, (class_OSError,))

# _csv module
class_csv_Error = make_stdlib_class("Error", "_csv", OM_BaseException_create, (class_Exception,))

# Helper to build magic_methods

def do_check_method_self_arg(self_expected_cls, method_name):
    cls_name = OM_get_boxed_value(OM_get(self_expected_cls, "__name__"))
    method_qualname = cls_name + "." + method_name
    not_enough_arguments_msg = method_qualname + "(): not enough arguments"
    not_a_subtype_msg = method_qualname + "(object): object is not a subtype of " + cls_name

    def check_method_self_arg(ctx, cont, args):
        args_len = len(args)
        if args_len == 0:
            return sem_raise_with_message(ctx, class_TypeError, not_enough_arguments_msg)

        cls = args[0]

        if not om_isinstance(cls, self_expected_cls):
            return sem_raise_with_message(ctx, class_TypeError, not_a_subtype_msg)
        else:
            return cont(ctx, args)

    return check_method_self_arg

def do_check_method_with_kwargs_self_arg(self_expected_cls, method_name):
    cls_name = OM_get_boxed_value(OM_get(self_expected_cls, "__name__"))
    method_qualname = cls_name + "." + method_name
    not_enough_arguments_msg = method_qualname + "(): not enough arguments"
    not_a_subtype_msg = method_qualname + "(object): object is not a subtype of " + cls_name

    def check_method_self_arg(ctx, cont, args, kwargs):
        args_len = len(args)
        if args_len == 0:
            return sem_raise_with_message(ctx, class_TypeError, not_enough_arguments_msg)

        cls = args[0]

        if not om_isinstance(cls, self_expected_cls):
            return sem_raise_with_message(ctx, class_TypeError, not_a_subtype_msg)
        else:
            return cont(ctx, args, kwargs)

    return check_method_self_arg

def do_check_static_method_cls_arg(expected_cls, method_name):
    cls_name = OM_get_boxed_value(OM_get(expected_cls, "__name__"))
    not_enough_arguments_msg = method_name + "(): not enough arguments"
    not_a_type_object_msg = method_name + "(X): X is not a type object"
    not_a_subtype_msg = method_name + "(object): object is not a subtype of " + cls_name

    def check_new_cls_arg(ctx, cont, args):
        args_len = len(args)
        if args_len == 0:
            return sem_raise_with_message(ctx, class_TypeError, not_enough_arguments_msg)

        cls = args[0]

        if not om_isinstance(cls, class_type):
            return sem_raise_with_message(ctx, class_TypeError, not_a_type_object_msg)
        elif not om_issubclass(cls, expected_cls):
            return sem_raise_with_message(ctx, class_TypeError, not_a_subtype_msg)
        else:
            return cont(ctx, args)

    return check_new_cls_arg


def do_check_static_method_with_kwargs_cls_arg(expected_cls, method_name):
    cls_name = OM_get_boxed_value(OM_get(expected_cls, "__name__"))
    not_enough_arguments_msg = method_name + "(): not enough arguments"
    not_a_type_object_msg = method_name + "(X): X is not a type object"
    not_a_subtype_msg = method_name + "(object): object is not a subtype of " + cls_name

    def check_new_cls_arg(ctx, cont, args, kwargs):
        args_len = len(args)
        if args_len == 0:
            return sem_raise_with_message(ctx, class_TypeError, not_enough_arguments_msg)

        cls = args[0]

        if not om_isinstance(cls, class_type):
            return sem_raise_with_message(ctx, class_TypeError, not_a_type_object_msg)
        elif not om_issubclass(cls, expected_cls):
            return sem_raise_with_message(ctx, class_TypeError, not_a_subtype_msg)
        else:
            return cont(ctx, args, kwargs)

    return check_new_cls_arg


def do_static_magic_method(cls, method_name, code):
    check_static_method_cls_arg = do_check_static_method_cls_arg(cls, method_name)

    def magic_method(ctx, args):
        return check_static_method_cls_arg(ctx, code, args)

    return magic_method

def do_magic_method(cls, method_name, code):
    check_method_self_arg = do_check_method_self_arg(cls, method_name)

    def magic_method(ctx, args):
        return check_method_self_arg(ctx, code, args)

    return magic_method


def do_magic_method_with_defaults(cls, method_name, code, n_no_defaults, defaults):
    check_method_self_arg = do_check_method_self_arg(cls, method_name)

    msg_expected_at_least = "expected at least " + str(n_no_defaults) + " positional argument(s), got "
    defaults_len = len(defaults)

    def magic_method(ctx, args):
        def push_defaults(ctx, args):
            if len(args) > n_no_defaults:
                i = len(args) - n_no_defaults - 1
                while i < defaults_len:
                    args.append(defaults[i])
                    i += 1
                return code(ctx, args)
            else:
                return sem_raise_with_message(ctx, class_TypeError, msg_expected_at_least + str(len(args) - 1))

        return check_method_self_arg(ctx, push_defaults, args)

    return magic_method


def do_static_magic_method_with_kwargs(cls, method_name, code):
    check_static_method_with_kwargs_cls_arg = do_check_static_method_with_kwargs_cls_arg(cls, method_name)

    def magic_method(ctx, args, kwargs):
        return check_static_method_with_kwargs_cls_arg(ctx, code, args, kwargs)

    return magic_method

def do_magic_method_with_kwargs(cls, method_name, code):
    check_method_self_arg = do_check_method_with_kwargs_self_arg(cls, method_name)

    def magic_method(ctx, args, kwargs):
        return check_method_self_arg(ctx, code, args, kwargs)

    return magic_method


def do_magic_method_with_aligned_kwargs(cls, method_name, code, n_posonly, kwarg_names, defaults):
    check_method_self_arg = do_check_method_with_kwargs_self_arg(cls, method_name)

    msg_expected_at_least = "expected at least " + str(n_posonly) + " positional argument(s), got "

    def magic_method(ctx, args, kwargs):
        def align_code(ctx, args, kwargs):
            if len(args) > n_posonly:
                i = n_posonly + 1
                j = 0
                for name in kwarg_names:
                    value_from_kwarg = dict_pop(kwargs, name, absent)

                    if i >= len(args):
                        args.append(defaults[j] if value_from_kwarg is absent else value_from_kwarg)
                    elif value_from_kwarg is not absent:
                        error_msg = "argument for " + method_name + " given by name ('" + name + "') and position (" + str(i) + ")"
                        return sem_raise_with_message(ctx, class_TypeError, error_msg)

                    i += 1
                    j += 1

                if dict_len(kwargs) > 0:
                    unknown_name = dict_keys(kwargs)[0]
                    error_msg = "'" + unknown_name + "' is an invalid keyword argument for " + method_name
                    return sem_raise_with_message(ctx, class_TypeError, error_msg)
                else:
                    return code(ctx, args)
            else:
                return sem_raise_with_message(ctx, class_TypeError, msg_expected_at_least + str(len(args) - 1))

        return check_method_self_arg(ctx, align_code, args, kwargs)

    return magic_method


# Primitive operators for doing actual computations
def gen_dunder_Homogenous_Numeric_BinOp(py_class, method, prim, om_class, om_box):
    debug_msg = py_class + "." + method
    def dunder_Numeric_BinOp(ctx, args):
        if debug: print(debug_msg)
        val1 = args[0]
        val2 = args[1]

        # Primitive operations are only defined on same types.
        if om_issubclass(OM_get_object_class(val2), om_class):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            result = prim(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_box(result))
        else:
            # TODO: Return om_NotImplemented(rte) (in the proper rte)
            return ctx.cont(ctx.rte, om_NotImplemented)

    return do_magic_method(om_class, method, dunder_Numeric_BinOp)

# Reversed operators reverse the order of their arguments when
# doing the computation.
def gen_dunder_Homogenous_Numeric_rBinOp(py_class, method, prim, om_class, om_box):
    def dunder_Numeric_rBinOp(ctx, args):
        if debug: print(py_class+ "." + method)
        val1 = args[0]
        val2 = args[1]

        if om_issubclass(OM_get_object_class(val2), om_class):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            # Reverse the arguments.
            result = prim(val2_value, val1_value)
            return ctx.cont(ctx.rte, om_box(result))
        else:
            # TODO: Return om_NotImplemented(rte) (in the proper rte)
            return ctx.cont(ctx.rte, om_NotImplemented)

    return do_magic_method(om_class, method, dunder_Numeric_rBinOp)

# class_type magic methods
def om_type_new_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        obj = args[1]
        return ctx.cont(ctx.rte, OM_get_object_class(obj))
    elif args_len == 4:
        return sem_raise(ctx, class_NotImplementedError)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "type() takes 1 or 3 arguments")

om_type_new = do_magic_method(class_type, "__new__", om_type_new_code)

def om_type_call(ctx, args, kwargs):
    def on_instance_creation(rte, instance):
        if om_is(OM_get_object_class(instance), cls):
            cls_init = getattribute_from_class_mro(cls, "__init__")
            next_ctx = with_cont(ctx, lambda rte, _: ctx.cont(ctx.rte, instance))
            return sem_generic_call(next_ctx, cls_init, [instance] + args[1:], kwargs)
        else:
            return ctx.cont(ctx.rte, instance)

    cls = args[0]
    cls_new = getattribute_from_class_mro(cls, "__new__")
    next_ctx = with_cont(ctx, on_instance_creation)

    return sem_generic_call(next_ctx, cls_new, args, kwargs)


def om_type_getattribute_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        self = args[0]
        name = args[1]

        name_value = OM_get_boxed_value(name)

        # Get field name
        attr = getattribute_from_class_mro(self, name_value)
        if attr is absent:
            return sem_raise_with_message(ctx, class_AttributeError, "type has no attribute '" + name_value + "'")

        # attr.__get__
        attr_get = getattribute_from_obj_mro(attr, '__get__')
        if attr_get is absent:
            return ctx.cont(ctx.rte, attr)
        else:
            # TODO: find a better way than this...
            # It seems like cPython does very minor optimisation to avoid that check
            # https://github.com/python/cpython/blob/master/Objects/typeobject.c#L6968
            if om_is(OM_get_object_class(attr), class_getset_descriptor):
                # replace None by absent in that base to indicate the attribute was looked-up on self
                # and not on om_None and found on self
                return sem_simple_call(ctx, attr_get, [attr, absent, self])
            else:
                return sem_simple_call(ctx, attr_get, [attr, om_None, self])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected one argument, got " + str(len(args) - 1))

om_type_getattribute = do_magic_method(class_type, "__getattribute__", om_type_getattribute_code)

def om_type_setattr_code(ctx, args):
    if len(args) == 3:
        self = args[0]
        name = args[1]
        value = args[2]

        if not om_isinstance(name, class_str):
            return sem_raise_with_message(ctx, class_TypeError, "attribute name must be string")

        name_value = OM_get_boxed_value(name)
        class_attr = getattribute_from_obj_mro(self, name_value)

        def set_on_self():
            is_builtin = OM_get_type_is_builtin(self)
            if is_builtin:
                # Prevent setting attribute on a builtin class
                cls_name = OM_get_boxed_value(OM_get(self, '__name__'))
                msg = "can't set attributes of built-in/extension type '" + cls_name + "'"
                return sem_raise_with_message(ctx, class_TypeError, msg)
            else:
                OM_set(self, name_value, value)
                return cont_obj(ctx, om_None)

        if class_attr is absent:
            return set_on_self()
        else:
            attr_set = getattribute_from_obj_mro(class_attr, '__set__')

            if attr_set is absent:
                return set_on_self()
            else:
                return sem_simple_call(ctx, attr_set, [class_attr, self, value])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(len(args) - 1))

om_type_setattr = do_magic_method(class_type, "__setattr__", om_type_setattr_code)

def om_format_type_repr(self, rte):
    if OM_get_type_is_builtin(self):
        self_name = OM_get(self, '__name__')
        self_name_value = OM_get_boxed_value(self_name)
        return "<class '" + self_name_value + "'>"
    else:
        return "<class '" + OM_get_class_qualname(self) + "'>"

def om_type_repr(ctx, args):
    self = args[0]
    result = om_format_type_repr(self, ctx.rte)
    return ctx.cont(ctx.rte, om_str(result))

# class_WrapperDescriptor methods
def om_WrapperDescriptor_get(ctx, args):
    if debug: print('wrapper_descriptor.__get__')
    self = args[0]
    obj = args[1]
    cls = args[2]

    if obj is om_None:
        return ctx.cont(ctx.rte, self)
    else:
        self_name = OM_get(self, '__name__')
        code = OM_get_code(self)
        requires_kwargs = OM_get_requires_kwargs(self)
        method = om_MethodWrapper(self_name, obj, code, requires_kwargs)
        return ctx.cont(ctx.rte, method)

def om_WrapperDescriptor_call_code(ctx, args, kwargs):
    if debug: print('wrapper_descriptor.__call__')

    return sem_generic_call(ctx, args[0], args[1:], kwargs)

om_WrapperDescriptor_call = do_magic_method_with_kwargs(class_WrapperDescriptor, '__call__', om_WrapperDescriptor_call_code)

def om_format_WrapperDescriptor_repr(self, rte):
    self__name__ = OM_get(self, '__name__')
    self__name__value = OM_get_boxed_value(self__name__)

    cls = OM_get_WrapperDescriptor_cls(self)
    clsname = OM_get(cls, '__name__')
    clsname_value = OM_get_boxed_value(clsname)

    return "<slot wrapper '" + self__name__value + "' of '" + clsname_value + "' objects>"

def om_WrapperDescriptor_repr(ctx, args):
    if debug: print('wrapper_descriptor.__call__')
    self = args[0]

    result = om_format_WrapperDescriptor_repr(self, ctx.rte)

    return ctx.cont(ctx.rte, om_str(result))

# class_MethodWrapper methods
def om_MethodWrapper_call_code(ctx, args, kwargs):
    if debug: print('method-wrapper.__call__')

    # This method is never called by sem_call
    return sem_generic_call(ctx, args[0], args[1:], kwargs)

om_MethodWrapper_call = do_magic_method_with_kwargs(class_MethodWrapper, '__call__', om_MethodWrapper_call_code)

def om_format_MethodWrapper_repr(self, rte):
    serial = OM_get_serial(self, rte)

    self__name__ = OM_get(self, '__name__')
    self__name__value = OM_get_boxed_value(self__name__)

    instance = OM_get_MethodWrapper_instance(self)

    cls = OM_get_object_class(instance)
    clsname = OM_get(cls, '__name__')
    clsname_value = OM_get_boxed_value(clsname)

    return "<method-wrapper '" + self__name__value + "' of " + clsname_value + " object #"+ str(serial) +">"


def om_MethodWrapper_repr(ctx, args):
    if debug: print('method-wrapper.__call__')
    self = args[0]

    result = om_format_MethodWrapper_repr(self, ctx.rte)

    return ctx.cont(ctx.rte, om_str(result))

# class_object methods
def om_object_new(ctx, args, kwargs):
    args_len = len(args)

    if args_len == 0:
        return sem_raise_with_message(ctx, class_TypeError, "object.__new__(): not enough arguments")

    cls = args[0]

    if om_is(cls, class_object):
        if args_len > 1 or dict_len(kwargs) > 1:
            return sem_raise_with_message(ctx, class_TypeError, "object() takes no argument")
        else:
            return cont_obj(ctx, om(class_object))
    elif not om_isinstance(cls, class_type):
        return sem_raise_with_message(ctx, class_TypeError, "object.__new__(X): X is not a type object")
    elif OM_get_type_is_builtin(cls):
        # Builtin types should all have and use their own __new__ method due to populting hiddden attributes
        cls_name = OM_get_class_name(cls)
        return sem_raise_with_message(ctx, class_TypeError, "object.__new__(" + cls_name + ") is not safe, use " + cls_name + ".__new__()")
    else:
        return cont_obj(ctx, om(cls))

def om_object_init_code(ctx, args, kwargs):
    # TODO: this might not be correct
    return ctx.cont(ctx.rte, om_None)

om_object_init = do_magic_method_with_kwargs(class_object, "__init__", om_object_init_code)

def om_object_getattribute_code(ctx, args):
    if debug: print('object.__getattribute__')

    if len(args) == 2:
        self = args[0]
        name = args[1]

        if not om_isinstance(name, class_str):
            return sem_raise_with_message(ctx, class_TypeError, "attribute name must be string")

        name_value = OM_get_boxed_value(name)

        self_attr = OM_get(self, name_value)

        if self_attr is not absent:
            return cont_obj(ctx, self_attr)

        # Get field name
        attr, owner = getattribute_from_obj_mro_with_owner(self, name_value)
        if attr is absent:
            self_clsname = OM_get(OM_get_object_class(self), '__name__')
            self_clsname_value = OM_get_boxed_value(self_clsname)

            msg = "'" + self_clsname_value + "' object has no attribute '" + name_value + "'"
            return sem_raise_with_message(ctx, class_AttributeError, msg)

        attr_get = getattribute_from_obj_mro(attr, '__get__')
        if attr_get is absent:
            return cont_obj(ctx, attr)
        else:
            # TODO: this might be a problem when self is actually "None"
            return sem_simple_call(ctx, attr_get, [attr, self, owner])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_object_getattribute = do_magic_method(class_object, "__getattribute__", om_object_getattribute_code)

def om_object_setattr_code(ctx, args):
    if debug: print('object.__setattr__')

    if len(args) == 3:
        self = args[0]
        name = args[1]
        value = args[2]

        if not om_isinstance(name, class_str):
            return sem_raise_with_message(ctx, class_TypeError, "attribute name must be string")

        name_value = OM_get_boxed_value(name)
        class_attr = getattribute_from_obj_mro(self, name_value)

        def set_on_self():
            OM_set(self, name_value, value)
            return cont_obj(ctx, om_None)

        if class_attr is absent:
            return set_on_self()
        else:
            attr_set = getattribute_from_obj_mro(class_attr, '__set__')

            if attr_set is absent:
                return set_on_self()
            else:
                return sem_simple_call(ctx, attr_set, [class_attr, self, value])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(len(args) - 1))

om_object_setattr = do_magic_method(class_object, "__setattr__", om_object_setattr_code)


def om_object_str_code(ctx, args):
    if len(args) == 1:
        return sem_repr(ctx, args[0])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_object_str = do_magic_method(class_object, "__repr__", om_object_str_code)

def om_format_object_repr(self, rte):
    serial = OM_get_serial(self, rte)

    cls = OM_get_object_class(self)
    clsname = OM_get(cls, '__name__')
    clsname_value = OM_get_boxed_value(clsname)

    return "<" + clsname_value + " object #" + str(serial) +">"

def om_object_repr_code(ctx, args):
    if len(args) == 1:
        return cont_str(ctx, om_format_object_repr(args[0], ctx.rte))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_object_repr = do_magic_method(class_object, "__repr__", om_object_repr_code)

def om_object_eq_code(ctx, args):
    if len(args) == 2:
        return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_object_eq = do_magic_method(class_object, "__eq__", om_object_eq_code)

def om_object_ne_code(ctx, args):
    # As per: https://github.com/python/cpython/blob/fabd7bb8e0450f16ed5c5c0ad575aa413d65712d/Objects/typeobject.c#L3989
    if len(args) == 2:
        self = args[0]
        other = args[1]
        self_eq = getattribute_from_obj_mro(self, "__eq__")

        def check_result(check_result_rte, res):
            if om_is(res, om_NotImplemented):
                return cont_obj(ctx, om_NotImplemented)
            else:
                def invert_result(invert_rte, bool_res):
                    if om_is(bool_res, om_True):
                        return cont_obj(ctx, om_False)
                    else:
                        return cont_obj(ctx, om_True)
                return sem_bool(with_cont(ctx, invert_result), res)
        return sem_simple_call(with_cont(ctx, check_result), self_eq, [self, other])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_object_ne = do_magic_method(class_object, "__ne__", om_object_ne_code)


# class_getset_descriptor


def make_getset_readonly_slot(name, objclass, om_getter):
    def getter(ctx, instance):
        return cont_obj(ctx, om_getter(instance))

    def setter(ctx, instance, value):
        return sem_raise_with_message(ctx, class_AttributeError, name + " assignment unsupported")

    return om_getset_descriptor(name, objclass, getter, setter)


def om_getset_descriptor_get_code(ctx, args):
    args_len = len(args)

    if args_len <= 3:
        self = args[0]
        instance = args[1]
        owner = args[2]

        objclass = OM_get_getset_descriptor_objclass(self)
        getter = OM_get_getset_descriptor_getter(self)

        if instance is absent:
            # special signal sent from type.__getattribute__ to indicate attribute was looked up on owner
            return getter(ctx, owner)
        elif om_isinstance(instance, objclass):
            return getter(ctx, instance)
        else:
            name = OM_get_getset_descriptor_name(self)
            wrong_cls_name = OM_get_object_class_name(instance)
            expected_cls_name = OM_get_boxed_value(OM_get(objclass, "__name__"))
            error_msg = "descriptor '" + name + "' for '" + expected_cls_name + "' objects doesn't apply to a '" + wrong_cls_name + "' object"
            return sem_raise_with_message(ctx, class_TypeError, error_msg)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(args_len - 1))

om_getset_descriptor_get = do_magic_method(class_getset_descriptor, "__get__", om_getset_descriptor_get_code)


def om_getset_descriptor_set_code(ctx, args):
    args_len = len(args)

    if args_len == 3:
        self = args[0]
        instance = args[1]
        value = args[2]

        objclass = OM_get_getset_descriptor_objclass(self)

        if om_isinstance(instance, objclass):
            setter = OM_get_getset_descriptor_setter(self)
            return setter(ctx, instance, value)
        else:
            name = OM_get_getset_descriptor_name(self)
            wrong_cls_name = OM_get_object_class_name(instance)
            expected_cls_name = OM_get_boxed_value(OM_get(objclass, "__name__"))
            error_msg = "descriptor '" + name + "' for '" + expected_cls_name + "' objects doesn't apply to a '" + wrong_cls_name + "' object"
            return sem_raise_with_message(ctx, class_TypeError, error_msg)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(args_len - 1))

om_getset_descriptor_set = do_magic_method(class_getset_descriptor, "__set__", om_getset_descriptor_set_code)


# class_TextIOWrapper
def raise_operation_on_closed_file(ctx):
    return sem_raise_with_message(ctx, class_ValueError, "I/O operation on closed file.")

def is_read_file_mode(mode):
    return mode == 'r'

def is_write_truncate_mode(mode):
    return mode == 'w'

def om_format_TextIOWrapper(self, rte):
    return "<TextIOWrapper name='" + OM_get_TextIOWrapper_name(self) + \
           "' mode='" + OM_get_TextIOWrapper_mode(self) + "'>"

def om_TextIOWrapper_repr(ctx, args):
    if len(args) == 1:
        self = args[0]
        return cont_str(ctx, om_format_TextIOWrapper(self))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

def om_TextIOWrapper_enter(ctx, args):
    if len(args) == 1:
        self = args[0]
        return cont_obj(ctx, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

def om_TextIOWrapper_exit(ctx, args):
    if len(args) > 0:
        self = args[0]
        OM_set_TextIOWrapper_opened(self, False)
        return cont_obj(ctx, om_None)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected at least 1 argument, got " + str(len(args) - 1))

def om_TextIOWrapper_close(ctx, args):
    if len(args) == 1:
        self = args[0]
        OM_set_TextIOWrapper_opened(self, False)
        return cont_obj(ctx, om_None)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

def om_TextIOWrapper_read(ctx, args):
    if len(args) == 1:
        self = args[0]
        read_size = -1
    elif len(args) == 2:
        self = args[0]
        size = args[1]

        if size is om_None:
            read_size = -1
        elif om_isinstance(size, class_int):
            read_size = int_to_num(OM_get_boxed_value(size))
        else:
            return sem_raise_with_message(ctx, class_TypeError, "argument should be integer or None")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

    opened = OM_get_TextIOWrapper_opened(self)
    if opened:
        mode = OM_get_TextIOWrapper_mode(self)

        if is_read_file_mode(mode):
            name = OM_get_TextIOWrapper_name(self)

            if runtime_file_exists(ctx.rte, name):
                # Mimic file buffer by slicing file content
                content = runtime_read_file(ctx.rte, name)
                file_len = len(content)
                pointer = OM_get_TextIOWrapper_pointer(self)

                if read_size >= 0:
                    read_end = pointer + read_size
                    if read_end > file_len:
                        read_end = file_len
                else:
                    read_end = file_len

                OM_set_TextIOWrapper_pointer(self, read_end)
                return cont_str(ctx, content[pointer:read_end])
            else:
                # cPython returns an empty string if the file
                # no longer exists at a read() after being opened
                return cont_str(ctx, "")
        else:
            return sem_raise_with_message(ctx, class_UnsupportedOperation, "not readable")
    else:
        return raise_operation_on_closed_file(ctx)

def TextIOWrapper_read_next_line(ctx, textiowrapper):
    opened = OM_get_TextIOWrapper_opened(textiowrapper)
    if opened:
        mode = OM_get_TextIOWrapper_mode(textiowrapper)

        if is_read_file_mode(mode):
            name = OM_get_TextIOWrapper_name(textiowrapper)

            if runtime_file_exists(ctx.rte, name):
                # Mimic file buffer by slicing file content
                content = runtime_read_file(ctx.rte, name)
                file_len = len(content)
                pointer = OM_get_TextIOWrapper_pointer(textiowrapper)
                line_end = string_index_of(content, "\n", pointer, file_len)

                if line_end == -1:
                    line = content[pointer:file_len]
                    OM_set_TextIOWrapper_pointer(textiowrapper, file_len)
                else:
                    # Include the linebreak in the returned slice
                    next_pointer = line_end + 1
                    line = content[pointer:next_pointer]
                    OM_set_TextIOWrapper_pointer(textiowrapper, next_pointer)

                return cont_obj(ctx, line)
            else:
                # cPython returns an empty string if the file
                # no longer exists at a read() after being opened
                return cont_obj(ctx, "")
        else:
            return sem_raise_with_message(ctx, class_UnsupportedOperation, "not readable")
    else:
        return raise_operation_on_closed_file(ctx)

def om_TextIOWrapper_readline(ctx, args):
    if len(args) == 1:
        self = args[0]

        def convert_str(rte, s):
            return cont_str(with_rte(ctx, rte), s)

        return TextIOWrapper_read_next_line(with_cont(ctx, convert_str), self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

def om_TextIOWrapper_next(ctx, args):
    if len(args) == 1:
        self = args[0]

        def check_result(rte, s):
            if s == "":
                return sem_raise(with_rte(ctx, rte), class_StopIteration)
            else:
                return cont_str(with_rte(ctx, rte), s)

        return TextIOWrapper_read_next_line(with_cont(ctx, check_result), self)

    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

def om_TextIOWrapper_iter(ctx, args):
    if len(args) == 1:
        self = args[0]
        return cont_obj(ctx, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))


def om_TextIOWrapper_write(ctx, args):
    if len(args) == 2:
        self = args[0]
        content = args[1]

        if om_isinstance(content, class_str):
            opened = OM_get_TextIOWrapper_opened(self)
            content_value = OM_get_boxed_value(content)
            content_length = len(content_value)

            if opened:
                mode = OM_get_TextIOWrapper_mode(self)

                if is_write_truncate_mode(mode):
                    name = OM_get_TextIOWrapper_name(self)

                    # TODO: cPython on Linux does not recreate file if it was deleted
                    # is that expected or quirk of my OS?
                    runtime_write_file(ctx.rte, name, content_value)

                    # TODO: we should in fact return the number of written bytes
                    # fix that once we have a better filesystem in codeBoot?
                    return cont_int(ctx, int_from_num(content_length))
                else:
                    return sem_raise_with_message(ctx, class_UnsupportedOperation, "not writable")
            else:
                return raise_operation_on_closed_file(ctx)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "write() argument must be str")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))

# class _cvs.reader
def om_csv_reader_iter(ctx, args):
    if len(args) == 1:
        self = args[0]
        return cont_obj(ctx, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

def om_csv_parse_line(ctx, self, init_line, fetch_line):
    # IF YOU NEED HELP DEBUGGING THIS FUNCTION, ASK Olivier Melançon
    #
    # NOTE: This function had to be written in CPS because an element of the iterator
    # of csv.reader could have incomplete data. This is the case when a linebreak is escaped
    # in a file. The file wrapper will then iterate on line, despite some elements spanning
    # through multiple line. Exemple:
    #
    # 1,2,3,"""I see,""
    # said the blind man","as he picked up his
    # hammer and saw"
    # 9,8,7,6
    #
    # Which should output
    # [['1', '2', '3',
    #     '"I see,"\nsaid the blind man',
    #     'as he picked up his\nhammer and saw'],
    #  ['9','8','7','6']]
    #
    # Since this requires a call to sem_next, we have no choice but to write the loop over
    # characters in CPS.

    unexpected_end_of_data_msg = "unexpected end of data"
    unquoted_newline_msg = "new-line character seen in unquoted field"

    delimiter = OM_get_csv_reader_delimiter(self)
    escapechar = OM_get_csv_reader_escapechar(self)
    lineterminator = OM_get_csv_reader_lineterminator(self) # TODO: ignored, '\n' and '\r' are hardcoded
    quotechar = OM_get_csv_reader_quotechar(self)
    quoting = OM_get_csv_reader_quoting(self)
    skipinitialspace = OM_get_csv_reader_skipinitialspace(self)
    strict = OM_get_csv_reader_strict(self)

    must_cast_unquoted = quoting == csv_param_quote_nonnumeric

    def all_lineterminators(s, start, stop):
        while start < stop:
            c = s[start]
            if c != "\n" and c != "\r":
                return False
            start = start + 1
        return True

    def is_lineterminator(c):
        return c == "\n" or c == "\r"

    elements = []
    init_line_len = len(init_line)

    if all_lineterminators(init_line, 0, init_line_len):
        # Special case where en empty list is returned instead of a list containing an empty string
        return cont_list(ctx, [], 0)

    # vector loop start
    def row_loop_start(ctx, i, line, line_len, must_add_trailing_empty_word):
        if i < line_len:
            quoted_element = False
            current_quote_unclosed = False

            chars = []
            c = line[i]

            if skipinitialspace and c == " ":
                i = i + 1

            if c == quotechar:
                i = i + 1
                quoted_element = True
                current_quote_unclosed = True

            return element_loop(ctx, i, line, line_len, current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, False)
        else:
            if must_add_trailing_empty_word:
                elements.append(om_str(""))
            return cont_list(ctx, elements, len(elements))

    # chars loop
    def element_loop(ctx, i, line, line_len, current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, escaping):
        def do_continue():
            return element_loop(ctx, i, line, line_len, current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, escaping)

        def do_break():
            return row_loop_tail(ctx, i, line, line_len, current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, escaping)

        if i >= line_len:
            return do_break()
        else:
            c = line[i]

            if escaping:
                escaped_c = line[i]
                if strict and not quoted_element and is_lineterminator(escaped_c):
                    # In strict mode, escapechar cannot be used to escape unquoted linebreaks
                    return sem_raise_with_message(ctx, class_csv_Error, unexpected_end_of_data_msg)
                else:
                    chars.append(escaped_c)
                    escaping = False
                    i = i + 1

            # Note: in non-strict mode the escape can comes after closing the quote character
            # in which case it is ignored
            elif c == escapechar and (not quoted_element or current_quote_unclosed):
                # Escaped character
                i = i + 1
                escaping = True
            elif is_lineterminator(c) and not current_quote_unclosed:
                # If we see unparsed linebreaks at the end of a word, they are discarded
                # We then expect all remaining characters to be linebreaks
                if all_lineterminators(line, i + 1, line_len):
                    i = line_len
                else:
                    return sem_raise_with_message(ctx, class_csv_Error, unquoted_newline_msg)
            elif c == delimiter and not current_quote_unclosed:
                # Delimiter
                i = i + 1

                # When a line end with a delimiter, a empty word will not be accounted for
                # by the loop, we thus have to add it as a special case
                if i == line_len:
                    must_add_trailing_empty_word = True

                return do_break()

            elif c == quotechar and current_quote_unclosed:
                # End of a quoted element
                next_i = i + 1

                if next_i < line_len and line[next_i] == quotechar:
                    # escape by doubling
                    chars.append(quotechar)
                    i = next_i + 1
                elif strict:
                    # In strict mode, the quotechar must be the last of an element
                    current_quote_unclosed = False
                    if next_i < line_len:
                        next_c = line[next_i]

                        if next_c == delimiter or is_lineterminator(next_c):
                            i = next_i
                            return do_continue()
                        else:
                            return sem_raise_with_message(ctx,
                                                      class_csv_Error,
                                                      "'" + delimiter + "' expected after '" + quotechar + "'")
                    else:
                        return do_break()
                else:
                    current_quote_unclosed = False
                    i = next_i
            else:
                # Normal character
                chars.append(c)
                i = i + 1

            return do_continue()

    # vector loop
    def row_loop_tail(ctx, i, line, line_len, current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, escaping):
        def join_element():
            element = string_join("", chars)

            if not quoted_element and must_cast_unquoted and len(element) > 0:
                # When quoting is QUOTE_NONNUMERIC, we convert unquoted entries to floats
                float_conversion = float_str_conversion(element)

                if float_conversion is None:
                    return raise_could_not_convert_str_to_float(ctx, om_str(element))
                else:
                    elements.append(om_float(float_conversion))
            else:
                elements.append(om_str(element))

            return row_loop_start(ctx, i, line, line_len, must_add_trailing_empty_word)

        if current_quote_unclosed:
            def success(rte, new_line):
                return element_loop(ctx, 0, new_line, len(new_line), current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, escaping)

            def fail(rte):
                if strict:
                    return sem_raise_with_message(with_rte(ctx, rte), class_csv_Error, unexpected_end_of_data_msg)
                else:
                    return join_element()

            return fetch_line(ctx, success, fail)
        elif escaping:
            def success(rte, new_line):
                return element_loop(ctx, 0, new_line, len(new_line), current_quote_unclosed, quoted_element, chars, must_add_trailing_empty_word, escaping)

            def fail(rte):
                if strict:
                    return sem_raise_with_message(with_rte(ctx, rte), class_csv_Error, unexpected_end_of_data_msg)
                else:
                    chars.append("\n") # as per cPython, in non-strict mode trailing escapes are replaced by \n
                    return join_element()

            return fetch_line(ctx, success, fail)
        else:
            return join_element()

    return row_loop_start(ctx, 0, init_line, init_line_len, False)


def om_csv_reader_next(ctx, args):
    if len(args) == 1:
        self = args[0]
        line_iterator = OM_get_csv_reader_lines(self)

        def fetch_line(ctx, success, fail):
            def get_next(rte, nxt_line):
                if nxt_line is None:
                    return fail(rte)
                elif om_isinstance(nxt_line, class_str):
                    line_num = OM_get_csv_reader_line_num(self)
                    OM_set_csv_reader_line_num(self, line_num + 1)

                    return success(rte, OM_get_boxed_value(nxt_line))
                else:
                    return sem_raise_with_message(with_rte(ctx, rte), class_csv_Error, "iterator should return strings")
            return sem_next(with_cont(ctx, get_next), line_iterator, None)

        return fetch_line(ctx,
                          lambda rte, fst_line: om_csv_parse_line(with_rte(ctx, rte), self, fst_line, fetch_line),
                          lambda rte: sem_raise(ctx, class_StopIteration))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))

# class_NotImplementedType
def om_format_NotImplementedType(self, rte):
    return "NotImplemented"

def om_NotImplementedType_str(ctx, args):
    if debug: print('NotImplementedType.__str__')
    self = args[0]
    result = om_format_NotImplementedType(self, ctx.rte)
    return ctx.cont(ctx.rte, om_str(result))

def om_NotImplementedType_repr(ctx, args):
    if debug: print('NotImplementedType.__repr__')
    self = args[0]
    result = om_str('NotImplemented')
    return ctx.cont(ctx.rte, result)

# class_bool methods
def om_bool_new_code(ctx, args):
    if len(args) == 1:
        return cont_bool(ctx, False)
    elif len(args) == 2:
        return sem_bool(ctx, args[1])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected at most 1 arguments, got " + str(len(args) - 1))

om_bool_new = do_static_magic_method(class_bool, "__new__", om_bool_new_code)

def om_format_bool_repr(self, rte):
    if om_is(self, om_True):
        return "True"
    else:
        return "False"

def om_bool_repr_code(ctx, args):
    if debug: print('bool.__repr__')

    if len(args) == 1:
        self = args[0]
        return cont_str(ctx, om_format_bool_repr(self, ctx.rte))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_bool_repr = do_magic_method(class_bool, "__repr__", om_bool_repr_code)

def om_bool_bool_code(ctx, args):
    if debug: print('bool.__bool__')

    if len(args) == 1:
        self = args[0]
        return cont_obj(ctx, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_bool_bool = do_magic_method(class_bool, "__bool__", om_bool_bool_code)


def om_int_neg_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        result = int_neg(OM_get_boxed_value(self))
        return ctx.cont(ctx.rte, om_boxval(class_int, result))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_int_neg = do_magic_method(class_int, "__neg__", om_int_neg_code)

def om_int_invert_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        result = int_not(OM_get_boxed_value(self))
        return ctx.cont(ctx.rte, om_boxval(class_int, result))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_int_invert = do_magic_method(class_int, "__invert__", om_int_invert_code)

def om_int_pos_code(ctx, args):
    if len(args) == 1:
        return ctx.cont(ctx.rte, args[0])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_int_pos = do_magic_method(class_int, "__pos__", om_int_pos_code)

# compute pow_mod with unboxed value.
def compute_pow_mod(ctx, num, power, mod):
    if int_is_zero(mod):
        return sem_raise_with_message(ctx, class_ValueError, "pow() 3rd argument cannot be 0")
    elif int_is_nonneg(power):
        result = int_pow_mod(num, power, mod)
        return cont_int(ctx, result)
    else:
        num_mod = int_mod_floor(num, mod)
        fl_num_mod = int_to_num(num_mod)
        fl_power = int_to_num(power)

        # NOTE: NaN should not happen
        # raise an Overflow error when it cannot be exactly represent as a floating point
        if float_is_infinite(fl_num_mod) or float_is_nan(fl_num_mod) or float_is_nan(fl_power):
            return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
        elif float_is_neg(fl_power):
            # modular inverse computation
            return sem_raise_with_message(ctx, class_NotImplementedError, "modular inverse unimplemented")
        elif float_is_infinite(fl_power):
            # the result tends to 0 when power tends to -Infinity
            return cont_float(ctx, float_from_num(0.0))
        else:
            # the result is less than the mod value because fl_power < 0
            result = float_pow(fl_num_mod, fl_power)
            return cont_float(ctx, result)

# compute pow with unboxed value
def compute_pow(ctx, num, power):
    if int_is_nonneg(power):
        result = int_pow(num, power)
        return cont_int(ctx, result)
    else:
        fl_num = int_to_num(num)
        fl_power = int_to_num(power)

        # NOTE: NaN should not happen
        # raise an Overflow error when it cannot be exactly represent as a floating point
        if float_is_infinite(fl_num) or float_is_nan(fl_num) or float_is_nan(fl_power):
            return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
        elif not float_is_finite(fl_power):
            # the result tends to 0 when power tends to -Infinity
            return cont_float(ctx, float_from_num(0.0))
        else:
            result = float_pow(fl_num, fl_power)
            return cont_float(ctx, result)

def om_int_pow_code(ctx, args):
    args_len = len(args)
    if args_len < 2:
        return sem_raise_with_message(ctx, class_TypeError, "expected at least 1 argument, got " + str(args_len - 1))
    elif args_len > 3:
        return sem_raise_with_message(ctx, class_TypeError, "expected at most 3 arguments, got " + str(args_len - 1))
    else:
        self = args[0]
        power = args[1]

        if om_isinstance(power, class_int):
            self_value = OM_get_boxed_value(self)
            power_value = OM_get_boxed_value(power)

            if args_len == 2:
                return compute_pow(ctx, self_value, power_value)
            else:
                mod = args[2]
                if om_isinstance(mod, class_int):
                    mod_value = OM_get_boxed_value(mod)
                    return compute_pow_mod(ctx, self_value, power_value, mod_value)
                elif om_isinstance(mod, class_float):
                    return sem_raise_with_message(ctx, class_TypeError, "3rd argument not allowed unless all arguments are integers")
        return cont_obj(ctx, om_NotImplemented)

om_int_pow = do_magic_method(class_int, "__pow__", om_int_pow_code)

# XXX: code repetition...
def om_int_rpow_code(ctx, args):
    args_len = len(args)
    if args_len < 2:
        return sem_raise_with_message(ctx, class_TypeError, "expected at least 1 argument, got " + str(args_len - 1))
    elif args_len > 3:
        return sem_raise_with_message(ctx, class_TypeError, "expected at most 3 arguments, got " + str(args_len - 1))
    else:
        self = args[0]
        num = args[1]

        if om_isinstance(num, class_int):
            self_value = OM_get_boxed_value(self)
            num_value = OM_get_boxed_value(num)

            if args_len == 2:
                return compute_pow(ctx, num_value, self_value)
            else:
                mod = args[2]
                if om_isinstance(mod, class_int):
                    mod_value = OM_get_boxed_value(mod)
                    return compute_pow_mod(ctx, num_value, self_value, mod_value)
                elif om_isinstance(mod, class_float):
                    return sem_raise_with_message(ctx, class_TypeError, "3rd argument not allowed unless all arguments are integers")
        return cont_obj(ctx, om_NotImplemented)

om_int_rpow = do_magic_method(class_int, "__rpow__", om_int_rpow_code)

# int round if tie_up is False, then tie break is done to even
# if tie_up is True, then tie break is done to upper number
def int_round(x, ndigits, tie_even):
    pow_limit = int_mul(int_from_num(10), int_abs(x))

    # Version of pow which abort if the power is unnecessrily big
    def round_pow(y, n):
        if int_gt(x, pow_limit) and not int_is_zero(n):
            return False
        elif int_is_zero(n):
            return int_from_num(1)
        else:
            sq = int_mul(y, y)
            temp = round_pow(sq, int_rshift(n, int_from_num(1)))
            if temp is False:
                return False
            elif int_is_even(n):
                return temp
            else:
                return int_mul(y, temp)

    if int_is_nonneg(ndigits):
        return x
    else:
        low_digits_range = round_pow(int_from_num(10), int_neg(ndigits))

        # abs(ndigits) may be so big that we don't need to know the result of its power
        if low_digits_range is False:
            return int_from_num(0)
        else:
            low_digits = int_mod_floor(x, low_digits_range)
            tmp_cmp = int_mul(low_digits, int_from_num(2))
            x_rounded_down = int_sub(x, low_digits)

            if int_gt(tmp_cmp, low_digits_range): # Round up
                return int_add(x_rounded_down, low_digits_range)
            elif int_eq(tmp_cmp, low_digits_range): # Round toward even if tie_up is False
                if tie_even and int_is_even(int_div_floor(x_rounded_down, low_digits_range)):
                    return x_rounded_down
                else:
                    return int_add(x_rounded_down, low_digits_range)
            else: # Round down
                return x_rounded_down

def om_int_round_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        return cont_obj(ctx, self)
    elif len(args) == 2:
        self = args[0]
        ndigits = args[1]

        def apply_round(rte, n):
            self_value = OM_get_boxed_value(self)
            n_value = OM_get_boxed_value(n)
            if int_is_nonneg(n_value):
                return cont_obj(ctx, self)
            else:
                return cont_int(ctx, int_round(self_value, n_value, True))

        return sem_index(with_cont(ctx, apply_round), ndigits)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_int_round = do_magic_method(class_int, "__round__", om_int_round_code)

# class_tuple methods


def make_tuple(ctx, elements):
    return ctx.cont(ctx.rte, om_tuple(elements))


def om_tuple_elements_repr(ctx, elts, repr_acc, i):
    if len(elts) == i:
        result = '(' + ', '.join(repr_acc) + (',' if i == 1 else '') + ')'
        return cont_str(ctx, result)
    else:
        def cont(rte, value):
            repr_acc.append(OM_get_boxed_value(value))
            return stmt_end(
                Context(rte, lambda _: om_tuple_elements_repr(with_rte(ctx, rte), elts, repr_acc, i + 1), ctx.ast),
                0)

        return sem_repr(with_cont(ctx, cont), elts[i])


def om_tuple_repr_code(ctx, args):
    if debug: print('list.__repr__')

    args_len = len(args)

    if args_len == 1:
        rte = ctx.rte
        self = args[0]

        if rte_check_seen_repr(rte, self):
            return cont_str(ctx, "(...)")
        else:
            rte_add_seen_repr(rte, self)
            elements = OM_get_tuple_seq(self)
            return om_tuple_elements_repr(ctx, elements, [], 0)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(args_len - 1))


om_tuple_repr = do_magic_method(class_tuple, "__repr__", om_tuple_repr_code)


def om_tuple_eq_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        other = args[1]

        if om_isinstance(other, class_tuple):
            self_seq = OM_get_tuple_seq(self)
            self_len = len(self_seq)

            other_seq = OM_get_tuple_seq(other)
            other_len = len(other_seq)

            if self_len == other_len:
                return check_sequence_equality(ctx, self_seq, other_seq, 0, self_len)
            else:
                return cont_obj(ctx, om_False)
        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "__eq__() takes 1 argument (" + str(args_len - 1) + " given)")


om_tuple_eq = do_magic_method(class_tuple, "__eq__", om_tuple_eq_code)


def om_tuple_new_code(ctx, args):
    args_len = len(args)

    cls = args[0]

    if args_len == 1:
        return ctx.cont(ctx.rte, om_tuple_subtype(cls, []))
    elif args_len == 2:
        def alloc(rte, seq):
            return ctx.cont(rte, om_tuple_subtype(cls, seq))
        return om_unpack_iterable(with_cont(ctx, alloc), args[1])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "tuple expected at most 1 argument, got " + str(args_len))


om_tuple_new = do_static_magic_method(class_tuple, "__new__", om_tuple_new_code)


def om_tuple_len_code(ctx, args):
    if debug: print('tuple.__len__')

    args_len = len(args)

    if args_len == 1:
        self = args[0]
        elements = OM_get_tuple_seq(self)
        elements_len = len(elements)

        return cont_int(ctx, int_from_num(elements_len))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 argument, got " + str(len(args) - 1))


om_tuple_len = do_magic_method(class_tuple, "__len__", om_tuple_len_code)


def om_tuple_getitem_code(ctx, args):
    if debug: print('tuple.__getitem__')

    args_len = len(args)

    if args_len == 2:
        self = args[0]
        item = args[1]

        if om_isinstance(item, class_slice):
            elements = OM_get_list_seq(self)

            def get_result(rte, res):
                slice_start = int_to_num(res[0])
                slice_stop = int_to_num(res[1])
                slice_step = int_to_num(res[2])

                new_seq = list_get_slice(elements, slice_start, slice_stop, slice_step)

                return cont_tuple(with_rte(ctx, rte), new_seq)

            start = OM_get_slice_start(item)
            stop = OM_get_slice_stop(item)
            step = OM_get_slice_step(item)

            return compute_slice_indices(with_cont(ctx, get_result), start, stop, step, int_from_num(len(elements)))
        else:
            def cont(rte, val):
                item_box_index = OM_get_boxed_value(val)
                elements = OM_get_tuple_seq(self)
                elements_len = int_from_num(len(elements))
                if int_ge(item_box_index, elements_len):
                    return sem_raise_with_message(ctx, class_IndexError, "tuple index out of range")
                elif int_is_nonneg(item_box_index):
                    return cont_obj(ctx, elements[int_to_num(item_box_index)])
                else:
                    reversed_index = int_add(item_box_index, elements_len)
                    if int_is_nonneg(reversed_index):
                        return cont_obj(ctx, elements[int_to_num(reversed_index)])
                    else:
                        return sem_raise_with_message(ctx, class_IndexError, "tuple index out of range")

            return sem_index(with_cont(ctx, cont), item)

    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))


om_tuple_getitem = do_magic_method(class_tuple, "__getitem__", om_tuple_getitem_code)


def om_tuple_add_code(ctx, args):
    if debug: print('tuple.__add__')

    args_len = len(args)

    if args_len == 2:
        self = args[0]
        other = args[1]

        if om_isinstance(other, class_tuple):
            self_elements = OM_get_tuple_seq(self)
            other_elements = OM_get_tuple_seq(other)

            return cont_tuple(ctx, list_concat(self_elements, other_elements))
        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))


om_tuple_add = do_magic_method(class_tuple, "__add__", om_tuple_add_code)


def om_tuple_mul_code(ctx, args):
    if debug: print('tuple.__mul__')

    args_len = len(args)

    if args_len == 2:
        self = args[0]
        other = args[1]

        def cont(rte, n):
            if n is absent:
                return cont_obj(with_rte(ctx, rte), om_NotImplemented)
            else:
                repeat = int_to_num(OM_get_boxed_value(n))

                if repeat > 0:
                    elements = OM_get_tuple_seq(self)

                    return cont_tuple(with_rte(ctx, rte), list_repeat(elements, repeat))
                else:
                    return cont_tuple(with_rte(ctx, rte), [])
        return sem_maybe_index(with_cont(ctx, cont), other)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))


om_tuple_mul = do_magic_method(class_tuple, "__mul__", om_tuple_mul_code)
om_tuple_rmul = do_magic_method(class_tuple, "__rmul__", om_tuple_mul_code)


def count_in_sequence(ctx, seq, len_, val):
    def do_check_item(i, count):
        if i < len_:
            def step_to_next_item(rte, res):
                if om_is(res, om_True):
                    return do_check_item(i + 1, count + 1)
                else:
                    return do_check_item(i + 1, count)

            item = seq[i]
            return sem_Eq_bool_with_return_to_trampoline(with_cont(ctx, step_to_next_item), val, item)
        else:
            return cont_int_from_num(ctx, count)

    return do_check_item(0, 0)


def om_tuple_count_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        self_seq = OM_get_list_seq(self)
        self_len = len(self_seq)
        val = args[1]

        return count_in_sequence(ctx, self_seq, self_len, val)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "count() takes exactly one argument (" + str(args_len - 1) + " given)")


om_tuple_count = do_magic_method(class_tuple, "count", om_tuple_count_code)


def sequence_search(ctx, seq, target, start, end):
    # search om_lst[start:end] for target and returns its index, or absent if not found
    # both start and end must be positive indices in range

    if start < end:
        def check_result(rte, res):
            if om_is(res, om_True):
                return cont_obj(with_rte(ctx, rte), start)
            else:
                return stmt_end(
                    Context(
                        rte,
                        lambda rte: sequence_search(with_rte(ctx, rte), seq, target, start + 1, end),
                        ctx.ast),
                    0)
        return sem_Eq_bool(with_cont(ctx, check_result), seq[start], target)
    else:
        return cont_obj(ctx, absent)


def clamp_index(index, len_):
    if index >= len_:
        return len_
    elif index >= 0:
        return index
    else:
        reversed_index = index + len_
        if reversed_index >= 0:
            return reversed_index
        else:
            return 0


def gen_om_sequence_index(om_class, seq_getter, len_getter):
    cls_name = OM_get_boxed_value(OM_get(om_class, "__name__"))
    not_in_msg = " is not in " + cls_name

    def code(ctx, args):
        args_len = len(args)

        def check_result(rte, res):
            if res is absent:
                def do_error(err_rte, repr_):
                    return sem_raise_with_message(with_rte(ctx, err_rte), class_ValueError,
                                                  OM_get_boxed_value(repr_) + not_in_msg)
                return sem_repr(Context(rte, do_error, ctx.ast), value)
            else:
                return cont_int(with_rte(ctx, rte), int_from_num(res))

        if args_len == 2:
            self = args[0]
            elements = seq_getter(self)
            len_ = len_getter(self, elements)
            value = args[1]

            return sequence_search(with_cont(ctx, check_result), elements, value, 0, len_)
        if args_len == 3 or args_len == 4:
            self = args[0]
            elements = seq_getter(self)
            len_ = len_getter(self, elements)
            value = args[1]
            start = args[2]

            def get_start(rte, om_start):
                index = int_to_num(OM_get_boxed_value(om_start))

                start_index = clamp_index(index, len_)

                if args_len == 3:
                    return sequence_search(Context(rte, check_result, ctx.ast), elements, value, start_index, len_)
                else:  # args_len == 4
                    stop = args[3]

                    def get_stop(stop_rte, om_stop):
                        index = int_to_num(OM_get_boxed_value(om_stop))
                        stop_index = clamp_index(index, len_)
                        return sequence_search(Context(rte, check_result, ctx.ast), elements, value, start_index, stop_index)
                    return sem_index(Context(rte, get_stop, ctx.ast), stop)
            return sem_index(with_cont(ctx, get_start), start)
        else:
            return sem_raise_with_message(ctx, class_TypeError,
                                          "index() expected between 1 and 3 arguments, got " + str(args_len - 1))

    return do_magic_method(om_class, 'index', code)


om_tuple_index = gen_om_sequence_index(class_tuple, OM_get_tuple_seq, lambda t, s: len(s))


# class_list methods


def get_list_inner_len(len_):
    return len_ * 5 // 4 + 1


def list_seq_grow(seq, extra_space=0):
    seq_len = len(seq)
    new_len = get_list_inner_len(seq_len + extra_space)

    new_seq = []
    i = 0
    while i < seq_len:
        new_seq.append(seq[i])
        i += 1

    while i < new_len:
        new_seq.append(empty_cell)
        i += 1

    return new_seq

def list_seq_maybe_shrink(om_lst, seq, len_, inner_len):
    if len_ < inner_len // 2 + 1:
        new_inner_len = get_list_inner_len(len_)
        new_seq = seq[:new_inner_len]

        OM_set_list_seq(om_lst, new_seq)

def list_internal_append(om_lst, seq, len_, inner_len, value):
    if len_ < inner_len:
        seq[len_] = value
        OM_set_list_len(om_lst, len_ + 1)
    else:
        new_elements = list_seq_grow(seq)
        new_elements[len_] = value
        OM_set_list_seq(om_lst, new_elements)
        OM_set_list_len(om_lst, len_ + 1)

def list_shift_left(om_lst, seq, len_, inner_len, shift_pos, shift_amount):
    to_index = shift_pos
    from_index = shift_pos + shift_amount

    while from_index < len_:
        seq[to_index] = seq[from_index]
        to_index += 1
        from_index += 1

    while to_index < len_:
        seq[to_index] = empty_cell
        to_index += 1

    new_len = len_ - shift_amount
    OM_set_list_len(om_lst, new_len)
    list_seq_maybe_shrink(om_lst, seq, new_len, inner_len)


def list_shift_right(om_lst, seq, len_, inner_len, shift_pos, shift_amount):
    # list_shift_right frees frees a slice in the list from shift_pos to shift_pos + shift_amount
    # The elements in this freed slot are undefined and must be replaced afterward
    # Since shift_right may resize the list, it will return the new sequence of the om_lst
    diff = len_ + shift_amount - inner_len
    if diff > 0:
        seq = list_seq_grow(seq, diff)
        OM_set_list_seq(om_lst, seq)

    last_index = len_ - 1
    to_index = last_index + shift_amount
    from_index = last_index

    while from_index >= shift_pos:
        seq[to_index] = seq[from_index]
        to_index -= 1
        from_index -= 1

    OM_set_list_len(om_lst, len_ + shift_amount)
    return seq


def check_sequence_equality(ctx, seq1, seq2, start, end):
    if start < end:
        def check_res(rte, res):
            def check_truthiness(rte, is_eq):
                if om_is(is_eq, om_True):
                    next_ctx = Context(rte, lambda rte: check_sequence_equality(ctx, seq1, seq2, start + 1, end), ctx.ast)
                    return stmt_end(next_ctx, 0)
                else:
                    return cont_obj(ctx, om_False)
            return sem_bool(Context(rte, check_truthiness, ctx.ast), res)
        return sem_Eq(with_cont(ctx, check_res), seq1[start], seq2[start])
    else:
        return cont_obj(ctx, om_True)


def make_list(ctx, elements):
    list_len = len(elements)
    dynamic_array = list_seq_grow(elements)
    return ctx.cont(ctx.rte, om_list(dynamic_array, list_len))

def om_list_new_code(ctx, args):
    if debug: print("list.__new__")

    args_len = len(args)

    if args_len == 1:
        return ctx.cont(ctx.rte, om_list([], 0))
    elif args_len == 2:
        def alloc(rte, seq):
            return make_list(ctx, seq)
        return om_unpack_iterable(with_cont(ctx, alloc), args[1])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "list expected at most 1 argument, got " + str(args_len))

om_list_new = do_static_magic_method(class_list, "__new__", om_list_new_code)


def om_list_eq_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        other = args[1]

        if om_isinstance(other, class_list):
            self_seq = OM_get_list_seq(self)
            self_len = OM_get_list_len(self)

            other_seq = OM_get_list_seq(other)
            other_len = OM_get_list_len(other)

            if self_len == other_len:
                return check_sequence_equality(ctx, self_seq, other_seq, 0, self_len)
            else:
                return cont_obj(ctx, om_False)
        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "__eq__() takes 1 argument (" + str(args_len - 1) + " given)")


om_list_eq = do_magic_method(class_list, "__eq__", om_list_eq_code)


def om_list_elements_repr(ctx, elts, repr_acc, i):
    if len(elts) == i or elts[i] is empty_cell:
        result = '[' + ', '.join(repr_acc) + ']'
        return cont_str(ctx, result)
    else:
        def cont(rte, value):
            repr_acc.append(OM_get_boxed_value(value))
            return stmt_end(
                Context(rte, lambda _: om_list_elements_repr(with_rte(ctx, rte), elts, repr_acc, i + 1), ctx.ast),
                0)

        return sem_repr(with_cont(ctx, cont), elts[i])

def om_list_repr_code(ctx, args):
    if debug: print('list.__repr__')

    args_len = len(args)

    if args_len == 1:
        rte = ctx.rte
        self = args[0]

        if rte_check_seen_repr(rte, self):
            return cont_str(ctx, "[...]")
        else:
            rte_add_seen_repr(rte, self)
            elements = OM_get_list_seq(self)
            return om_list_elements_repr(ctx, elements, [], 0)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

om_list_repr = do_magic_method(class_list, "__repr__", om_list_repr_code)


def om_list_getitem_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        item = args[1]

        if om_isinstance(item, class_slice):
            def get_result(rte, res):
                elements = OM_get_list_seq(self)
                slice_start = int_to_num(res[0])
                slice_stop = int_to_num(res[1])
                slice_step = int_to_num(res[2])

                new_seq = list_get_slice(elements, slice_start, slice_stop, slice_step)

                return cont_list(with_rte(ctx, rte), new_seq, len(new_seq))

            start = OM_get_slice_start(item)
            stop = OM_get_slice_stop(item)
            step = OM_get_slice_step(item)
            len_ = OM_get_list_len(self)

            return compute_slice_indices(with_cont(ctx, get_result), start, stop, step, int_from_num(len_))
        else:
            def cont(rte, item_index):
                index = OM_get_boxed_value(item_index)
                self_len = int_from_num(OM_get_list_len(self))
                elements = OM_get_list_seq(self)

                next_ctx = with_rte(ctx, rte)

                if int_ge(index, self_len):
                    return sem_raise_with_message(next_ctx, class_IndexError, "list index out of range")
                elif int_is_nonneg(index):
                    return cont_obj(next_ctx, elements[int_to_num(index)])
                else:
                    reversed_index = int_add(index, self_len)
                    if int_is_nonneg(reversed_index):
                        return cont_obj(next_ctx, elements[int_to_num(reversed_index)])
                    else:
                        return sem_raise_with_message(next_ctx, class_IndexError, "list index out of range")

            return sem_index(with_cont(ctx, cont), item)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "__getitem__() takes exactly one argument (" + str(args_len - 1) + " given)")

om_list_getitem = do_magic_method(class_list, "__getitem__", om_list_getitem_code)

def list_set_simple_slice(om_list, seq, list_len, start, stop, elements):
    # A simple slice is a slice with step 1
    # Assignment to a simple slice is not simple at all because it allows the sequence to change length
    slice_len = stop - start if stop > start else 0
    elements_len = len(elements)
    diff = slice_len - elements_len

    if diff > 0:  # list must shrink
        new_stop = stop - diff
        # Write new items in list
        list_set_slice(seq, start, new_stop, 1, elements)
        # Delete extra items in the slice from the list
        list_shift_left(om_list, seq, list_len, len(seq), new_stop, diff)
    elif diff < 0:  # list must grow
        new_stop = stop - diff
        # Make extra space in the list for extra items
        seq = list_shift_right(om_list, seq, list_len, len(seq), start, -diff)
        # Write items in list
        list_set_slice(seq, start, new_stop, 1, elements)
    else: # list len does not change
        list_set_slice(seq, start, stop, 1, elements)


def om_list_setitem_code(ctx, args):
    args_len = len(args)
    if args_len == 3:
        self = args[0]
        item = args[1]
        value = args[2]

        if om_isinstance(item, class_slice):
            self_len = OM_get_list_len(self)

            def get_slice_indices(slice_rte, indices):
                start = indices[0]
                stop = indices[1]
                step = indices[2]

                def get_assignment_values(elements_rte, elements):
                    if int_eq(step, int_from_num(1)):
                        # simple slice (step == 1) is the trickiest because it allows for insertion/removal
                        # it is allowed to change the list length
                        self_elements = OM_get_list_seq(self)
                        list_set_simple_slice(self, self_elements, self_len, int_to_num(start), int_to_num(stop), elements)
                        return cont_obj(with_rte(ctx, elements_rte), om_None)
                    else:
                        # The case of extended slices (step != 1) is simpler because the slice length
                        # must be the same as the assignment length, anything else is an error
                        slice_len = compute_range_len(start, stop, step)
                        elements_len = int_to_num(len(elements))
                        if int_eq(slice_len, elements_len):
                            # NOTE: this check has to reasons:
                            #  1) there is nothing to do if the slice has length 0
                            #  2) A slice of length 0 may have negative indices as sentinel values which list_set_slice
                            #     cannot handle
                            if int_is_pos(slice_len):
                                self_elements = OM_get_list_seq(self)
                                list_set_slice(self_elements,
                                               int_to_num(start),
                                               int_to_num(stop),
                                               int_to_num(step),
                                               elements)
                            return cont_obj(with_rte(ctx, elements_rte), om_None)
                        else:
                            return sem_raise_with_message(with_rte(ctx, elements_rte),
                                                          class_ValueError,
                                                          "attempt to assign sequence of size "
                                                          + int_to_string(elements_len, 10)
                                                          + " to extended slice of size "
                                                          + int_to_string(slice_len, 10))
                return om_unpack_iterable(Context(slice_rte, get_assignment_values, ctx.ast), value)

            return compute_slice_indices(with_cont(ctx, get_slice_indices),
                                         OM_get_slice_start(item),
                                         OM_get_slice_stop(item),
                                         OM_get_slice_step(item),
                                         int_from_num(self_len))
        else:
            def cont(rte, item_index):
                index = OM_get_boxed_value(item_index)
                self_len = int_from_num(OM_get_list_len(self))
                elements = OM_get_list_seq(self)

                next_ctx = with_rte(ctx, rte)

                if int_ge(index, self_len):
                    return sem_raise_with_message(next_ctx, class_IndexError, "list index out of range")
                elif int_is_nonneg(index):
                    elements[int_to_num(index)] = value
                    return cont_obj(next_ctx, om_None)
                else:
                    reversed_index = int_add(index, self_len)
                    if int_is_nonneg(reversed_index):
                        elements[int_to_num(reversed_index)] = value
                        return cont_obj(next_ctx, om_None)
                    else:
                        return sem_raise_with_message(next_ctx, class_IndexError, "list index out of range")
            return sem_index(with_cont(ctx, cont), item)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "__setitem__() takes exactly two argument (" + str(args_len - 1) + " given)")

om_list_setitem = do_magic_method(class_list, "__setitem__", om_list_setitem_code)

def om_list_len_code(ctx, args):
    args_len = len(args)
    if args_len == 1:
        self = args[0]
        elements_len = OM_get_list_len(self)
        return cont_int(ctx, int_from_num(elements_len))
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "__len__() takes no argument (" + str(args_len - 1) + " given)")


om_list_len = do_magic_method(class_list, "__len__", om_list_len_code)


def om_list_add_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        other = args[1]

        if om_isinstance(other, class_list):
            self_len = OM_get_list_len(self)
            self_seq = OM_get_list_seq(self)

            other_len = OM_get_list_len(other)
            other_seq = OM_get_list_seq(other)

            new_len = self_len + other_len
            new_seq = list_new(get_list_inner_len(new_len), empty_cell)

            list_set_slice(new_seq, 0, self_len, 1, self_seq)
            list_set_slice(new_seq, self_len, new_len, 1, other_seq)

            return cont_list(ctx, new_seq, new_len)
        else:
            return cont_obj(ctx, om_NotImplemented)


    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "__add__() takes one argument (" + str(args_len - 1) + " given)")


om_list_add = do_magic_method(class_list, "__add__", om_list_add_code)


def om_list_extend_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        other = args[1]

        def cont(rte, other_seq):
            self_len = OM_get_list_len(self)
            self_seq = OM_get_list_seq(self)

            other_len = len(other_seq)

            new_len = self_len + other_len

            if new_len <= len(self_seq):
                list_set_slice(self_seq, self_len, new_len, 1, other_seq)
                OM_set_list_len(self, new_len)
            else:
                new_seq = list_new(get_list_inner_len(new_len), empty_cell)

                list_set_slice(new_seq, 0, self_len, 1, self_seq)
                list_set_slice(new_seq, self_len, new_len, 1, other_seq)

                OM_set_list_seq(self, new_seq)
                OM_set_list_len(self, new_len)

            return cont_obj(with_rte(ctx, rte), om_None)

        return om_unpack_iterable(with_cont(ctx, cont), other)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "extend() takes one argument (" + str(args_len - 1) + " given)")


om_list_extend = do_magic_method(class_list, "extend", om_list_extend_code)


def om_list_iadd_code(ctx, args):
    args_len = len(args)
    if args_len == 2:

        def cont(rte, _):
            return cont_obj(with_rte(ctx, rte), args[0])

        return om_list_extend_code(with_cont(ctx, cont), args)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "__iadd__() takes one argument (" + str(args_len - 1) + " given)")


om_list_iadd = do_magic_method(class_list, "__iadd__", om_list_iadd_code)


def om_list_mul_code(ctx, args):

    args_len = len(args)

    if args_len == 2:
        self = args[0]
        n = args[1]

        def cont(rte, n_int):
            if n_int is absent:
                return cont_obj(with_rte(ctx, rte), om_NotImplemented)
            else:
                repeat = int_to_num(OM_get_boxed_value(n_int))

                if repeat > 0:
                    seq = OM_get_list_seq(self)
                    self_len = OM_get_list_len(self)

                    new_len = repeat * self_len

                    return cont_list(with_rte(ctx, rte), list_repeat(seq[0:self_len], repeat), new_len)
                else:
                    return cont_list(with_rte(ctx, rte), [], 0)
        return sem_maybe_index(with_cont(ctx, cont), n)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))


om_list_mul = do_magic_method(class_list, "__mul__", om_list_mul_code)
om_list_rmul = do_magic_method(class_list, "__rmul__", om_list_mul_code)


def om_list_append_code(ctx, args):
    if debug: print('list.append')

    args_len = len(args)

    if args_len == 2:
        self = args[0]
        value = args[1]

        elements = OM_get_list_seq(self)
        list_len = OM_get_list_len(self)
        elements_len = len(elements)

        list_internal_append(self, elements, list_len, elements_len, value)

        return ctx.cont(ctx.rte, om_None)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "append() takes exactly one argument (" + str(args_len - 1) + " given)")

om_list_append = do_magic_method(class_list, "append", om_list_append_code)


def om_list_pop_code(ctx, args):
    args_len = len(args)
    if args_len == 1:
        self = args[0]
        elements = OM_get_list_seq(self)
        len_ = OM_get_list_len(self)
        inner_len = len(elements)

        if len_ > 0:
            last_index = len_ - 1
            last = elements[last_index]
            elements[last_index] = empty_cell
            OM_set_list_len(self, last_index)

            list_seq_maybe_shrink(self, elements, last_index, inner_len)
            return cont_obj(ctx, last)
        else:
            return sem_raise_with_message(ctx, class_IndexError, "pop item from empty list")
    elif args_len == 2:
        def do_pop(rte, om_index):
            self = args[0]
            elements = OM_get_list_seq(self)
            len_ = OM_get_list_len(self)
            inner_len = len(elements)

            index = int_to_num(OM_get_boxed_value(om_index))
            next_ctx = with_rte(ctx, rte)

            if index >= len_:
                return sem_raise_with_message(next_ctx, class_IndexError, "pop index out of range")
            elif index >= 0:
                poped_item = elements[index]
                list_shift_left(self, elements, len_, inner_len, index, 1)
                return cont_obj(next_ctx, poped_item)
            else:
                reversed_index = index + len_
                if reversed_index >= 0:
                    poped_item = elements[reversed_index]
                    list_shift_left(self, elements, len_, inner_len, reversed_index, 1)
                    return cont_obj(next_ctx, poped_item)
                else:
                    return sem_raise_with_message(next_ctx, class_IndexError, "pop index out of range")

        return sem_index(with_cont(ctx, do_pop), args[1])

    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "pop() expected at most 1 argument, got " + str(args_len - 1))


om_list_pop = do_magic_method(class_list, "pop", om_list_pop_code)


def om_list_insert_code(ctx, args):
    args_len = len(args)
    if args_len == 3:
        def do_insert(rte, om_index):
            self = args[0]
            elements = OM_get_list_seq(self)
            len_ = OM_get_list_len(self)
            inner_len = len(elements)
            value = args[2]

            index = int_to_num(OM_get_boxed_value(om_index))
            next_ctx = with_rte(ctx, rte)

            if index >= len_:
                list_internal_append(self, elements, len_, inner_len, value)
                return cont_obj(next_ctx, om_None)
            elif index >= 0:
                elements = list_shift_right(self, elements, len_, inner_len, index, 1)
                elements[index] = value
                return cont_obj(next_ctx, om_None)
            else:
                reversed_index = index + len_
                if reversed_index >= 0:
                    elements = list_shift_right(self, elements, len_, inner_len, reversed_index, 1)
                    elements[reversed_index] = value
                    return cont_obj(next_ctx, om_None)
                else:
                    elements = list_shift_right(self, elements, len_, inner_len, 0, 1)
                    elements[0] = value
                    return cont_obj(next_ctx, om_None)

        return sem_index(with_cont(ctx, do_insert), args[1])
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "insert() expected 2 arguments, got " + str(args_len - 1))


om_list_insert = do_magic_method(class_list, "insert", om_list_insert_code)


om_list_index = gen_om_sequence_index(class_list, OM_get_list_seq, lambda l, s: OM_get_list_len(l))


def om_list_contains_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        def get_result(rte, res):
            return cont_bool(with_rte(ctx, rte), res is not absent)

        self = args[0]
        seq = OM_get_list_seq(self)
        len_ = OM_get_list_len(self)

        target = args[1]

        return sequence_search(with_cont(ctx, get_result), seq, target, 0, len_)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "__contains__() takes 1 argument (" + str(args_len - 1) + " given)")


om_list_contains = do_magic_method(class_list, '__contains__', om_list_contains_code)


def om_list_remove_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        def get_result(rte, res):
            if res is absent:
                return sem_raise_with_message(with_rte(ctx, rte), class_ValueError, "list.remove(x): x not in list")
            else:
                list_shift_left(self, seq, len_, len(seq), res, 1)
                return cont_obj(with_rte(ctx, rte), om_None)

        self = args[0]
        seq = OM_get_list_seq(self)
        len_ = OM_get_list_len(self)

        target = args[1]

        return sequence_search(with_cont(ctx, get_result), seq, target, 0, len_)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "remove() takes 1 argument (" + str(args_len - 1) + " given)")


om_list_remove = do_magic_method(class_list, 'remove', om_list_remove_code)


def om_list_copy_code(ctx, args):
    args_len = len(args)
    if args_len == 1:
        self = args[0]
        seq = OM_get_list_seq(self)
        len_ = OM_get_list_len(self)

        seq_copy = list_copy(seq)

        return cont_list(ctx, seq_copy, len_)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "copy() takes no argument (" + str(args_len - 1) + " given)")


om_list_copy = do_magic_method(class_list, "copy", om_list_copy_code)


def om_list_clear_code(ctx, args):
    args_len = len(args)
    if args_len == 1:
        self = args[0]

        OM_set_list_seq(self, list_seq_grow([]))
        OM_set_list_len(self, 0)

        return cont_obj(ctx, om_None)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "clear() takes no argument (" + str(args_len - 1) + " given)")


om_list_clear = do_magic_method(class_list, "clear", om_list_clear_code)


def om_list_reverse_code(ctx, args):
    args_len = len(args)
    if args_len == 1:
        self = args[0]
        seq = OM_get_list_seq(self)
        len_ = OM_get_list_len(self)

        i = 0
        j = len_ - 1

        while i < j:
            tmp = seq[j]
            seq[j] = seq[i]
            seq[i] = tmp
            i += 1
            j -= 1

        return cont_obj(ctx, om_None)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "reverse() takes no argument (" + str(args_len - 1) + " given)")


om_list_reverse = do_magic_method(class_list, "reverse", om_list_reverse_code)


def om_list_count_code(ctx, args):
    args_len = len(args)
    if args_len == 2:
        self = args[0]
        self_len = OM_get_list_len(self)
        self_seq = OM_get_list_seq(self)
        val = args[1]

        return count_in_sequence(ctx, self_seq, self_len, val)
    else:
        return sem_raise_with_message(ctx, class_TypeError,
                                      "count() takes exactly one argument (" + str(args_len - 1) + " given)")


om_list_count = do_magic_method(class_list, "count", om_list_count_code)


# class_range methods

def om_range_new_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        stop = args[1]
        if om_isinstance(stop, class_int):
            return cont_obj(ctx, om_range(int_from_num(0), OM_get_boxed_value(stop), int_from_num(1)))
        else:
            def alloc_range(alloc_rte, stop_int):
                return cont_obj(with_rte(ctx, alloc_rte),
                                om_range(int_from_num(0),
                                 OM_get_boxed_value(stop_int),
                                 int_from_num(1)))
            return sem_index(with_cont(ctx, alloc_range), stop)
    if args_len == 3:
        start = args[1]
        stop = args[2]

        def get_start(start_rte, start_int):
            def alloc_range(alloc_rte, stop_int):
                return cont_obj(with_rte(ctx, alloc_rte),
                                om_range(OM_get_boxed_value(start_int),
                                         OM_get_boxed_value(stop_int),
                                         int_from_num(1)))

            if om_isinstance(stop, class_int):
                return alloc_range(start_rte, stop)
            else:
                return sem_index(with_cont(ctx, alloc_range), stop)

        if om_isinstance(start, class_int):
            return get_start(ctx.rte, start)
        else:
            return sem_index(with_cont(ctx, get_start), start)
    elif args_len == 4:
        start = args[1]
        stop = args[2]
        step = args[3]

        def get_start(start_rte, start_int):
            def get_stop(stop_rte, stop_int):
                def check_step(alloc_rte, step_int):
                    start_value = OM_get_boxed_value(start_int)
                    stop_value = OM_get_boxed_value(stop_int)
                    step_value = OM_get_boxed_value(step_int)

                    if int_is_zero(step_value):
                        return sem_raise_with_message(ctx, class_ValueError, "range() arg 3 must not be zero")
                    else:
                        return cont_obj(with_rte(ctx, alloc_rte), om_range(start_value, stop_value, step_value))

                if om_isinstance(step, class_int):
                    return check_step(stop_rte, step)
                else:
                    return sem_index(with_cont(ctx, check_step), step)

            if om_isinstance(stop, class_int):
                return get_stop(start_rte, stop)
            else:
                return sem_index(with_cont(ctx, get_stop), stop)

        if om_isinstance(start, class_int):
            return get_start(ctx.rte, start)
        else:
            return sem_index(with_cont(ctx, get_start), start)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "range expected 1 to 3 arguments, got " + str(len(args) - 1))


om_range_new = do_static_magic_method(class_range, "__new__", om_range_new_code)


def om_format_range_repr(self, rte):
    start = OM_get_range_start(self)
    stop = OM_get_range_stop(self)
    step = OM_get_range_step(self)

    start_str = int_to_string(start, 10)
    stop_str = int_to_string(stop, 10)

    if int_eq(step, int_from_num(1)):
        return "range(" + start_str + ", " + stop_str + ")"
    else:
        step_str = int_to_string(step, 10)
        return "range(" + start_str + ", " + stop_str + ", " + step_str + ")"


def om_range_repr_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]
        return cont_str(ctx, om_format_range_repr(self, ctx.rte))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))


om_range_repr = do_magic_method(class_range, "__repr__", om_range_repr_code)


def om_range_eq_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        other = args[1]

        if om_isinstance(other, class_range):
            self = args[0]

            start = OM_get_range_start(self)
            stop = OM_get_range_stop(self)
            step = OM_get_range_step(self)

            self_len = compute_range_len(start, stop, step)

            other_start = OM_get_range_start(other)
            other_stop = OM_get_range_stop(other)
            other_step = OM_get_range_step(other)

            other_len = compute_range_len(other_start, other_stop, other_step)

            if int_eq(self_len, other_len):
                if int_is_zero(self_len):
                    return cont_obj(ctx, om_True)
                if int_eq(self_len, int_from_num(1)):
                    return cont_bool(ctx, int_eq(start, other_start))
                else:
                    return cont_bool(ctx, int_eq(start, other_start) and int_eq(step, other_step))
            else:
                return cont_obj(ctx, om_False)

        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))


om_range_eq = do_magic_method(class_range, "__eq__", om_range_eq_code)


def compute_range_len(start, stop, step):
    _1 = int_from_num(1)

    if int_is_nonneg(step) and int_lt(start, stop):
        res = int_add(_1, int_div_floor(int_sub(stop, int_add(start, _1)), step))
        return res
    elif int_is_neg(step) and int_gt(start, stop):
        res = int_add(_1, int_div_floor(int_sub(start, int_add(stop, _1)), int_neg(step)))
        return res
    else:
        return int_from_num(0)

def om_range_len_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]
        start = OM_get_range_start(self)
        stop = OM_get_range_stop(self)
        step = OM_get_range_step(self)

        return cont_int(ctx, compute_range_len(start, stop, step))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

om_range_len = do_magic_method(class_range, "__len__", om_range_len_code)


def compute_range_item(start, stop, step, index):
    length = compute_range_len(start, stop, step)

    if int_ge(index, length):
        return None
    elif int_is_nonneg(index):
        return int_add(start, int_mul(index, step))
    elif int_ge(index, int_neg(length)):
        return int_add(start, int_mul(int_add(length, index), step))
    else:
        return None


def compute_slice_range_item(start, stop, step, index):
    return int_add(start, int_mul(index, step))


def compute_range_slice(range_start, range_stop, range_step, slice_start, slice_stop, slice_step):
    new_start = compute_slice_range_item(range_start, range_stop, range_step, slice_start)
    new_stop = compute_slice_range_item(range_start, range_stop, range_step, slice_stop)
    new_step = int_mul(range_step, slice_step)

    return new_start, new_stop, new_step


def om_range_getitem_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        item = args[1]

        if om_isinstance(item, class_slice):
            def get_result(rte, res):
                slice_start = res[0]
                slice_stop = res[1]
                slice_step = res[2]

                new_start, new_stop, new_step = compute_range_slice(range_start,
                                                                    range_stop,
                                                                    range_step,
                                                                    slice_start,
                                                                    slice_stop,
                                                                    slice_step)

                new_range = om_range(
                    int_from_num(new_start),
                    int_from_num(new_stop),
                    int_from_num(new_step)
                )

                return cont_obj(with_rte(ctx, rte), new_range)

            self = args[0]
            range_start = OM_get_range_start(self)
            range_stop = OM_get_range_stop(self)
            range_step = OM_get_range_step(self)

            range_len = compute_range_len(range_start, range_stop, range_step)

            return compute_slice_indices(with_cont(ctx, get_result),
                                         OM_get_slice_start(item),
                                         OM_get_slice_stop(item),
                                         OM_get_slice_step(item),
                                         range_len)
        else:
            def get_item(rte, index):
                self = args[0]
                start = OM_get_range_start(self)
                stop = OM_get_range_stop(self)
                step = OM_get_range_step(self)

                index_value = OM_get_boxed_value(index)

                res = compute_range_item(start, stop, step, index_value)

                if res is None:
                    return sem_raise_with_message(ctx, class_IndexError, "range object index out of range")
                else:
                    return cont_int(ctx, res)

            return sem_index(with_cont(ctx, get_item), item)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))

om_range_getitem = do_magic_method(class_range, "__getitem__", om_range_getitem_code)


# class_slice methods

def om_slice_new_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        start = om_None
        stop = args[1]
        step = om_None

        return cont_obj(ctx, om_slice(start, stop, step))
    elif args_len == 3:
        start = args[1]
        stop = args[2]
        step = om_None

        return cont_obj(ctx, om_slice(start, stop, step))
    elif args_len == 4:
        start = args[1]
        stop = args[2]
        step = args[3]

        return cont_obj(ctx, om_slice(start, stop, step))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "slice takes from 1 to 3 arguments, got " + str(args_len - 1))


om_slice_new = do_static_magic_method(class_slice, '__new__', om_slice_new_code)


def om_slice_repr_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]

        start = OM_get_slice_start(self)
        stop = OM_get_slice_stop(self)
        step = OM_get_slice_step(self)

        def get_start_repr(start_rte, start_repr):
            def get_stop_repr(stop_rte, stop_repr):
                def get_step_repr(step_rte, step_repr):
                    repr_ = "slice(" + OM_get_boxed_value(start_repr) + ", " \
                            + OM_get_boxed_value(stop_repr) + ", " \
                            + OM_get_boxed_value(step_repr) + ")"

                    return cont_str(with_rte(ctx, step_rte), repr_)
                return sem_repr(make_out_of_ast_context(stop_rte, get_step_repr), step)
            return sem_repr(make_out_of_ast_context(start_rte, get_stop_repr), stop)
        return sem_repr(with_cont(ctx, get_start_repr), start)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))


om_slice_repr = do_magic_method(class_slice, '__repr__', om_slice_repr_code)


def compute_slice_indices_aux(ctx, start, stop, step, len_):
    # start, stop and step must be big integer or None, len_ must be big int

    # See cPython algorithm: https://github.com/python/cpython/blob/master/Objects/sliceobject.c#L248
    # this is harder to get right than you might think

    _0 = int_from_num(0)
    _1 = int_from_num(1)
    _neg_1 = int_from_num(-1)
    _len_minus_1 = int_sub(len_, _1)
    _neg_len = int_neg(len_)

    # STEP
    if step is None:
        real_step = int_from_num(1)
    elif int_is_zero(step):
        return sem_raise_with_message(ctx, class_ValueError, "slice step cannot be 0")
    else:
        real_step = step

    step_is_negative = int_is_neg(real_step)

    # START
    if start is None:
        if step_is_negative:
            real_start = _len_minus_1
        else:
            real_start = _0
    elif int_ge(start, len_):
        real_start = _len_minus_1 if step_is_negative else len_
    elif int_is_nonneg(start):
        real_start = start
    elif int_ge(start, _neg_len):
        real_start = int_add(start, len_)
    elif step_is_negative:
        real_start = _neg_1
    else:
        real_start = _0

    # STOP
    if stop is None:
        if step_is_negative:
            real_stop = _neg_1
        else:
            real_stop = len_
    elif int_ge(stop, len_):
        real_stop = _len_minus_1 if step_is_negative else len_
    elif int_is_nonneg(stop):
        real_stop = stop
    elif int_ge(stop, _neg_len):
        real_stop = int_add(stop, len_)
    elif step_is_negative:
        real_stop = _neg_1
    else:
        real_stop = _0

    return cont_obj(ctx, [real_start, real_stop, real_step])


def compute_slice_indices(ctx, start, stop, step, len_):
    # start, stop and step must be om object, len_ must be big int

    args = list_new(3, None)

    def do_get_int_or_none(obj, cont, i):
        def get_int_or_none(rte):
            if om_is(obj, om_None):
                args[i] = None
                return cont(rte)
            elif om_isinstance(obj, class_int):
                args[i] = OM_get_boxed_value(obj)
                return cont(rte)
            else:
                def get_index(rte, index):
                    if om_is(index, absent):
                        return sem_raise_with_message(ctx, class_TypeError,
                                                      "slice indices must be integers or None or have an __index__ method")
                    else:
                        args[i] = OM_get_boxed_value(index)
                        return cont(rte)
                return sem_maybe_index(Context(rte, get_index, ctx.ast), obj)
        return get_int_or_none

    def get_args(rte):
        return compute_slice_indices_aux(with_rte(ctx, rte), args[0], args[1], args[2], len_)

    get_step = do_get_int_or_none(step, get_args, 2)
    get_stop = do_get_int_or_none(stop, get_step, 1)
    get_start = do_get_int_or_none(start, get_stop, 0)

    return get_start(ctx.rte)


def om_slice_indices_code(ctx, args):
    if len(args) == 2:
        self = args[0]

        def check_len(rte, len_):
            len_val = OM_get_boxed_value(len_)
            if int_is_neg(len_val):
                return sem_raise_with_message(with_rte(ctx, rte), class_ValueError, "length should not be negative")
            else:
                def cast_to_tuple(rte, res):
                    return cont_tuple(with_rte(ctx, rte), [om_int(res[0]), om_int(res[1]), om_int(res[2])])

                start = OM_get_slice_start(self)
                stop = OM_get_slice_stop(self)
                step = OM_get_slice_step(self)

                return compute_slice_indices(Context(rte, cast_to_tuple, ctx.ast), start, stop, step, len_val)
        return sem_index(with_cont(ctx, check_len), args[1])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))


om_slice_indices = do_magic_method(class_slice, "indices", om_slice_indices_code)


# class_map methods
def cps_map(ctx, fn, lst):
    lst_len = len(lst)
    new_lst = list_new(lst_len, None)

    def do_next(i):
        if i < lst_len:
            def do_store(rte, val):
                new_lst[i] = val
                return stmt_end(with_cont(ctx, lambda rte: do_next(i + 1)), 0)
            return fn(with_cont(ctx, do_store), lst[i])
        else:
            return cont_obj(ctx, new_lst)

    return do_next(0)


def om_map_new_code(ctx, args):
    args_len = len(args)

    if args_len < 3:
        return sem_raise_with_message(ctx, class_TypeError, "map() must have at least two arguments.")
    else:
        cls = args[0]
        fn = args[1]
        iterables = args[2:]

        def create_obj(rte, iterators):
            map_obj = om_map(cls, fn, iterators)
            return cont_obj(ctx, map_obj)

        return cps_map(with_cont(ctx, create_obj), sem_iter, iterables)


om_map_new = do_static_magic_method(class_map, "__new__", om_map_new_code)


def om_map_iter_code(ctx, args):
    if len(args) == 1:
        return cont_obj(ctx, args[0])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))


om_map_iter = do_magic_method(class_map, "__iter__", om_map_iter_code)


def om_map_next_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        fn = OM_get_map_function(self)
        iterators = OM_get_map_iterators(self)

        def do_call(rte, fn_args):
            return sem_simple_call(ctx, fn, fn_args)

        return cps_map(with_cont(ctx, do_call), sem_next_no_default, iterators)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))


om_map_next = do_magic_method(class_map, "__next__", om_map_next_code)


# class_filter methods


def om_filter_new_code(ctx, args):
    args_len = len(args)

    if args_len != 3:
        return sem_raise_with_message(ctx, class_TypeError, "filter() expected 2 arguments, got " + str(args_len - 1))
    else:
        cls = args[0]
        fn = args[1]
        iterable = args[2]

        def create_obj(rte, iterator):
            filter_obj = om_filter(cls, fn, iterator)
            return cont_obj(ctx, filter_obj)

        return sem_iter(with_cont(ctx, create_obj), iterable)


om_filter_new = do_static_magic_method(class_filter, "__new__", om_filter_new_code)


def om_filter_iter_code(ctx, args):
    if len(args) == 1:
        return cont_obj(ctx, args[0])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))


om_filter_iter = do_magic_method(class_filter, "__iter__", om_filter_iter_code)


def om_filter_next_code(ctx, args):

    if len(args) == 1:
        self = args[0]
        fn = OM_get_map_function(self)
        iterator = OM_get_filter_iterator(self)

        if om_is(fn, om_None):
            def do_filter_bool():
                def get_next(rte, nxt):
                    def check_truthiness(rte, res):
                        if om_is(res, om_True):
                            return cont_obj(ctx, nxt)
                        else:
                            return stmt_end(with_cont(ctx, lambda rte: do_filter_bool()), 0)
                    return sem_bool(with_cont(ctx, check_truthiness), nxt)
                return sem_next_no_default(with_cont(ctx, get_next), iterator)
            return do_filter_bool()
        else:
            def do_filter_call():
                def get_next(rte, nxt):
                    def get_call_res(rte, res):
                        def check_truthiness(rte, bool_val):
                            if om_is(bool_val, om_True):
                                return cont_obj(ctx, nxt)
                            else:
                                return stmt_end(with_cont(ctx, lambda rte: do_filter_call()), 0)
                        return sem_bool(with_cont(ctx, check_truthiness), res)
                    return sem_simple_call(with_cont(ctx, get_call_res), fn, [nxt])
                return sem_next_no_default(with_cont(ctx, get_next), iterator)
            return do_filter_call()
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))


om_filter_next = do_magic_method(class_filter, "__next__", om_filter_next_code)


# class_iterator methods

def om_iterator_iter_code(ctx, args):
    if debug: print('iterator.__iter__')

    if len(args) == 1:
        return cont_obj(ctx, args[0])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))


om_iterator_iter = do_magic_method(class_iterator, "__iter__", om_iterator_iter_code)

def om_iterator_next_code(ctx, args):
    if debug: print('iterator.__next__')

    if len(args) == 1:

        self = args[0]

        obj = OM_get_iterator_obj(self)
        index = OM_get_iterator_index(self)

        def increment_index(rte, val):
            OM_set_iterator_index(self, om_int(int_add(OM_get_boxed_value(index), int_from_num(1))))
            return ctx.cont(rte, val)

        def catch_IndexError(exn):
            if om_isinstance(exn, class_IndexError):
                return sem_raise(ctx, class_StopIteration)
            else:
                return sem_raise_unsafe(ctx.rte, exn)

        next_ctx = with_cont_and_catch(ctx, increment_index, catch_IndexError)

        return sem_getitem(next_ctx, obj, index)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_iterator_next = do_magic_method(class_iterator, "__next__", om_iterator_next_code)

# class_str methods
def om_str_new_code(ctx, args):
    cls = args[0]

    if len(args) == 1:
        return ctx.cont(ctx, om_boxval(cls, ""))
    elif len(args) == 2:
        value = args[1]
        return sem_str(ctx, value)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "str() takes 0 or 1 argument")

om_str_new = do_static_magic_method(class_str, "__new__", om_str_new_code)

def om_format_str_repr(self, rte):
    def char_code_to_hex(code):
        if code < 16:
            return "\\x0" + int_to_string(int_from_num(char_code), 16)
        else:
            return "\\x" + int_to_string(int_from_num(char_code), 16)

    value = OM_get_boxed_value(self)
    value_len = len(value)
    contains_single_quote = False
    contains_double_quote = False

    char_lst = []
    i = 0
    while i < value_len:
        char = value[i]

        if char == '"':
            contains_double_quote = True
        elif char == "'":
            contains_single_quote = True

        char_lst.append(char)
        i += 1

    use_single_quote = not contains_single_quote or contains_double_quote

    j = 0
    while j < value_len:
        char = char_lst[j]
        char_code = ord(char)

        if char_code < 32:
            if char_code == 9: # \t
                char_lst[j] = "\\t"
            elif char_code == 10: # \n
                char_lst[j] = "\\n"
            elif char_code == 13: # \r
                char_lst[j] = "\\r"
            else:
                char_lst[j] = char_code_to_hex(char_code)
        elif char_code < 127:
            if char_code == 39: # '
                if use_single_quote:
                    char_lst[j] = "\\'"
            elif char_code == 92: # \
                char_lst[j] = "\\\\"
        elif char_code < 161:
            char_lst[j] = char_code_to_hex(char_code)

        j += 1

    if use_single_quote:
        return "'" + ''.join(char_lst) + "'"
    else:
        return '"' + ''.join(char_lst) + '"'

def om_str_repr_code(ctx, args):
    if debug: print('str.__repr__')

    if len(args) == 1:
        self = args[0]

        formatted_str = om_format_str_repr(self, ctx.rte)

        return ctx.cont(ctx.rte, om_str(formatted_str))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_str_repr = do_magic_method(class_str, "__repr__", om_str_repr_code)

def om_str_add_code(ctx, args):
    if debug: print('str.__add__')

    if len(args) == 2:
        self = args[0]
        other = args[1]

        if om_isinstance(other, class_str):
            self_val = OM_get_boxed_value(self)
            other_value = OM_get_boxed_value(other)

            return cont_str(ctx, self_val + other_value)
        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_str_add = do_magic_method(class_str, "__add__", om_str_add_code)

def om_str_mul_code(ctx, args):
    if debug: print('str.__mul__')

    if len(args) == 2:
        self = args[0]
        other = args[1]

        def do_mul(rte, res):
            if res is absent:
                return sem_raise_with_message(ctx, class_TypeError, "can't multiply sequence by non-int")
            else:
                times = OM_get_boxed_value(res)
                num_times = int_to_num(times, True)

                if num_times is False:
                    # NOTE: This is not strictly Python, but we cannot handle too big multpilciations for now
                    return sem_raise_with_message(ctx, class_OverflowError, "int too large to multiply sequence")
                else:
                    return cont_str(ctx, string_mul(OM_get_boxed_value(self), num_times))
        return sem_maybe_index(with_cont(ctx, do_mul), other)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_str_mul = do_magic_method(class_str, "__mul__", om_str_mul_code)
om_str_rmul = do_magic_method(class_str, "__rmul__", om_str_mul_code)

om_str_eq = gen_dunder_Homogenous_Numeric_BinOp('str', '__eq__', string_eq, class_str, om_bool)
om_str_ne = gen_dunder_Homogenous_Numeric_BinOp('str', '__ne__', string_ne, class_str, om_bool)
om_str_lt = gen_dunder_Homogenous_Numeric_BinOp('str', '__lt__', string_lt, class_str, om_bool)
om_str_le = gen_dunder_Homogenous_Numeric_BinOp('str', '__le__', string_le, class_str, om_bool)
om_str_gt = gen_dunder_Homogenous_Numeric_BinOp('str', '__gt__', string_gt, class_str, om_bool)
om_str_ge = gen_dunder_Homogenous_Numeric_BinOp('str', '__ge__', string_ge, class_str, om_bool)

def om_str_getitem_code(ctx, args):
    if debug: print('str.__getitem__')

    if len(args) == 2:
        self = args[0]
        item = args[1]

        if om_isinstance(item, class_slice):
            self_string = OM_get_boxed_value(self)

            def get_result(rte, res):
                slice_start = int_to_num(res[0])
                slice_stop = int_to_num(res[1])
                slice_step = int_to_num(res[2])

                new_str = string_get_slice(self_string, slice_start, slice_stop, slice_step)

                return cont_str(with_rte(ctx, rte), new_str)

            start = OM_get_slice_start(item)
            stop = OM_get_slice_stop(item)
            step = OM_get_slice_step(item)

            return compute_slice_indices(with_cont(ctx, get_result), start, stop, step, int_from_num(len(self_string)))
        else:
            def get_char(rte, index):
                index_val = OM_get_boxed_value(index)
                self_val = OM_get_boxed_value(self)
                self_len = int_from_num(len(self_val))

                if int_ge(index_val, self_len):
                    return sem_raise_with_message(ctx, class_IndexError, "string index out of range")
                elif int_is_nonneg(index_val):
                    return cont_str(ctx, self_val[int_to_num(index_val)])
                else:
                    reversed_index = int_add(index_val, self_len)
                    if int_is_nonneg(reversed_index):
                        return cont_str(ctx, self_val[int_to_num(reversed_index)])
                    else:
                        return sem_raise_with_message(ctx, class_IndexError, "string index out of range")
            return sem_index(with_cont(ctx, get_char), item)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_str_getitem = do_magic_method(class_str, "__getitem__", om_str_getitem_code)

def om_str_len_code(ctx, args):
    if debug: print('str.__len__')

    if len(args) == 1:
        self = args[0]

        self_len = len(OM_get_boxed_value(self))

        return cont_int(ctx, int_from_num(self_len))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_str_len = do_magic_method(class_str, "__len__", om_str_len_code)

def om_str_str_code(ctx, args):
    if debug: print('str.__str__')

    if len(args) == 1:
        self = args[0]

        if om_is(OM_get_object_class(self), class_str):
            return ctx.cont(ctx.rte, self)
        else:
            new_str = om_str(OM_get_boxed_value(self))
            ctx.cont(ctx.rte, new_str)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_str_str = do_magic_method(class_str, "__str__", om_str_str_code)


def om_str_join_code(ctx, args):
    if len(args) == 2:
        self = args[0]
        it = args[1]

        def get_words(rte, words):
            i = 0
            raw_strings = list_new(len(words), None)

            for word in words:
                if not om_isinstance(word, class_str):
                    return sem_raise_with_message(with_rte(ctx, rte), class_TypeError, "sequence item " + str(i) + ": expected str instance")
                else:
                    raw_strings[i] = OM_get_boxed_value(word)
                    i += 1

            res = string_join(OM_get_boxed_value(self), raw_strings)
            return cont_str(with_rte(ctx, rte), res)
        return om_unpack_iterable(with_cont(ctx, get_words), it)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 argument, got " + str(len(args) - 1))


om_str_join = do_magic_method(class_str, "join", om_str_join_code)


def om_str_replace_code(ctx, args):
    if len(args) == 3:
        self = args[0]
        pattern = args[1]
        replacement = args[2]

        if not om_isinstance(pattern, class_str):
            return sem_raise_with_message(ctx, class_TypeError, "replace() argument 1 must be str")
        elif not om_isinstance(replacement, class_str):
            return sem_raise_with_message(ctx, class_TypeError, "replace() argument 2 must be str")
        else:
            return cont_str(ctx, string_replace(OM_get_boxed_value(self),
                                                OM_get_boxed_value(pattern),
                                                OM_get_boxed_value(replacement)))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(len(args) - 1))


om_str_replace = do_magic_method(class_str, "replace", om_str_replace_code)


def gen_str_unary_op(method_name, primitive, cont_kind):
    def op_code(ctx, args):
        args_len = len(args)

        if args_len == 1:
            return cont_kind(ctx, primitive(OM_get_boxed_value(args[0])))
        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected no argument, got " + str(len(args) - 1))

    return do_magic_method(class_str, method_name, op_code)


# Case operations
om_str_upper = gen_str_unary_op("upper", string_upper, cont_str)
om_str_lower = gen_str_unary_op("lower", string_lower, cont_str)
om_str_swapcase = gen_str_unary_op("swapcase", string_swapcase, cont_str)


# Characters kind operations
def do_check_non_empty_string_category(char_fn):
    def unicode_is_(string):
        i = 0
        string_len = len(string)
        if string_len == 0:
            return False
        else:
            while i < string_len:
                res = char_fn(ord(string[i]))
                if res is None:
                    return None
                elif res:
                    i += 1
                else:
                    return False
            return True
    return unicode_is_


def do_check_string_category(char_fn):
    def unicode_is_(string):
        i = 0
        string_len = len(string)
        while i < string_len:
            res = char_fn(ord(string[i]))
            if res is None:
                return None
            elif res:
                i += 1
            else:
                return False
        return True
    return unicode_is_


def do_check_string_case_category(check_case):
    def unicode_is_(string):
        i = 0
        string_len = len(string)
        while i < string_len:
            res = extended_ascii_is_alpha(ord(string[i]))
            if res is None:
                return None
            elif res:
                break
            else:
                i += 1

        if i < string_len:
            while i < string_len:
                code = ord(string[i])
                res = extended_ascii_is_alpha(code)
                if res is None:
                    return None
                elif res:
                    case_res = check_case(code)
                    if case_res is None:
                        return None
                    elif case_res:
                        i += 1
                    else:
                        return False
                else:
                    i += 1
            return True
        else:
            return False

    return unicode_is_


def str_method_cont_maybe_bool(ctx, val):
    if val is None:
        return sem_raise_with_message(ctx, class_NotImplementedError, "only extended ascii characters are supported for now")
    else:
        return cont_bool(ctx, val)

# TODO: methods below only support extended ascii and raise a NotImplementedError for unicode
om_str_isalpha = gen_str_unary_op("isalpha", do_check_non_empty_string_category(extended_ascii_is_alpha), str_method_cont_maybe_bool)
om_str_isalnum = gen_str_unary_op("isalnum", do_check_non_empty_string_category(extended_ascii_is_alnum), str_method_cont_maybe_bool)
om_str_isascii = gen_str_unary_op("isascii", do_check_string_category(extended_ascii_is_ascci), cont_bool)
om_str_isdecimal = gen_str_unary_op("isdecimal", do_check_non_empty_string_category(extended_ascii_is_decimal), str_method_cont_maybe_bool)
om_str_isdigit = gen_str_unary_op("isdigit", do_check_non_empty_string_category(extended_ascii_is_digit), str_method_cont_maybe_bool)
om_str_isnumeric = gen_str_unary_op("isnumber", do_check_non_empty_string_category(extended_ascii_is_numeric), str_method_cont_maybe_bool)
om_str_isspace = gen_str_unary_op("isspace", do_check_non_empty_string_category(extended_ascii_is_whitespace), str_method_cont_maybe_bool)

# Those two are special
om_str_islower = gen_str_unary_op("islower", do_check_string_case_category(extended_ascii_is_not_upper), str_method_cont_maybe_bool)
om_str_isupper = gen_str_unary_op("isupper", do_check_string_case_category(extended_ascii_is_upper), str_method_cont_maybe_bool)


def gen_str_split(method_name, primitive, whitespace_primitive):
    def code(ctx, args):
        args_len = len(args)

        if args_len == 3:
            self = args[0]
            sep = args[1]

            def do_split(rte, splits):
                max_split_num = int_to_num(OM_get_boxed_value(splits))
                max_split_num = -1 if max_split_num < 0 else max_split_num

                if om_isinstance(sep, class_str):
                    sep_val = OM_get_boxed_value(sep)

                    if len(sep_val) == 0:
                        return sem_raise_with_message(ctx, class_ValueError, "empty separator")
                    else:
                        res = primitive(OM_get_boxed_value(self), sep_val, max_split_num)
                        return cont_list_of_str(ctx, res, len(res))
                elif om_is(sep, om_None):
                    res = whitespace_primitive(OM_get_boxed_value(self), max_split_num)
                    return cont_list_of_str(ctx, res, len(res))
                else:
                    return sem_raise_with_message(ctx, class_TypeError, "separator must be str or None")

            return sem_index(with_cont(ctx, do_split), args[2])
        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected at most 3 arguments, got " + str(len(args) - 1))

    return do_magic_method_with_aligned_kwargs(class_str, method_name, code, 0,
                                                   ["sep", "maxsplit"], [om_None, om_int_from_num(-1)])

om_str_split = gen_str_split("split", string_split, string_whitespace_split)
om_str_rsplit = gen_str_split("rsplit", string_right_split, string_whitespace_right_split)


def om_splitlines_code(ctx, args):
    if len(args) == 2:
        self = args[0]
        self_value = OM_get_boxed_value(self)
        keepends = args[1]

        # This is the default case, so it should happen often
        if om_is(keepends, om_False):
            res = string_split_lines(self_value, False)
            return cont_list_of_str(ctx, res, len(res))
        elif om_is(keepends, om_True):
            res = string_split_lines(self_value, True)
            return cont_list_of_str(ctx, res, len(res))
        else:
            def cont(rte, res):
                if om_is(res, om_False):
                    res = string_split_lines(self_value, False)
                    return cont_list_of_str(ctx, res, len(res))
                else:
                    res = string_split_lines(self_value, True)
                    return cont_list_of_str(ctx, res, len(res))

            # cPython does not do that conversion and enforces a, int, but we might as well implement it
            return sem_bool(with_cont(ctx, cont), keepends)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected at most 1 arguments, got " + str(len(args) - 1))


om_str_splitlines = do_magic_method_with_aligned_kwargs(class_str, "splitlines", om_splitlines_code, 0,
                                                    ["keepends"], [om_False])


def om_str_contains_code(ctx, args):
    if debug: print('str.__len__')

    if len(args) == 2:
        self = args[0]
        other = args[1]
        if om_isinstance(other, class_str):
            self_val = OM_get_boxed_value(self)
            other_val = OM_get_boxed_value(other)
            self_len = len(self_val)
            return cont_bool(ctx, string_index_of(self_val, other_val, 0, self_len) != -1)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "'in <string>' requires string as left operand")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_str_contains = do_magic_method(class_str, "__contains__", om_str_contains_code)


def gen_str_find(method_name, do_find, do_on_fail):
    def code(ctx, args):
        args_len = len(args)
        self = args[0]
        self_value = OM_get_boxed_value(self)
        substring = args[1]
        start = args[2]
        stop = args[3]

        if args_len == 4:
            def get_start(rte, start_index):
                def get_stop(rte, stop_index):

                    # Special case which short-circuits slicing if start > len(self)
                    # This is not needed in general but mimics a cPython special case which
                    # Where "".find("", 1) returns -1 despite ""[1:].find("") returning 0
                    # There seems to be some discrepancy or at least ambiguity between cPython and
                    # the Python doc here. I decided to go with the cPython implementation
                    if not om_is(start_index, om_None):
                        start_val = OM_get_boxed_value(start_index)
                        if int_gt(start_val, int_from_num(len(self_value))):
                            return do_on_fail(ctx)

                    return compute_slice_indices(with_cont(ctx,
                                                           lambda rte, indices: do_find(ctx,
                                                                                        indices,
                                                                                        self_value,
                                                                                        substring)),
                                                 start_index, stop_index, om_None, int_from_num(len(self_value)))

                if om_is(stop, om_None):
                    return get_stop(ctx.rte, om_None)
                else:
                    return sem_index(with_cont(ctx, get_stop), stop)

            if om_is(start, om_None):
                return get_start(ctx.rte, om_None)
            else:
                return sem_index(with_cont(ctx, get_start), start)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected between 1 and 3 arguments arguments, got " + str(len(args) - 1))


    return do_magic_method_with_defaults(class_str, method_name, code, 1, [om_None, om_None])


def om_str_do_find(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        index = string_index_of(string,
                                OM_get_boxed_value(om_substring),
                                int_to_num(indices[0]),
                                int_to_num(indices[1]))
        return cont_int_from_num(ctx, index)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "must be str")


def om_str_do_rfind(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        index = string_last_index_of(string,
                                     OM_get_boxed_value(om_substring),
                                     int_to_num(indices[0]),
                                     int_to_num(indices[1]))
        return cont_int_from_num(ctx, index)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "must be str")


def om_str_find_do_on_fail(ctx):
    return cont_int_from_num(ctx, -1)


om_str_find = gen_str_find("find", om_str_do_find, om_str_find_do_on_fail)
om_str_rfind = gen_str_find("rfind", om_str_do_rfind, om_str_find_do_on_fail)


def om_str_do_startswith(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        res = string_startswith(string,
                             OM_get_boxed_value(om_substring),
                             int_to_num(indices[0]),
                             int_to_num(indices[1]))
        return cont_bool(ctx, res)
    elif om_isinstance(om_substring, class_tuple):
        prefixes = OM_get_tuple_seq(om_substring)
        start_num = int_to_num(indices[0])
        stop_num = int_to_num(indices[1])
        for p in prefixes:
            if string_startswith(string, OM_get_boxed_value(p), start_num, stop_num):
                return cont_obj(ctx, om_True)
        return cont_obj(ctx, om_False)

    else:
        return sem_raise_with_message(ctx, class_TypeError, "startswith first arg must be str or a tuple of str")


def om_str_do_endswith(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        res = string_endswith(string,
                             OM_get_boxed_value(om_substring),
                             int_to_num(indices[0]),
                             int_to_num(indices[1]))
        return cont_bool(ctx, res)
    elif om_isinstance(om_substring, class_tuple):
        prefixes = OM_get_tuple_seq(om_substring)
        start_num = int_to_num(indices[0])
        stop_num = int_to_num(indices[1])
        for p in prefixes:
            if string_endswith(string, OM_get_boxed_value(p), start_num, stop_num):
                return cont_obj(ctx, om_True)
        return cont_obj(ctx, om_False)

    else:
        return sem_raise_with_message(ctx, class_TypeError, "endswith first arg must be str or a tuple of str")


def om_str_startswith_do_on_fail(ctx):
    return cont_obj(ctx, om_False)


om_str_startswith = gen_str_find("startswith", om_str_do_startswith, om_str_startswith_do_on_fail)
om_str_endswith = gen_str_find("endswith", om_str_do_endswith, om_str_startswith_do_on_fail)


def om_str_do_index(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        index = string_index_of(string,
                               OM_get_boxed_value(om_substring),
                               int_to_num(indices[0]),
                               int_to_num(indices[1]))
        if index >= 0:
            return cont_int_from_num(ctx, index)
        else:
            return sem_raise_with_message(ctx, class_ValueError, "substring not found")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "must be str")


def om_str_index_do_on_fail(ctx):
    return sem_raise_with_message(ctx, class_ValueError, "substring not found")


def om_str_do_rindex(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        index = string_last_index_of(string,
                               OM_get_boxed_value(om_substring),
                               int_to_num(indices[0]),
                               int_to_num(indices[1]))
        if index >= 0:
            return cont_int_from_num(ctx, index)
        else:
            return om_str_index_do_on_fail(ctx)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "must be str")


om_str_index = gen_str_find("index", om_str_do_index, om_str_index_do_on_fail)
om_str_rindex = gen_str_find("rindex", om_str_do_rindex, om_str_index_do_on_fail)


def om_str_do_count(ctx, indices, string, om_substring):
    if om_isinstance(om_substring, class_str):
        count = string_count(string,
                             OM_get_boxed_value(om_substring),
                             int_to_num(indices[0]),
                             int_to_num(indices[1]))
        return cont_int_from_num(ctx, count)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "must be str")


def om_str_count_do_on_fail(ctx):
    return cont_int_from_num(ctx, 0)


om_str_count = gen_str_find("count", om_str_do_count, om_str_count_do_on_fail)


def gen_str_strip(method_name, chars_primitive, whitespace_primitive):
    def code(ctx, args):
        self = args[0]
        chars = args[1]

        if om_is(chars, om_None):
            return cont_str(ctx, whitespace_primitive(OM_get_boxed_value(self)))
        elif om_isinstance(chars, class_str):
            return cont_str(ctx, chars_primitive(OM_get_boxed_value(self), OM_get_boxed_value(chars)))
        else:
            return sem_raise_with_message(ctx, class_TypeError, "strip arg must be None or str")

    return do_magic_method_with_defaults(class_str, "method_name", code, 0, [om_None])


om_str_strip = gen_str_strip("strip", string_trim, string_trim_whitespaces)
om_str_lstrip = gen_str_strip("lstrip", string_trim_left, string_trim_left_whitespaces)
om_str_rstrip = gen_str_strip("rstrip", string_trim_right, string_trim_right_whitespaces)


# class_dict methods

def om_dict_new(ctx, args):
    return sem_raise_with_message(ctx, class_NotImplementedError, "dict type not implemented")


def om_dict_getitem_code(ctx, args):
    # TODO: This is a dummy implementation meant to test **kwargs, it does not implement dict.__getitem__ correctly
    args_len = len(args)

    if args_len == 2:
        self = args[0]
        key = args[1]

        if om_isinstance(key, class_str):
            key_val = OM_get_boxed_value(key)
            val = dict_get(OM_get_boxed_value(self), key_val, None)
            if val is None:
                return sem_raise_with_message(ctx, class_KeyError, "'" + key_val + "'")
            else:
                return cont_obj(ctx, val)
        else:
            return sem_raise_with_message(ctx, class_NotImplementedError, "dict type not implemented")

    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))

om_dict_getitem = do_magic_method(class_dict, "__getitem__", om_dict_getitem_code)

def om_dict_get_code(ctx, args):
    # TODO: This is a dummy implementation meant to test **kwargs, it does not implement dict.get correctly
    args_len = len(args)

    if args_len == 2 or args_len == 3:
        self = args[0]
        key = args[1]
        default_ = om_None if args_len == 2 else args[2]


        if om_isinstance(key, class_str):
            key_val = OM_get_boxed_value(key)
            val = dict_get(OM_get_boxed_value(self), key_val, default_)
            return cont_obj(ctx, val)
        else:
            return sem_raise_with_message(ctx, class_NotImplementedError, "dict type not implemented")

    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 or 3 arguments, got " + str(args_len - 1))

om_dict_get = do_magic_method(class_dict, "__getitem__", om_dict_get_code)


# class_module methods
def om_module_getattribute_code(ctx, args):
    if debug: print('module.__getattribute__')

    args_len = len(args)

    if args_len == 2:
        self = args[0]
        name = args[1]

        if om_isinstance(name, class_str):
            name_value = OM_get_boxed_value(name)

            self_dict = OM_get(self, '__dict__')
            self_dict_value = OM_get_boxed_value(self_dict)
            result = dict_get(self_dict_value, name_value, absent)
            if result is absent:
                return om_object_getattribute(ctx, args)
            else:
                return ctx.cont(ctx.rte, result)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "attribute name must be string")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))


om_module_getattribute = do_magic_method(class_module, "__getattribute__", om_module_getattribute_code)


def om_module_setattr_code(ctx, args):
    if debug: print('module.__setattr__')

    if len(args) == 3:
        self = args[0]
        name = args[1]
        value = args[2]

        if om_isinstance(name, class_str):
            attr = OM_get_boxed_value(name)

            module_env = OM_get_module_env(self)
            dict_set(module_env, attr, value)
            return cont_obj(ctx, om_None)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "attribute name must be string")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(len(args) - 1))


om_module_setattr = do_magic_method(class_module, "__setattr__", om_module_setattr_code)


def om_format_module_repr(self, rte):
    self_dict = OM_get(self, '__dict__')
    self_dict_value = OM_get_boxed_value(self_dict)

    name = dict_get(self_dict_value, '__name__', absent)
    # assert name is not absent, 'internal error'
    name_value = OM_get_boxed_value(name)

    env_builtins = rte_builtins(rte)
    if om_is(self_dict_value, env_builtins):
        return "<module '" + name_value +"' (built-in)>"
    else:
        return "<module '" + name_value +"'>"

def om_module_repr(ctx, args):
    if debug: print('module.__repr__')
    self = args[0]

    result = om_format_module_repr(self, ctx.rte)

    return ctx.cont(ctx.rte, om_str(result))


# class_NoneType methods
def om_NoneType_bool_code(ctx, val):
    if debug: print('None.__bool__')
    result = om_False
    return ctx.cont(ctx.rte, result)

om_NoneType_bool = do_magic_method(class_NoneType, "__bool__", om_NoneType_bool_code)

def om_NoneType_new_code(ctx, val):
    if debug: print('None.__new__')
    return ctx.cont(ctx.rte, om_None)

om_NoneType_new = do_static_magic_method(class_NoneType, "__new__", om_NoneType_new_code)

def om_format_NoneType_repr(value, rte):
    return "None"


def om_NoneType_repr_code(ctx, val):
    if debug: print('None.__repr__')
    return ctx.cont(ctx.rte, om_str(om_format_NoneType_repr(val, ctx.rte)))

om_NoneType_repr = do_magic_method(class_NoneType, "__repr__", om_NoneType_repr_code)

# class_function methods
def om_make_builtin_function_with_signature(name, code, signature):
    om_fn = om(class_function)

    OM_set(om_fn, '__name__', om_str(name))
    OM_set_function_signature(om_fn, signature)
    OM_set_function_body(om_fn, code)
    arity = signature_arity(signature)
    OM_set_function_arity(om_fn, arity)
    # NOTE: builtin function should have no closure and no reference to global variables
    # It should also not affect the bubble that we have no access to upper scopes since we cannot step into
    # a builtin function. If any of that changes, this is going to break.
    OM_set_function_locals(om_fn, [])
    OM_set_function_globals(om_fn, absent)

    return om_fn

def om_function_call_code(ctx, args, kwargs):
    self = args[0]
    params = args[1:]

    signature = OM_get_function_signature(self)

    ## test arity
    def execute_body(rte, locals_env):
        stack = make_frame(rte, ctx.cont, ctx.ast)

        for item in OM_get_function_locals(self):
            name = item[0]
            must_box = item[1]

            value = dict_get(locals_env, name, absent)

            if must_box:
                dict_set(locals_env, name, [value])
            else:
                dict_set(locals_env, name, value)

        call_rte = make_call_rte(rte, locals_env, self, stack)
        body = OM_get_function_body(self)

        return body(call_rte,
                    lambda rte1:
                       frame_cont(rte_stack(rte1))(frame_rte(rte_stack(rte1)), om_None))

    self_name_value = OM_get_boxed_value(OM_get(self, '__name__'))
    return align_args_with_signature(with_cont(ctx, execute_body), self_name_value, params, kwargs, signature)


om_function_call = do_magic_method_with_kwargs(class_function, '__call__', om_function_call_code)


def om_function_get_code(ctx, args):
    if debug: print('wrapper_descriptor.__get__')
    self = args[0]
    obj = args[1]
    cls = args[2]

    if obj is om_None:
        return cont_obj(ctx, self)
    else:
        return cont_method(ctx, self, obj)


om_function_get = do_magic_method(class_function, "__get__", om_function_get_code)


def om_format_function_repr(self, rte):
    serial = OM_get_serial(self, rte)
    self__name__ = OM_get(self, '__name__')
    return '<function ' + OM_get_boxed_value(self__name__) + ' #' + str(serial) + '>'

def om_function_repr(ctx, args):
    self = args[0]
    result = om_str(om_format_function_repr(self, ctx.rte))
    return ctx.cont(ctx.rte, result)

# class_method methods


def om_method_new_code(ctx, args):
    args_len = len(args)

    if args_len == 3:
        fn = args[1]
        instance = args[2]

        # check fn is "probably" callable
        fn_call = getattribute_from_obj_mro(fn, "__call__")

        if fn_call is absent:
            return sem_raise_with_message(ctx, class_TypeError, "first argument must be callable")
        else:
            return cont_method(ctx, fn, instance)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(args_len - 1))


om_method_new = do_static_magic_method(class_method, "__new__", om_method_new_code)


def om_method_call_code(ctx, args, kwargs):
    method = args[0]

    fn = OM_get_method_function(method)
    self = OM_get_method_self(method)

    return sem_generic_call(ctx, fn, [self] + args[1:], kwargs)


om_method_call = do_magic_method_with_kwargs(class_method, "__call__", om_method_call_code)


def om_method_repr_code(ctx, args):
    args_len = len(args)

    if args_len == 2:

        method = args[0]
        fn = OM_get_method_function(method)
        self = OM_get_method_self(method)

        def get_self_repr(_, self_repr):
            self_repr_val = OM_get_boxed_value(self_repr)

            # TODO: should be __qualname__
            fn_maybe_qualname = OM_get(fn, "__name__")
            fn_qualname = fn_maybe_qualname if fn_maybe_qualname is not absent else "?"

            repr_ = "<bound method " + fn_qualname + " of " + self_repr_val + ">"

            return cont_str(ctx, repr_)

        return sem_repr(with_cont(ctx, get_self_repr), self)

    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected one argument, got " + str(args_len - 1))


om_method_repr = do_magic_method(class_method, "__repr__", om_method_repr_code)


# class_BaseException methods
def om_BaseException_new(ctx, args):
    cls = args[0]
    exn_args = om_tuple(args[1:])

    return ctx.cont(ctx.rte, om_exception(cls, exn_args))

def om_BaseException_str(ctx, args):
    self = args[0]
    self_args = OM_get(self, 'args')

    def cont(rte, seq):
        if len(seq) == 0:
            return ctx.cont(ctx.rte, om_str(""))
        elif len(seq) == 1:
            return sem_str(ctx, seq[0])
        else:
            acc = []
            # TODO: hack to avoid using nonlocal in map_repr
            i_ref = [0]

            def map_repr(_, val):
                acc.append(val)
                i_ref[0] += 1
                if i_ref[0] < len(seq):
                    return sem_repr(with_cont(ctx, map_repr), seq[i_ref[0]])
                else:
                    acc_str = []
                    i = 0
                    while i < len(acc):
                        acc_str.append(OM_get_boxed_value(acc[i]))
                        i += 1
                    return ctx.cont(ctx.rte, om_str("(" + ", ".join(acc_str) + ")"))

            return sem_repr(with_cont(ctx, map_repr), seq[i_ref[0]])


    return om_unpack_iterable(with_cont(ctx, cont), self_args)


# XXX: need to decide if I keep this
def box_object(obj):
    if obj is None:
        return om_None
    elif obj is True:
        return om_True
    elif obj is False:
        return om_False
    elif float_instance(obj):
        return om_float(obj)
    elif int_instance(obj):
        return om_int(obj)
    elif isinstance(obj, str):
        return om_str(obj)
    else:
        raise ValueError("Cannot box object " + str(obj))

# Arithmetic
om_int_add = gen_dunder_Homogenous_Numeric_BinOp('int', '__add__', int_add, class_int, om_int)
om_int_radd = gen_dunder_Homogenous_Numeric_rBinOp('int', '__radd__', int_add, class_int, om_int)

om_int_sub = gen_dunder_Homogenous_Numeric_BinOp('int', '__sub__', int_sub, class_int, om_int)
om_int_rsub = gen_dunder_Homogenous_Numeric_rBinOp('int', '__rsub__', int_sub, class_int, om_int)

om_int_mul = gen_dunder_Homogenous_Numeric_BinOp('int', '__mul__', int_mul, class_int, om_int)
om_int_rmul = gen_dunder_Homogenous_Numeric_rBinOp('int', '__rmul__', int_mul, class_int, om_int)

# Bitwise
om_int_lshift = gen_dunder_Homogenous_Numeric_BinOp('int', '__lshift__', int_lshift, class_int, om_int)
om_int_rlshift = gen_dunder_Homogenous_Numeric_rBinOp('int', '__rlshift__', int_lshift, class_int, om_int)
om_int_rshift = gen_dunder_Homogenous_Numeric_BinOp('int', '__rshift__', int_rshift, class_int, om_int)
om_int_rrshift = gen_dunder_Homogenous_Numeric_rBinOp('int', '__rrshift__', int_rshift, class_int, om_int)
om_int_or = gen_dunder_Homogenous_Numeric_BinOp('int', '__or__', int_or, class_int, om_int)
om_int_ror = gen_dunder_Homogenous_Numeric_rBinOp('int', '__ror__', int_or, class_int, om_int)
om_int_and = gen_dunder_Homogenous_Numeric_BinOp('int', '__and__', int_and, class_int, om_int)
om_int_rand = gen_dunder_Homogenous_Numeric_rBinOp('int', '__rand__', int_and, class_int, om_int)
om_int_xor = gen_dunder_Homogenous_Numeric_BinOp('int', '__xor__', int_xor, class_int, om_int)
om_int_rxor = gen_dunder_Homogenous_Numeric_rBinOp('int', '__rxor__', int_xor, class_int, om_int)

def is_space(c):
    return c == " " or c == "\t" or c == "\f" or c =="\r" or c == "\n"


def get_trimmed_str_range(s):
    end = len(s)
    start = 0
    while start < end:
        if is_space(s[start]):
            start += 1
        else:
            break

    while start < end:
        if is_space(s[end-1]):
            end -= 1
        else:
            break

    return start, end


# class_int methods
def int_from_str(s, base):
    base = int_to_num(base)

    disallow_heading_zeros = base == 0

    # base is 0 or 2 <= base <= 36
    start, end = get_trimmed_str_range(s)

    if start >= end:
        return False

    sign = s[start]

    if sign == '+' or sign == '-':
        start += 1

    if end - start >= 3 and s[start] == '0':
        c = s[start+1]
        if c == 'b' or c == 'B':
            prefix_base = 2
        elif c == 'o' or c == 'O':
            prefix_base = 8
        elif c == 'x' or c == 'X':
            prefix_base = 16
        else:
            prefix_base = base - 1
        if prefix_base > 0 if base == 0 else prefix_base == base:
            disallow_heading_zeros = False
            base = prefix_base
            start += 2

    if start >= end:
        return False

    # disallow heading zero in base 0 without prefix-base
    if disallow_heading_zeros and s[start] == '0':
        start += 1
        while start < end:
            if s[start] == '0':
                start += 1
            else:
                # non-zero in base 10 with heading 0 or non-digit character
                return False
        # If we consumed a chain of legal '0', the result can only be 0
        return int_from_num(0)


    if base == 0:
        base = 10

    n = int_from_substring(s, start, end, base)

    if n is False:
        return False

    if sign == '-':
        return int_neg(n)
    else:
        return n

def om_int_str_conversion(ctx, obj, radix):
    if not om_isinstance(obj, class_str):
        return sem_raise_with_message(ctx, class_TypeError, "int() can't convert non-string with explicit base")

    def check_range(rte, index):
        str_value = OM_get_boxed_value(obj)
        base = OM_get_boxed_value(index)

        res = int_from_str(str_value, base)

        if res is False:
            return sem_raise_with_message(ctx, class_ValueError, "invalid literal for int() with base " + str(
                base) + ": '" + str_value + "'")
        else:
            return ctx.cont(rte, om_int(res))
    return sem_index(with_cont(ctx, check_range), radix)

def om_int_new_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        cls = args[0]
        return ctx.cont(ctx.rte, om_int_subtype(cls, int_from_num(0)))
    elif args_len == 2:
        cls = args[0]
        obj = args[1]

        def check_result(rte, res):
            if res is absent:
                if om_isinstance(obj, class_str):
                    return om_int_str_conversion(ctx, obj, om_int(int_from_num(10)))
                else:
                    return sem_raise_with_message(
                        Context(rte, ctx.cont, ctx.ast),
                        class_TypeError,
                        "int() argument must be a string, a bytes-like object or a number")
            else:
                return ctx.cont(ctx.rte, om_int_subtype(cls, OM_get_boxed_value(res)))
        return sem_maybe_int(with_cont(ctx, check_result), obj)
    elif args_len == 3:
        obj = args[1]
        radix = args[2]

        if om_isinstance(obj, class_str):
            def check_radix_range(rte, res):
                res_value = OM_get_boxed_value(res)
                if int_is_zero(res_value) or int_ge(res_value, int_from_num(2)) and int_le(res_value, int_from_num(36)):
                    return om_int_str_conversion(ctx, obj, res)
                else:
                    return sem_raise_with_message(ctx, class_ValueError, "int() base must be >= 2 and <= 36, or 0")

            return sem_index(with_cont(ctx, check_radix_range), radix)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "int() can't convert non-string with explicit base")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "int() takes at most 2 argument, got " + str(args_len))

om_int_new = do_static_magic_method(class_int, "__new__", om_int_new_code)

def om_int_int_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]
        return ctx.cont(ctx.rte, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

om_int_int = do_magic_method(class_int, "__int__", om_int_int_code)

def om_int_index_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]
        return ctx.cont(ctx.rte, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

om_int_index = do_magic_method(class_int, "__index__", om_int_index_code)

def om_int_float_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]
        float_val = int_to_num(OM_get_boxed_value(self))
        return ctx.cont(ctx.rte, om_float(float_val))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

om_int_float = do_magic_method(class_int, "__float__", om_int_float_code)

def om_int_bool_code(ctx, args):
    if debug: print('int.__bool__')
    args_len = len(args)
    if args_len != 1:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

    self = args[0]
    val_value = OM_get_boxed_value(self)
    return cont_bool(ctx, not int_is_zero(val_value))

def om_int_abs_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        result = int_abs(OM_get_boxed_value(self))
        return ctx.cont(ctx.rte, om_int(result))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_int_abs = do_magic_method(class_int, "__abs__", om_int_abs_code)
om_int_bool = do_magic_method(class_int, "__bool__", om_int_bool_code)

# Comparison
om_int_eq = gen_dunder_Homogenous_Numeric_BinOp('int', '__eq__', int_eq, class_int, om_bool)
om_int_ne = gen_dunder_Homogenous_Numeric_BinOp('int', '__ne__', int_ne, class_int, om_bool)
om_int_lt = gen_dunder_Homogenous_Numeric_BinOp('int', '__lt__', int_lt, class_int, om_bool)
om_int_le = gen_dunder_Homogenous_Numeric_BinOp('int', '__le__', int_le, class_int, om_bool)
om_int_gt = gen_dunder_Homogenous_Numeric_BinOp('int', '__gt__', int_gt, class_int, om_bool)
om_int_ge = gen_dunder_Homogenous_Numeric_BinOp('int', '__ge__', int_ge, class_int, om_bool)

def om_format_int_repr(self, rte):
    return int_to_string(OM_get_boxed_value(self), 10)


def om_int_repr_code(ctx, args):
    self = args[0]
    result = om_format_int_repr(self, ctx.rte)
    return ctx.cont(ctx.rte, om_str(result))

om_int_repr = do_magic_method(class_int, "__repr__", om_int_repr_code)


# Mod has a check for division by zero.
def om_int_mod_code(ctx, args):
    if debug: print("int.__mod__")
    val1 = args[0]
    val2 = args[1]

    # Primitive operations are only defined on same types.
    if om_issubclass(OM_get_object_class(val2), class_int):
        # Early break for ZeroDivisionError
        val2_value = OM_get_boxed_value(val2)
        if int_is_zero(val2_value):
            return sem_raise_with_message(ctx, class_ZeroDivisionError, "modulo by zero")
        else:
            val1_value = OM_get_boxed_value(val1)
            result = int_mod_floor(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_int(result))
    else:
        # TODO: Return om_NotImplemented(rte) (in the proper rte)
        return ctx.cont(ctx.rte, om_NotImplemented)

om_int_mod = do_magic_method(class_int, "__mod__", om_int_mod_code)

def om_int_rmod_code(ctx, args):
    if debug: print("int.__rmod__")
    val1 = args[0]
    val2 = args[1]

    # Primitive operations are only defined on same types.
    if om_issubclass(OM_get_object_class(val2), class_int):
        # Early break for ZeroDivisionError
        val1_value = OM_get_boxed_value(val1)
        if int_is_zero(val1_value):
            return sem_raise_with_message(ctx, class_ZeroDivisionError, "modulo by zero")
        else:
            val2_value = OM_get_boxed_value(val2)
            result = int_mod_floor(val2_value, val1_value)
            return ctx.cont(ctx.rte, om_int(result))
    else:
        # TODO: Return om_NotImplemented(rte) (in the proper rte)
        return ctx.cont(ctx.rte, om_NotImplemented)

om_int_rmod = do_magic_method(class_int, "__rmod__", om_int_rmod_code)

# FloorDiv has another check for division by zero.
# Write it by hand.
def om_int_floordiv_code(ctx, args):
    if debug: print("int.__floordiv__")
    val1 = args[0]
    val2 = args[1]


    # Primitive operations are only defined on same types.
    if om_issubclass(OM_get_object_class(val2), class_int):
        # Early break for ZeroDivisionError
        val2_value = OM_get_boxed_value(val2)
        if int_is_zero(val2_value):
            return sem_raise_with_message(ctx, class_ZeroDivisionError, "division by zero")
        else:
            val1_value = OM_get_boxed_value(val1)
            result = int_div_floor(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_int(result))
    else:
        # TODO: Return om_NotImplemented(rte) (in the proper rte)
        return ctx.cont(ctx.rte, om_NotImplemented)

om_int_floordiv = do_magic_method(class_int, "__floordiv__", om_int_floordiv_code)


def om_int_rfloordiv_code(ctx, args):
    if debug: print("int.__rfloordiv__")
    val1 = args[0]
    val2 = args[1]

    # Primitive operations are only defined on same types.
    if om_issubclass(OM_get_object_class(val2), class_int):
        # Early break for ZeroDivisionError
        val1_value = OM_get_boxed_value(val1)
        if int_is_zero(val1_value):
            return sem_raise_with_message(ctx, class_ZeroDivisionError, "division by zero")
        else:
            val2_value = OM_get_boxed_value(val2)
            result = int_div_floor(val2_value, val1_value)
            return ctx.cont(ctx.rte, om_int(result))
    else:
        # TODO: Return om_NotImplemented(rte) (in the proper rte)
        return ctx.cont(ctx.rte, om_NotImplemented)

om_int_rfloordiv = do_magic_method(class_int, "__rfloordiv__", om_int_rfloordiv_code)

def om_int_truediv_code(ctx, args):
    if debug: print("int.__truediv__")
    val1 = args[0]
    val2 = args[1]

    # Primitive operations are only defined on same types.
    if om_issubclass(OM_get_object_class(val2), class_int):
        # Early break for ZeroDivisionError
        val2_value = OM_get_boxed_value(val2)
        if int_is_zero(val2_value):
            return sem_raise_with_message(ctx, class_ZeroDivisionError, "division by zero")
        else:
            val1_value = OM_get_boxed_value(val1)
            result = float_div(int_to_num(val1_value), int_to_num(val2_value))
            return ctx.cont(ctx.rte, om_float(result))
    else:
        # TODO: Return om_NotImplemented(rte) (in the proper rte)
        return ctx.cont(ctx.rte, om_NotImplemented)

om_int_truediv = do_magic_method(class_int, "__truediv__", om_int_truediv_code)


def om_int_rtruediv_code(ctx, args):
    if debug: print("int.__rtruediv__")
    val1 = args[0]
    val2 = args[1]

    # Primitive operations are only defined on same types.
    if om_issubclass(OM_get_object_class(val2), class_int):
        # Early break for ZeroDivisionError
        val1_value = OM_get_boxed_value(val1)
        if int_is_zero(val1_value):
            return sem_raise_with_message(ctx, class_ZeroDivisionError, "division by zero")
        else:
            val2_value = OM_get_boxed_value(val2)
            result = float_div(int_to_num(val2_value), int_to_num(val1_value))
            return ctx.cont(ctx.rte, om_float(result))
    else:
        # TODO: Return om_NotImplemented(rte) (in the proper rte)
        return ctx.cont(ctx.rte, om_NotImplemented)

om_int_rtruediv = do_magic_method(class_int, "__rtruediv__", om_int_rtruediv_code)

# Float dunders

def float_str_is_decimal_float(s, start, end):
    if start >= end:
        return False

    dot_pos = -1

    i = start
    while i < end:
        c_code = ord(s[i])

        if c_code >= 48 and c_code <= 57:
            i += 1
        elif c_code == 46 and dot_pos == -1:
            dot_pos = i
            i += 1
        else:
            return False

    return dot_pos == - 1 or dot_pos > start or dot_pos < end - 1


def float_str_is_integral_float(s, start, end):
    if start >= end:
        return False

    i = start
    while i < end:
        c_code = ord(s[i])

        if c_code >= 48 and c_code <= 57:
            i += 1
        else:
            return False

    return True


def float_str_segment_is_inf(s, start, end):
    if end - start == 3:
        c1 = s[start]
        c2 = s[start+1]
        c3 = s[start+2]
        return c1 == "i" or c1 == "I" and c2 == "n" or c2 == "N" and c3 == "f" or c3 == "F"
    else:
        return False

def float_str_segment_is_nan(s, start, end):
    if end - start == 3:
        c1 = s[start]
        c2 = s[start+1]
        c3 = s[start+2]
        return c1 == "n" or c1 == "N" and c2 == "a" or c2 == "A" and c3 == "n" or c3 == "N"
    else:
        return False

def float_str_find_e_in_segment(s, start, end):
    while start < end:
        c = s[start]
        if c == "e" or c == "E":
            return start
        start += 1
    return None

def float_str_conversion(s):
    start, end = get_trimmed_str_range(s)

    if start >= end:
        return None

    sign = s[start]

    if sign == '+' or sign == '-':
        start += 1

    if float_str_segment_is_inf(s, start, end):
        if sign == "-":
            return float_neg_inf()
        else:
            return float_inf()

    if float_str_segment_is_nan(s, start, end):
        return float_nan()

    e_pos = float_str_find_e_in_segment(s, start, end)

    if e_pos is None:
        if float_str_is_decimal_float(s, start, end):
            return float_from_string(s)
        else:
            return None
    else:
        e_start = e_pos + 1
        e_sign = s[e_start]

        if e_sign == "+" or e_sign == "-":
            e_start += 1

        if not (float_str_is_integral_float(s, e_start, end) and float_str_is_decimal_float(s, start, e_pos)):
            return None
        else:
            return float_from_string(s)

def raise_could_not_convert_str_to_float(ctx, s):
    return sem_raise_with_message(ctx, class_ValueError,
                                  "could not convert string to float: " + om_format_str_repr(s, ctx.rte))


def om_float_str_conversion(ctx, obj):
    if om_isinstance(obj, class_str):
        s = OM_get_boxed_value(obj)
        res = float_str_conversion(s)
        if res is None:
            return raise_could_not_convert_str_to_float(ctx, obj)
        else:
            return cont_float(ctx, res)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "float() argument must be a string or a number")

def om_float_new_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        cls = args[0]
        return ctx.cont(ctx.rte, om_float_subtype(cls, 0))
    elif args_len == 2:
        cls = args[0]
        obj = args[1]

        def check_result(rte, res):
            if res is absent:
                return om_float_str_conversion(ctx, obj)
            else:
                return ctx.cont(ctx.rte, om_float_subtype(cls, OM_get_boxed_value(res)))
        return sem_maybe_float(with_cont(ctx, check_result), obj)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "int() takes at most 1 argument, got " + str(args_len))

om_float_new = do_static_magic_method(class_float, "__new__", om_float_new_code)

def om_float_bool_code(ctx, args):
    if debug: print('int.__bool__')
    args_len = len(args)
    if args_len != 1:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))
    self = args[0]
    val_value = OM_get_boxed_value(self)
    return cont_bool(ctx, not float_is_zero(val_value))

om_float_bool = do_magic_method(class_float, "__bool__", om_float_bool_code)

def om_float_int_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        val = OM_get_boxed_value(self)

        if float_is_pos(val):
            int_val = int_from_num(float_floor(val))
            return ctx.cont(ctx.rte, om_int(int_val))
        else:
            int_val = int_from_num(float_ceil(val))
            return ctx.cont(ctx.rte, om_int(int_val))

om_float_int = do_magic_method(class_float, "__int__", om_float_int_code)

def om_float_float_code(ctx, args):
    args_len = len(args)

    if args_len == 1:
        self = args[0]
        return ctx.cont(ctx.rte, self)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

om_float_float = do_magic_method(class_float, "__float__", om_float_float_code)

def gen_dunder_Float_BinOp(py_class, method, prim, cont_box):
    debug_msg = py_class + "." + method

    def dunder_Float_BinOp(ctx, args):
        if debug: print(debug_msg)

        val1 = args[0]
        val2 = args[1]

        val2_class = OM_get_object_class(val2)

        # Primitive operations are only defined on same types.
        if om_issubclass(val2_class, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            result = prim(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_float(result))
        elif om_issubclass(val2_class, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value)
            if float_is_infinite(val2_float_value) or float_is_nan(val2_float_value):
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
            else:
                res = prim(val1_value, val2_float_value)
                return cont_box(ctx, res)
        else:
            return cont_obj(ctx, om_NotImplemented)

    return do_magic_method(class_float, method, dunder_Float_BinOp)


def gen_dunder_Float_rBinOp(py_class, method, prim, cont_box):
    debug_msg = py_class + "." + method

    def dunder_Float_rBinOp(ctx, args):
        if debug: print(debug_msg)

        val1 = args[0]
        val2 = args[1]


        val2_class = OM_get_object_class(val2)

        # Primitive operations are only defined on same types.
        if om_issubclass(val2_class, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            result = prim(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_float(result))
        elif om_issubclass(val2_class, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value)
            if float_is_infinite(val2_float_value) or float_is_nan(val2_float_value):
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")

            res = prim(val2_float_value, val1_value)
            return cont_box(ctx, res)
        else:
            return cont_obj(ctx, om_NotImplemented)

    return do_magic_method(class_float, method, dunder_Float_rBinOp)


def gen_dunder_Float_DivideOp(py_class, method, prim, cont_box):
    debug_msg = py_class + "." + method

    def dunder_Float_DivideOp(ctx, args):
        if debug: print(debug_msg)
        val1 = args[0]
        val2 = args[1]

        val2_class = OM_get_object_class(val2)

        # Primitive operations are only defined on same types.
        if om_issubclass(val2_class, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)

            if float_is_zero(val2_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float division or modulo by zero")

            result = prim(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_float(result))
        elif om_issubclass(val2_class, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value, True)
            if val2_float_value is False:
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")

            if float_is_zero(val2_float_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float division or modulo by zero")

            res = prim(val1_value, val2_float_value)
            return cont_box(ctx, res)
        else:
            return cont_obj(ctx, om_NotImplemented)

    return do_magic_method(class_float, method, dunder_Float_DivideOp)

def gen_dunder_Float_rDivideOp(py_class, method, prim, cont_box):
    debug_msg = py_class + "." + method

    def dunder_Float_rDivideOp(ctx, args):
        if debug: print(debug_msg)
        val1 = args[0]
        val2 = args[1]

        val2_class = OM_get_object_class(val2)

        # Primitive operations are only defined on same types.
        if om_issubclass(val2_class, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)

            if float_is_zero(val1_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float division or modulo by zero")

            result = prim(val1_value, val2_value)
            return ctx.cont(ctx.rte, om_float(result))
        elif om_issubclass(val2_class, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value, True)
            if val2_float_value is False:
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")

            if float_is_zero(val1_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float division or modulo by zero")

            res = prim(val2_float_value, val1_value)
            return cont_box(ctx, res)
        else:
            return cont_obj(ctx, om_NotImplemented)

    return do_magic_method(class_float, method, dunder_Float_rDivideOp)


def gen_dunder_Float_EqComp(py_class, method, float_comp, res_on_overflow, cont_box):
    debug_msg = py_class + "." + method

    def dunder_Float_EqComp(ctx, args):
        if debug: print(debug_msg)
        val1 = args[0]
        val2 = args[1]

        val2_class = OM_get_object_class(val2)

        # Primitive operations are only defined on same types.
        if om_issubclass(val2_class, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            result = float_comp(val1_value, val2_value)
            return cont_bool(ctx, result)
        elif om_issubclass(val2_class, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value, True)

            if val2_float_value is False:
                cont_bool(ctx, res_on_overflow)
            else:
                res = float_comp(val1_value, val2_float_value)
                return cont_bool(ctx, res)
        else:
            return cont_obj(ctx, om_NotImplemented)

    return do_magic_method(class_float, method, dunder_Float_EqComp)

def gen_dunder_Float_Comp(py_class, method, float_comp, int_comp, neg_inf_res, pos_inf_res, cont_box):
    debug_msg = py_class + "." + method

    def dunder_Float_Comp(ctx, args):
        if debug: print(debug_msg)
        val1 = args[0]
        val2 = args[1]

        val2_class = OM_get_object_class(val2)

        # Primitive operations are only defined on same types.
        if om_issubclass(val2_class, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            result = float_comp(val1_value, val2_value)
            return cont_box(ctx, result)
        elif om_issubclass(val2_class, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value, True)

            if val2_float_value is False:
                if float_is_finite(val1_value):
                    val1_int_value = int_from_num(float_trunc(val1_value))
                    res = int_comp(val1_int_value, val2_value)
                    return cont_box(ctx, res)
                elif float_is_nan(val1_value):
                    return cont_box(ctx, False)
                elif float_is_pos(val1_value):
                    # case: +inf
                    return cont_box(ctx, pos_inf_res)
                else:
                    #case: -inf
                    return cont_box(ctx, neg_inf_res)
            else:
                res = float_comp(val1_value, val2_float_value)
                return cont_box(ctx, res)
        else:
            return cont_obj(ctx, om_NotImplemented)

    return do_magic_method(class_float, method, dunder_Float_Comp)


om_float_add = gen_dunder_Float_BinOp('float', '__add__', float_add, cont_float)
om_float_radd = gen_dunder_Float_rBinOp('float', '__add__', float_add, cont_float)

om_float_sub = gen_dunder_Float_BinOp('float', '__sub__', float_sub, cont_float)
om_float_rsub = gen_dunder_Float_rBinOp('float', '__rsub__', float_sub, cont_float)

om_float_mul = gen_dunder_Float_BinOp('float', '__mul__', float_mul, cont_float)
om_float_rmul = gen_dunder_Float_rBinOp('float', '__rmul__', float_mul, cont_float)

om_float_truediv = gen_dunder_Float_DivideOp('float', '__truediv__', float_div, cont_float)
om_float_rtruediv = gen_dunder_Float_rDivideOp('float', '__rtruediv__', float_div, cont_float)

def float_floordiv(u, v):
    return float_floor(u / v)

om_float_floordiv = gen_dunder_Float_DivideOp('float', '__floordiv__', float_floordiv, cont_float)
om_float_rfloordiv = gen_dunder_Float_rDivideOp('float', '__rfloordiv__', float_floordiv, cont_float)

def om_float_mod_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        val1 = args[0]
        val2 = args[1]

        if om_isinstance(val2, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)

            if float_is_zero(val2_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float modulo")
            elif float_is_infinite(val2_value) and float_is_finite(val1_value):
                if float_is_neg(val1_value):
                    # Return inf
                    return cont_float(ctx, val2_value)
                else:
                    return cont_float(ctx, val1_value)
            else:
                return cont_float(ctx, float_mod_floor(val1_value, val2_value))
        elif om_isinstance(val2, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value)

            if float_is_infinite(val2_float_value):
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
            elif float_is_zero(val2_float_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float modulo")
            elif float_is_infinite(val2_float_value) and float_is_finite(val1_value):
                if float_is_neg(val1_value):
                    # Return inf
                    return cont_float(ctx, val2_float_value)
                else:
                    return cont_float(ctx, val1_value)
            else:
                return cont_float(ctx, float_mod_floor(val1_value, val2_float_value))
        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))

om_float_mod = do_magic_method(class_float, '__mod__', om_float_mod_code)


def om_float_rmod_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        val1 = args[0]
        val2 = args[1]

        if om_isinstance(val2, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)

            if float_is_zero(val1_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float modulo")
            elif float_is_infinite(val1_value) and float_is_finite(val2_value):
                if float_is_neg(val2_value):
                    # Return inf
                    return cont_float(ctx, val1_value)
                else:
                    return cont_float(ctx, val2_value)
            else:
                return cont_float(ctx, float_mod_floor(val2_value, val1_value))
        elif om_isinstance(val2, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value)

            if float_is_infinite(val2_float_value):
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
            elif float_is_zero(val1_value):
                return sem_raise_with_message(ctx, class_ZeroDivisionError, "float modulo")
            elif float_is_infinite(val1_value) and float_is_finite(val2_float_value):
                if float_is_neg(val2_float_value):
                    # Return inf
                    return cont_float(ctx, val1_value)
                else:
                    return cont_float(ctx, val2_float_value)
            else:
                return cont_float(ctx, float_mod_floor(val2_float_value, val1_value))
        else:
            return cont_obj(ctx, om_NotImplemented)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))

om_float_rmod = do_magic_method(class_float, '__rmod__', om_float_rmod_code)

def om_float_pow_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        val1 = args[0]
        val2 = args[1]

        if om_isinstance(val2, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)

            abs_val1_value = float_abs(val1_value)

            if float_is_infinite(val2_value) and float_eq(abs_val1_value, float_from_num(1.0)):
                # Special case in Python where +-1.0 ** inf returns 1.0
                return cont_float(ctx, abs_val1_value)
            else:
                return cont_float(ctx, float_pow(val1_value, val2_value))

        elif om_isinstance(val2, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value)
            if float_is_infinite(val2_float_value):
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
            else:
                return cont_float(ctx, float_pow(val1_value, val2_float_value))
        else:
            return cont_obj(ctx, om_NotImplemented)
    elif args_len == 3:
        return sem_raise_with_message(ctx, class_TypeError, "pow() 3rd argument not allowed unless all arguments are integers")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))

om_float_pow = do_magic_method(class_float, "__pow__", om_float_pow_code)


def om_float_rpow_code(ctx, args):
    args_len = len(args)

    if args_len == 2:
        val1 = args[0]
        val2 = args[1]

        if om_isinstance(val2, class_float):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)

            abs_val2_value = float_abs(val2_value)

            if float_is_infinite(val1_value) and float_eq(abs_val2_value, float_from_num(1.0)):
                # Special case in Python where +-1.0 ** inf returns 1.0
                return cont_float(ctx, abs_val2_value)
            else:
                return cont_float(ctx, float_pow(val2_value, val1_value))

        elif om_isinstance(val2, class_int):
            val1_value = OM_get_boxed_value(val1)
            val2_value = OM_get_boxed_value(val2)
            val2_float_value = int_to_num(val2_value)
            if float_is_infinite(val2_float_value):
                return sem_raise_with_message(ctx, class_OverflowError, "int too large to convert to float")
            elif float_is_infinite(val1_value) and float_eq(val2_float_value, float_from_num(1.0)):
                # Special case in Python where 1.0 ** inf returns 1.0
                return cont_float(ctx, val2_float_value)
            else:
                return cont_float(ctx, float_pow(val2_float_value, val1_value))
        else:
            return cont_obj(ctx, om_NotImplemented)
    elif args_len == 3:
        return sem_raise_with_message(ctx, class_TypeError, "pow() 3rd argument not allowed unless all arguments are integers")
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(args_len - 1))

om_float_rpow = do_magic_method(class_float, "__rpow__", om_float_rpow_code)

## float comparisons
def float_ne(x, y):
    return not float_eq(x, y)

om_float_eq = gen_dunder_Float_EqComp('float', '__eq__', float_eq, False, cont_bool)
om_float_ne = gen_dunder_Float_EqComp('float', '__ne__', float_ne, True, cont_bool)
om_float_lt = gen_dunder_Float_Comp('float', '__lt__', float_lt, int_lt, True, False, cont_bool)
om_float_le = gen_dunder_Float_Comp('float', '__le__', float_le, int_le, True, False, cont_bool)
om_float_gt = gen_dunder_Float_Comp('float', '__gt__', float_gt, int_gt, False, True, cont_bool)
om_float_ge = gen_dunder_Float_Comp('float', '__ge__', float_ge, int_ge, False, True, cont_bool)

def float_round_even(x):
    if float_is_neg(x):
        sign = float_from_num(-1.0)
    else:
        sign = float_from_num(1.0)

    norm = float_abs(x)
    norm_integral_part = float_floor(norm)
    norm_dec_part = float_sub(norm, norm_integral_part)

    half = float_from_num(0.5)

    if float_lt(norm_dec_part, half):
        return float_mul(sign, norm_integral_part)
    elif float_eq(norm_dec_part, half) and float_is_zero(float_mod(norm_integral_part, float_from_num(2.0))):
        return float_mul(sign, norm_integral_part)
    else:
        return float_mul(sign, float_add(norm_integral_part, float_from_num(1.0)))


def om_float_round_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        return cont_int(ctx, int_from_num(float_round_even(OM_get_boxed_value(self))))
    elif len(args) == 2:
        self = args[0]
        ndigits = args[1]

        def apply_round(rte, n):
            self_value = OM_get_boxed_value(self)
            n_value = OM_get_boxed_value(n)

            if int_is_zero(n_value):
                return cont_float(ctx, float_round_even(self_value))
            elif float_is_infinite(self_value):
                return cont_float(ctx, self_value)
            elif int_is_neg(n_value):
                # When n is a negative value we want to raise to a power of 10
                # In that case use the int_round algorithm on the norm of self

                if float_is_neg(self_value):
                    sign = float_from_num(-1.0)
                else:
                    sign = float_from_num(1.0)

                norm = float_abs(self_value)

                # NOTE: We are using int_round which breaks ties to even
                # Although a number such as 5.1 would be casted to 5 and rounded to 0
                # For this reason we indicate to int_round to break ties by rounding up if self has a decimal part
                norm_integral_part = float_floor(norm)
                int_norm_integral_part = int_from_num(norm_integral_part)

                if float_eq(norm, norm_integral_part):
                    # Break int_round ties by rounding to even
                    res = int_to_num(int_round(int_norm_integral_part, n_value, True))
                else:
                    # Break int_round ties by rounding up
                    res = int_to_num(int_round(int_norm_integral_part, n_value, False))

                if float_is_infinite(res):
                    return sem_raise_with_message(ctx, class_OverflowError, "rounded value too large to represent")
                else:
                    return cont_float(ctx, float_mul(sign, res))
            else:
                n_float_value = int_to_num(n_value)
                # We do not want to pass a BigInt to float_round so we handle Overflows prior
                if float_is_infinite(n_float_value):
                    if int_is_neg(n_value):
                        return cont_obj(ctx, self)
                    else:
                        return cont_float(ctx, float_from_num(0.0))
                else:
                    scale = float_pow(float_from_num(10.0), n_float_value)
                    res = float_div(float_round_even(float_mul(self_value, scale)), scale)
                    if float_is_infinite(res):
                        # Value precision > 1: nothing to round
                        return cont_obj(ctx, self)
                    else:
                        return cont_float(ctx, res)

        return sem_index(with_cont(ctx, apply_round), ndigits)
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 1 arguments, got " + str(len(args) - 1))

om_float_round = do_magic_method(class_float, "__round__", om_float_round_code)

def om_float_abs_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        result = float_abs(OM_get_boxed_value(self))
        return ctx.cont(ctx.rte, om_float(result))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_float_abs = do_magic_method(class_float, "__abs__", om_float_abs_code)


def digit_to_char(x):
    return chr(x + 48)

def float_repr_scale(r, s, m_pos, m_neg, must_round, v):
    """
    r is an int
    s is an int
    m_pos is int
    m_neg is int
    must_round is a boolean
    v is a float
    """
    epsilon = float_pow(float_from_num(10.0), float_from_num(-10.0))

    est = int_from_num(float_to_num(float_ceil(float_sub(float_log10(v), epsilon))))

    if int_is_neg(est):
        factor = int_pow(int_from_num(10), int_neg(est))
        return float_repr_fixup(
            int_mul(r, factor),
            s,
            int_mul(m_pos, factor),
            int_mul(m_neg, factor),
            est,
            must_round)
    else:
        factor = int_pow(int_from_num(10), est)
        return float_repr_fixup(
            r,
            int_mul(s, factor),
            m_pos,
            m_neg,
            est,
            must_round)

def float_repr_fixup(r, s, m_pos, m_neg, k, must_round):
    if int_ge(int_add(r, m_pos), s) if must_round else int_lt(s, int_add(r, m_pos)):
        return (int_add(k, int_from_num(1)),
                float_repr_generate(r, s, m_pos, m_neg, must_round, int_from_num(0)))
    else:
        return (k,
                float_repr_generate(
                    int_mul(r, int_from_num(10)),
                    s,
                    int_mul(m_pos, int_from_num(10)),
                    int_mul(m_neg, int_from_num(10)),
                    must_round,
                    int_from_num(0)))

def float_repr_generate(r, s, m_pos, m_neg, must_round, n):
    dr = int_divmod_floor(r, s)
    d = dr[0]
    r = dr[1]

    n_num = int_to_num(n)

    if int_ge(m_neg, r) if must_round else int_lt(r, m_neg):
        if int_ge(int_add(r, m_pos), s) if must_round else int_lt(s, int_add(r, m_pos)):
            _2r = int_add(r, r)
            if int_is_even(d) and int_eq(_2r, s) or int_lt(_2r, s):
                last_digit = d
            else:
                last_digit = int_add(d, int_from_num(1))
        else:
            last_digit = d

        str_chars = list_new(n_num + 1, 0)
        str_chars[n_num] = int_to_num(last_digit)
        return str_chars
    elif int_ge(int_add(r, m_pos), s) if must_round else int_lt(s, int_add(r, m_pos)):
        str_chars = list_new(n_num + 1, 0)
        str_chars[n_num] = int_to_num(d) + 1
        return str_chars
    else:
        str_chars = float_repr_generate(
            int_mul(r, int_from_num(10)),
            s,
            int_mul(m_pos, int_from_num(10)),
            int_mul(m_neg, int_from_num(10)),
            must_round,
            int_add(n, int_from_num(1)))
        str_chars[n_num] = int_to_num(d)
        return str_chars

float_repr_e_bias = int_from_num(1023)
float_repr_m_bits = int_from_num(52)
float_repr_m_min = int_from_num(4503599627370496)
float_repr_m_min_float = float_from_num(4503599627370496.0)
float_repr_m_max = int_from_num(9007199254740991)
float_repr_num_e_min = int_from_num(-1074)
float_repr_m_pos_min = int_from_num(4503599627370496)

def float_repr_decompose(x):
    """x: strictly positive finite float number"""

    def exp_form(x):
        if float_lt(x, float_from_num(1.0)):
            r = exp_form_neg(x, float_from_num(0.5), int_from_num(1))
            return float_mul(r[0], float_to_num(2.0)), int_sub(int_from_num(-1), r[1])
        else:
            return exp_form_pos(x, float_from_num(2.0), int_from_num(1))

    def exp_form_pos(x, y, i):
        i2 = int_mul(i, int_from_num(2))

        if int_ge(float_repr_e_bias, i2) and float_ge(x, y):
            r = exp_form_pos(x, float_mul(y, y), i2)
        else:
            r = (x, int_from_num(0))

        a = r[0]
        b = r[1]

        ib = int_add(i, b)

        if int_ge(float_repr_e_bias, ib) and float_ge(a, y):
            return float_div(a, y), ib
        else:
            return r

    def exp_form_neg(x, y, i):
        i2 = int_mul(i, int_from_num(2))

        if int_lt(i2, int_sub(float_repr_e_bias, int_from_num(1))) and float_lt(x, y):
            r = exp_form_neg(x, float_mul(y, y), i2)
        else:
            r = (x, int_from_num(0))

        a = r[0]
        b = r[1]
        ib = int_add(i, b)

        if int_lt(ib, int_sub(float_repr_e_bias, int_from_num(1))) and float_lt(a, y):
            return float_div(a, y), ib
        else:
            return r

    r = exp_form(float_abs(x))
    y = r[0]

    if float_lt(y, float_from_num(2.0)):
        return int_from_num(float_to_num(float_trunc(float_mul(r[0], float_repr_m_min_float)))), int_sub(r[1], float_repr_m_bits)
    else:
        if float_gt(y, float_from_num(0.0)):
            return float_repr_m_min, int_sub(int_add(float_repr_e_bias, int_from_num(1)), float_repr_m_bits) # inf
        else:
            return float_repr_m_max, int_sub(int_add(float_repr_e_bias, int_from_num(1)), float_repr_m_bits) # nanprint(float_decompose(0.0))

def float_repr_pow_mantissa_pair(v):
    x = float_repr_decompose(v)

    f = x[0]
    e = x[1]
    must_round = int_is_even(f)

    if int_is_neg(e):
        if int_ne(e, float_repr_num_e_min) and int_eq(f, float_repr_m_pos_min):
            return float_repr_scale(
                int_lshift(f, int_from_num(2)),
                int_lshift(int_from_num(1), int_sub(int_from_num(2), e)),
                int_from_num(2),
                int_from_num(1),
                must_round,
                v)
        else:
            return float_repr_scale(
                int_lshift(f, int_from_num(1)),
                int_lshift(int_from_num(1), int_sub(int_from_num(1), e)),
                int_from_num(1),
                int_from_num(1),
                must_round,
                v)
    else:
        _2_pow_e = int_lshift(int_from_num(1), e)
        if int_eq(f, float_repr_m_pos_min):
            return float_repr_scale(
                int_lshift(f, int_add(e, int_from_num(2))),
                int_from_num(4),
                int_lshift(int_from_num(1), int_add(e, int_from_num(1))),
                _2_pow_e,
                must_round,
                v)
        else:
            return float_repr_scale(
                int_lshift(f, int_add(e, int_from_num(1))),
                int_from_num(2),
                _2_pow_e,
                _2_pow_e,
                must_round,
                v)

def format_float_repr_pow(exponent):
    exponent_abs = -exponent if exponent < 0 else exponent
    return ("e-" if exponent < 0 else "e+") + ("0" if exponent_abs < 10 else "") + str(exponent_abs)

def format_float_repr(v):
    if float_is_nan(v):
        return "nan"

    sign = "-" if float_is_neg(v) else ""

    if float_is_infinite(v):
        return sign + "inf"
    elif float_is_zero(v):
        return sign + "0.0"

    abstract_exponent, digits = float_repr_pow_mantissa_pair(float_abs(v))
    exponent_inc = int_to_num(abstract_exponent)
    exponent = exponent_inc - 1

    m = []
    for d in digits:
        m.append(digit_to_char(d))

    if exponent >= 16:
        if len(m) == 1:
            return sign + m[0] + format_float_repr_pow(exponent)
        else:
            m[0] = m[0] + "."
            return sign + "".join(m) + format_float_repr_pow(exponent)
    elif exponent >= 0:
        m_len = len(m)
        if exponent_inc >= m_len:
            m = list_concat(m, list_new(exponent_inc - m_len, "0"))
            m.append(".0")
        else:
            m[exponent_inc] = "." + m[exponent_inc]
        return sign + "".join(m)
    elif exponent >= -4:
        return sign + "0." + "".join(list_new(-exponent_inc, "0")) + "".join(m)
    elif len(m) == 1:
        return sign + m[0] + format_float_repr_pow(exponent)
    else:
        m[0] = m[0] + "."
        return sign + "".join(m) + format_float_repr_pow(exponent)

def om_format_float_repr(self, rte):
    value = OM_get_boxed_value(self)
    return format_float_repr(value)

def om_float_repr_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        result = om_format_float_repr(self, ctx.rte)
        return ctx.cont(ctx.rte, om_str(result))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_float_repr = do_magic_method(class_float, "__repr__", om_float_repr_code)

def om_float_neg_code(ctx, args):
    if len(args) == 1:
        self = args[0]
        result = float_neg(OM_get_boxed_value(self))
        return ctx.cont(ctx.rte, om_boxval(class_float, result))
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(len(args) - 1))

om_float_neg = do_magic_method(class_float, "__neg__", om_float_neg_code)

def om_float_pos_code(ctx, args):
    if len(args) == 1:
        return ctx.cont(ctx.rte, args[0])
    else:
        return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got "+ str(len(args) - 1))

om_float_pos = do_magic_method(class_float, "__pos__", om_float_pos_code)

bootstrap_populate_base_types()

# Internal types
populate_builtin_getset_descriptor()
populate_builtin_NotImplementedType()
populate_builtin_MethodWrapper()
populate_builtin_TextIOWrapper()
populate_builtin_csv_reader()

# Basic type and date structure.
populate_builtin_int()
populate_builtin_float()
populate_builtin_bool()
populate_builtin_tuple()
populate_builtin_list()
populate_builtin_dict()
populate_builtin_range()
populate_builtin_map()
populate_builtin_filter()
populate_builtin_slice()
populate_builtin_iterator()
populate_builtin_dict()
populate_builtin_module()
populate_builtin_NoneType()
populate_builtin_function()
populate_builtin_method()

# Populate Exception classes
populate_builtin_BaseException()

# Builtin functions code

def om_breakpoint_code(rte, cont):
    def return_none(_):
        return unwind_return(rte, om_None)

    frame = rte_stack(rte)
    parent_ast = frame_ast(frame)
    parent_rte = frame_rte(frame)

    # The rte is used to display the variables, so we provide the caller rte
    ctx = Context(parent_rte, return_none, parent_ast)

    return stmt_end_breakpoint(ctx)


def om_input_code(rte, cont):
    def return_value(rte1, obj_str):
        obj_str_value = OM_get_boxed_value(obj_str)
        result = runtime_input(obj_str_value)
        if result is None:
            # The Python 'input' function always returns a string
            # In codeBoot the 'cancel' button of the prompt thus returns
            # an empty string
            return unwind_return(rte1, om_str(""))
        else:
            return unwind_return(rte1, om_str(result))

    obj = rte_lookup_locals(rte, 'obj')
    ctx = make_out_of_ast_context(rte, return_value)
    return sem_str(ctx, obj)

def gen_int_to_string_conv_code(radix, prefix):
    def conv_code(rte, cont):
        obj = rte_lookup_locals(rte, 'obj')
        obj_cls = OM_get_object_class(obj)
        if om_issubclass(obj_cls, class_int):
            obj_value = OM_get_boxed_value(obj)
            if int_is_nonneg(obj_value):
                result = prefix + int_to_string(obj_value, radix)
            else:
                result = "-" + prefix + int_to_string(int_neg(obj_value), radix)
            return unwind_return(rte, om_str(result))
        else:
            obj_cls_name = OM_get(obj_cls, '__name__')
            obj_cls_name_value = OM_get_boxed_value(obj_cls_name)
            msg = "'"+obj_cls_name_value+"' object cannot be interpreted as an integer"
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise_with_message(ctx, class_TypeError, msg)

    return conv_code

om_hex_code = gen_int_to_string_conv_code(16, '0x')
om_oct_code = gen_int_to_string_conv_code(8, '0o')
om_bin_code = gen_int_to_string_conv_code(2, '0b')

def om_chr_code(rte, cont):
    obj = rte_lookup_locals(rte, "obj")
    if om_isinstance(obj, class_int):
        obj_value = OM_get_boxed_value(obj)
        if int_gt(obj_value, -1) and int_lt(obj_value,1114112):
            obj_int_val = int_to_num(obj_value)
            return unwind_return(rte, om_str(chr(obj_int_val)))
        else:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise_with_message(ctx, class_ValueError, "chr() arg not in range(0x110000)")
    else:
        ctx = make_out_of_ast_context(rte, cont)
        return sem_raise_with_message(ctx, class_TypeError, "an integer is required")

def om_ord_code(rte, cont):
    obj = rte_lookup_locals(rte, "obj")
    if om_isinstance(obj, class_str):
        obj_value = OM_get_boxed_value(obj)
        obj_value_len = len(obj_value)
        if obj_value_len == 1:
            obj_value_int = int_from_num(ord(obj_value))
            return unwind_return(rte, om_int(obj_value_int))
        else:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise_with_message(ctx, class_ValueError, "ord() expected a character, but string of length " + str(obj_value_len) + " found")
    else:
        ctx = make_out_of_ast_context(rte, cont)
        return sem_raise_with_message(ctx, class_TypeError, "ord() expected string of length 1")

def om_print_code(rte, _):
    args = rte_lookup_locals(rte, 'args')
    args_seq = OM_get_list_seq(args)
    args_len = len(args_seq)

    result = []
    for _ in args_seq:
        result.append(None)

    def loop(rte, i):
        def print_value(rte, str_result):
            result[i] = OM_get_boxed_value(str_result)

            new_index = i + 1
            if new_index < args_len:
                return stmt_end(make_out_of_ast_context(rte, lambda rte: loop(rte, new_index)), 0)
            else:
                # sep=' '
                runtime_print(' '.join(result), rte)
                return unwind_return(rte, om_None)

        next_ctx = make_out_of_ast_context(rte, print_value)
        return sem_str(next_ctx, args_seq[i])

    if args_len > 0:
        return loop(rte, 0)
    else:
        runtime_print('', rte)
        return unwind_return(rte, om_None)

def om_alert_code(rte, _):
    obj = rte_lookup_locals(rte, "obj")
    def alert_str(rte, obj_str):
        obj_str_value = OM_get_boxed_value(obj_str)
        runtime_alert(obj_str_value)
        return unwind_return(rte, om_None)

    ctx = make_out_of_ast_context(rte, alert_str)
    return sem_str(ctx, obj)

def om_confirm_code(rte, _):
    obj = rte_lookup_locals(rte, "obj")
    def confirm_dialog(rte, obj_str):
        obj_str_value = OM_get_boxed_value(obj_str)
        result = runtime_confirm(obj_str_value)
        return unwind_return(rte, om_bool(result))

    ctx = make_out_of_ast_context(rte, confirm_dialog)
    return sem_str(ctx, obj)

def om_prompt_code(rte, _):
    obj = rte_lookup_locals(rte, "obj")
    def prompt_str(rte, obj_str):
        obj_str_value = OM_get_boxed_value(obj_str)
        result = runtime_prompt(obj_str_value)
        if om_is(result, None):
            return unwind_return(rte, om_None)
        else:
            return unwind_return(rte, om_str(result))

    ctx = make_out_of_ast_context(rte, prompt_str)
    return sem_str(ctx, obj)

def om_repr_code(rte, _):
    def cont(rte, res):
        return unwind_return(rte, res)
    next_ctx = make_out_of_ast_context(rte, cont)
    return sem_repr(next_ctx, rte_lookup_locals(rte, 'obj'))

def om_len_code(rte, _):
    def cont(rte, res):
        return unwind_return(rte, res)
    next_ctx = make_out_of_ast_context(rte, cont)
    return sem_len(next_ctx, rte_lookup_locals(rte, 'obj'))

def om_next_code(rte, _):
    def cont(rte, res):
        return unwind_return(rte, res)
    next_ctx = make_out_of_ast_context(rte, cont)
    return sem_next(next_ctx, rte_lookup_locals(rte, 'obj'), rte_lookup_locals(rte, 'default'))

def om_iter_code(rte, _):
    next_ctx = make_out_of_ast_context(rte, unwind_return)

    obj = rte_lookup_locals(rte, 'obj')
    sentinel = rte_lookup_locals(rte, 'sentinel')

    if sentinel is absent:
        return sem_iter(next_ctx, obj)
    else:
        return sem_raise(next_ctx, class_NotImplementedError)

def om_open_code(rte, _):
    next_ctx = make_out_of_ast_context(rte, unwind_return)

    file = rte_lookup_locals(rte, 'file')
    mode = rte_lookup_locals(rte, 'mode')

    # cPython applies checks on mode first
    if om_isinstance(mode, class_str):
        mode_value = OM_get_boxed_value(mode)

        if mode_value != 'r' and mode_value != 'w':
            return sem_raise_with_message(next_ctx, class_ValueError, "invalid mode: '" + mode_value + "'")
    else:
        return sem_raise_with_message(next_ctx, class_TypeError, "open() argument 'mode' must be str")

    if om_isinstance(file, class_str):
        file_value = OM_get_boxed_value(file)
    else:
        return sem_raise_with_message(next_ctx, class_TypeError, "open() argument 'file' must be str")

    if mode_value == "r" and runtime_file_exists(rte, file_value):
        return unwind_return(rte, om_TextIOWrapper(class_TextIOWrapper, file_value, mode_value, 0, True))
    elif mode_value == "w":
        runtime_write_file(rte, file_value, "")
        return unwind_return(rte, om_TextIOWrapper(class_TextIOWrapper, file_value, mode_value, 0, True))
    else:
        return sem_raise_with_message(next_ctx, class_FileNotFoundError,
                                      "No such file: '" + file_value + "'")

def om_abs_code(rte, _):
    next_ctx = make_out_of_ast_context(rte, unwind_return)

    obj = rte_lookup_locals(rte, 'obj')
    return sem_abs(next_ctx, obj)

def do_min_max(name, sem_Comp):
    expected_argument_error_msg = name + " expected 1 argument, got 0"
    empty_sequence_error_msg = name + "() arg is an empty sequence"

    def code(rte, cont):
        args = rte_lookup_locals(rte, 'args')
        args_elements = OM_get_tuple_seq(args)
        args_len = len(args_elements)
        if args_len == 0:
            return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError, expected_argument_error_msg)
        elif args_len == 1:
            iterable = args_elements[0]
        else:
            iterable = args

        def loop_iterator(loop_iterator_rte, iterator):
            def get_first(get_first_rte, first_element):
                if first_element is for_loop_end_marker:
                    return sem_raise_with_message(make_out_of_ast_context(get_first_rte, cont), class_ValueError, empty_sequence_error_msg)
                candidate_ref = [first_element]
                def get_next(get_next_rte, next_element):
                    if next_element is for_loop_end_marker:
                        return cont_obj(make_out_of_ast_context(get_next_rte, unwind_return), candidate_ref[0])
                    else:
                        def compare_candidates(compare_rte, res):
                            def pick_next_candidate(pick_rte, bool_res):
                                if om_is(bool_res, om_True):
                                    candidate_ref[0] = next_element
                                return sem_next_with_return_to_trampoline(make_out_of_ast_context(pick_rte, get_next), iterator, for_loop_end_marker)
                            return sem_bool(make_out_of_ast_context(compare_rte, pick_next_candidate), res)
                        return sem_Comp(make_out_of_ast_context(get_next_rte, compare_candidates), next_element, candidate_ref[0])
                return sem_next(make_out_of_ast_context(get_first_rte, get_next), iterator, for_loop_end_marker)
            return sem_next(make_out_of_ast_context(loop_iterator_rte, get_first), iterator, for_loop_end_marker)
        return sem_iter(make_out_of_ast_context(rte, loop_iterator), iterable)

    return code

om_min_code = do_min_max("min", sem_Lt)
om_max_code = do_min_max("max", sem_Gt)

def om_round_code(rte, cont):
    number = rte_lookup_locals(rte, 'number')
    ndigits = rte_lookup_locals(rte, 'ndigits')

    # NOTE: sem_Round handles the case where ndigits is 'absent'
    return sem_Round(make_out_of_ast_context(rte, unwind_return), number, ndigits)

def om_pow_code(rte, _):
    next_ctx = make_out_of_ast_context(rte, unwind_return)

    base = rte_lookup_locals(rte, 'base')
    power = rte_lookup_locals(rte, 'power')
    mod = rte_lookup_locals(rte, 'mod')

    if mod is absent:
        return sem_Pow(next_ctx, base, power)
    else:
        return sem_PowMod(next_ctx, base, power, mod)

def om_isinstance_code(rte, cont):
    obj = rte_lookup_locals(rte, 'object')
    classinfo = rte_lookup_locals(rte, 'classinfo')

    next_ctx = make_out_of_ast_context(rte, unwind_return)

    if om_isinstance(classinfo, class_type):
        return cont_bool(next_ctx, om_isinstance(obj, classinfo))
    elif om_isinstance(classinfo, class_tuple):
        return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_NotImplementedError,
                                      "isinstance() tuple classinfo is not supported yet")
    else:
        return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError,
                                      "isinstance() arg 2 must be a type or tuple of types")


# Built-in Modules
def om_make_math_unary_real_function(fn_name, float_fn, arg):
    def float_code(rte, cont):
        val = rte_lookup_locals(rte, arg)

        def apply_float_fn(float_rte, float_val):
            if float_val is absent:
                return sem_raise_with_message(make_out_of_ast_context(float_rte, cont), class_TypeError, "must be real number")
            else:
                res = float_fn(OM_get_boxed_value(float_val))
                return unwind_return(float_rte, om_float(res))

        return sem_maybe_float(make_out_of_ast_context(rte, apply_float_fn), val)

    return om_make_builtin_function_with_signature(fn_name, float_code, make_posonly_only_signature((arg,)))

def om_make_math_unary_real_to_int_function(fn_name, float_fn, arg):
    def float_code(rte, cont):
        val = rte_lookup_locals(rte, arg)

        def apply_float_fn(float_rte, float_val):
            if float_val is absent:
                return sem_raise_with_message(make_out_of_ast_context(float_rte, cont), class_TypeError, "must be real number")
            else:
                res = float_fn(OM_get_boxed_value(float_val))

                if float_is_infinite(res):
                    return sem_raise_with_message(make_out_of_ast_context(float_rte, cont), class_ValueError,
                                                         "cannot convert float infinity to integer")
                elif float_is_nan(res):
                    return sem_raise_with_message(make_out_of_ast_context(float_rte, cont), class_ValueError,
                                                  "cannot convert float NaN to integer")
                else:
                    int_res = int_from_num(float_to_num(res))
                    return unwind_return(float_rte, om_int(int_res))

        return sem_maybe_float(make_out_of_ast_context(rte, apply_float_fn), val)

    return om_make_builtin_function_with_signature(fn_name, float_code, make_posonly_only_signature((arg,)))

def om_make_math_unary_real_domain_function(fn_name, float_fn, arg, arg_domain):
    def float_code(rte, cont):
        val = rte_lookup_locals(rte, arg)

        def apply_float_fn(float_rte, float_val):
            if float_val is absent:
                return sem_raise_with_message(make_out_of_ast_context(float_rte, cont), class_TypeError, "must be real number")
            else:
                float_unboxed_val = OM_get_boxed_value(float_val)

                if float_is_nan(float_unboxed_val):
                    return unwind_return(float_rte, om_float(float_nan()))
                elif arg_domain(float_unboxed_val):
                    res = float_fn(OM_get_boxed_value(float_val))
                    return unwind_return(float_rte, om_float(res))
                else:
                    return sem_raise_with_message(make_out_of_ast_context(float_rte, cont), class_ValueError, "math domain error")

        return sem_maybe_float(make_out_of_ast_context(rte, apply_float_fn), val)

    return om_make_builtin_function_with_signature(fn_name, float_code, make_posonly_only_signature((arg,)))

def make_math_domain_function(cmp, bound):
    float_bound = float_from_num(bound)
    return lambda x: cmp(x, float_bound)

def make_math_domain_range_function(cmp1, bound1, cmp2, bound2):
    float_bound1 = float_from_num(bound1)
    float_bound2 = float_from_num(bound2)
    return lambda x: cmp1(x, float_bound1) and cmp2(x, float_bound2)

def make_module_math():
    # NOTE: the math module does not generally defers to corresponding semantics.
    # By example, math.pow does not call __pow__ and __rpow__, instead it calls __float__ on both operands
    # and does a native float exponentiation. This behaviour is the same for most math methods.
    # This also means math methods always return floats and have different error than arithmetic semantics

    sqrt_domain = make_math_domain_function(float_ge, 0)
    om_math_sqrt = om_make_math_unary_real_domain_function("sqrt", float_sqrt, "x", sqrt_domain)

    om_math_floor = om_make_math_unary_real_to_int_function("floor", float_floor, "x")
    om_math_ceil = om_make_math_unary_real_to_int_function("ceil", float_ceil, "x")

    def math_pow_code(rte, cont):
        obj1 = rte_lookup_locals(rte, 'x')
        obj2 = rte_lookup_locals(rte, 'y')

        def check_obj1(obj1_rte, obj1_res):
            if obj1_res is absent:
                return sem_raise_with_message(make_out_of_ast_context(obj1_rte, cont), class_TypeError,
                                              "must be real number")
            else:
                def check_obj2(obj2_rte, obj2_res):
                    if obj2_res is absent:
                        return sem_raise_with_message(make_out_of_ast_context(obj2_rte, cont), class_ValueError,
                                                      "must be real number")
                    else:
                        float_res1 = OM_get_boxed_value(obj1_res)
                        float_res2 = OM_get_boxed_value(obj2_res)

                        res = float_pow(float_res1, float_res2)

                        if float_is_infinite(res):
                            return sem_raise_with_message(make_out_of_ast_context(obj2_rte, cont), class_OverflowError,
                                                          "math range error")
                        elif float_is_nan(res):
                            return sem_raise_with_message(make_out_of_ast_context(obj2_rte, cont), class_ValueError,
                                                          "math domain error")
                        else:
                            return unwind_return(obj2_rte, om_float(res))

                return sem_maybe_float(make_out_of_ast_context(obj1_rte, check_obj2), obj2)
        return sem_maybe_float(make_out_of_ast_context(rte, check_obj1), obj1)

    # Exponentiation
    om_math_pow = om_make_builtin_function_with_signature("pow", math_pow_code, make_posonly_only_signature(("x", "y")))
    om_math_exp = om_make_math_unary_real_function("exp", float_exp, "x")

    # Logarithms
    log_domain = make_math_domain_function(float_gt, 0)
    om_math_log = om_make_math_unary_real_domain_function("log", float_log, "x", log_domain)
    om_math_log2 = om_make_math_unary_real_domain_function("log2", float_log2, "x", log_domain)
    om_math_log10 = om_make_math_unary_real_domain_function("log10", float_log10, "x", log_domain)

    log1p_domain = make_math_domain_function(float_gt, -1)
    om_math_log1p = om_make_math_unary_real_domain_function("log1p", float_log1p, "x", log1p_domain)

    # Trigonometry
    om_math_sin = om_make_math_unary_real_function("sin", float_sin, "x")
    om_math_cos = om_make_math_unary_real_function("cos", float_cos, "x")
    om_math_tan = om_make_math_unary_real_function("tan", float_tan, "x")

    inverse_trig_domain = make_math_domain_range_function(float_ge, -1, float_le, 1)
    om_math_asin = om_make_math_unary_real_domain_function("asin", float_asin, "x", inverse_trig_domain)
    om_math_acos = om_make_math_unary_real_domain_function("acos", float_acos, "x", inverse_trig_domain)
    om_math_atan = om_make_math_unary_real_function("atan", float_atan, "x")

    def math_atan2_code(rte, cont):
        obj1 = rte_lookup_locals(rte, 'y')
        obj2 = rte_lookup_locals(rte, 'x')

        def check_obj1(obj1_rte, obj1_res):
            if obj1_res is absent:
                return sem_raise_with_message(make_out_of_ast_context(obj1_rte, cont), class_TypeError,
                                              "must be real number")
            else:
                def check_obj2(obj2_rte, obj2_res):
                    if obj2_res is absent:
                        return sem_raise_with_message(make_out_of_ast_context(obj2_rte, cont), class_ValueError,
                                                      "must be real number")
                    else:
                        float_res1 = OM_get_boxed_value(obj1_res)
                        float_res2 = OM_get_boxed_value(obj2_res)

                        res = float_atan2(float_res1, float_res2)

                        return unwind_return(obj2_rte, om_float(res))
                return sem_maybe_float(make_out_of_ast_context(obj1_rte, check_obj2), obj2)
        return sem_maybe_float(make_out_of_ast_context(rte, check_obj1), obj1)

    om_math_atan2 = om_make_builtin_function_with_signature("atan2", math_atan2_code, make_posonly_only_signature(("y", "x")))


    module_math_env = make_dict()

    # functions
    dict_set(module_math_env, 'sqrt', om_math_sqrt)
    dict_set(module_math_env, 'floor', om_math_floor)
    dict_set(module_math_env, 'ceil', om_math_ceil)
    dict_set(module_math_env, 'log', om_math_log)
    dict_set(module_math_env, 'log2', om_math_log2)
    dict_set(module_math_env, 'log10', om_math_log10)
    dict_set(module_math_env, 'log1p', om_math_log1p)
    dict_set(module_math_env, 'pow', om_math_pow)
    dict_set(module_math_env, 'exp', om_math_exp)
    dict_set(module_math_env, 'sin', om_math_sin)
    dict_set(module_math_env, 'cos', om_math_cos)
    dict_set(module_math_env, 'tan', om_math_tan)
    dict_set(module_math_env, 'asin', om_math_asin)
    dict_set(module_math_env, 'acos', om_math_acos)
    dict_set(module_math_env, 'atan', om_math_atan)
    dict_set(module_math_env, 'atan2', om_math_atan2)

    # constants
    dict_set(module_math_env, 'pi', om_float(float_pi()))
    dict_set(module_math_env, 'e', om_float(float_e()))
    dict_set(module_math_env, 'inf', om_float(float_inf()))
    dict_set(module_math_env, 'nan', om_float(float_nan()))

    return om_module('math', module_math_env)

# init module turtle
def make_module_turtle():
    # returns unbox number or absent
    def convert_to_number(val):
        if om_isinstance(val, class_float):
            return float_to_num(OM_get_boxed_value(val))
        elif om_isinstance(val, class_int):
            return int_to_num(OM_get_boxed_value(val))
        else:
            return absent

    # Generate code for 0 argument native function
    def make_set_option_fn(fct, name):
        def code(rte, cont):
            fct(rte)
            return unwind_return(rte, om_None)
        return om_make_builtin_function_with_signature(name, code, empty_signature)

    om_module_turtle_st = make_set_option_fn(drawing_st, 'st')
    om_module_turtle_ht = make_set_option_fn(drawing_ht, 'ht')
    om_module_turtle_pd = make_set_option_fn(drawing_pd, 'pd')
    om_module_turtle_pu = make_set_option_fn(drawing_pu, 'pu')
    om_module_turtle_nextpu = make_set_option_fn(drawing_nextpu, 'nextpu')

    def make_translation_fn(fn, name, arg1_name, arg2_name):
        def code(rte, cont):
            arg1 = rte_lookup_locals(rte, arg1_name)
            arg2 = rte_lookup_locals(rte, arg2_name)

            def get_arg1_float(arg1_rte, arg1_float):
                def get_arg2_float(arg2_rte, arg2_float):
                    val1 = float_to_num(OM_get_boxed_value(arg1_float))
                    val2 = float_to_num(OM_get_boxed_value(arg2_float))

                    if not float_is_finite(val1) or not float_is_finite(val2):
                        return sem_raise_with_message(make_out_of_ast_context(arg2_rte, cont), class_ValueError, name + "() arguments must be finite numbers")
                    else:
                        fn(rte, val1, val2)
                        return unwind_return(rte, om_None)

                return sem_float(make_out_of_ast_context(arg1_rte, get_arg2_float), arg2)
            return sem_float(make_out_of_ast_context(rte, get_arg1_float), arg1)
        return om_make_builtin_function_with_signature(name, code,
                                                       make_posonly_defaults_signature((arg1_name, arg2_name),
                                                                               (om_float(float_from_num(0)),)))

    om_module_turtle_fd = make_translation_fn(drawing_fd, 'fd', 'xdist', 'ydist')
    om_module_turtle_bk = make_translation_fn(drawing_bk, 'bk', 'xdist', 'ydist')

    def clear_code(rte, cont):
        width = rte_lookup_locals(rte, 'width')
        height = rte_lookup_locals(rte, 'height')

        if width is absent:
            drawing_cs(rte)
            return unwind_return(rte, om_None)
        elif height is absent:
            return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError,
                                          'clear() expected 0 or 2 arguments, got 1')
        else:
            def get_width_float(width_rte, width_float):
                def get_height_float(height_rte, height_float):
                    width_val = float_to_num(OM_get_boxed_value(width_float))
                    height_val = float_to_num(OM_get_boxed_value(height_float))

                    if not float_is_finite(width_val) or not float_is_finite(height_val):
                        return sem_raise_with_message(make_out_of_ast_context(height_rte, cont),
                                                      class_ValueError,
                                                      "clear() arguments must be finite numbers")
                    else:
                        drawing_cs(rte, width_val, height_val)
                        return unwind_return(rte, om_None)
                return sem_float(make_out_of_ast_context(width_rte, get_height_float), height)
            return sem_float(make_out_of_ast_context(rte, get_width_float), width)

    om_module_turtle_clear = om_make_builtin_function_with_signature('clear', clear_code,
                                                                     make_posonly_defaults_only_signature(('width', 'height'),
                                                                                                  (absent, absent)))
    def goto_code(rte, cont):
        x = rte_lookup_locals(rte, 'x')
        y = rte_lookup_locals(rte, 'y')

        def get_x_float(x_rte, x_float):
            def get_y_float(y_rte, y_float):
                x_val = float_to_num(OM_get_boxed_value(x_float))
                y_val = float_to_num(OM_get_boxed_value(y_float))

                if not float_is_finite(x_val) or not float_is_finite(y_val):
                    return sem_raise_with_message(make_out_of_ast_context(y_rte, cont),
                                                  class_ValueError,
                                                  "goto() arguments must be finite numbers")
                else:
                    drawing_mv(y_rte, x_val, y_val)
                    return unwind_return(rte, om_None)

            return sem_float(make_out_of_ast_context(x_rte, get_y_float), y)
        return sem_float(make_out_of_ast_context(rte, get_x_float), x)

    om_module_turtle_goto = om_make_builtin_function_with_signature('goto', goto_code, make_posonly_only_signature(('x', 'y')))

    def make_rotation_fn(fn, name, arg_name):
        def code(rte, cont):
            angle = rte_lookup_locals(rte, arg_name)
            def get_angle_float(angle_rte, angle_float):
                angle_val = float_to_num(OM_get_boxed_value(angle_float))

                if float_is_finite(angle_val):
                    fn(angle_rte, angle_val)
                    return unwind_return(angle_rte, om_None)
                else:
                    return sem_raise_with_message(make_out_of_ast_context(angle_rte, cont),
                                                  class_ValueError,
                                                  name + "() argument must be a finite number")

            return sem_float(make_out_of_ast_context(rte, get_angle_float), angle)
        return om_make_builtin_function_with_signature(name, code, make_posonly_only_signature((arg_name,)))

    om_module_turtle_lt = make_rotation_fn(drawing_lt, 'lt', 'angle')
    om_module_turtle_rt = make_rotation_fn(drawing_rt, 'rt', 'angle')

    def pencolor_code(rte, cont):
        r = rte_lookup_locals(rte, 'r')
        g = rte_lookup_locals(rte, 'g')
        b = rte_lookup_locals(rte, 'b')

        def color_in_range(val):
            return val >= 0 and val <= 1

        def get_r_float(r_rte, r_float):
            def get_g_float(g_rte, g_float):
                def get_b_float(b_rte, b_float):
                    r_val = float_to_num(OM_get_boxed_value(r_float))
                    g_val = float_to_num(OM_get_boxed_value(g_float))
                    b_val = float_to_num(OM_get_boxed_value(b_float))

                    if color_in_range(r_val) and color_in_range(g_val) and color_in_range(b_val):
                        drawing_setpc(rte, r_val, g_val, b_val)
                        return unwind_return(rte, om_None)
                    else:
                        return sem_raise_with_message(make_out_of_ast_context(b_rte, cont),
                                                      class_ValueError,
                                                      "pencolor() arguments must be between 0 and 1")

                return sem_float(make_out_of_ast_context(g_rte, get_b_float), b)
            return sem_float(make_out_of_ast_context(r_rte, get_g_float), g)
        return sem_float(make_out_of_ast_context(rte, get_r_float), r)

    om_module_turtle_pencolor = om_make_builtin_function_with_signature('pencolor', pencolor_code,
                                                                        make_posonly_only_signature(('r', 'g', 'b')))

    def pensize_code(rte, cont):
        width = rte_lookup_locals(rte, 'width')

        def get_width_float(width_rte, width_float):
            width_value = OM_get_boxed_value(width_float)

            if float_is_finite(width_value) and float_is_pos(width_value):
                drawing_setpw(width_rte, float_to_num(width_value))
                return unwind_return(width_rte, om_None)
            else:
                return sem_raise_with_message(make_out_of_ast_context(width_rte, cont), class_ValueError,
                                              "pensize() argument must be a positive number")

        return sem_float(make_out_of_ast_context(rte, get_width_float), width)

    om_module_turtle_pensize = om_make_builtin_function_with_signature('pensize', pensize_code,
                                                                       make_posonly_only_signature(('width',)))

    def write_code(rte, cont):
        arg = rte_lookup_locals(rte, 'arg')

        def get_arg_str(arg_rte, arg_str):
            text_value = OM_get_boxed_value(arg_str)
            drawing_drawtext(arg_rte, text_value)
            return unwind_return(arg_rte, om_None)

        return sem_str(make_out_of_ast_context(rte, get_arg_str), arg)


    om_module_turtle_write = om_make_builtin_function_with_signature('write', write_code,
                                                                     make_posonly_only_signature(('arg',)))

    module_turtle_env = make_dict()

    dict_set(module_turtle_env, 'clear', om_module_turtle_clear)
    dict_set(module_turtle_env, 'st', om_module_turtle_st)
    dict_set(module_turtle_env, 'ht', om_module_turtle_ht)
    dict_set(module_turtle_env, 'pd', om_module_turtle_pd)
    dict_set(module_turtle_env, 'pu', om_module_turtle_pu)
    dict_set(module_turtle_env, 'nextpu', om_module_turtle_nextpu)
    dict_set(module_turtle_env, 'fd', om_module_turtle_fd)
    dict_set(module_turtle_env, 'bk', om_module_turtle_bk)
    dict_set(module_turtle_env, 'goto', om_module_turtle_goto)
    dict_set(module_turtle_env, 'lt', om_module_turtle_lt)
    dict_set(module_turtle_env, 'rt', om_module_turtle_rt)
    dict_set(module_turtle_env, 'pencolor', om_module_turtle_pencolor)
    dict_set(module_turtle_env, 'pensize', om_module_turtle_pensize)
    dict_set(module_turtle_env, 'write', om_module_turtle_write)

    return om_module('turtle', module_turtle_env)

def make_module_random():
    module_random_env = make_dict()

    def om_random_code(rte, _):
        result = runtime_random()
        return unwind_return(rte, om_float(result))

    om_random_random = om_make_builtin_function_with_signature('random', om_random_code, empty_signature)

    dict_set(module_random_env, 'random', om_random_random)

    return om_module('random', module_random_env)


def make_module_time():
    module_time_env = make_dict()

    def om_time_code(rte, _):
        result = runtime_time()
        return unwind_return(rte, om_float(result))

    def om_sleep_code(rte, cont):
        secs = rte_lookup_locals(rte, 'secs')

        def return_none(_):
            return unwind_return(rte, om_None)

        frame = rte_stack(rte)
        parent_ast = frame_ast(frame)
        parent_rte = frame_rte(frame)

        # The rte is used to display the variables, so we provide the caller rte
        sleep_ctx = Context(parent_rte, return_none, parent_ast)

        if om_isinstance(secs, class_float):
            sleep_time = float_to_num(OM_get_boxed_value(secs))
            if sleep_time < 0:
                return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_ValueError,
                                              "sleep length must be non-negative")
            else:
                return stmt_end_with_sleep(sleep_ctx, sleep_time * 1000)
        else:
            def sleep_int_amount(int_rte, int_res):
                if int_res is absent:
                    return sem_raise_with_message(make_out_of_ast_context(int_rte, cont), class_TypeError,
                                                  "a number is required")
                else:
                    sleep_time = int_to_num(OM_get_boxed_value(int_res))
                    if sleep_time < 0:
                        return sem_raise_with_message(make_out_of_ast_context(int_rte, cont), class_ValueError,
                                                      "sleep length must be non-negative")
                    else:
                        return stmt_end_with_sleep(sleep_ctx, sleep_time * 1000)
            return sem_maybe_index(make_out_of_ast_context(rte, sleep_int_amount), secs)

    om_time_time = om_make_builtin_function_with_signature('time', om_time_code, empty_signature)
    om_time_sleep = om_make_builtin_function_with_signature('sleep', om_sleep_code, make_posonly_only_signature(('secs',)))

    dict_set(module_time_env, 'time', om_time_time)
    dict_set(module_time_env, 'sleep', om_time_sleep)

    return om_module('time', module_time_env)


def make_module_io():
    module_io_env = make_dict()
    dict_set(module_io_env, 'UnsupportedOperation', class_UnsupportedOperation)
    return om_module('io', module_io_env)

def make_module_functools():
    module_functools_env = make_dict()

    def om_reduce_code(rte, cont):
        fn = rte_lookup_locals(rte, "function")
        it = rte_lookup_locals(rte, "iterable")
        init = rte_lookup_locals(rte, "initializer")

        def get_iterator(rte, iterator):
            def get_next(rte, last):
                def catch_StopIteration(exn):
                    ctx = make_out_of_ast_context(rte, cont)
                    if om_isinstance(exn, class_StopIteration):
                        return unwind_return(rte, last)
                    else:
                        return sem_raise_unsafe(ctx.rte, exn)

                def do_call(rte, nxt):
                    return sem_simple_call(make_out_of_ast_context(rte, get_next), fn, [last, nxt])

                return sem_next_no_default(make_out_of_ast_context_with_catch(rte, do_call, catch_StopIteration), iterator)

            if init is absent:
                def catch_StopIteration(exn):
                    ctx = make_out_of_ast_context(rte, cont)
                    if om_isinstance(exn, class_StopIteration):
                        return sem_raise_with_message(ctx, class_TypeError, "reduce() of empty sequence with no initial value")
                    else:
                        return sem_raise_unsafe(ctx.rte, exn)

                return sem_next_no_default(make_out_of_ast_context_with_catch(rte, get_next, catch_StopIteration), iterator)
            else:
                return get_next(rte, init)

        return sem_iter(make_out_of_ast_context(rte, get_iterator), it)

    om_functools_reduce = om_make_builtin_function_with_signature("reduce", om_reduce_code,
                                                                  make_posonly_defaults_signature(
                                                                      ["function", "iterable", "initializer"],
                                                                      [absent]))

    dict_set(module_functools_env, 'reduce', om_functools_reduce)

    return om_module('functools', module_functools_env)


# csv module QUOTE_* parameters
csv_param_quote_minimal = 0
csv_param_quote_all = 1
csv_param_quote_nonnumeric = 2
csv_param_quote_none = 3

def make_module_csv():
    module_csv_env = make_dict()

    QUOTE_MINIMAL = om_int(csv_param_quote_minimal)
    QUOTE_ALL = om_int(csv_param_quote_all)
    QUOTE_NONNUMERIC = om_int(csv_param_quote_nonnumeric)
    QUOTE_NONE = om_int(csv_param_quote_none)

    dict_set(module_csv_env, "QUOTE_MINIMAL", QUOTE_MINIMAL)
    dict_set(module_csv_env, "QUOTE_ALL", QUOTE_ALL)
    dict_set(module_csv_env, "QUOTE_NONNUMERIC", QUOTE_NONNUMERIC)
    dict_set(module_csv_env, "QUOTE_NONE", QUOTE_NONE)

    def reader_code(rte, cont):
        csvfile = rte_lookup_locals(rte, "csvfile")
        dialect = rte_lookup_locals(rte, "dialect")
        delimiter = rte_lookup_locals(rte, "delimiter")
        doublequote = rte_lookup_locals(rte, "doublequote")
        escapechar = rte_lookup_locals(rte, "escapechar")
        lineterminator = rte_lookup_locals(rte, "lineterminator")
        quotechar = rte_lookup_locals(rte, "quotechar")
        quoting = rte_lookup_locals(rte, "quoting")
        skipinitialspace = rte_lookup_locals(rte, "skipinitialspace")
        strict = rte_lookup_locals(rte, "strict")

        def create_reader(reader_rte, it):
            # Check for dialect
            # TODO: we ignore dialect
            if not om_isinstance(dialect, class_str):
                return sem_raise_with_message(make_out_of_ast_context(reader_rte, None), class_TypeError, "dialect must be a string")
            else:
                dialect_value = OM_get_boxed_value(dialect)

            # check for delimiter
            if not om_isinstance(delimiter, class_str) or len(OM_get_boxed_value(delimiter)) != 1:
                return sem_raise_with_message(make_out_of_ast_context(reader_rte, None), class_TypeError, "delimiter must be a 1-character string")
            else:
                delimiter_value = OM_get_boxed_value(delimiter)

            def after_doublequote(dq_rte, doublequote_as_bool):
                # doublequote truthiness is tested
                doublequote_value = True if om_is(doublequote_as_bool, om_True) else False

                # check for escape char
                if om_is(escapechar, om_None):
                    escapechar_value = None
                elif om_isinstance(escapechar, class_str) and len(OM_get_boxed_value(delimiter)) == 1:
                    escapechar_value = OM_get_boxed_value(escapechar)
                else:
                    return sem_raise_with_message(make_out_of_ast_context(dq_rte, None), class_TypeError, "escapechar must be a string or None")

                # check for lineterminator
                # TODO: we ignore lineterminator since even cPython 3.8 seems to ignore it
                # https://docs.python.org/3.8/library/csv.html#csv.Dialect.lineterminator
                if not om_isinstance(lineterminator, class_str):
                    return sem_raise_with_message(make_out_of_ast_context(dq_rte, None), class_TypeError, "lineterminator must be a string")
                else:
                    lineterminator_value = OM_get_boxed_value(lineterminator)

                # check for quotechar
                # not clear in the doc, but as per cpython unittests, it can be None
                if om_is(quotechar, om_None):
                    quotechar_value = None
                elif not om_isinstance(quotechar, class_str) or len(OM_get_boxed_value(quotechar)) != 1:
                    return sem_raise_with_message(make_out_of_ast_context(dq_rte, None), class_TypeError, "quotechar must be a 1-character string")
                else:
                    quotechar_value = OM_get_boxed_value(quotechar)

                # check for quoting
                if not om_has_type(quoting, class_int):
                    return sem_raise_with_message(make_out_of_ast_context(dq_rte, None), class_TypeError, "quoting must be an interger")
                else:
                    quoting_value = OM_get_boxed_value(quoting)
                    if quoting_value < csv_param_quote_minimal or quoting_value > csv_param_quote_none:
                        return sem_raise_with_message(make_out_of_ast_context(dq_rte, None), class_TypeError, "bad quoting value")
                    if quoting_value == csv_param_quote_none:
                        quotechar_value = None

                def after_skipinitialspace(initialspace_rte, skipinitialspace_as_bool):
                    # skipinitialspace truthiness is tested
                    skipinitialspace_value = True if om_is(skipinitialspace_as_bool, om_True) else False

                    def after_strict(initialspace_rte, strict_as_bool):
                        # strict truthiness is tested
                        strict_value = True if om_is(strict_as_bool, om_True) else False

                        reader = om_csv_reader(class_csv_reader, 0, it, dialect_value, delimiter_value, doublequote_value,
                                               escapechar_value, lineterminator_value, quotechar_value, quoting_value,
                                               skipinitialspace_value, strict_value)
                        return unwind_return(initialspace_rte, reader)

                    return sem_bool(make_out_of_ast_context(dq_rte, after_strict), strict)

                return sem_bool(make_out_of_ast_context(dq_rte, after_skipinitialspace), skipinitialspace)

            return sem_bool(make_out_of_ast_context(reader_rte, after_doublequote), doublequote)

        return sem_iter(make_out_of_ast_context(rte, create_reader), csvfile)

    # See full details on formatting parameters here:
    # https://docs.python.org/3.8/library/csv.html#dialects-and-formatting-parameters
    dict_set(module_csv_env, 'reader',
             om_make_builtin_function_with_signature(
                'reader', reader_code,
                make_signature(["dialect"], # args
                               ["csvfile"], # posonly
                               None, # *args
                               ["delimiter", "doublequote","escapechar", "lineterminator",
                                "quotechar", "quoting", "skipinitialspace", "strict"], # kwonly
                               [om_str(","), om_True, om_None, om_str("\n"),
                                om_str('"'), QUOTE_MINIMAL, om_False, om_False], # kw-defaults
                                None, # **kwargs
                                [om_str("excel")]))) # dialect default

    dict_set(module_csv_env, 'Error', class_csv_Error)

    return om_module('csv', module_csv_env)

# add the mouse event functions to a specify environment
def make_module_mouse():
    def getMouse_code(rte, cont):
        if getMouse is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            mouse_state = getMouse(rte)

            x = dict_get(mouse_state, 'x', None)
            y = dict_get(mouse_state, 'y', None)
            button = dict_get(mouse_state, 'button', None)
            shift = dict_get(mouse_state, 'shift', None)
            ctrl = dict_get(mouse_state, 'ctrl', None)
            alt = dict_get(mouse_state, 'alt', None)

            struct_attrs = make_dict()
            dict_set(struct_attrs, 'x', om_int(int_from_num(x)))
            dict_set(struct_attrs, 'y', om_int(int_from_num(y)))
            dict_set(struct_attrs, 'button', om_int(button))
            dict_set(struct_attrs, 'shift', om_bool(shift))
            dict_set(struct_attrs, 'ctrl', om_bool(ctrl))
            dict_set(struct_attrs, 'alt', om_bool(alt))

            return sem_generic_call(make_out_of_ast_context(rte, unwind_return), class_struct, [], struct_attrs)

    def getMouseX_code(rte, cont):
        if getMouseX is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            return unwind_return(rte, om_int(int_from_num(getMouseX(rte))))

    def getMouseY_code(rte, cont):
        if getMouseY is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            return unwind_return(rte, om_int(int_from_num(getMouseY(rte))))

    def getMouseButton_code(rte, cont):
        if getMouseButton is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            return unwind_return(rte, om_int(getMouseButton(rte)))

    def getMouseShift_code(rte, cont):
        if getMouseShift is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            return unwind_return(rte, om_bool(getMouseShift(rte)))

    def getMouseCtrl_code(rte, cont):
        if getMouseCtrl is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            return unwind_return(rte, om_bool(getMouseCtrl(rte)))

    def getMouseAlt_code(rte, cont):
        if getMouseAlt is None:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise(ctx, class_NotImplementedError)
        else:
            return unwind_return(rte, om_bool(getMouseAlt(rte)))

    module_mouse_env = make_dict()

    dict_set(module_mouse_env, 'getMouse',
             om_make_builtin_function_with_signature('getMouse', getMouse_code, empty_signature))
    dict_set(module_mouse_env, 'getMouseX',
             om_make_builtin_function_with_signature('getMouseX', getMouseX_code, empty_signature))
    dict_set(module_mouse_env, 'getMouseY',
             om_make_builtin_function_with_signature('getMouseY', getMouseY_code, empty_signature))
    dict_set(module_mouse_env, 'getMouseButton',
             om_make_builtin_function_with_signature('getMouseButton', getMouseButton_code, empty_signature))
    dict_set(module_mouse_env, 'getMouseShift',
             om_make_builtin_function_with_signature('getMouseShift', getMouseShift_code, empty_signature))
    dict_set(module_mouse_env, 'getMouseCtrl',
             om_make_builtin_function_with_signature('getMouseCtrl', getMouseCtrl_code, empty_signature))
    dict_set(module_mouse_env, 'getMouseAlt',
             om_make_builtin_function_with_signature('getMouseAlt', getMouseAlt_code, empty_signature))

    return om_module('mouse', module_mouse_env)

def make_module_pixels():
    def color_str_to_dict(s):
        len_s = len(s)
        if len_s == 4 and s[0] == '#':
            r = int_from_substring(s, 1, 2, 16)
            g = int_from_substring(s, 2, 3, 16)
            b = int_from_substring(s, 3, 4, 16)
            if r is False or g is False or b is False:
                return None
            else:
                color = make_dict()
                dict_set(color, 'r', int_to_num(r))
                dict_set(color, 'g', int_to_num(g))
                dict_set(color, 'b', int_to_num(b))
                return color
        else:
            return None

    def color_struct_to_dict(s):
        r = OM_get(s, 'r')
        g = OM_get(s, 'g')
        b = OM_get(s, 'b')

        if r is absent or g is absent or b is absent:
            return None
        else:
            color_codes = []
            for val in [r, g, b]:
                if om_isinstance(val, class_int):
                    boxed_val = OM_get_boxed_value(val)
                    val_num = int_to_num(boxed_val)

                    if val_num >= 0 and val_num <= 15:
                        color_codes.append(val_num)
                    else:
                        return None
                else:
                    return None

            color = make_dict()
            dict_set(color, 'r', color_codes[0])
            dict_set(color, 'g', color_codes[1])
            dict_set(color, 'b', color_codes[2])
            return color

    def setScreenMode_code(rte, cont):
        width = rte_lookup_locals(rte, 'width')
        height = rte_lookup_locals(rte, 'height')
        if om_isinstance(width, class_int) and om_isinstance(height, class_int):
            width_val = int_to_num(OM_get_boxed_value(width))
            height_val = int_to_num(OM_get_boxed_value(height))
            drawing_setScreenMode(rte, width_val, height_val)
            return unwind_return(rte, om_None)
        else:
            ctx = make_out_of_ast_context(rte, cont)
            return sem_raise_with_message(ctx, class_TypeError, "arguments width and height must be of type int")

    def getScreenWidth_code(rte, cont):
        result = drawing_getScreenWidth(rte)
        return unwind_return(rte, om_int(int_from_num(result)))

    def getScreenHeight_code(rte, cont):
        result = drawing_getScreenHeight(rte)
        return unwind_return(rte, om_int(int_from_num(result)))

    def setPixel_code(rte, cont):
        ctx = make_out_of_ast_context(rte, cont)
        x = rte_lookup_locals(rte, 'x')
        y = rte_lookup_locals(rte, 'y')
        color = rte_lookup_locals(rte, 'color')
        if om_isinstance(x, class_int) and om_isinstance(y, class_int):
            xval = int_to_num(OM_get_boxed_value(x))
            yval = int_to_num(OM_get_boxed_value(y))

            screen_width = drawing_getScreenWidth(rte)
            screen_height = drawing_getScreenHeight(rte)

            if xval < 0 or xval >= screen_width:
                return sem_raise_with_message(ctx, class_IndexError, "x parameter of setPixel must be a non-negative integer less than " + str(screen_width))

            if yval < 0 or yval >= screen_height:
                return sem_raise_with_message(ctx, class_IndexError, "y parameter of setPixel must be a non-negative integer less than " + str(screen_height))

            if om_isinstance(color, class_str):
                color_val = color_str_to_dict(OM_get_boxed_value(color))
                if color_val is None:
                    return sem_raise_with_message(ctx, class_ValueError, "invalid HTML color str format")
                else:
                    drawing_setPixel(rte, xval, yval, color_val)
                    return unwind_return(rte, om_None)
            if om_isinstance(color, class_struct):
                color_val = color_struct_to_dict(color)
                if color_val is None:
                    return sem_raise_with_message(ctx, class_ValueError, "invalid HTML color struct format")
                else:
                    drawing_setPixel(rte, xval, yval, color_val)
                    return unwind_return(rte, om_None)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "color must be of type str or struct")
        else:
            return sem_raise_with_message(ctx, class_TypeError, "arguments x and y must be of type int")


    def fillRectangle_code(rte, cont):
        ctx = make_out_of_ast_context(rte, cont)
        x = rte_lookup_locals(rte, 'x')
        y = rte_lookup_locals(rte, 'y')
        width = rte_lookup_locals(rte, 'width')
        height = rte_lookup_locals(rte, 'height')
        color = rte_lookup_locals(rte, 'color')
        if om_isinstance(x, class_int) and om_isinstance(y, class_int) and \
           om_isinstance(width, class_int) and om_isinstance(height, class_int):
            xval = int_to_num(OM_get_boxed_value(x))
            yval = int_to_num(OM_get_boxed_value(y))
            width_val = int_to_num(OM_get_boxed_value(width))
            height_val = int_to_num(OM_get_boxed_value(height))

            screen_width = drawing_getScreenWidth(rte)
            screen_height = drawing_getScreenHeight(rte)

            if xval < 0:
                return sem_raise_with_message(ctx, class_IndexError, "x parameter of fillRectangle must be a non-negative integer")

            if yval < 0:
                return sem_raise_with_message(ctx, class_IndexError, "y parameter of fillRectangle must be a non-negative integer")

            if width_val < 0 or xval + width_val > screen_width:
                error_msg = "width parameter of fillRectangle must be a non-negative integer such that x + width <= " + str(screen_width)
                return sem_raise_with_message(ctx, class_IndexError, error_msg)

            if height_val < 0 or yval + height_val > screen_height:
                error_msg = "height parameter of fillRectangle must be a non-negative integer such that y + height <= " + str(screen_height)
                return sem_raise_with_message(ctx, class_IndexError, error_msg)

            if om_isinstance(color, class_str):
                color_val = color_str_to_dict(OM_get_boxed_value(color))
                if color_val is None:
                    return sem_raise_with_message(ctx, class_ValueError, "invalid HTML color str format")
                else:
                    drawing_fillRectangle(rte, xval, yval, width_val, height_val, color_val)
                    return unwind_return(rte, om_None)
            elif om_isinstance(color, class_struct):
                color_val = color_struct_to_dict(color)
                if color_val is None:
                    return sem_raise_with_message(ctx, class_ValueError, "invalid HTML color struct format")
                else:
                    drawing_fillRectangle(rte, xval, yval, width_val, height_val, color_val)
                    return unwind_return(rte, om_None)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "color must be of type str or struct")
        else:
            return sem_raise_with_message(ctx, class_TypeError, "x, y, width and height must be of type int")


    def exportScreen_code(rte, cont):
        result = drawing_exportScreen(rte)
        return unwind_return(rte, om_str(result))

    # NOTE: getMouse is in the mouse module
    # def getMouse_code(rte, cont):
    #     pass

    setScreenMode = om_make_builtin_function_with_signature('setScreenMode', setScreenMode_code, make_posonly_only_signature(('width', 'height',)))
    getScreenWidth = om_make_builtin_function_with_signature('getScreenWidth', getScreenWidth_code, empty_signature)
    getScreenHeight = om_make_builtin_function_with_signature('getScreenHeight', getScreenHeight_code, empty_signature)
    setPixel = om_make_builtin_function_with_signature('setPixel', setPixel_code, make_posonly_only_signature(('x', 'y', 'color',)))
    fillRectangle = om_make_builtin_function_with_signature('fillRectangle', fillRectangle_code, make_posonly_only_signature(('x', 'y', 'width', 'height', 'color',)))
    exportScreen = om_make_builtin_function_with_signature('exportScreen', exportScreen_code, empty_signature)

    module_pixels_env = make_dict()
    dict_set(module_pixels_env, 'setScreenMode', setScreenMode)
    dict_set(module_pixels_env, 'getScreenWidth', getScreenWidth)
    dict_set(module_pixels_env, 'getScreenHeight', getScreenHeight)
    dict_set(module_pixels_env, 'setPixel', setPixel)
    dict_set(module_pixels_env, 'fillRectangle', fillRectangle)
    dict_set(module_pixels_env, 'exportScreen', exportScreen)
    return om_module('pixels', module_pixels_env)


def make_module_more_builtins():
    # Defines the module "more_builtins" which contains builtins class/functions
    # which are specific to CodeBoot learning environment

    def om_struct_new_code(ctx, args, kwargs):
        if debug: print('struct.__new__')

        args_len = len(args)

        if args_len == 1:
            struct_obj = om(args[0])

            fields = []

            for pair in dict_items(kwargs):
                key = pair[0]
                value = pair[1]

                if key == '_fields':
                    return sem_raise_with_message(ctx, class_ValueError,
                                                  "cannot set reserved attribute '_fields' of struct()")
                elif key == '__class__':
                    return sem_raise_with_message(ctx, class_ValueError,
                                                  "cannot set reserved attribute '__class__' of struct()")
                else:
                    fields.append(om_str(key))
                    OM_set(struct_obj, key, value)

            OM_set(struct_obj, '_fields', om_tuple(fields))

            return cont_obj(ctx, struct_obj)

        else:
            return sem_raise_with_message(ctx, class_TypeError,
                                          "struct takes no positional argument, got " + str(args_len - 1))

    om_struct_new = do_static_magic_method_with_kwargs(class_struct, "__new__", om_struct_new_code)

    def om_struct_repr_code(ctx, args):
        if debug: print('struct.__repr__')

        args_len = len(args)

        if args_len == 1:
            rte = ctx.rte
            self = args[0]

            if rte_check_seen_repr(rte, self):
                return cont_str(ctx, "struct(...)")
            else:
                rte_add_seen_repr(rte, self)

                attrs = OM_get_tuple_seq(OM_get(self, '_fields'))

                def do_end(end_rte, acc):
                    return ctx.cont(end_rte, om_str("struct(" + ", ".join(acc) + ")"))

                cont = do_end

                i = len(attrs) - 1
                while i >= 0:
                    # fields are stored as strings
                    name = OM_get_boxed_value(attrs[i])
                    value = OM_get(self, name)

                    def create_code(name, value, cont):
                        def do_element(element_rte, acc):
                            def do_attr_repr(attr_rte, repr_):
                                repr_val = OM_get_boxed_value(repr_)
                                acc.append(name + "=" + repr_val)
                                return cont(attr_rte, acc)
                            return sem_repr(make_out_of_ast_context(element_rte, do_attr_repr), value)
                        return do_element

                    cont = create_code(name, value, cont)
                    i -= 1

                return cont(ctx.rte, [])
        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected 0 arguments, got " + str(args_len - 1))

    om_struct_repr = do_magic_method(class_struct, "__repr__", om_struct_repr_code)


    def om_struct_setattr_code(ctx, args):
        if debug: print('struct.__setattr__')

        args_len = len(args)

        if args_len == 3:
            self = args[0]
            name = args[1]
            value = args[2]

            if om_isinstance(name, class_str):
                name_value = OM_get_boxed_value(name)
                fields = OM_get_tuple_seq(OM_get(self, '_fields'))

                for f in fields:
                    field_value = OM_get_boxed_value(f)
                    if name_value == field_value:
                        OM_set(self, name_value, value)

                        return cont_obj(ctx, om_None)

                return sem_raise_with_message(ctx, class_AttributeError,
                                              "struct() object has no attribute '" + name_value + "'")
            else:
                return sem_raise_with_message(ctx, class_TypeError, "attribute must be string")

        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(args_len - 1))

    om_struct_setattr = do_magic_method(class_struct, "__setattr__", om_struct_setattr_code)

    builtin_add_methods_to_class(
        class_struct,
        (('__new__', om_struct_new, True),
         ('__repr__', om_struct_repr),
         ('__setattr__', om_struct_setattr)))


    # Codeboot IO

    def readFile_code(rte, cont):
        filename = rte_lookup_locals(rte, 'filename')

        if not om_isinstance(filename, class_str):
            return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError, "filename must be a str")
        else:
            filename_value = OM_get_boxed_value(filename)

            if len(filename_value) == 0:
                return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError,
                                              "filename must be a non-empty str")
            elif runtime_file_exists(rte, filename_value):
                content = runtime_read_file(rte, filename_value)
                return unwind_return(rte, om_str(content))
            else:
                return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_FileNotFoundError,
                                              "No such file: '" + filename_value + "'")


    om_readFile = om_make_builtin_function_with_signature('readFile', readFile_code,
                                                          make_posonly_only_signature(['filename']))

    def writeFile_code(rte, cont):
        filename = rte_lookup_locals(rte, 'filename')
        content = rte_lookup_locals(rte, 'content')

        if not om_isinstance(filename, class_str):
            return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError, "filename must be a str")
        elif not om_isinstance(content, class_str):
            return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError, "content must be a str")
        else:
            filename_value = OM_get_boxed_value(filename)
            content_value = OM_get_boxed_value(content)

            if len(filename_value) == 0:
                return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_TypeError,
                                              "filename must be a non-empty str")
            else:
                runtime_write_file(rte, filename_value, content_value)
                return unwind_return(rte, om_None)


    om_writeFile = om_make_builtin_function_with_signature('writeFile', writeFile_code,
                                                           make_posonly_only_signature(['filename', 'content']))

    # DOM related methods

    # Singleton object which allows access to the DOM
    om_document = om(class_DOMDocument)

    def om_DOMDocument_new_code(ctx, args):
        if len(args) == 1:
            return cont_obj(ctx, om_document)
        else:
            return sem_raise_with_message(ctx, class_TypeError, 'DOMDocument takes no argument')

    om_DOMDocument_new = do_static_magic_method(class_DOMDocument, '__new__', om_DOMDocument_new_code)


    def om_DOMDocument_querySelector_code(ctx, args):
        args_len = len(args)

        if args_len == 2:
            selector = args[1]

            if om_isinstance(selector, class_str):
                selector_value = OM_get_boxed_value(selector)
                # TODO: raise a Python exception on failure, for now Codeboot will raise its own JS exception
                elem = runtime_querySelector(ctx.rte, selector_value)
                # runtime_querySelector will return 'null' on a failure
                # TODO: make it return undefined which is the pyinterp None? Or give a way for pyinterp to handle null.
                if elem:
                    return cont_DOMElement(ctx, elem)
                else:
                    return cont_obj(ctx, om_None)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "HTML element selector must be a string")
        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected one argument, got " + str(args_len - 1))


    om_DOMDocument_querySelector = do_magic_method(class_DOMDocument, "querySelector", om_DOMDocument_querySelector_code)


    builtin_add_methods_to_class(
        class_DOMDocument,
        (('__new__', om_DOMDocument_new),
         ('querySelector', om_DOMDocument_querySelector)))


    def om_DOMElement_innerHTML_getter(ctx, instance):
        if om_is(instance, class_DOMElement):
            return cont_obj(ctx, om_innerHTML_descriptor)
        elif om_isinstance(instance, class_DOMElement):
            content = runtime_getInnerHTML(ctx.rte, OM_get_DOMElement_elem(instance))
            return cont_str(ctx, content)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "innerHTML descriptor expected a 'DOMElement'")


    def om_DOMElement_innerHTML_setter(ctx, instance, content):
        if om_isinstance(instance, class_DOMElement):
            if om_isinstance(content, class_str):
                content_value = OM_get_boxed_value(content)
                runtime_setInnerHTML(ctx.rte, OM_get_DOMElement_elem(instance), content_value)
                return cont_obj(ctx, om_None)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "innerHTML attribute must be set to a string")
        else:
            return sem_raise_with_message(ctx, class_TypeError, "innerHTML descriptor expected a 'DOMElement'")


    def om_DOMElement_value_getter(ctx, instance):
        if om_is(instance, class_DOMElement):
            return cont_obj(ctx, om_value_descriptor)
        elif om_isinstance(instance, class_DOMElement):
            content = runtime_getValue(ctx.rte, OM_get_DOMElement_elem(instance))
            return cont_str(ctx, content)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "value descriptor expected a 'DOMElement'")


    def om_DOMElement_value_setter(ctx, instance, content):
        if om_isinstance(instance, class_DOMElement):
            if om_isinstance(content, class_str):
                content_value = OM_get_boxed_value(content)
                runtime_setValue(ctx.rte, OM_get_DOMElement_elem(instance), content_value)
                return cont_obj(ctx, om_None)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "value attribute must be set to a string")
        else:
            return sem_raise_with_message(ctx, class_TypeError, "value descriptor expected a 'DOMElement'")


    def gen_DOMElement_handleAttribute(name, runtime_fn, do_cont):
        def om_DOMElement_handleAttribute_code(ctx, args):
            args_len = len(args)

            if args_len == 2:
                self = args[0]
                attr = args[1]
                elem = OM_get_DOMElement_elem(self)

                if om_isinstance(attr, class_str):
                    return do_cont(ctx, runtime_fn(ctx.rte, elem, OM_get_boxed_value(attr)))
                else:
                    return sem_raise_with_message(ctx, class_TypeError, "'DOMElement' attribute must be a string")
            else:
                return sem_raise_with_message(ctx, class_TypeError, "expected one argument, got " + str(args_len - 1))

        return do_magic_method(class_DOMElement, name, om_DOMElement_handleAttribute_code)

    def om_DOMElement_setAttribute_code(ctx, args):
        args_len = len(args)

        if args_len == 3:
            self = args[0]
            attr = args[1]
            value = args[2]
            elem = OM_get_DOMElement_elem(self)

            if om_isinstance(attr, class_str):
                if om_isinstance(value, class_str):
                    runtime_setAttribute(ctx.rte, elem, OM_get_boxed_value(attr), OM_get_boxed_value(value))
                    return cont_obj(ctx, om_None)
                else:
                    return sem_raise_with_message(ctx, class_TypeError, "'DOMElement' attribute value must be a string")
            else:
                return sem_raise_with_message(ctx, class_TypeError, "'DOMElement' attribute must be a string")
        else:
            return sem_raise_with_message(ctx, class_TypeError, "expected 2 arguments, got " + str(args_len - 1))

    om_DOMElement_setAttribute = do_magic_method(class_DOMElement, "setAttribute", om_DOMElement_setAttribute_code)

    # Depending on browser getAttribute may return "" or null when the attribute does not exist, we standardize this to None
    def cont_null_or_str(ctx, val):
        if not val or val == "":
            return cont_obj(ctx, om_None)
        else:
            return cont_str(ctx, val)

    om_DOMElement_hasAttribute = gen_DOMElement_handleAttribute("hasAttribute", runtime_hasAttribute, cont_bool)
    om_DOMElement_getAttribute = gen_DOMElement_handleAttribute("getAttribute", runtime_getAttribute, cont_null_or_str)
    om_DOMElement_removeAttribute = gen_DOMElement_handleAttribute("removeAttribute", runtime_removeAttribute,
                                                                lambda ctx, _: cont_obj(ctx, om_None))


    builtin_add_methods_to_class(
        class_DOMElement,
        (('hasAttribute', om_DOMElement_hasAttribute),
         ('getAttribute', om_DOMElement_getAttribute),
         ('removeAttribute', om_DOMElement_removeAttribute),
         ('setAttribute', om_DOMElement_setAttribute)))

    om_innerHTML_descriptor = om_getset_descriptor('innerHTML', class_DOMElement,
                                                   om_DOMElement_innerHTML_getter,
                                                   om_DOMElement_innerHTML_setter)

    OM_set(class_DOMElement, 'innerHTML', om_innerHTML_descriptor)


    om_value_descriptor = om_getset_descriptor('value', class_DOMElement,
                                               om_DOMElement_value_getter,
                                               om_DOMElement_value_setter)

    OM_set(class_DOMElement, 'value', om_value_descriptor)


    module_more_builtins_env = make_dict()
    dict_set(module_more_builtins_env, 'struct', class_struct)
    dict_set(module_more_builtins_env, 'writeFile', om_writeFile)
    dict_set(module_more_builtins_env, 'readFile', om_readFile)
    dict_set(module_more_builtins_env, 'document', om_document)

    return om_module('more_builtins', module_more_builtins_env)

# Interpreter
@nocompile
def interp_file(path, options):
    source = read_file(path)
    interp(parse(source, path, 'exec', False), options)

@nocompile
def read_file(path):
    with open(path, 'r') as f:
        content = f.read()
    return content

# used by pyinterp CLI
def default_compilation_error(start_line0,
                         start_column0,
                         end_line0,
                         end_column0, error_kind, msg):
    raise SyntaxError(msg + " at line " + str(end_line0))

def interp_source(src, options=None):
    if options is None:
        options = {}
    interp(parse(src, '<unknown>', 'exec', False), options)

def parse(source, filename, mode, context):
    return AST.parse(source, filename, mode, context)

def interp(ast, options):
    # TODO: move outside of this function
    safe_for_space = dict_get(options, 'safe_for_space', True)

    external_context = make_dict()
    dict_set(external_context, 'safe_for_space', safe_for_space)

    code = comp(ast, external_context)
    trampoline(prepare_execution(code, fresh_rte(options)))

def comp(ast, external_context):
    cte = CTE(None, None, make_dict(), [], None, None, external_context, None)

    if hasattr(ast, 'container'):
        container = ast.container
        filename = container.tostr if container.tostr is not False else None
    else:
        filename = None

    cte, code = comp_mod(cte, ast)

    return code

def prepare_execution(code, rte):
    return lambda: code(rte, lambda rte: None)

def module_to_dict(module):
    module_dict = OM_get(module, '__dict__')
    return OM_get_boxed_value(module_dict)

def inject_module_in_env(module, env):
    module_env = module_to_dict(module)
    for key_value in dict_items(module_env):
        key = key_value[0]
        value = key_value[1]
        dict_set(env, key, value)

# FFI
def om_host_eval_code(rte, cont):
    expr = rte_lookup_locals(rte, 'expr')
    result = host2py(host_eval(py2host(expr)))
    if result == absent:
        return sem_raise_with_message(make_out_of_ast_context(rte, cont), class_ValueError, "Could not convert JavaScript type to Python")
    return unwind_return(rte, result)

def fresh_rte(options):
    locals_env = absent
    globals_env = make_dict()
    builtins_env = make_dict()
    builtins_module = om_module('builtins', builtins_env)

    rte = make_new_rte(globals_env, locals_env, builtins_env, builtins_module, options)

    # Vanilla Python builtins
    om_builtin_print = om_make_builtin_function_with_signature('print', om_print_code, make_vararg_only_signature('args'))
    om_builtin_breakpoint = om_make_builtin_function_with_signature('breakpoint', om_breakpoint_code, empty_signature)
    om_builtin_input = om_make_builtin_function_with_signature('input', om_input_code, make_posonly_defaults_signature(('obj',), (om_str(''),)))
    om_builtin_hex = om_make_builtin_function_with_signature('hex', om_hex_code, make_posonly_only_signature(('obj',)))
    om_builtin_oct = om_make_builtin_function_with_signature('oct', om_oct_code, make_posonly_only_signature(('obj',)))
    om_builtin_bin = om_make_builtin_function_with_signature('bin', om_bin_code, make_posonly_only_signature(('obj',)))
    om_builtin_chr = om_make_builtin_function_with_signature('chr', om_chr_code, make_posonly_only_signature(('obj',)))
    om_builtin_ord = om_make_builtin_function_with_signature('ord', om_ord_code, make_posonly_only_signature(('obj',)))
    om_builtin_repr = om_make_builtin_function_with_signature('repr', om_repr_code, make_posonly_only_signature(('obj',)))
    om_builtin_len = om_make_builtin_function_with_signature('len', om_len_code, make_posonly_only_signature(('obj',)))
    om_builtin_next = om_make_builtin_function_with_signature('next', om_next_code,
                                                              make_posonly_defaults_signature(('obj', 'default'), (absent,)))
    om_builtin_open = om_make_builtin_function_with_signature('open', om_open_code,
                                                              make_args_defaults_signature(('file', 'mode'), (om_str('r'),)))
    om_builtin_iter = om_make_builtin_function_with_signature('iter', om_iter_code,
                                                              make_posonly_defaults_signature(('obj', 'sentinel'), (absent,)))
    om_builtin_abs = om_make_builtin_function_with_signature('abs', om_abs_code, make_posonly_only_signature(('obj',)))
    om_builtin_min = om_make_builtin_function_with_signature('min', om_min_code, make_vararg_only_signature('args'))
    om_builtin_max = om_make_builtin_function_with_signature('max', om_max_code, make_vararg_only_signature('args'))
    om_builtin_round = om_make_builtin_function_with_signature('round', om_round_code, make_posonly_defaults_signature(('number', 'ndigits'), (absent,)))
    om_builtin_pow = om_make_builtin_function_with_signature('pow', om_pow_code, make_posonly_defaults_only_signature(('base', 'power', 'mod'), (absent,)))

    om_builtin_isinstance = om_make_builtin_function_with_signature('isinstance', om_isinstance_code, make_posonly_only_signature(('object', 'classinfo')))

    # FFI
    om_host_eval = om_make_builtin_function_with_signature('host_eval', om_host_eval_code, make_posonly_only_signature(('expr',)))

    dict_set(builtins_env, 'type', class_type)
    dict_set(builtins_env, 'object', class_object)
    dict_set(builtins_env, 'int', class_int)
    dict_set(builtins_env, 'float', class_float)
    dict_set(builtins_env, 'bool', class_bool)
    dict_set(builtins_env, 'str', class_str)
    dict_set(builtins_env, 'tuple', class_tuple)
    dict_set(builtins_env, 'list', class_list)
    dict_set(builtins_env, 'dict', class_dict)
    dict_set(builtins_env, 'range', class_range)
    dict_set(builtins_env, 'map', class_map)
    dict_set(builtins_env, 'filter', class_filter)
    dict_set(builtins_env, 'slice', class_slice)
    dict_set(builtins_env, 'NotImplemented', om_NotImplemented)
    dict_set(builtins_env, 'print', om_builtin_print)
    dict_set(builtins_env, 'breakpoint', om_builtin_breakpoint)
    dict_set(builtins_env, 'isinstance', om_builtin_isinstance)
    dict_set(builtins_env, 'input', om_builtin_input)
    dict_set(builtins_env, 'hex', om_builtin_hex)
    dict_set(builtins_env, 'oct', om_builtin_oct)
    dict_set(builtins_env, 'bin', om_builtin_bin)
    dict_set(builtins_env, 'chr', om_builtin_chr)
    dict_set(builtins_env, 'ord', om_builtin_ord)
    dict_set(builtins_env, 'repr', om_builtin_repr)
    dict_set(builtins_env, 'len', om_builtin_len)
    dict_set(builtins_env, 'next', om_builtin_next)
    dict_set(builtins_env, 'iter', om_builtin_iter)
    dict_set(builtins_env, 'open', om_builtin_open)
    dict_set(builtins_env, 'abs', om_builtin_abs)
    dict_set(builtins_env, 'min', om_builtin_min)
    dict_set(builtins_env, 'max', om_builtin_max)
    dict_set(builtins_env, 'round', om_builtin_round)
    dict_set(builtins_env, 'pow', om_builtin_pow)

    # FFI
    dict_set(builtins_env, 'host_eval', om_host_eval)

    dict_set(builtins_env, 'BaseException', class_BaseException)
    dict_set(builtins_env, 'Exception', class_Exception)
    dict_set(builtins_env, 'RuntimeError', class_RuntimeError)
    dict_set(builtins_env, 'NameError', class_NameError)
    dict_set(builtins_env, 'UnboundLocalError', class_UnboundLocalError)
    dict_set(builtins_env, 'SyntaxError', class_SyntaxError)
    dict_set(builtins_env, 'TypeError', class_TypeError)
    dict_set(builtins_env, 'ValueError', class_ValueError)
    dict_set(builtins_env, 'LookupError', class_LookupError)
    dict_set(builtins_env, 'IndexError', class_IndexError)
    dict_set(builtins_env, 'KeyError', class_KeyError)
    dict_set(builtins_env, 'StopIteration', class_StopIteration)
    dict_set(builtins_env, 'ArithmeticError', class_ArithmeticError)
    dict_set(builtins_env, 'ZeroDivisionError', class_ZeroDivisionError)
    dict_set(builtins_env, 'AssertionError', class_AssertionError)
    dict_set(builtins_env, 'ImportError', class_ImportError)
    dict_set(builtins_env, 'ModuleNotFoundError', class_ModuleNotFoundError)
    dict_set(builtins_env, 'OSError', class_OSError)
    dict_set(builtins_env, 'FileNotFoundError', class_FileNotFoundError)

    # Pyinterp functions
    om_builtin_alert = om_make_builtin_function_with_signature('alert', om_alert_code, make_posonly_defaults_signature(('obj',), (om_str(''),)))
    om_builtin_confirm = om_make_builtin_function_with_signature('confirm', om_confirm_code, make_posonly_defaults_signature(('obj',), (om_str(''),)))
    om_builtin_prompt = om_make_builtin_function_with_signature('prompt', om_prompt_code, make_posonly_defaults_signature(('obj',), (om_str(''),)))

    dict_set(builtins_env, 'alert', om_builtin_alert)
    dict_set(builtins_env, 'confirm', om_builtin_confirm)
    dict_set(builtins_env, 'prompt', om_builtin_prompt)


    # Preloaded modules
    math_module = make_module_math()
    turtle_module = make_module_turtle()
    random_module = make_module_random()
    time_module = make_module_time()
    io_module = make_module_io()
    functools_module = make_module_functools()
    csv_module = make_module_csv()
    mouse_module = make_module_mouse()
    pixels_module = make_module_pixels()
    more_builtins_module = make_module_more_builtins()

    # Add modules to sys module to allow imports
    rte_add_to_sys_modules(rte, 'builtins', builtins_module)
    rte_add_to_sys_modules(rte, 'math', math_module)
    rte_add_to_sys_modules(rte, 'turtle', turtle_module)
    rte_add_to_sys_modules(rte, 'random', random_module)
    rte_add_to_sys_modules(rte, 'time', time_module)
    rte_add_to_sys_modules(rte, 'io', io_module)
    rte_add_to_sys_modules(rte, 'functools', functools_module)
    rte_add_to_sys_modules(rte, 'csv', csv_module)
    rte_add_to_sys_modules(rte, 'mouse', mouse_module)
    rte_add_to_sys_modules(rte, 'pixels', pixels_module)
    rte_add_to_sys_modules(rte, 'more_builtins', more_builtins_module)

    # Inject some module into the builtins
    dict_set(builtins_env, 'math', math_module)
    dict_set(builtins_env, 'mouse', mouse_module)
    dict_set(builtins_env, 'pixels', pixels_module)
    dict_set(builtins_env, 'turtle', turtle_module)
    dict_set(builtins_env, 'time', time_module)

    inject_module_in_env(mouse_module, builtins_env)
    inject_module_in_env(pixels_module, builtins_env)
    inject_module_in_env(random_module, builtins_env)
    inject_module_in_env(turtle_module, builtins_env)
    inject_module_in_env(time_module, builtins_env)
    inject_module_in_env(more_builtins_module, builtins_env)

    dict_set(globals_env, '__name__', om_str('__main__'))
    dict_set(globals_env, '__builtins__', om_module('builtins', builtins_env))
    return rte


def make_module_rte(parent_rte, builtins_module, name):
    locals_env = absent
    globals_env = make_dict()

    rte = make_rte_from_parent(
        parent_rte,
        globals_env,
        locals_env,
        absent,
        rte_stack(parent_rte),
        rte_ctrl_env(parent_rte))

    rte_reset_continue_break(rte)
    dict_set(globals_env, '__name__', om_str(name))
    dict_set(globals_env, '__builtins__', builtins_module)

    return rte


def trampoline(cont):

    while cont:

        state = cont()

        if not state:
            break

        ast = struct_get(state, "ast")
        msg = struct_get(state, "msg")
        display_result = struct_get(state, "display_result")
        sleep_time = struct_get(state, "sleep_time")
        error = struct_get(state, "error")
        cont = struct_get(state, "cont")
        ctx = struct_get(state, "ctx")

        if error is not None:
            print(error)
        if sleep_time is not None:
            runtime_sleep(sleep_time)
        if cont and rte_trace(ctx.rte) and msg is not None:
                if len(msg) > 0:
                    msg = ' '+msg

                print('at '+str(ast.lineno)+'.'+str(ast.col_offset+1)+'-'+str(ast.end_lineno)+'.'+str(ast.end_col_offset+1)+msg)


# Compilation of a module.

def set_ast_property(ast, name, value):
    props = getattr(ast, "_pyinterp", None)

    if props is None:
        props = make_dict()
        ast._pyinterp = props

    dict_set(props, name, value)

def get_ast_property(ast, name, default_):
    props = getattr(ast, "_pyinterp", None)

    if props is None:
        props = make_dict()
        ast.__pyinterp__ = props

    return dict_get(props, name, default_)


def walk(cte, ast, fn, args):
    # Hack to check child is an instance of AST while zp does not support class hierarchy
    if hasattr(ast, '_fields'):
        res = fn(cte, ast, args)
        # If fn return True continue walk, else abort recursive walk
        if res:
            for field in ast._fields:
                child = getattr(ast, field)

                if isinstance(child, list):
                    for item in child:
                        walk(cte, item, fn, args)
                else:
                    walk(cte, child, fn, args)

def walk_with_abort(cte, ast, fn, abort_fn, args):
    # Provides an 'abort' as first argument to 'fn' which call is detected to interrupt walk and return result
    # The provided abort function can only take a single argument, multiple arguments must be passed as a tuple
    error_occured = [False]
    abort_res = [None]

    def abort(args):
        error_occured[0] = True
        abort_res[0] = abort_fn(args)

    new_args = [abort]
    for a in args:
        new_args.append(a)

    def inner_walk(cte, ast, fn, args):
        if hasattr(ast, '_fields'):
            res = fn(cte, ast, args)

            if error_occured[0]:
                return

            # If fn return True continue walk, else abort recursive walk
            if res:
                for field in ast._fields:
                    child = getattr(ast, field)

                    if isinstance(child, list):
                        for item in child:
                            walk(cte, item, fn, args)
                            if error_occured[0]:
                                return
                    else:
                        walk(cte, child, fn, args)
                        if error_occured[0]:
                            return

    inner_walk(cte, ast, fn, new_args)
    return abort_res[0] if error_occured[0] else None

def raise_walk_syntax_error(args):
    cte, ast, msg = args
    return CT_raise_syntax_error_with_msg(cte, ast, msg)


def apply_source_to_source_transformations(cte, ast):
    # Source-to-source transformations are expected to mutate the module
    s2s_format_lambda_body(cte, ast)

def s2s_format_lambda_body(cte, ast):
    # AST.lambda body attribute is a single expression 'expr',
    # although it behaves exactly as a function with body [Return(expr)]
    # instead of making a special case out of AST.Lambda, we format its body so all traversal algorithm treating
    # FunctionDef.body also apply to Lambda.body

    def make_Return_pseudo_node(expr):
        ret = Return(expr)
        ret.lineno = expr.lineno
        ret.col_offset = expr.col_offset
        ret.end_lineno = expr.end_lineno
        ret.end_col_offset = expr.end_col_offset

        # Special case which only happens in py.js
        if hasattr(expr, 'container'):
            ret.container = expr.container

        return ret

    def update_With_nested_node(stmt):
        items = stmt.items

        if len(items) > 1:
            body = stmt.body
            type_comment = stmt.type_comment
            nested_with = With(items[1:], body, type_comment)

            nested_with.lineno = stmt.lineno
            nested_with.col_offset = stmt.col_offset
            nested_with.end_lineno = stmt.end_lineno
            nested_with.end_col_offset = stmt.end_col_offset

            # Special case which only happens in py.js
            if hasattr(stmt, 'container'):
                nested_with.container = stmt.container

            stmt.body = [nested_with]
            stmt.items = [items[0]]


    def walk_fn(cte, ast, _):
        if isinstance(ast, AST.Lambda):
            expression_body = ast.body
            ast.body = [make_Return_pseudo_node(expression_body)]
            return True
        elif isinstance(ast, AST.With):
            # Transform all With to simple With
            # A simple with is a With statement with a single with item
            # ex: 'with x as a' is simple and 'with x as a, y as b' is not
            # All With statement are converted into nested With as they are semantically
            # equivalent. It is also easier to implement this way since each withitem
            # needs its own finally block in case another item fails when entered
            update_With_nested_node(ast)
            return True
        else:
            return True

    return walk(cte, ast, walk_fn, ())


# Flags for
LOCAL_VAR = ["LOCAL_VAR"]
CLOSURE_VAR = ["CLOSURE_VAR"]
CLASS_CLOSURE_VAR = ["CLASS_CLOSURE_VAR"]
GLOBAL_VAR = ["GLOBAL_VAR"]

def make_local_var_token(cte, name, current_fn, in_function):
    # Second element indicates if the variable needs to be boxed for a closure
    n_vars = get_ast_property(current_fn, 'n_vars', None)
    set_ast_property(current_fn, 'n_vars', n_vars + 1)

    locals_env = get_ast_property(current_fn, 'locals_env', None)

    # Local variable function may be automatically boxed in non-safe-for-space mode
    # It is important class namespace variables are not because a class namespace is more dynamic, similar to the
    # global scope
    boxed = in_function and not get_cte_safe_for_space(cte)

    # If safe_for_space is False, then box all variables by default
    tk = [LOCAL_VAR, boxed, n_vars]

    dict_set(locals_env, name, tk)
    return tk

def get_local_var_is_boxed(token):
    return token[1]

def get_local_var_index(token):
    return token[2]

def mark_local_var_token_as_boxed(token):
    token[1] = True

def is_local_var(token):
    return token[0] is LOCAL_VAR


def make_closure_var_token(id_, stack, current_namespace):
    # This function both mutates the ast to add a free variable and return the created token or None
    # Exception: a nonlocal variable can be bound to a global variable when there is a 'global' statement for the var
    last = len(stack) - 1

    # Special case for classes closures
    # Since class execution is linear, there is no need for a closure, but we need to mark variables as coming from
    # the lexical parent local environment
    if isinstance(current_namespace, AST.ClassDef):
        k = 0
        while k <= last:
            fn = stack[last - k]

            # Find the first element on stack which is a function
            # (FunctionDef, since a class cannot be defined in a Lambda)
            if isinstance(fn, AST.ClassDef):
                k += 1
            else:
                fn_locals_env = get_ast_property(fn, "locals_env", None)  # Should never be None
                var_token = dict_get(fn_locals_env, id_, None)

                # If the current variable name is a plain local variable in the function scope, then the class
                # namespace will only require to look at the lexical-closest function local environment
                if var_token is not None and is_local_var(var_token):
                    locals_env = get_ast_property(current_namespace, 'locals_env', None)
                    current_fn_tk = [CLASS_CLOSURE_VAR]
                    dict_set(locals_env, id_, current_fn_tk)

                    return current_fn_tk
                else:
                    # Otherwise the variable actually comes from the function closure or is global
                    # If that is the case the usual algorithm applies
                    break

    i = 0
    while i <= last:
        fn = stack[last - i]

        # Stack contains both functions and classes but classes do not have a closure
        # the runtime will in fact not create a stack frame at all
        if isinstance(fn, AST.ClassDef):
            i += 1
        else:
            fn_locals_env = get_ast_property(fn, "locals_env", None) # Should never be None
            var_token = dict_get(fn_locals_env, id_, None)

            if var_token is not None:
                if is_local_var(var_token):
                    mark_local_var_token_as_boxed(var_token)
                elif is_closure_var(var_token):
                    pass
                else: # global variable case
                    tk = make_global_var_token()
                    dict_set(fn_locals_env, id_, tk)
                    return tk

                j = 0
                while j < i:
                    fn = stack[last - j]
                    fn_locals_env = get_ast_property(fn, "locals_env", None)  # Should never be None

                    fn_n_freevars = get_ast_property(fn, 'n_freevars', None)  # Should never be None
                    set_ast_property(fn, 'n_freevars', fn_n_freevars + 1)

                    tk = [CLOSURE_VAR, fn_n_freevars]
                    dict_set(fn_locals_env, id_, tk)

                    j += 1

                n_freevars = get_ast_property(current_namespace, 'n_freevars', None)  # Should never be None
                set_ast_property(current_namespace, 'n_freevars', n_freevars + 1)
                locals_env = get_ast_property(current_namespace, 'locals_env', None)
                current_fn_tk = [CLOSURE_VAR, n_freevars]
                dict_set(locals_env, id_, current_fn_tk)

                return current_fn_tk

            else:
                i += 1
    return None

def is_closure_var(token):
    return token[0] is CLOSURE_VAR

def get_closure_var_index(token):
    return token[1]

def is_class_closure_var(token):
    return token[0] is CLASS_CLOSURE_VAR

def get_class_closure_var_index(token):
    return token[1]

def make_global_var_token():
    return [GLOBAL_VAR]

def is_global_var(token):
    return token[0] is GLOBAL_VAR

def init_compute_variables_scope(cte, ast):
    # Init computing variables scopes on function definitions, ignore variables since they are all global at top-level

    def walk_fn(cte, ast, args):
        is_function = isinstance(ast, AST.FunctionDef) or isinstance(ast, AST.Lambda)

        if is_function or isinstance(ast, AST.ClassDef):
            locals_env = make_dict()
            locals_ref = make_dict()
            stack = []

            res = compute_variables_scope(cte, ast, locals_env, locals_ref, stack, is_function)

            syntax_error = args[0]

            if res is not None:
                return syntax_error(res)
            else:
                return False
        else:
            return True

    return walk_with_abort(cte, ast, walk_fn, raise_walk_syntax_error, ())

def init_locals_env_from_args(cte, locals_env, current_fn):
    # Populate a function local cte with its arguments
    args = current_fn.args
    args_group = [args.args, args.posonlyargs, args.kwonlyargs]
    for group in args_group:
        for arg in group:
            name = arg.arg
            make_local_var_token(cte, name, current_fn, True)

    vararg = args.vararg
    kwarg = args.kwarg

    if vararg:
        make_local_var_token(cte, vararg.arg, current_fn, True)

    if kwarg:
        make_local_var_token(cte, kwarg.arg, current_fn, True)

    return locals_env

def compute_variables_scope(cte, ast, locals_env, locals_ref, stack, is_function):
    # Intermediate function which computes a function variables' scope, then recursively computes it for nested functions

    # init function variables counters and env
    set_ast_property(ast, 'n_freevars', 0)
    set_ast_property(ast, 'n_vars', 0)
    set_ast_property(ast, 'locals_env', locals_env)

    namespace_defs = []
    args = (locals_env, locals_ref, stack, namespace_defs, ast, is_function)

    if is_function:
        init_locals_env_from_args(cte, locals_env, ast)

    for stmt in ast.body:

        res = walk_with_abort(cte, stmt, compute_namespace_variables_scope, raise_walk_syntax_error, args)

        # A syntax error was detected
        if res is not None:
            return res

    # Now that all assignations have been treated, we can determine the scope of variables' references

    for name in dict_keys(locals_ref):
        # If the variable is already in the env, we were able to determine its scope
        if not dict_has(locals_env, name):
            # else it is either from a closure or global
            closure_token = make_closure_var_token(name, stack, ast)

            if closure_token is None:
                # The variable can only be global since it is not local, nor in a closure
                dict_set(locals_env, name, make_global_var_token())
            # Else the closure token was already assigned

    # recursively visit nested functions which were collected in 'function_defs'
    for nested_namespace in namespace_defs:
        nested_locals_env = make_dict()
        nested_locals_ref = make_dict()
        nested_stack = stack + [ast]

        is_nested_function = isinstance(nested_namespace, AST.FunctionDef) or isinstance(nested_namespace, AST.Lambda)

        res = compute_variables_scope(cte, nested_namespace, nested_locals_env, nested_locals_ref, nested_stack, is_nested_function)

        if res is not None:
            return res

    return None

def compute_namespace_variables_scope(cte, ast, args):
    syntax_error, locals_env, locals_ref, stack, namespace_defs, current_ns, is_function = args
    if isinstance(ast, AST.FunctionDef):
        # FunctionDef are treated recursively after the current scope has been analysed
        namespace_defs.append(ast)

        id_ = ast.name

        if not dict_has(locals_env, id_):
            make_local_var_token(cte, id_, current_ns, is_function)

        return False

    elif isinstance(ast, AST.Lambda):
        namespace_defs.append(ast)
        return False

    elif isinstance(ast, AST.ClassDef):
        namespace_defs.append(ast)

        name = ast.name
        if not dict_has(locals_env, name):
            make_local_var_token(cte, name, current_ns, is_function)

    elif isinstance(ast, ExceptHandler):
        name = ast.name
        if name is not None and not dict_has(locals_env, name):
            make_local_var_token(cte, name, current_ns, is_function)

        return True

    elif isinstance(ast, AST.Name):
        ctx = ast.ctx
        id_ = ast.id

        if isinstance(ctx, AST.Store):
            # If the variable is in locals_env, its scope is already known, this is a reassignment, else we mark it as local
            if not dict_has(locals_env, id_):
                make_local_var_token(cte, id_, current_ns, is_function)
        elif isinstance(ctx, AST.Load):
            # If the variable is in locals_env, its scope is already known
            # Else, we cannot determine its scope yet because there could be an assignation later
            # In both case, there is nothing to be done at that point but mark it as seen
            # See 'compute_variables_scope' for the rest of the analysis
            dict_set(locals_ref, id_, True)

        return True

    elif isinstance(ast, AST.Import):
        for alias in ast.names:
            module_name = alias.name
            asname = alias.asname

            # TODO account for packages once they exist
            id_ = module_name if asname is None else asname

            if not dict_has(locals_env, id_):
                make_local_var_token(cte, id_, current_ns, is_function)
        return True

    elif isinstance(ast, AST.Nonlocal):
        for id_ in ast.names:
            if dict_has(locals_env, id_) or dict_has(locals_ref, id_):
                return syntax_error((cte, ast, "name '" + id_ + "' is used prior to nonlocal declaration"))
            else:
                closure_token = make_closure_var_token(id_, stack, current_ns)
                if closure_token is None or is_global_var(closure_token):
                    # a 'nonlocal' statement cannot refer to a variable from a 'global' statement
                    return syntax_error((cte, ast, "no binding for nonlocal '" + id_ + "' found"))
                else:
                    dict_set(locals_env, id_, closure_token)
        return True

    elif isinstance(ast, AST.Global):
        for id_ in ast.names:
            if dict_has(locals_env, id_) or dict_has(locals_ref, id_):
                return syntax_error((cte, ast, "name '" + id_ + "' is used prior to global declaration"))
            else:
                dict_set(locals_env, id_, make_global_var_token())
        return True

    else:
        return True


def get_scope_variables(rte):
    def filter_scope(env):
        # Remove private names such as __name__ from displayed environment
        filtered_env = make_dict()
        for name in dict_keys(env):
            if len(name) < 2 or name[:2] != '__':
                dict_set(filtered_env, name, dict_get(env, name, None))
        return filtered_env

    current_func = rte_current_func(rte)
    safe_for_space = rte_safe_for_space(rte)

    if not safe_for_space:
        globals_ = rte_lexical_globals(rte)

        # In non-safe-for-space mode, each function has access to its whole lexical scope, we return it
        if current_func is absent:
            env = filter_scope(globals_)
            locals_ = rte_locals(rte)

            if locals_ is not absent:
                # case where a class is defined at top-level
                for name in dict_keys(locals_):
                    val = dict_get(locals_, name, None)  # Class attributes are not boxed (dynamic namespace)
                    if val is not absent:
                        dict_set(env, name, val)
        else:
            var_context = OM_get_function_var_context(current_func)
            filtered_globals = filter_scope(globals_)
            lexical_scope = OM_get_function_lexical_scope(current_func)
            class_parent_namespace = rte_class_parent_locals(rte)
            locals_ = rte_locals(rte)
            env = make_dict()

            # Add non-shadowed global variables
            for name in dict_keys(filtered_globals):
                var_from_context = dict_get(var_context, name, None)
                is_global = var_from_context is not None and is_global_var(var_from_context)
                if not dict_has(lexical_scope, name) and not dict_has(locals_, name) or is_global:
                    val = dict_get(filtered_globals, name, None)
                    dict_set(env, name, val)

            # Add non-shadowed bound variables from the lexical scope which are not skipped by a 'global' statement
            for name in dict_keys(lexical_scope):
                var_from_context = dict_get(var_context, name, None)
                is_global = var_from_context is not None and is_global_var(var_from_context)
                if not dict_has(locals_, name) and not is_global:
                    val = dict_get(lexical_scope, name, None)[0] # All variables are boxed in non-safe-for-space mode
                    if val is not absent:
                        dict_set(env, name, val)

            if class_parent_namespace is not absent:
                # Add bound local variables to the environment
                for name in dict_keys(class_parent_namespace):
                    val = dict_get(class_parent_namespace, name, None)[0]  # All variables are boxed in non-safe-for-space mode
                    if val is not absent:
                        dict_set(env, name, val)

                # Add class namespace to the environment
                for name in dict_keys(locals_):
                    val = dict_get(locals_, name, None)  # Class attributes are not boxed (dynamic namespace)
                    if val is not absent:
                        dict_set(env, name, val)
            else:
                # Add bound local variables to the environment
                for name in dict_keys(locals_):
                    val = dict_get(locals_, name, None)[0]  # All variables are boxed in non-safe-for-space mode
                    if val is not absent:
                        dict_set(env, name, val)

    elif current_func is absent:
        # At top-level
        env = filter_scope(rte_globals(rte))
        locals_ = rte_locals(rte)

        if locals_ is not absent:
            # case where a class is defined at top-level
            for name in dict_keys(locals_):
                val = dict_get(locals_, name, None)
                if val is not absent:
                    dict_set(env, name, val)
    else:
        global_vars = filter_scope(rte_lexical_globals(rte))
        closure = OM_get_function_closure(current_func)
        class_parent_namespace = rte_class_parent_locals(rte)
        local_vars = rte_locals(rte)

        global_env_part = make_dict()
        closure_env_part = make_dict()
        function_env_part = make_dict()

        in_class = class_parent_namespace is not absent

        var_context = OM_get_function_var_context(current_func)

        function_locals = class_parent_namespace if in_class else local_vars

        for key in dict_keys(var_context):
            var_val = dict_get(var_context, key, None)
            if is_local_var(var_val):
                boxed = get_local_var_is_boxed(var_val)
                if boxed:
                    val = dict_get(function_locals, key, None)[0]
                else:
                    val = dict_get(function_locals, key, None)
                if val is not absent:
                    dict_set(function_env_part, key, val)
            elif is_closure_var(var_val):
                index = get_closure_var_index(var_val)
                val = closure[index][0]
                if val is not absent:
                    dict_set(closure_env_part, key, val)
            else: # case global
                val = dict_get(global_vars, key, absent)

                # NOTE: value may be absent because key is a builtin name
                if val is not absent:
                    dict_set(global_env_part, key, val)

        env = make_dict()

        if in_class:
            for pair in dict_items(local_vars):
                key = pair[0]
                val = pair[1]
                dict_set(env, key, val)

        for pair in dict_items(function_env_part):
            key = pair[0]
            val = pair[1]
            if not dict_has(env, key):
                dict_set(env, key, val)

        for pair in dict_items(closure_env_part):
            key = pair[0]
            val = pair[1]
            if not dict_has(env, key):
                dict_set(env, key, val)

        for pair in dict_items(global_env_part):
            key = pair[0]
            val = pair[1]
            if not dict_has(env, key):
                dict_set(env, key, val)

    # Reverse the order so latest assignments come first
    # This will only work on Python and JS version which make_dict() is order preserving
    return list_reversed(dict_items(env))

def get_scope_variables_repr(rte):
    env = get_scope_variables(rte)
    env_repr = []

    for pair in env:
        key, val = pair
        val_repr = om_simple_repr(Context(rte, None, None), val)
        env_repr.append((key, val_repr))

    return env_repr

def run_walk_methods(cte, ast):
    apply_source_to_source_transformations(cte, ast)
    init_compute_variables_scope(cte, ast)

def comp_mod(cte, ast):

    if isinstance(ast, AST.Module):
        # Module(stmt* body, type_ignore *type_ignores)
        if debug: print('AST.Module')

        run_walk_methods(cte, ast)

        return comp_stmt_seq(cte, ast.body)

    elif isinstance(ast, AST.Interactive):
        # Interactive(stmt* body)
        if debug: print('AST.Interactive')

        run_walk_methods(cte, ast)

        return comp_stmt_seq(cte, ast.body)

    elif isinstance(ast, AST.Expression):
        # Expression(expr body)
        if debug: print('AST.Interactive')
        return CT_raise_syntax_error_with_msg(cte, ast, "AST.Expression not supported")

    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "unknown ast type")
        #assert False, 'comp_mod expected a AST.Module or AST.Interactive'

def comp_stmt_seq(cte, stmt_seq):
    if debug: print('comp_stmt_seq')
    if len(stmt_seq) == 0:
        return gen_stmt_empty(cte)
    else:
        (cte1, code1) = comp_stmt(cte, stmt_seq[0])
        if len(stmt_seq) == 1:
            return (cte1, code1)
        else:
            (cte2, code2) = comp_stmt_seq(cte1, stmt_seq[1:])
            return gen_stmt_seq(cte2, code1, code2)

# Compilation of a statement.

def comp_stmt(cte, ast):

    if isinstance(ast, AST.Expr):
        # Expr(expr value)
        if debug: print('AST.Expr')
        (cte1, code1) = comp_expr(cte, ast.value)
        return gen_Expr(cte1, ast, code1)

    elif isinstance(ast, AST.Pass):
        # Pass
        if debug: print('AST.Pass')
        return gen_Pass(cte, ast)

    elif isinstance(ast, AST.Nonlocal) or isinstance(ast, AST.Global):
        return gen_stmt_empty(cte)

    elif isinstance(ast, AST.Return):
        # Return
        if debug: print('AST.Return')

        # return point indicate that we are in a function
        # NOTE: inpired from codeboot JS
        depth_ast = CTCtrl_labelLookup(cte, "return point")
        if depth_ast is None:
            return CT_raise_syntax_error_with_msg(cte, ast, "'return' outside of function")
        elif ast.value is None:
            return cte, lambda rte, cont: frame_cont(rte_stack(rte))(frame_rte(rte_stack(rte)), om_None)
        else:
            (cte1, code1) = comp_expr(cte, ast.value)
            return cte, lambda rte, cont: code1(rte, lambda rte1, val1: unwind_return(rte1, val1))

    elif isinstance(ast, AST.Break):
        if debug: print('AST.Break')

        depth_ast = CTCtrl_labelLookup(cte, "break point")
        if depth_ast is None:
            return CT_raise_syntax_error_with_msg(cte, ast, "'break' outside loop")
        else:
            return gen_break(cte, ast)

    elif isinstance(ast, AST.Continue):
        if debug: print('AST.Continue')

        depth_ast = CTCtrl_labelLookup(cte, "break point")
        if depth_ast is None:
            return CT_raise_syntax_error_with_msg(cte, ast, "'continue' not properly in loop")
        else:
            return gen_continue(cte, ast)

    elif isinstance(ast, AST.Assign):
        # Assign(expr* targets, expr value, string? type_comment)
        return comp_Assign(cte, ast)

    elif isinstance(ast, AST.AugAssign):
        if debug: print("AST.AugAssign")
        return gen_aug_assign(cte, ast)


    elif isinstance(ast, AST.While):
        # While(expr test, stmt* body, stmt* orelse)
        if debug: print('AST.While')

        while_cte = CTCtrl_controlContext(cte, ast)

        # drop while cte
        return cte, gen_while(while_cte, ast)[1]

    elif isinstance(ast, AST.If):
        # If(expr test, stmt* body, stmt* orelse)
        if debug: print('AST.If')
        (cte1, code1) = comp_expr(cte, ast.test)
        (cte2, code2) = comp_stmt_seq(cte1, ast.body)
        (cte3, code3) = comp_stmt_seq(cte1, ast.orelse)
        return gen_if(cte3, ast, code1, code2, code3)

    elif isinstance(ast, AST.Assert):
        # Assert(expr test, expr? msg)
        if debug: print('AST.Assert')
        return gen_assert(cte, ast)

    elif isinstance(ast, AST.FunctionDef):
        if debug: print('AST.FunctionDef')
        return gen_FunctionDef(cte, ast)

    elif isinstance(ast, AST.ClassDef):
        return gen_ClassDef(cte, ast)

    elif isinstance(ast, AST.Delete):
        if debug: print('AST.Delete')
        return gen_delete_seq(cte, ast, ast.targets)

    elif isinstance(ast, AST.For) and isinstance(ast.target, AST.Name):
        if debug: print('AST.For')
        for_cte = CTCtrl_controlContext(cte, ast)

        # drop for_cte
        return cte, gen_for(for_cte, ast)[1]

    elif isinstance(ast, AST.Raise):
        exc = ast.exc

        if exc is None:
            return gen_raise(cte, ast, None)
        else:
            cte1, code1 = comp_expr(cte, ast.exc)
            return gen_raise(cte1, ast, code1)

    elif isinstance(ast, AST.Import):
        return comp_import(cte, ast, ast.names)

    elif isinstance(ast, AST.Try):
        return gen_try(cte, ast)

    elif isinstance(ast, AST.With):
        return gen_with(cte, ast)

    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "unsupported statements")


# Compilation of an expression.

def comp_expr(cte, ast):

    if isinstance(ast, AST.BinOp):
        # BinOp(expr left, operator op, expr right)
        if debug: print('AST.BinOp')
        (cte1, code1) = comp_expr(cte, ast.left)
        (cte2, code2) = comp_expr(cte, ast.right)
        return gen_BinOp(cte2, ast, ast.op, code1, code2)

    elif isinstance(ast, AST.UnaryOp):
        # UnaryOp(unaryop op, expr operand)
        if debug: print('AST.UnaryOp')
        (cte1, code1) = comp_expr(cte, ast.operand)
        return gen_UnaryOp(cte1, ast, ast.op, code1)

    elif isinstance(ast, AST.Name):
        # Name(identifier id, expr_context ctx)
        if debug: print('AST.Name')
        return gen_var_get(cte, ast, ast.id)

    elif isinstance(ast, AST.Constant):
        if debug: print('AST.Constant')
        return gen_constant(cte, ast, ast.value)

    elif isinstance(ast, AST.BoolOp):
        if debug: print('AST.BoolOp')
        return gen_BoolOp(cte, ast, ast.op, ast.values)

    elif isinstance(ast, AST.Compare):
        if debug: print('AST.Compare')
        result = gen_Compare(cte, ast, ast.left, ast.comparators, ast.ops)
        return result

    elif isinstance(ast, AST.Attribute):
        # {ast.value.id}.{ast.attr}
        (cte1, code1) = comp_expr(cte, ast.value)
        return gen_Attribute(cte1, ast, code1, ast.attr)
    elif isinstance(ast, AST.Lambda):
        return gen_Lambda(cte, ast)

    elif isinstance(ast, AST.Call):
        if debug: print('AST.Call')
        return gen_call(cte, ast)
    elif isinstance(ast, AST.IfExp):
        (cte1, test_code) = comp_expr(cte, ast.test)
        (cte2, body_code) = comp_expr(cte1, ast.body)
        (cte3, orelse_code) = comp_expr(cte2, ast.orelse)
        return gen_ifexpr(cte3, ast, test_code, body_code, orelse_code)

    elif isinstance(ast, AST.Tuple):
        if debug: print('AST.Tuple')
        (cte, code_elts) = comp_elements(cte, ast.elts)
        return gen_Tuple(cte, ast, code_elts)
    elif isinstance(ast, AST.List):
        if debug: print('AST.List')
        (cte, code_elts) = comp_elements(cte, ast.elts)
        return gen_List(cte, ast, code_elts)
    elif isinstance(ast, AST.Subscript) and isinstance(ast.ctx, AST.Load):
        if debug: print("AST.Subscript Load")
        obj_cte, obj_code = comp_expr_opt(cte, ast.value)

        index_ast = ast.slice

        if isinstance(index_ast, AST.Index):
            index_cte, index_code = comp_expr(obj_cte, index_ast.value)
            return gen_Subscript_Load(index_cte, ast, obj_code, index_code)
        elif isinstance(index_ast, AST.Slice):
            slice_cte, slice_code = gen_Slice(obj_cte, index_ast)
            return gen_Subscript_Load(slice_cte, ast, obj_code, slice_code)
        else:
            return CT_raise_syntax_error_with_msg(cte, ast, "extended slice not yet supported")
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "unsupported expression AST")

def comp_elements(cte, args):
    elements_code = []
    next_cte = cte
    for arg in args:
        if isinstance(arg, AST.Starred):
            if isinstance(arg.ctx, AST.Load):
                next_cte, args_code = comp_expr(next_cte, arg.value)

                def create_code(args_code):
                    def accumulate_many_args(rte, cont, acc):
                        def unpack_elements(unpack_rte, iterable):
                            def do_accumulate(acc_rte, values):
                                for val in values:
                                    acc.append(val)
                                return cont(acc_rte, acc)
                            return om_unpack_iterable(Context(unpack_rte, do_accumulate, arg), iterable)
                        return args_code(rte, unpack_elements)
                    return accumulate_many_args

                elements_code.append(create_code(args_code))
            else:
                return CT_raise_syntax_error_with_msg(cte, arg, "internal error, cannot load Starred(..., Store())")
        else:
            next_cte, arg_code = comp_expr(next_cte, arg)

            def create_code(arg_code):
                def accumulate_single_arg(rte, cont, acc):
                    def do_accumulate(acc_rte, val):
                        acc.append(val)
                        return cont(acc_rte, acc)
                    return arg_code(rte, do_accumulate)
                return accumulate_single_arg

            elements_code.append(create_code(arg_code))

    return gen_elements_seq(next_cte, elements_code)

def comp_keyword_elements(cte, keywords):
    elements_code = []
    next_cte = cte
    for keyword_arg in keywords:
        arg_name = keyword_arg.arg
        if arg_name is None:
            # This is a **kwargs
            next_cte, keyword_args_code = comp_expr(next_cte, keyword_arg.value)

            def create_code(keyword_args_code):
                def accumulate_many_args(rte, cont, mapping_acc):
                    def unpack_elements(unpack_rte, mapping):
                        def do_accumulate(acc_rte, mapping_values):
                            for pair in dict_items(mapping_values):
                                name = pair[0]
                                value = pair[1]
                                dict_set(mapping_acc, name, value)
                            return cont(acc_rte, mapping_acc)
                        return om_unpack_mapping(Context(unpack_rte, do_accumulate, keyword_arg), mapping)
                    return keyword_args_code(rte, unpack_elements)
                return accumulate_many_args

            elements_code.append(create_code(keyword_args_code))
        else:
            next_cte, keyword_arg_code = comp_expr(next_cte, keyword_arg.value)

            def create_code(keyword_arg_code, arg_name):
                def accumulate_single_arg(rte, cont, mapping_acc):
                    def do_accumulate(acc_rte, val):
                        dict_set(mapping_acc, arg_name, val)
                        return cont(acc_rte, mapping_acc)
                    return keyword_arg_code(rte, do_accumulate)
                return accumulate_single_arg

            elements_code.append(create_code(keyword_arg_code, arg_name))

    return gen_keyword_elements_seq(next_cte, elements_code)


def comp_Assign(cte, ast):
    targets = ast.targets
    value = ast.value
    if len(targets) == 1:
        target = targets[0]
        if isinstance(target, AST.Name):
            id = ast.targets[0].id
            expr_cte, expr_code = comp_expr(cte, value)
            set_cte, set_code = gen_var_set(expr_cte, ast, id)

            def code(rte, cont):
                def do_set(set_rte, val):
                    return set_code(set_rte, cont, val)
                return expr_code(rte, do_set)

            return set_cte, code

        elif isinstance(target, AST.Subscript):
            return gen_Subscript_Store(cte, ast, target, value)
        elif isinstance(target, AST.Tuple):
            return gen_multiple_Assign(cte, ast, target.elts, value)
        elif isinstance(target, AST.Attribute):
            return gen_Attribute_Store(cte, ast, target, value)
        else:
            return CT_raise_syntax_error_with_msg(cte, ast, 'Unsupported assignment')
    else:
        # NOTE: Happens when there are mutiple =, exemple: x = y = 1
        return CT_raise_syntax_error_with_msg(cte, ast, 'chained assignment is not supported')

def gen_elements_seq(cte, elements_code):
    elements_len = len(elements_code)

    def do_elements_cont(cont):
        i = elements_len - 1
        while i >= 0:
            current_element_code = elements_code[i]

            # Required to create a closure for next_cont and current_element_code
            def create_code(next_cont, current_element_code):
                def code(rte, acc):
                    return current_element_code(rte, next_cont, acc)
                return code

            cont = create_code(cont, current_element_code)
            i = i - 1
        return cont

    def alloc_list(rte, cont):
        acc = []
        elements_cont = do_elements_cont(cont)
        return elements_cont(rte, acc)

    return (cte, alloc_list)

def gen_keyword_elements_seq(cte, elements_code):
    elements_len = len(elements_code)

    def do_elements_cont(cont):
        i = elements_len - 1
        while i >= 0:
            current_element_code = elements_code[i]

            # Required to create a closure for next_cont and current_element_code
            def create_code(next_cont, current_element_code):
                def code(rte, mapping_acc):
                    return current_element_code(rte, next_cont, mapping_acc)
                return code

            cont = create_code(cont, current_element_code)
            i = i - 1
        return cont

    def alloc_dict(rte, cont):
        mapping_acc = make_dict()
        elements_cont = do_elements_cont(cont)
        return elements_cont(rte, mapping_acc)

    return cte, alloc_dict

def comp_expr_opt(cte, ast):
    if ast is None:
        return (cte, None)
    else:
        return comp_expr(cte, ast)


def gen_signature(cte, ast_args):
    # make_signature(args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwargs, defaults)

    seen = make_dict()

    def raise_if_duplicate(name, ast):
        if dict_get(seen, name, False):
            msg = "duplicate argument '" + name + "' in function definition"
            return CT_raise_syntax_error_with_msg(cte, ast, msg)
        else:
            dict_set(seen, name, True)

    args = []
    for arg in ast_args.args:
        arg_name = arg.arg
        raise_if_duplicate(arg_name, arg)
        args.append(arg_name)

    posonlyargs = []
    for posonly in ast_args.posonlyargs:
        arg_name = posonly.arg
        raise_if_duplicate(arg_name, posonly)
        posonlyargs.append(posonly.arg)

    vararg_ast = ast_args.vararg
    if vararg_ast is not None:
        arg_name = vararg_ast.arg
        raise_if_duplicate(arg_name, vararg_ast)
        vararg = vararg_ast.arg
    else:
        vararg = None

    kwarg_ast = ast_args.kwarg
    if kwarg_ast is not None:
        arg_name = kwarg_ast.arg
        raise_if_duplicate(arg_name, vararg_ast)
        kwarg = kwarg_ast.arg
    else:
        kwarg = None

    kwonlyargs = []
    for kwonly in ast_args.kwonlyargs:
        kwonlyargs.append(kwonly.arg)

    defaults_codes = []

    for d in ast_args.defaults:
        cte, default_code = comp_expr(cte, d)
        defaults_codes.append(default_code)

    kw_defaults_codes = []

    for d in ast_args.kw_defaults:
        if d is None:
            kw_default_code = lambda rte, cont: cont(rte, None)
        else:
            cte, kw_default_code = comp_expr(cte, d)
        kw_defaults_codes.append(kw_default_code)

    def signature_code(rte, cont):
        def get_defaults(defaults_rte, defaults):
            def get_kw_defaults(kw_defaults_rte, kw_defaults):
                return cont(defaults_rte,
                            make_signature(args, posonlyargs, vararg, kwonlyargs,
                                           kw_defaults, kwarg, defaults))
            return cps_map(Context(rte, get_kw_defaults, ast_args),
                       lambda ctx, def_code: def_code(ctx.rte, ctx.cont),
                       kw_defaults_codes)
        return cps_map(Context(rte, get_defaults, ast_args),
                       lambda ctx, def_code: def_code(ctx.rte, ctx.cont),
                       defaults_codes)
    return cte, signature_code

# Code generation functions.

# Note that 'code' is represented as a function closure and 'running'
# code consists of calling the function with the runtime environment (rte)
# and continuation (cont) that continues the execution.  The continuation
# receives the new rte and, if the code is for an expression, the result
# of the expression evaluation.

def do_stmt_end(cont, ast, nb_steps):
    return lambda rte: stmt_end(Context(rte, cont, ast), nb_steps)

def do_stmt_end_with_message(cont, ast):
    return lambda rte, msg: stmt_end_with_message(Context(rte, cont, ast), msg)

def do_expr_end(cont, ast):
    return lambda rte, val: expr_end(Context(rte, cont, ast), val)

def do_expr_end_with_step(cont, ast, nb_steps):
    return lambda rte, val: expr_end_with_step(Context(rte, cont, ast), val, nb_steps)

def do_expr_end_with_displayed_value(cont, ast, value):
    def reinject_val(val):
        return lambda rte, _: cont(rte, val)

    return lambda rte, val: expr_end(Context(rte, reinject_val(val), ast), value)

def gen_stmt_seq(cte, code1, code2):

    def code(rte, cont):
        return code1(rte, lambda rte1: code2(rte1, cont))

    return (cte, code)

def gen_stmt_empty(cte):

    def code(rte, cont):
        return cont(rte)

    return (cte, code)

def gen_Pass(cte, ast):

    def code(rte, cont):
        get_scope_variables_repr(rte)
        return stmt_end(Context(rte, cont, ast), 1)

    return (cte, code)


def gen_while(cte, ast):
    ast_test = ast.test
    ast_body = ast.body
    ast_orelse = ast.orelse

    test_cte, test_code = comp_expr(cte, ast_test)
    body_cte, body_code = comp_stmt_seq(test_cte, ast_body)
    orelse_cte, orelse_code = comp_stmt_seq(body_cte, ast_orelse)

    def code(rte, cont):
        stmt_end_cont = do_stmt_end(cont, ast, 0)

        def loop():
            def get_test_value(_, val):
                def branch(_, cond):
                    if om_is(cond, om_False):
                        return orelse_code(rte, stmt_end_cont)
                    else:
                        return body_code(loop_rte, lambda _: loop())

                return sem_bool(Context(rte, branch, ast_test), val)
            return test_code(rte, get_test_value)

        loop_rte = make_loop_rte(rte, lambda: stmt_end_cont(rte), loop)

        return loop()

    return orelse_cte, code


def gen_if(cte, ast, code1, code2, code3):

    def code(rte, cont):

        def dispatch(rte, val):
            stmt_end_cont = do_stmt_end(cont, ast, 0)
            if om_is(val, om_False):
                return code3(rte, stmt_end_cont)
            else:
                return code2(rte, stmt_end_cont)

        def cast_bool(rte, val):
            ctx = Context(rte, dispatch, ast)
            return sem_bool(ctx, val)

        return code1(rte, cast_bool)

    return (cte, code)



def gen_assert(cte, ast):
    test = ast.test
    msg = ast.msg

    test_cte, test_code = comp_expr(cte, test)
    msg_cte, msg_code = comp_expr_opt(test_cte, msg)

    if msg_code is None:
        def _throw(rte, cont):
            def do_throw(_):
                return sem_raise(Context(rte, cont, ast), class_AssertionError)

            stmt_end_cont = do_stmt_end_with_message(do_throw, ast)
            stmt_end_with_message_cont = lambda rte: stmt_end_cont(rte, "Assertion failed")
            return stmt_end_breakpoint(Context(rte, stmt_end_with_message_cont, ast))

        # NOTE: reassignment required due to a bug in zp function scoping
        throw_assert = _throw
    else:
        def _throw(rte, cont):
            def set_breakpoint(throw_rte, msg):
                def do_throw(_):
                    return sem_raise(Context(throw_rte, cont, ast), om_exception(class_AssertionError, om_tuple((msg,))))

                stmt_end_cont = do_stmt_end_with_message(do_throw, ast)
                assert_msg = "Assertion failed: " + om_simple_repr(Context(throw_rte, cont, ast), msg)
                stmt_end_with_message_cont = lambda rte: stmt_end_cont(rte, assert_msg)
                return stmt_end_breakpoint(Context(throw_rte, stmt_end_with_message_cont, ast))
            return msg_code(rte, set_breakpoint)
        # NOTE: reassignment required due to a bug in zp function scoping
        throw_assert = _throw

    def make_code(throw_assert):
        def code(rte, cont):
            def do_test(test_rte, test_val):
                def conditional_throw(assert_rte, test_bool):
                    if om_is(test_bool, om_True):
                        stmt_end = do_stmt_end(cont, ast, 0)
                        return stmt_end(assert_rte)
                    else:
                        return throw_assert(assert_rte, cont)
                return sem_bool(Context(test_rte, conditional_throw, test), test_val)
            return test_code(rte, do_test)
        return cte, code

    return make_code(throw_assert)

def gen_var_set(cte, ast, id):
    var_token = get_cte_locals_env_var(cte, id)

    if var_token is None or is_global_var(var_token):
        sem_set = sem_var_set_globals
    elif is_local_var(var_token):
        boxed = get_local_var_is_boxed(var_token)

        if boxed:
            sem_set = sem_var_set_local_boxed
        else:
            sem_set = sem_var_set_local

    elif is_class_closure_var(var_token):
        fn_cte = get_cte_function_parent(cte)
        tk = get_cte_locals_env_var(fn_cte, id)
        boxed = get_local_var_is_boxed(tk)

        if boxed:
            sem_set = sem_var_set_class_closure_boxed
        else:
            sem_set = sem_var_set_class_closure

    else: # case: closure var
        closure_table = get_cte_closure_table(cte)
        closure_pos = dict_get(closure_table, id, None)

        def code(rte, cont, val):
            msg = id + " ← " + om_simple_repr(Context(rte, None, ast), val)
            cont_stmt_end_with_message = do_stmt_end_with_message(cont, ast)
            return sem_var_set_closure(Context(rte, lambda rte: cont_stmt_end_with_message(rte, msg), ast), closure_pos, val)
        return (cte, code)

    def code(rte, cont, val):
        msg = id + " ← " + om_simple_repr(Context(rte, None, ast), val)
        cont_stmt_end_with_message = do_stmt_end_with_message(cont, ast)
        return sem_set(Context(rte, lambda rte: cont_stmt_end_with_message(rte, msg), ast), id, val)
    return (cte, code)


def gen_FunctionDef(cte, ast):
    fn_def_cte, create_function = gen_create_function(cte, ast.args, ast.body, ast.name, ast)
    set_cte, set_fn = gen_var_set(fn_def_cte, ast, ast.name)

    def code(rte, cont):
        def do_set(set_rte, fn):
            return set_fn(set_rte, cont, fn)
        return create_function(rte, do_set)

    return set_cte, code


def gen_Lambda(cte, ast):
    fn_def_cte, create_function = gen_create_function(cte, ast.args, ast.body, "<lambda>", ast)

    def code(rte, cont):
        return create_function(rte, do_expr_end(cont, ast))

    return fn_def_cte, code


def gen_namespace_freevar_getter(cte, name):
    cte_locals_env = get_cte_locals_env(cte)
    tk = dict_get(cte_locals_env, name, None)  # Cannot be None if properly called on a freevar

    if is_local_var(tk):
        def getter(rte):
            locals_ = rte_locals(rte)
            return dict_get(locals_, name, None)

        return getter

    elif is_closure_var(tk):

        index = get_closure_var_index(tk)

        def getter(rte):
            current_func = rte_current_func(rte)
            closure_cells = OM_get_function_closure(current_func)
            return closure_cells[index]

        return getter

    else:
        assert False, "Variable does not exist in cte"


def gen_create_function(cte, args, body, name, ast):
    fn_name = om_str(name)

    # Create the closure variable table
    n_freevars = get_ast_property(ast, 'n_freevars', None)
    locals_env = get_ast_property(ast, 'locals_env', None)
    freevars_getter = list_new(n_freevars, None)
    closure_table = make_dict()
    local_vars = []

    for local_name in dict_keys(locals_env):
        var_token = locals_env[local_name]
        if is_closure_var(var_token):
            index = get_closure_var_index(var_token)
            freevars_getter[index] = gen_namespace_freevar_getter(cte, local_name)
            dict_set(closure_table, local_name, index)
        elif is_local_var(var_token):
            local_vars.append((local_name, get_local_var_is_boxed(var_token)))

    def make_closure(rte):
        closure_cells = list_new(n_freevars, None)
        i = 0
        for getter in freevars_getter:
            closure_cells[i] = getter(rte)
            i += 1
        return closure_cells

    ids = make_dict()
    dict_set(ids, "return point", True)

    fn_cte = make_function_cte(name,
                               locals_env,
                               closure_table,
                               cte.lex_env,
                               CTCtrlLabel(None, ids, ast),
                               cte.external_context,
                               cte)

    (body_cte, body_code) = comp_stmt_seq(fn_cte, body)

    cte, signature_code = gen_signature(cte, args)

    safe_for_space = get_cte_safe_for_space(cte)

    if safe_for_space:
        def create_function(rte, cont):
            def get_signature(sig_rte, signature):
                func = om(class_function)
                OM_set(func, '__name__', fn_name)

                OM_set_function_signature(func, signature)
                OM_set_function_body(func, body_code)
                arity = signature_arity(signature)
                OM_set_function_arity(func, arity)
                OM_set_function_closure(func, make_closure(rte))
                OM_set_function_locals(func, local_vars)
                OM_set_function_globals(func, rte_lexical_globals(rte))
                OM_set_function_var_context(func, locals_env)

                return cont(sig_rte, func)
            return signature_code(rte, get_signature)

        return cte, create_function

    else:
        # In non safe-for-space mode, a function saves the whole lexical scope in which it was defined
        def create_function(rte, cont):
            def get_signature(sig_rte, signature):
                func = om(class_function)
                OM_set(func, '__name__', fn_name)

                OM_set_function_signature(func, signature)
                OM_set_function_body(func, body_code)
                arity = signature_arity(signature)
                OM_set_function_arity(func, arity)
                OM_set_function_closure(func, make_closure(sig_rte))
                OM_set_function_locals(func, local_vars)
                OM_set_function_globals(func, rte_lexical_globals(sig_rte))
                OM_set_function_var_context(func, locals_env)

                current_func = rte_current_func(sig_rte)

                if current_func is absent:
                    # top-level definition
                    lexical_scope = make_dict()
                else:
                    lexical_scope = dict_copy(OM_get_function_lexical_scope(current_func))

                    # Add local variables
                    locals_ = rte_locals(sig_rte)
                    for name in dict_keys(locals_):
                        val = dict_get(locals_, name, None)
                        # in non-safe-for-space mode, all variables should be boxed
                        dict_set(lexical_scope, name, val)

                OM_set_function_lexical_scope(func, lexical_scope)

                return cont(sig_rte, func)
            return signature_code(rte, get_signature)
        return cte, create_function


def gen_ClassDef(cte, ast):
    name = ast.name
    bases = ast.bases
    keywords = ast.keywords
    body = ast.body

    base_cte, bases_code = comp_elements(cte, bases)
    kwargs_cte, kwargs_code = comp_keyword_elements(base_cte, keywords)
    set_cte, set_cont = gen_var_set(kwargs_cte, ast, name)

    locals_env = get_ast_property(ast, 'locals_env', None)
    closure_table = make_dict()
    local_vars = []

    for local_name in dict_keys(locals_env):
        var_token = locals_env[local_name]
        if is_local_var(var_token):
            local_vars.append((local_name, get_local_var_is_boxed(var_token)))

    cls_cte = make_class_cte(name,
                             locals_env,
                             closure_table,
                             cte.lex_env,
                             None,
                             cte.external_context,
                             set_cte)

    _, body_code = comp_stmt_seq(cls_cte, body)


    def code(rte, cont):
        def get_bases(bases_rte, bases_list):
            def exec_body(kwargs_rte, kwargs_dict):
                if dict_len(kwargs_dict) > 0:
                    ctx = Context(kwargs_rte, cont, keywords[0])
                    return sem_raise_with_message(ctx, class_NotImplementedError, "class keyword arguments not yet supported")
                else:
                    class_locals_env = make_dict()
                    body_rte = make_class_rte(rte, class_locals_env)

                    def create_class(_):
                        class_module = OM_get_boxed_value(rte_lookup_globals(rte, "__name__"))

                        i = 0
                        for b in bases_list:
                            b_type = OM_get_object_class(b)
                            if om_is_not(b_type, class_type):
                                ctx = Context(kwargs_rte, cont, bases[i])
                                return sem_raise_with_message(ctx, class_NotImplementedError, "derived metaclass must be 'type'")
                            else:
                                i += 1

                        # TODO: add some checks on bases
                        om_class = make_class(name, class_module, bases_list, class_type)

                        # mro could not
                        if om_class is None:
                            ctx = Context(kwargs_rte, cont, bases[0])
                            return sem_raise_with_message(ctx, class_TypeError, "Cannot create a consistent method resolution order (MRO) for bases")

                        for pair in dict_items(class_locals_env):
                            key = pair[0]
                            value = pair[1]
                            OM_set(om_class, key, value)

                        return set_cont(rte, cont, om_class)
                    return body_code(body_rte, create_class)
            return kwargs_code(bases_rte, exec_body)
        return bases_code(rte, get_bases)
    return set_cte, code

def gen_multiple_Assign(cte, ast, targets, value):
    value_cte, value_code = comp_expr(cte, value)

    for targ in targets:
        if not isinstance(targ, AST.Name):
            return CT_raise_syntax_error_with_msg(cte, ast, "unsupported assignment")

    targets_len = len(targets)
    last_target_index = targets_len - 1

    setters = []
    last_assign_cte = value_cte
    for targ in targets:
        name = targ.id
        last_assign_cte, setter = gen_var_set(last_assign_cte, targ, name)
        setters.append(setter)

    def code(rte, cont):
        def unpack(unpack_rte, iterable):
            def start_assignments(start_assign_rte, seq):
                seq_len = len(seq)
                if targets_len == seq_len:
                    i = last_target_index
                    next_cont = cont
                    while i >= 0:
                        def make_code(i, next_cont):
                            def do_assign(assign_rte):
                                setter_code = setters[i]
                                val = seq[i]
                                return setter_code(assign_rte, next_cont, val)
                            return do_assign
                        next_cont = make_code(i, next_cont)
                        i -= 1
                    return next_cont(start_assign_rte)
                elif targets_len < seq_len:
                    return sem_raise_with_message(Context(start_assign_rte, cont, ast), class_ValueError, "too many values to unpack")
                else:
                    return sem_raise_with_message(Context(start_assign_rte, cont, ast), class_ValueError, "not enough values to unpack")
            return om_unpack_iterable(Context(unpack_rte, start_assignments, ast), iterable)
        return value_code(rte, unpack)
    return cte, code


def gen_var_get(cte, ast, id):
    var_token = get_cte_locals_env_var(cte, id)

    if var_token is None or is_global_var(var_token):
        def code(rte, cont):
            return sem_var_get_global(Context(rte, do_expr_end(cont, ast), ast), id)

        return (cte, code)
    elif is_local_var(var_token):
        boxed = get_local_var_is_boxed(var_token)

        if boxed:
            def code(rte, cont):
                return sem_var_get_local_boxed(Context(rte, do_expr_end(cont, ast), ast), id)

            return (cte, code)
        else:
            def code(rte, cont):
                return sem_var_get_local(Context(rte, do_expr_end(cont, ast), ast), id)

            return (cte, code)

    elif is_class_closure_var(var_token):
        fn_cte = get_cte_function_parent(cte)
        tk = get_cte_locals_env_var(fn_cte, id)
        boxed = get_local_var_is_boxed(tk)

        if boxed:
            def code(rte, cont):
                return sem_var_get_class_closure_boxed(Context(rte, do_expr_end(cont, ast), ast), id)
            return cte, code
        else:
            def code(rte, cont):
                return sem_var_get_class_closure(Context(rte, do_expr_end(cont, ast), ast), id)

            return cte, code

    else: # case: closure var
        closure_table = get_cte_closure_table(cte)
        closure_pos = dict_get(closure_table, id, None)

        def code(rte, cont):
            return sem_var_get_closure(Context(rte, do_expr_end(cont, ast), ast), closure_pos, id)

        return (cte, code)

def gen_delete(cte, ast, expr):
    if isinstance(expr, AST.Name):
        (expr_cte, code) = comp_expr(cte, expr)

        def del_expr(rte, cont):
            return sem_var_del(Context(rte, do_stmt_end(cont, ast, 1), ast), expr.id)

        return (expr_cte, del_expr)
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "del: only supports var deletion")


def gen_delete_seq(cte, ast, targets):
    expr = targets[0]
    if len(targets) == 1:
        return gen_delete(cte, ast, expr)
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "del: multiple targets not yet supported.")

def gen_for(cte, ast):
    target = ast.target
    iterable_expr = ast.iter
    body = ast.body
    orelse = ast.orelse

    iterable_cte, iterable_code = comp_expr(cte, iterable_expr)
    set_cte, set_code = gen_var_set(iterable_cte, target, target.id)
    body_cte, body_code = comp_stmt_seq(set_cte, body)
    orelse_cte, orelse_code = comp_stmt_seq(body_cte, orelse)

    def code(external_rte, cont):
        def get_iterable(_, iterable):
            def get_iterator(_, iterator):
                def do_else(_):
                    return orelse_code(external_rte, cont)

                def run_body(_):
                    return body_code(loop_rte, lambda _: loop())

                def loop():
                    def get_next(_, nxt_value):
                        if nxt_value is for_loop_end_marker:
                            stmt_end_cont = do_stmt_end(do_else, ast, 0)
                            return stmt_end_cont(external_rte)
                        else:
                            return set_code(external_rte, run_body, nxt_value)
                    return sem_next(Context(external_rte, get_next, iterable_expr), iterator, for_loop_end_marker)

                loop_rte = make_loop_rte(external_rte, lambda: cont(external_rte), loop)

                return loop()
            return sem_iter(Context(external_rte, get_iterator, iterable_expr), iterable)
        return iterable_code(external_rte, get_iterable)

    return body_cte, code


def gen_break(cte, ast):
    def code(rte, _):
        return sem_break(rte)
    return cte, code


def gen_continue(cte, ast):
    def code(rte, _):
        return sem_continue(rte)
    return cte, code


def gen_handler(cte, handler):
    exc_type = handler.type
    name = handler.name
    body = handler.body

    if exc_type is None:
        # This catches everything
        body_cte, body_code = comp_stmt_seq(cte, body)

        def code(rte, _, exit_cont, __):
            return body_code(rte, exit_cont)

        return body_cte, code
    elif name is None:
        # Catches a given exception, but does not register it to a name
        exc_type_cte, exc_type_code = comp_expr(cte, exc_type)
        body_cte, body_code = comp_stmt_seq(exc_type_cte, body)

        # skip_cont: called when this handler does not apply
        # exit_cont: called when the handler was applied and terminated
        def code(rte, skip_cont, exit_cont, exc):
            def get_exc_type(type_rte, exc_type):
                if om_isinstance(exc_type, class_type) and om_issubclass(exc_type, class_BaseException):
                    if om_isinstance(exc, exc_type):
                        return body_code(type_rte, exit_cont)
                    else:
                        return skip_cont(type_rte)
                else:
                    return sem_raise_with_message(Context(type_rte, skip_cont, exc_type),
                                                  class_TypeError, "catching classes that do not inherit from BaseException is not allowed")
            return exc_type_code(rte, get_exc_type)
        return body_cte, code

    else:
        # Catches an exception and registers it to a name
        # TODO: delete the name from scope after the except block
        exc_type_cte, exc_type_code = comp_expr(cte, exc_type)
        name_cte, name_setter_code = gen_var_set(exc_type_cte, exc_type, name)
        body_cte, body_code = comp_stmt_seq(name_cte, body)

        def code(rte, skip_cont, exit_cont, exc):
            def get_exc_type(type_rte, exc_type):
                if om_isinstance(exc_type, class_type) and om_issubclass(exc_type, class_BaseException):
                    if om_isinstance(exc, exc_type):
                        def exec_body(rte):
                            return body_code(rte, exit_cont)
                        return name_setter_code(type_rte, exec_body, exc)
                    else:
                        return skip_cont(type_rte)
                else:
                    return sem_raise_with_message(Context(type_rte, skip_cont, exc_type),
                                                  class_TypeError, "catching classes that do not inherit from BaseException is not allowed")
            return exc_type_code(rte, get_exc_type)
        return body_cte, code


def gen_handlers_seq(cte, handlers):
    if len(handlers) == 0:
        def reraise(rte, _, exc):
            return sem_raise_unsafe(rte, exc)
        return cte, reraise
    else:
        first_cte, first_code = gen_handler(cte, handlers[0])
        tail_cte, tail_code = gen_handlers_seq(first_cte, handlers[1:])

        def handle(rte, exit_cont, exc):
            def skip_cont(rte):
                return tail_code(rte, exit_cont, exc)
            return first_code(rte, skip_cont, exit_cont, exc)
        return tail_cte, handle


def gen_try(cte, ast):
    # NOTE: There may be no except or finally, but we then count those as empty statement
    # This could be optimized but for now it simplifies the code immensely

    # When an rte has a handler and a finally, the handler has priority
    try_body = ast.body
    handlers = ast.handlers
    else_body = ast.orelse
    finally_body = ast.finalbody

    try_cte, try_code = comp_stmt_seq(cte, try_body)
    handlers_cte, handlers_code = gen_handlers_seq(try_cte, handlers)
    else_cte, else_code = comp_stmt_seq(handlers_cte, else_body)
    finally_cte, finally_code = comp_stmt_seq(else_cte, finally_body)

    def code(rte, cont):
        def do_finally_before_return(finally_cont):
            return finally_code(rte, finally_cont)

        def do_finally_before_reraise(exc):
            return finally_code(rte, lambda _: sem_raise_unsafe(rte, exc))

        def run_handlers(exc):
            rte_with_exc = make_rte_with_handler_and_finally(rte, do_finally_before_reraise, do_finally_before_return)
            rte_set_current_exc(rte_with_exc, exc)
            return handlers_code(rte_with_exc, do_finally, exc)

        def do_finally(_):
            return finally_code(rte, cont)

        def do_else(_):
            else_rte = make_rte_with_handler_and_finally(rte, do_finally_before_reraise, do_finally_before_return)
            return else_code(else_rte, do_finally)

        def do_try(rte_with_handlers):
            return try_code(rte_with_handlers, do_else)

        return do_try(make_rte_with_handler_and_finally(rte, run_handlers, do_finally_before_return))

    return else_cte, code


def gen_raise(cte, ast, code):
    if code is None:
        def raise_current(rte, cont):
            ctx = Context(rte, cont, ast)
            current_exc = rte_get_current_exc(rte)
            if current_exc is absent:
                return sem_raise_with_message(ctx, class_RuntimeError, "No active exception to reraise")
            else:
                return sem_raise_unsafe(rte, current_exc)
        return cte, raise_current
    else:
        def eval_raise_param(rte, cont):
            def raise_exn(rte1, exn):
                ctx = Context(rte1, cont, ast)
                return sem_raise(ctx, exn)
            return code(rte, raise_exn)
        return cte, eval_raise_param

def make_With_nested_node(items, body, type_comment, parent_with):
    ast = With(items, body, type_comment)
    ast.lineno = parent_with.lineno
    ast.col_offset = parent_with.col_offset
    ast.end_lineno = parent_with.end_lineno
    ast.end_col_offset = parent_with.end_col_offset

    # Special case which only happens in py.js
    if hasattr(parent_with, 'container'):
        ast.container = parent_with.container

    return ast

def gen_with(cte, ast):
    # A single item is expected after s2s transformations
    withitem = ast.items[0]
    context_expr = withitem.context_expr
    optional_vars = withitem.optional_vars
    body = ast.body

    expr_cte, expr_code = comp_expr(cte, context_expr)
    if optional_vars is None:
        set_cte = expr_cte
        # No target, no set
        def set_target(rte, cont, val): return cont(rte, val)
    elif isinstance(optional_vars, AST.Name):
        set_cte, set_target = gen_var_set(expr_cte, optional_vars, optional_vars.id)
    else:
        return CT_raise_syntax_error_with_msg(expr_cte, optional_vars,
                                              "with-statement does not support multiple assignments")

    body_cte, body_code = comp_stmt_seq(set_cte, body)

    def code(rte, cont):
        def exec_context_obj(rte, unopened_context):
            # Context semantics is one of the rare semantics where
            # magic methods are collected before any execution
            # https://docs.python.org/3.8/reference/compound_stmts.html#with
            item_enter = getattribute_from_obj_mro(unopened_context, '__enter__')
            if item_enter is absent:
                return sem_raise_with_message(Context(rte, cont, optional_vars), class_AttributeError, "__enter__")

            item_exit = getattribute_from_obj_mro(unopened_context, '__exit__')
            if item_exit is absent:
                return sem_raise_with_message(Context(rte, cont, optional_vars), class_AttributeError, "__exit__")

            def enter_context(enter_rte, context_val):
                # Put a try-except-finally around the execution of the body
                # To exit the context with __exit__
                def finally_code(finally_rte, finally_cont):
                    return sem_simple_call(Context(finally_rte, lambda r, _ : finally_cont(r), optional_vars),
                                           item_exit,
                                           [unopened_context, om_None, om_None, om_None])

                def exit_before_flow(finally_cont):
                    return finally_code(enter_rte, finally_cont)

                def exit_before_reraise(exc):
                    # If __exit__ return a truthy value, the exception is not reraised
                    def maybe_reraise(reraise_rte, exit_val):
                        def check_truthiness(rte, res):
                            if om_is(res, om_True):
                                return cont(enter_rte)
                            else:
                                return sem_raise_unsafe(enter_rte, exc)
                        return sem_bool(Context(enter_rte, check_truthiness, optional_vars), exit_val)
                    return sem_simple_call(Context(enter_rte, maybe_reraise, optional_vars),
                                           item_exit,
                                           # 4th argument should be traceback, but we do not have those yet
                                           [unopened_context, OM_get_object_class(exc), exc, om_None])

                def exit_before_continue(_):
                    return finally_code(enter_rte, cont)

                def exec_body(body_rte):
                    return body_code(body_rte, exit_before_continue)

                activated_context_rte = make_rte_with_handler_and_finally(enter_rte, exit_before_reraise, exit_before_flow)
                return set_target(activated_context_rte, exec_body, context_val)
            return sem_simple_call(Context(rte, enter_context, optional_vars), item_enter, [unopened_context])
        return expr_code(rte, exec_context_obj)

    return body_cte, code


def comp_import(cte, ast, names):
    if len(names) == 1:
        return gen_import_alias(cte, ast, names[0])
    else:
        alias_cte, alias_code = gen_import_alias(cte, ast, names[0])
        tail_cte, tail_code = comp_import(alias_cte, ast, names[1:])
        return gen_import_seq(tail_cte, alias_code, tail_code)


def gen_import_seq(cte, current_import, next_code):
    def code(rte, cont):
        return current_import(rte, lambda next_rte: next_code(next_rte, cont))

    return cte, code


def gen_import_alias(cte, ast, alias):
    options = cte.external_context
    name = alias.name

    if string_contains(name, '.'):
        return CT_raise_syntax_error_with_msg(cte, ast, "importing packages is not supported yet")

    asname = alias.asname
    filename = name + ".py"

    import_is_in_repl = runtime_ast_is_from_repl(ast)

    # NOTE: we cannot be more precise then this because as for now, alias does not have positional information
    set_cte, set_code = gen_var_set(cte, ast, name if asname is None else asname)

    def code(rte, cont):
        existing_module = rte_get_from_sys_modules(rte, name)

        # Always re-import in repl as CodeBoot usage allows to use the repl to test files as they are edited
        if existing_module is absent or import_is_in_repl:
            if not runtime_file_exists(rte, filename):
                if import_is_in_repl and existing_module is not absent:
                    # When repl fails to re-import a module (deleted of not a file), take existing one from sys.modules
                    return set_code(rte, cont, existing_module)
                else:
                    return sem_raise_with_message(Context(rte, cont, ast), class_ModuleNotFoundError, "No module named '" + name + "'")
            else:
                module_src = runtime_read_file(rte, filename)
                container = runtime_get_file_container(rte, filename)

                compilation_error_thrower = runtime_get_compilationError_thrower(rte_vm(rte), container, module_src)
                syntax_error_thrower = runtime_get_syntaxError_thrower(compilation_error_thrower)

                if options is not False:
                    new_options = dict_copy(options)
                    dict_set(new_options, 'compilationError', compilation_error_thrower)
                    dict_set(new_options, 'syntaxError', syntax_error_thrower)
                else:
                    new_options = options

                module_ast = parse(module_src, '<unknown>', 'exec', new_options)
                runtime_attach_ast_to_file(rte, module_ast, filename)

                module_code = comp(module_ast, new_options)

                builtins_module = rte_builtins_module(rte)

                module_rte = make_module_rte(rte, builtins_module, name)

                module_object = om_module(name, rte_globals(module_rte))

                # NOTE: it is important to add module to sys.modules BEFORE executing the module to allow circular imports
                rte_add_to_sys_modules(rte, name, module_object)

                def store_module(_):
                    return set_code(rte, cont, module_object)

                return module_code(module_rte, store_module)

        else:
            return set_code(rte, cont, existing_module)

    return set_cte, code


def gen_Expr(cte, ast, code1):

    def code(rte, cont):
        return code1(rte, lambda rte1, val1: cont(rte1))

    return (cte, code)

def gen_logical_and(cte, ast, code1, code2):
    if debug: print('gen_logical_and')

    # XXX: look into runtime environment.

    def code(rte, cont):
        def cast_bool(rte1, val1):
            def dispatch(rte2, cond_val):
                if om_is(cond_val, om_True):
                    return code2(rte2, cont)
                else:
                    return cont(rte2, val1)

            ctx = Context(rte, dispatch, ast)
            return sem_bool(ctx, val1)

        return code1(rte, cast_bool)

    return (cte, code)

def gen_logical_or(cte, ast, code1, code2):
    if debug: print('gen_logical_or')

    def code(rte, cont):
        def cast_bool(rte1, val1):
            def dispatch(rte2, cond_val):
                if om_is(cond_val, om_True):
                    return cont(rte1, val1)
                else:
                    return code2(rte1, cont)
            return sem_bool(Context(rte1, dispatch, ast), val1)
        return code1(rte, cast_bool)

    return (cte, code)

def gen_BoolOp(cte, ast, op, values):
    if isinstance(op, AST.And):
        logical_op = gen_logical_and
    elif isinstance(op, AST.Or):
        logical_op = gen_logical_or
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "unknown boolean operation")
    return gen_BoolOp_seq(cte, ast, logical_op, values)

# Compilation of sequence of expressions

def gen_BoolOp_seq(cte, ast, logical_op, expr_seq):
    (cte1, code1) = comp_expr(cte, expr_seq[0])
    if len(expr_seq) == 1:
        return (cte1, code1)
    else:
        (cte2, code2) = gen_BoolOp_seq(cte, ast, logical_op, expr_seq[1:])
        return logical_op(cte, ast, code1, code2)

# Compilation of sequence of expressions

def gen_UnaryOp(cte, ast, op, code1):
    if debug: print(op)

    if isinstance(op, AST.USub):
        sem_op = sem_Neg
    elif isinstance(op, AST.UAdd):
        sem_op = sem_Pos
    elif isinstance(op, AST.Invert):
        sem_op = sem_Invert
    elif isinstance(op, AST.Not):
        sem_op = sem_Not
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "unimplemented unary operator")

    def code(rte, cont):
        return code1(rte,
                lambda rte1, val1:
                    sem_op(Context(rte1, do_expr_end(cont, ast), ast), val1))

    return (cte, code)


def gen_aug_op(cte, ast):
    op = ast.op

    if isinstance(op, AST.Add):
        return sem_IAdd
    elif isinstance(op, AST.Sub):
        return sem_ISub
    elif isinstance(op, AST.Mult):
        return sem_IMul
    elif isinstance(op, AST.Div):
        return sem_ITrueDiv
    elif isinstance(op, AST.FloorDiv):
        return sem_IFloorDiv
    elif isinstance(op, AST.Mod):
        return sem_IMod
    elif isinstance(op, AST.LShift):
        return sem_ILShift
    elif isinstance(op, AST.RShift):
        return sem_IRShift
    elif isinstance(op, AST.BitAnd):
        return sem_IAnd
    elif isinstance(op, AST.BitOr):
        return sem_IOr
    elif isinstance(op, AST.BitXor):
        return sem_IXor
    elif isinstance(op, AST.Pow):
        return sem_IPow
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "Unimplemented assignment operator")


def gen_aug_assign(cte, ast):
    target = ast.target
    sem_op = gen_aug_op(cte, ast)

    if isinstance(target, AST.Name):
        value = ast.value
        id_ = target.id

        get_cte, get_target = gen_var_get(cte, target, id_)
        val_cte, val_code = comp_expr(get_cte, value)
        set_cte, set_target = gen_var_set(val_cte, ast, id_)

        def code(rte, cont):
            def get_val(get_rte, target_val):
                def do_sem(val_rte, lhs_val):
                    def do_set(set_rte, val):
                        return set_target(set_rte, cont, val)
                    return sem_op(Context(val_rte, do_set, ast), target_val, lhs_val)
                return val_code(get_rte, do_sem)
            return get_target(rte, get_val)

        return set_cte, code
    elif isinstance(target, AST.Subscript):
        return gen_subscript_aug_assign(cte, ast, target, sem_op)
    elif isinstance(target, AST.Attribute):
        return gen_attr_aug_assign(cte, ast, target, sem_op)
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "illegal expression for augmented assignment")


def gen_subscript_aug_assign(cte, ast, target, sem_op):
    target_obj = target.value
    target_index = target.slice.value
    value = ast.value

    obj_cte, obj_code = comp_expr(cte, target_obj)
    index_cte, index_code = comp_expr(obj_cte, target_index)
    value_cte, value_code = comp_expr(index_cte, value)

    if isinstance(target_obj, AST.Name):
        id_ = target_obj.id

        def _make_message_lhs(rte, _, index):
            ctx = Context(rte, None, ast)

            index_repr = om_simple_repr(ctx, index)

            return id_ + "[" + index_repr + "] ← "

        make_message_lhs = _make_message_lhs
    else:
        def _make_message_lhs(rte, obj, index):
            ctx = Context(rte, None, ast)

            obj_repr = om_simple_repr(ctx, obj)
            index_repr = om_simple_repr(ctx, index)

            return obj_repr + "[" + index_repr + "] ← "

        make_message_lhs = _make_message_lhs

    def code(rte, cont):
        def get_container(container_rte, container):
            def get_index(index_rte, index):
                def get_lhs(lhs_rte, lhs_obj):
                    def get_value(value_rte, value):
                        # Get message lhs before applying sem_op to show before/after in bubble
                        msg_lhs = make_message_lhs(value_rte, container, index)

                        def get_op_res(res_rte, res):
                            cont_stmt_end_with_message = do_stmt_end_with_message(cont, ast)
                            msg = msg_lhs + om_simple_repr(Context(rte, None, ast), res)

                            return sem_setitem(
                                Context(res_rte, lambda rte: cont_stmt_end_with_message(rte, msg), ast),
                                container,
                                index,
                                res)

                        return sem_op(Context(value_rte, get_op_res, ast), lhs_obj, value)

                    return value_code(lhs_rte, get_value)

                expr_end_cont = do_expr_end(get_lhs, target)
                return sem_getitem(Context(index_rte, expr_end_cont, target_obj), container, index)

            return index_code(container_rte, get_index)

        return obj_code(rte, get_container)

    return value_cte, code


def gen_attr_aug_assign(cte, ast, target, sem_op):
    target_obj = target.value
    attr_name = target.attr
    attr_name_str = om_str(attr_name)
    value = ast.value

    obj_cte, obj_code = comp_expr(cte, target_obj)
    value_cte, value_code = comp_expr(obj_cte, value)

    if isinstance(target_obj, AST.Name):
        id_ = target_obj.id
        pre_compiled_msg = id_ + "." + attr_name + " ← "

        def _make_message_lhs(rte, _):
            return pre_compiled_msg

        make_message_lhs = _make_message_lhs
    else:
        def _make_message_lhs(rte, obj):
            ctx = Context(rte, None, ast)

            obj_repr = om_simple_repr(ctx, obj)

            return obj_repr + "." + attr_name + " ← "

        make_message_lhs = _make_message_lhs

    def code(rte, cont):
        def get_obj(obj_rte, obj):
            def get_attr(attr_rte, attr):
                def get_value(value_rte, val):
                    # Get message lhs before applying sem_op to show before/after in bubble
                    msg_lhs = make_message_lhs(value_rte, obj)

                    def get_res(res_rte, res):
                        cont_stmt_end_with_message = do_stmt_end_with_message(cont, ast)
                        msg = msg_lhs + om_simple_repr(Context(rte, None, ast), res)

                        return sem_setattribute(
                            Context(res_rte, lambda rte: cont_stmt_end_with_message(rte, msg), ast),
                            obj,
                            attr_name_str,
                            res)

                    return sem_op(Context(value_rte, get_res, ast), attr, val)

                return value_code(attr_rte, get_value)

            expr_end_cont = do_expr_end(get_attr, target)
            return sem_getattribute(Context(obj_rte, expr_end_cont, target), obj, attr_name_str)

        return obj_code(rte, get_obj)

    return value_cte, code


def gen_BinOp(cte, ast, op, code1, code2):
    if debug: print(op)

    # Arithmetic
    if isinstance(op, AST.Add):
        sem_op = sem_Add
    elif isinstance(op, AST.Sub):
        sem_op = sem_Sub
    elif isinstance(op, AST.Mult):
        sem_op = sem_Mult
    # TODO: Normalize nomenclature
    elif isinstance(op, AST.Div):
        sem_op = sem_TrueDiv
    elif isinstance(op, AST.Mod):
        sem_op = sem_Mod
    elif isinstance(op, AST.FloorDiv):
        sem_op = sem_FloorDiv
    # Bitwise
    elif isinstance(op, AST.LShift):
        sem_op = sem_LShift
    elif isinstance(op, AST.RShift):
        sem_op = sem_RShift
    elif isinstance(op, AST.BitAnd):
        sem_op = sem_And
    elif isinstance(op, AST.BitOr):
        sem_op = sem_Or
    elif isinstance(op, AST.BitXor):
        sem_op = sem_Xor
    elif isinstance(op, AST.Pow):
        sem_op = sem_Pow
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "unimplemented binary operator")

    def code(rte, cont):
        return code1(rte,
                     lambda rte1, val1:
                       code2(rte1,
                             lambda rte2, val2:
                               sem_op(Context(rte2, do_expr_end(cont, ast), ast),
                                      val1, val2)))

    return (cte, code)

# XXX: I don't know what name it should have
def comp_Compare_Op(cte, op):
    if isinstance(op, AST.Eq):
        sem_op = sem_Eq
    elif isinstance(op, AST.NotEq):
        sem_op = sem_NotEq
    elif isinstance(op, AST.Lt):
        sem_op = sem_Lt
    elif isinstance(op, AST.Gt):
        sem_op = sem_Gt
    elif isinstance(op, AST.LtE):
        sem_op = sem_LtE
    elif isinstance(op, AST.GtE):
        sem_op = sem_GtE
    elif isinstance(op, AST.Is):
        return sem_Is
    elif isinstance(op, AST.IsNot):
        return sem_IsNot
    elif isinstance(op, AST.In):
        sem_op = sem_Contains
    elif isinstance(op, AST.NotIn):
        sem_op = sem_NotContains
    else:
        return CT_raise_syntax_error_with_msg(cte, op, "unknown comparator")

    return sem_op


def make_Compare_pseudo_node(left, op, right):
    ast = Compare(left, [op], [right])
    ast.lineno = left.lineno
    ast.col_offset = left.col_offset
    ast.end_lineno = right.end_lineno
    ast.end_col_offset = right.end_col_offset

    # Special case which only happens in py.js
    if hasattr(left, 'container'):
        ast.container = left.container

    return ast


def gen_Compare(cte, ast, left, comparators, ops):
    ops_len = len(ops)
    left_cte, left_code = comp_expr(cte, left)

    comparators_code = []
    for expr in comparators:
        left_cte, expr_code = comp_expr(left_cte, expr)
        comparators_code.append(expr_code)

    sem_ops = []
    for op in ops:
        sem_ops.append(comp_Compare_Op(cte, op))

    if len(comparators) > 1:
        pseudo_asts = []
        j = 0
        tmp_left = left
        while j < ops_len:
            tmp_op = ops[j]
            tmp_right = comparators[j]
            pseudo_node = make_Compare_pseudo_node(tmp_left, tmp_op, tmp_right)
            pseudo_asts.append(pseudo_node)
            tmp_left = tmp_right
            j += 1

        def do_chain_cont(end_chain_cont):
            next_cont = end_chain_cont
            init_i = ops_len - 1
            i = init_i

            while i >= 0:
                current_comparator_code = comparators_code[i]
                current_sem_op = sem_ops[i]
                current_pseudo_ast = pseudo_asts[i]

                def create_code(next_cont, current_comparator_code, current_sem_op, current_pseudo_ast, i):
                    def get_right_value(cont_rte, left_val):
                        def exec_comparison(compare_rte, right_val):
                            def check_result(result_rte, result):
                                def branch(branch_rte, bool_result):
                                    if i == init_i or om_is(bool_result, om_False):
                                        expr_end_cont = do_expr_end(end_chain_cont, current_pseudo_ast)
                                        return expr_end_cont(branch_rte, result)
                                    else:
                                        expr_end_cont = do_expr_end_with_displayed_value(next_cont, current_pseudo_ast,
                                                                                         result)
                                        return expr_end_cont(branch_rte, right_val)

                                return sem_bool(make_out_of_ast_context(result_rte, branch), result)

                            return current_sem_op(Context(compare_rte, check_result, current_pseudo_ast), left_val,
                                                  right_val)

                        return current_comparator_code(cont_rte, exec_comparison)

                    return get_right_value

                next_cont = create_code(next_cont, current_comparator_code, current_sem_op, current_pseudo_ast, i)
                i -= 1
            return next_cont

        def start_chain(rte, cont):
            expr_end_cont = do_expr_end(cont, ast)
            chain_cont = do_chain_cont(expr_end_cont)
            return left_code(rte, chain_cont)

        return left_cte, start_chain

    else:
        sem_op = sem_ops[0]
        right_code = comparators_code[0]

        def code(rte, cont):
            def get_left(left_rte, left_val):
                def get_right(right_rte, right_val):
                    expr_end_cont = do_expr_end(cont, ast)
                    return sem_op(Context(right_rte, expr_end_cont, ast), left_val, right_val)
                return right_code(left_rte, get_right)
            return left_code(rte, get_left)
        return left_cte, code


def sem_Is(ctx, val1, val2):
    result = om_is(val1, val2)
    return cont_bool(ctx, result)

def sem_IsNot(ctx, val1, val2):
    result = not om_is(val1, val2)
    return cont_bool(ctx, result)


def sem_Neg(ctx, val1):
    val1_neg = getattribute_from_obj_mro(val1, '__neg__')
    if val1_neg is absent:
        cls = OM_get_object_class(val1)
        cls_name = OM_get_boxed_value(OM_get(cls, "__name__"))
        return sem_raise_with_message(ctx, class_TypeError, "bad operand type for unary -: '"+cls_name+"'")
    else:
        return sem_simple_call(ctx, val1_neg, [val1])

def sem_Pos(ctx, val1):
    val1_pos = getattribute_from_obj_mro(val1, '__pos__')
    if val1_pos is absent:
        cls = OM_get_object_class(val1)
        cls_name = OM_get_boxed_value(OM_get(cls, "__name__"))
        return sem_raise_with_message(ctx, class_TypeError, "bad operand type for unary +: '"+cls_name+"'")
    else:
        return sem_simple_call(ctx, val1_pos, [val1])

def sem_Invert(ctx, val1):
    val1_pos = getattribute_from_obj_mro(val1, '__invert__')
    if val1_pos is absent:
        cls = OM_get_object_class(val1)
        cls_name = OM_get_boxed_value(OM_get(cls, "__name__"))
        return sem_raise_with_message(ctx, class_TypeError, "bad operand type for unary ~: '"+cls_name+"'")
    else:
        return sem_simple_call(ctx, val1_pos, [val1])

def gen_sem_IOperator(method_name, sem_fall_back, op_name):
    def sem_IOp(ctx, self, other):
        def cont_raise_error(rte, result):
            if om_is(result, om_NotImplemented):
                return sem_raise_with_message(ctx, class_TypeError, "unsupported operand type(s) for " + op_name)
            else:
                return cont_obj(ctx, result)

        def cont_call_fallback(rte, result):
            if om_is(result, om_NotImplemented):
                return sem_fall_back(with_cont(ctx, cont_raise_error), self, other)
            else:
                return cont_obj(ctx, result)

        self_iop = getattribute_from_obj_mro(self, method_name)

        if self_iop is absent:
            return sem_fall_back(ctx, self, other)
        else:
            return sem_simple_call(with_cont(ctx, cont_call_fallback), self_iop, [self, other])
    return sem_IOp

sem_IAdd = gen_sem_IOperator("__iadd__", sem_Add, "+=")
sem_ISub = gen_sem_IOperator("__isub__", sem_Sub, "-=")
sem_IMul = gen_sem_IOperator("__imul__", sem_Mult, "*=")
sem_ITrueDiv = gen_sem_IOperator("__itruediv__", sem_TrueDiv, "/=")
sem_IFloorDiv = gen_sem_IOperator("__ifloordiv__",sem_FloorDiv,  "//=")
sem_IPow = gen_sem_IOperator("__ipow__", sem_Pow, "**=")
sem_IMod = gen_sem_IOperator("__imod__", sem_Mod, "%=")
sem_IAnd = gen_sem_IOperator("__iand__", sem_And, "&=")
sem_IOr = gen_sem_IOperator("__ior__", sem_Or, "|=")
sem_IXor = gen_sem_IOperator("__ixor__", sem_Xor, "^=")
sem_ILShift = gen_sem_IOperator("__ilshift__", sem_LShift, "<<=")
sem_IRShift = gen_sem_IOperator("__irshift__", sem_RShift, ">>=")


def sem_Not(ctx, obj):

    def flip(rte, res):
        if om_is(res, om_True):
            return ctx.cont(rte, om_False)
        else:
            return ctx.cont(rte, om_True)

    return sem_bool(with_cont(ctx, flip), obj)

def sem_repr(ctx, val1):
    val1_repr = getattribute_from_obj_mro(val1, '__repr__')

    rte_repr_enter(ctx.rte)

    def check_string(rte, res):
        if om_isinstance(res, class_str):
            rte_repr_exit(rte)
            return ctx.cont(rte, res)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "__repr__ returned non-string")

    ctx1 = with_cont(ctx, check_string)
    return sem_simple_call(ctx1, val1_repr, [val1])

def sem_str(ctx, value):
    value_str = getattribute_from_obj_mro(value, "__str__")

    def check_string(rte, res):
        if om_isinstance(res, class_str):
            return ctx.cont(rte, res)
        else:
            return sem_raise_with_message(ctx, class_TypeError, "__str__ returned non-string")

    next_ctx = with_cont(ctx, check_string)
    return sem_simple_call(next_ctx, value_str, [value])

def sem_getattribute(ctx, obj, name):
    def catch_AttributeError(exn):
        if om_isinstance(exn, class_AttributeError):
            obj_getattr = getattribute_from_obj_mro(obj, '__getattr__')
            if obj_getattr is absent:
                return sem_raise_unsafe(ctx.rte, exn)
            else:
                return sem_simple_call(ctx, obj_getattr, [obj, name])
        else:
            return sem_raise_unsafe(ctx.rte, exn)

    obj_getattribute = getattribute_from_obj_mro(obj, '__getattribute__')

    return sem_simple_call(with_catch(ctx, catch_AttributeError), obj_getattribute, [obj, name])

def sem_setattribute(ctx, obj, name, value):
    obj_getattribute = getattribute_from_obj_mro(obj, '__setattr__')

    return sem_simple_call(with_cont(ctx, lambda rte, _: ctx.cont(rte)), obj_getattribute, [obj, name, value])

def sem_simple_call(ctx, obj, args):
    obj_type = OM_get_object_class(obj)

    # Recursively recover __call__ of object until we get a base callable object
    if om_is(obj_type, class_MethodWrapper):
        code = OM_get_code(obj)
        instance = OM_get_MethodWrapper_instance(obj)
        requires_kwargs = OM_get_requires_kwargs(obj)

        if requires_kwargs:
            return code(ctx, [instance] + args, make_dict())
        else:
            return code(ctx, [instance] + args)
    elif om_is(obj_type, class_WrapperDescriptor):
        code = OM_get_code(obj)
        requires_kwargs = OM_get_requires_kwargs(obj)

        if requires_kwargs:
            return code(ctx, args, make_dict())
        else:
            return code(ctx, args)
    elif om_is(obj_type, class_function):
        return om_function_call_code(ctx, [obj] + args, make_dict())
    else:
        obj_call = getattribute_from_obj_mro(obj, '__call__')
        if obj_call is absent:
            class_name = OM_get_object_class_name(obj)
            return sem_raise_with_message(ctx, class_TypeError, "'" + class_name + "' object is not callable")
        else:
            return sem_simple_call(ctx, obj_call, [obj] + args)

def sem_generic_call(ctx, obj, args, kwargs):
    if dict_len(kwargs) == 0:
        return sem_simple_call(ctx, obj, args)
    else:
        obj_type = OM_get_object_class(obj)

        # Recursively recover __call__ of object until we get a base callable object
        if om_is(obj_type, class_MethodWrapper):
            requires_kwargs = OM_get_requires_kwargs(obj)

            if requires_kwargs:
                code = OM_get_code(obj)
                instance = OM_get_MethodWrapper_instance(obj)
                return code(ctx, [instance] + args, kwargs)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "method takes no keyword arguments")
        elif om_is(obj_type, class_WrapperDescriptor):
            requires_kwargs = OM_get_requires_kwargs(obj)

            if requires_kwargs:
                code = OM_get_code(obj)
                return code(ctx, args, kwargs)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "function takes no keyword arguments")
        elif om_is(obj_type, class_function):
            return om_function_call_code(ctx, [obj] + args, kwargs)
        else:
            obj_call = getattribute_from_obj_mro(obj, '__call__')
            if obj_call is absent:
                class_name = OM_get_object_class_name(obj)
                return sem_raise_with_message(ctx, class_TypeError, "'" + class_name + "' object is not callable")
            else:
                return sem_generic_call(ctx, obj_call, [obj] + args, kwargs)

def sem_getitem(ctx, obj, item):
    obj_getitem = getattribute_from_obj_mro(obj, "__getitem__")
    if obj_getitem is absent:
        return sem_raise_with_message(ctx, class_TypeError, 'object is not subscriptable')
    else:
        return sem_simple_call(ctx, obj_getitem, [obj, item])

def sem_setitem(ctx, obj, item, val):
    obj_setitem = getattribute_from_obj_mro(obj, "__setitem__")
    if obj_setitem is absent:
        return sem_raise_with_message(ctx, class_TypeError, 'object does not support item assignment')
    else:
        return sem_simple_call(with_cont(ctx, lambda rte, _: ctx.cont(rte)), obj_setitem, [obj, item, val])

def sem_next(ctx, obj, default_):
    obj_next = getattribute_from_obj_mro(obj, "__next__")
    if obj_next is absent:
        return sem_raise_with_message(ctx, class_TypeError, "object is not an iterator")
    elif default_ is absent:
        return sem_simple_call(ctx, obj_next, [obj])
    else:
        def catch_StopIteration(exn):
            if om_isinstance(exn, class_StopIteration):
                return cont_obj(ctx, default_)
            else:
                return sem_raise_unsafe(ctx.rte, exn)

        next_ctx = with_catch(ctx, catch_StopIteration)
        return sem_simple_call(next_ctx, obj_next, [obj])


def sem_next_no_default(ctx, obj):
    return sem_next(ctx, obj, absent)


def sem_next_with_return_to_trampoline(ctx, obj, default_):
    # Useful for emulating a for-loop without too many recursions
    def do_step(rte, val):
        return stmt_end(Context(rte, lambda rte: ctx.cont(rte, val), ctx.ast), 0)
    return sem_next(with_cont(ctx, do_step), obj, default_)


def sem_iter(ctx, obj):
    obj_iter = getattribute_from_obj_mro(obj, "__iter__")
    if obj_iter is absent:
        obj_getitem = getattribute_from_obj_mro(obj, "__getitem__")
        if obj_getitem is absent:
            return sem_raise_with_message(ctx, class_TypeError, "object is not iterable")
        else:
            return ctx.cont(ctx.rte, om_iterator(obj, om_int(int_from_num(0))))
    else:
        return sem_simple_call(ctx, obj_iter, [obj])

def sem_Contains_in_iterator(ctx, target, iterator):
    def get_next(rte, iterator):
        def compare(get_next_rte, get_next_val):
            if get_next_val is for_loop_end_marker:
                return ctx.cont(get_next_rte, om_False)
            else:
                def cont_eq(eq_rte, eq_result):
                    def cont(rte, bool_res):
                        if om_is(bool_res, om_True):
                            return ctx.cont(ctx.rte, om_True)
                        else:
                            return get_next(rte, iterator)
                    return sem_bool(Context(eq_rte, cont, ctx.ast), eq_result)
                return sem_Eq(Context(get_next_rte, cont_eq, ctx.ast), get_next_val, target)
        return sem_next_with_return_to_trampoline(Context(rte, compare, ctx.ast), iterator, for_loop_end_marker)
    return get_next(ctx.rte, iterator)

def sem_Contains(ctx, target, obj):
    obj_contains = getattribute_from_obj_mro(obj, "__contains__")

    def cast_to_bool(rte, val):
        return sem_bool(ctx, val)

    if obj_contains is absent:
        def cont(rte, it):
            return sem_Contains_in_iterator(with_cont(ctx, cast_to_bool), target, it)
        return sem_iter(with_cont(ctx, cont), obj)
    else:
        return sem_simple_call(with_cont(ctx, cast_to_bool), obj_contains, [obj, target])


def sem_NotContains(ctx, target, obj):
    def cont(rte, val):
        if om_is(val, om_True):
            return cont_obj(ctx, om_False)
        else:
            return cont_obj(ctx, om_True)

    return sem_Contains(with_cont(ctx, cont), target, obj)


def om_unpack_iterable(ctx, it):
    seq = []

    def get_next(rte, iterator):
        def accumulate(rte, val):
            if val is for_loop_end_marker:
                return cont_obj(ctx, seq)
            else:
                seq.append(val)
                return get_next(rte, iterator)
        return sem_next_with_return_to_trampoline(Context(rte, accumulate, ctx.ast), iterator, for_loop_end_marker)

    return sem_iter(with_cont(ctx, get_next), it)

def om_unpack_mapping(ctx, mapping):
    if om_isinstance(mapping, class_dict):
        return cont_obj(ctx, OM_get_boxed_value(mapping))
    else:
        return sem_raise_with_message(ctx, class_NotImplementedError, "mapping unpacking is not yet supported for non-dict objects")

def sem_maybe_len(ctx, obj):
    obj_len = getattribute_from_obj_mro(obj, "__len__")
    if obj_len is absent:
        return ctx.cont(ctx.rte, absent)
    else:
        def check_result(result_rte, res):
            def check_range(range_rte, len_res):
                res_value = OM_get_boxed_value(res)
                if int_is_nonneg(res_value):
                    return cont_obj(ctx, res)
                else:
                    return sem_raise_with_message(ctx, class_ValueError, "__len__() should return >= 0")
            return sem_index(with_cont(ctx, check_range), res)
        return sem_simple_call(with_cont(ctx, check_result), obj_len, [obj])

def sem_len(ctx, obj):
    def cont(rte, val):
        if val is absent:
            obj_cls_name = OM_get_object_class_name(obj)
            error_msg = "object of type '" + obj_cls_name + "' has no len()"
            return sem_raise_with_message(ctx, class_TypeError, error_msg)
        else:
            return ctx.cont(rte, val)

    return sem_maybe_len(with_cont(ctx, cont), obj)

def sem_abs(ctx, obj):
    obj_abs = getattribute_from_obj_mro(obj, '__abs__')

    if obj_abs is absent:
        return sem_raise_with_message(ctx, class_TypeError, "bad operand type for abs()")
    else:
        return sem_simple_call(ctx, obj_abs, [obj])

def sem_maybe_int(ctx, obj):
    obj_int = getattribute_from_obj_mro(obj, '__int__')

    if obj_int is absent:
        return ctx.cont(ctx.rte, absent)
    else:
        def check_int(rte, res):
            if om_isinstance(res, class_int):
                return ctx.cont(rte, res)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "__int__ returned non-int")
        return sem_simple_call(with_cont(ctx, check_int), obj_int, [obj])

def sem_int(ctx, obj):
    def check_result(rte, res):
        if res is absent:
            return sem_raise_with_message(ctx, class_TypeError, "object cannot be interpreted as an integer")
        else:
            return cont_obj(ctx, res)
    return sem_maybe_int(with_cont(ctx, check_result), obj)

def sem_maybe_index(ctx, obj):
    # TODO: add overflow check. The difference between __int__ and __index is that the later cannot return a bigint
    obj_int = getattribute_from_obj_mro(obj, '__index__')

    if obj_int is absent:
        return ctx.cont(ctx.rte, absent)
    else:
        def check_int(rte, res):
            if om_isinstance(res, class_int):
                return ctx.cont(rte, res)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "__index__ returned non-int")
        return sem_simple_call(with_cont(ctx, check_int), obj_int, [obj])

def sem_index(ctx, obj):
    def check_result(rte, res):
        if res is absent:
            return sem_raise_with_message(ctx, class_TypeError, "object cannot be interpreted as an integer")
        else:
            return cont_obj(ctx, res)
    return sem_maybe_index(with_cont(ctx, check_result), obj)

def sem_maybe_float(ctx, obj):
    obj_float = getattribute_from_obj_mro(obj, '__float__')

    if obj_float is absent:
        return ctx.cont(ctx.rte, absent)
    else:
        def check_float(rte, res):
            if om_isinstance(res, class_float):
                return ctx.cont(rte, res)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "__float__ returned non-float")
        return sem_simple_call(with_cont(ctx, check_float), obj_float, [obj])

def sem_float(ctx, obj):
    def check_result(rte, res):
        if res is absent:
            return sem_raise_with_message(ctx, class_TypeError, "object cannot be interpreted as a float")
        else:
            return cont_obj(ctx, res)
    return sem_maybe_float(with_cont(ctx, check_result), obj)

def gen_constant(cte, ast, val):
    obj = box_object(val)

    def code(rte, cont):
        return sem_constant(Context(rte, do_expr_end(cont, ast), ast), obj)

    return (cte, code)

def gen_Tuple(cte, ast, code_elts):
    return gen_elements(cte, ast, code_elts, make_tuple)

def gen_List(cte, ast, elts_code):
    return gen_elements(cte, ast, elts_code, make_list)

def gen_elements(cte, ast, code_elts, make_container):
    def code(rte, cont):
        return code_elts(rte,
                         lambda rte1, elts:
                            make_container(Context(rte1,
                                                   do_expr_end(cont, ast),
                                                   ast),
                                           elts))
    return (cte, code)

def gen_Slice(cte, slice_ast):
    def do_None(rte, cont):
        return cont(rte, om_None)

    lower = slice_ast.lower
    upper = slice_ast.upper
    step = slice_ast.step

    if lower is not None:
        lower_cte, lower_code = comp_expr(cte, lower)
    else:
        lower_cte, lower_code = cte, do_None

    if upper is not None:
        upper_cte, upper_code = comp_expr(lower_cte, upper)
    else:
        upper_cte, upper_code = lower_cte, do_None

    if step is not None:
        step_cte, step_code = comp_expr(upper_cte, step)
    else:
        step_cte, step_code = upper_cte, do_None

    def do_slice(rte, cont):
        def get_lower(lo_rte, lo):
            def get_upper(up_rte, up):
                def get_step(st_rte, st):
                    return cont(st_rte, om_slice(lo, up, st))
                return step_code(up_rte, get_step)
            return upper_code(lo_rte, get_upper)
        return lower_code(rte, get_lower)

    return step_cte, do_slice

def gen_Subscript_Load(cte, ast, obj_code, index_code):
    def get_obj(rte, cont):
        def get_index(rte, obj):
            def get_item(getitem_rte, index):
                return sem_getitem(Context(getitem_rte, cont, ast), obj, index)
            return index_code(rte, get_item)
        return obj_code(rte, get_index)

    def code(rte, cont):
        return get_obj(rte, do_expr_end(cont, ast))
    return cte, code

def gen_Subscript_Store(cte, ast, target, value):
    target_obj = target.value
    index_ast = target.slice

    obj_cte, obj_code = comp_expr(cte, target_obj)

    if isinstance(index_ast, AST.Index):
        index_cte, index_code = comp_expr(obj_cte, index_ast.value)
    elif isinstance(index_ast, AST.Slice):
        index_cte, index_code = gen_Slice(obj_cte, index_ast)
    else:
        return CT_raise_syntax_error_with_msg(cte, ast, "extended slice not yet supported")

    value_cte, value_code = comp_expr(index_cte, value)

    if isinstance(target_obj, AST.Name):
        var_id = target_obj.id

        def _make_message(rte, _, index, value):
            ctx = Context(rte, None, ast)
            return var_id + "[" + om_simple_repr(ctx, index) + "] ← " + om_simple_repr(ctx, value)

        make_message = _make_message
    else:
        def _make_message(rte, obj, index, value):
            ctx = Context(rte, None, ast)

            obj_repr = om_simple_repr(ctx, obj)
            index_repr = om_simple_repr(ctx, index)
            value_repr = om_simple_repr(ctx, value)

            return obj_repr + "[" + index_repr + "] ← " + value_repr

        make_message = _make_message


    def get_obj(rte, cont):
        def get_index(rte, obj):
            def get_value(get_value_rte, index):
                def set_item(setitem_rte, value):
                    msg = make_message(setitem_rte, obj, index, value)
                    cont_stmt_end_with_message = do_stmt_end_with_message(cont, ast)
                    ctx = Context(setitem_rte, lambda rte: cont_stmt_end_with_message(rte, msg), ast)
                    return sem_setitem(ctx, obj, index, value)
                return value_code(get_value_rte, set_item)
            return index_code(rte, get_value)
        return obj_code(rte, get_index)

    return value_cte, get_obj

def sem_constant(ctx, val):
    return ctx.cont(ctx.rte, val)

def sem_var_set_local(ctx, id, val):
    rte_set_locals(ctx.rte, id, val)
    return cont_no_val(ctx)

def sem_var_set_local_boxed(ctx, id, val):
    rte_set_locals_boxed(ctx.rte, id, val)
    return cont_no_val(ctx)

def sem_var_set_class_closure(ctx, id, val):
    parent_locals_env = rte_class_parent_locals(ctx.rte)
    dict_set(parent_locals_env, id, val)
    return cont_no_val(ctx)

def sem_var_set_class_closure_boxed(ctx, id, val):
    parent_locals_env = rte_class_parent_locals(ctx.rte)
    slot = dict_get(parent_locals_env, id, None)
    slot[0] = val
    return cont_no_val(ctx)

def sem_var_set_globals(ctx, id, val):
    rte_set_globals(ctx.rte, id, val)
    return cont_no_val(ctx)

def sem_var_set_closure(ctx, pos, val):
    rte_set_closure(ctx.rte, pos, val)
    return cont_no_val(ctx)

def sem_var_get_local(ctx, id):
    value = rte_lookup_locals(ctx.rte, id)

    if value is absent:
        return sem_raise_with_message(ctx, class_UnboundLocalError,
                                      "local variable '" + id + "' referenced before assignment")
    return cont_obj(ctx, value)

def sem_var_get_local_boxed(ctx, id):
    value = rte_lookup_locals_boxed(ctx.rte, id)

    if value is absent:
        return sem_raise_with_message(ctx, class_UnboundLocalError, "local variable '" + id + "' referenced before assignment")
    return cont_obj(ctx, value)


def sem_var_get_class_closure_boxed(ctx, id):
    parent_locals_env = rte_class_parent_locals(ctx.rte)
    value = dict_get(parent_locals_env, id, absent)[0]

    if value is absent:
        return sem_raise_with_message(ctx, class_NameError,
                                      "free variable '" + id + "' referenced before assignment in enclosing scope")
    else:
        return cont_obj(ctx, value)


def sem_var_get_class_closure(ctx, id):
    parent_locals_env = rte_class_parent_locals(ctx.rte)
    value = dict_get(parent_locals_env, id, absent)

    if value is absent:
        return sem_raise_with_message(ctx, class_NameError,
                                      "free variable '" + id + "' referenced before assignment in enclosing scope")
    else:
        return cont_obj(ctx, value)


def sem_var_get_closure(ctx, pos, id):
    value = rte_lookup_closure(ctx.rte, pos)

    if value is absent:
        return sem_raise_with_message(ctx, class_NameError, "free variable '" + id + "' referenced before assignment in enclosing scope")
    else:
        return cont_obj(ctx, value)

def sem_var_get_global(ctx, id):
    def catch_AttributeError(exn):
        if om_isinstance(exn, class_AttributeError):
            error_msg = "name '" + id + "' is not defined"
            return sem_raise_with_message(ctx, class_NameError, error_msg)
        else:
            return sem_raise_unsafe(ctx.rte, exn)

    value = rte_lookup_globals(ctx.rte, id)

    if value is absent:
        env_builtins = rte_lookup_globals(ctx.rte, '__builtins__')
        return sem_getattribute(with_catch(ctx, catch_AttributeError), env_builtins, om_str(id))
    else:
        return cont_obj(ctx, value)

def sem_var_del(ctx, id):
    return sem_raise(ctx, class_NotImplementedError)

def sem_bool(ctx, val):
    val_bool = getattribute_from_obj_mro(val, '__bool__')
    if val_bool is absent:
        def check_len(rte, res):
            if res is absent:
                return cont_obj(ctx, om_True)
            else:
                res_value = OM_get_boxed_value(res)
                return cont_bool(ctx, not int_is_zero(res_value))
        return sem_maybe_len(with_cont(ctx, check_len), val)
    else:
        def check_bool(rte, res):
            if om_is(res, om_True) or om_is(res, om_False):
                return cont_obj(ctx, res)
            else:
                return sem_raise_with_message(ctx, class_TypeError, "__bool__ should return bool")

        return sem_simple_call(with_cont(ctx, check_bool), val_bool, [val])


def find_closest_ast(rte):
    frame = rte_stack(rte)
    ast = frame_ast(frame)
    # There should always be a frame with an ast somewhere
    while ast is None:
        frame = rte_stack(frame_rte(frame))
        ast = frame_ast(frame)
    return ast

# raise_unsafe raises an object which must already have been checked to be a BaseException and contain context info
# raise_unsafe expected exc to contain all context information and none has to be added
def sem_raise_unsafe(rte, exc):
    handler = rte_get_handler(rte)
    return handler(exc)


def sem_raise(ctx, exn):
    rte = ctx.rte

    # create the exn_object to be created
    if om_isinstance(exn, class_type) and om_issubclass(exn, class_BaseException):
        exn_obj = om_exception(exn, om_tuple(()))
    elif om_isinstance(exn, class_BaseException):
        exn_obj = exn
    else:
        # TypeError raising a non-BaseException was attempted
        exn_obj = om_exception(class_TypeError, om_tuple(()))

    location = ctx.ast or find_closest_ast(rte)

    location_stack = OM_init_BaseException_locations(exn_obj)
    location_stack.append(location)

    return sem_raise_unsafe(rte, exn_obj)


def sem_raise_with_message(ctx, exn_type, msg):
    args = om_tuple((om_str(msg),))
    return sem_raise(ctx, om_exception(exn_type, args))


# Check if there is a finally block and execute it before proceeding to next continuation
# If there is no finally, run the continuation
# NOTE: a finally continuation is meant to intercept returns only, to intercept exceptions an handler should be used
def sem_finally(rte, cont):
    final = rte_get_finally(rte)
    if final is absent:
        return cont(rte)
    else:
        # The final continuation should have full information on what to do next
        return final(cont)


def sem_break(rte):
    break_cont = rte_get_break_cont(rte)
    return break_cont()


def sem_continue(rte):
    continue_cont = rte_get_continue_cont(rte)
    return continue_cont()


def sem_exec_all_finally(rte, cont):
    final = rte_get_finally(rte)
    if final is absent:
        return cont(rte)
    else:
        # The final continuation should have full information on what to do next
        def do_next_finally(rte):
            return sem_exec_all_finally(rte, do_stmt_end(cont, find_closest_ast(rte), 0))

        return final(do_next_finally)


def gen_call(cte, ast):
    args = ast.args
    keywords = ast.keywords
    args_len = len(args)
    keywords_len = len(keywords)

    func_cte, func_code = comp_expr(cte, ast.func)

    if args_len == 0 and keywords_len == 0:
        # Case where there is no argument or keywords: f()
        def code(rte, cont):
            expr_end_cont = do_expr_end(cont, ast)

            def get_func(func_rte, fn):
                return sem_simple_call(Context(func_rte, expr_end_cont, ast), fn, [])
            return func_code(rte, get_func)

        return cte, code
    elif keywords_len == 0:
        # Case where there are arguments, but not keyword arguments
        args_cte, args_code = comp_elements(func_cte, args)

        def code(rte, cont):
            expr_end_cont = do_expr_end(cont, ast)

            def get_func(func_rte, fn):
                def do_call(call_rte, args):
                    return sem_simple_call(Context(call_rte, expr_end_cont, ast), fn, args)
                return args_code(func_rte, do_call)
            return func_code(rte, get_func)

        return args_cte, code
    elif args_len == 0:
        # Case where there are keywords, but no arguments
        kwargs_cte, kwargs_code = comp_keyword_elements(func_cte, keywords)

        def code(rte, cont):
            expr_end_cont = do_expr_end(cont, ast)

            def get_func(func_rte, fn):
                def do_call(call_rte, kwargs):
                    return sem_generic_call(Context(call_rte, expr_end_cont, ast), fn, [], kwargs)
                return kwargs_code(func_rte, do_call)
            return func_code(rte, get_func)

        return kwargs_cte, code
    else:
        # Case where there are both keywords, and arguments
        args_cte, args_code = comp_elements(func_cte, args)
        kwargs_cte, kwargs_code = comp_keyword_elements(args_cte, keywords)

        def code(rte, cont):
            expr_end_cont = do_expr_end(cont, ast)

            def get_func(func_rte, fn):
                def get_args(args_rte, args):
                    def do_call(call_rte, kwargs):
                        return sem_generic_call(Context(call_rte, expr_end_cont, ast), fn, args, kwargs)
                    return kwargs_code(args_rte, do_call)
                return args_code(func_rte, get_args)
            return func_code(rte, get_func)

        return kwargs_cte, code


def gen_ifexpr(cte, ast, test_code, body_code, orelse_code):
    def code(rte, cont):
        expr_end_cont = do_expr_end_with_step(cont, ast, 0)
        def dispatch(rte, val):
            if om_is(val, om_True):
                return body_code(rte, expr_end_cont)
            else:
                return orelse_code(rte, expr_end_cont)

        def cast_bool(rte, val):
            ctx = Context(rte, dispatch, ast)
            return sem_bool(ctx, val)

        return test_code(rte, cast_bool)

    return (cte, code)


def gen_Attribute(cte, ast, code, name):
    def call_getattribute(rte, cont, obj):
        ctx = Context(rte, cont, ast)
        return sem_getattribute(ctx, obj, om_str(name))

    def code1(rte, cont):
        expr_end_cont = do_expr_end(cont, ast)
        return code(rte,
                    lambda rte, val:
                       call_getattribute(rte, expr_end_cont, val))

    return (cte, code1)

def gen_Attribute_Store(cte, ast, target, value):
    target_value_node = target.value
    target_cte, target_code = comp_expr(cte, target_value_node)
    value_cte, value_code = comp_expr(target_cte, value)
    raw_name = target.attr
    name = om_str(raw_name)

    if isinstance(target_value_node, AST.Name):
        var_id = target_value_node.id
        def _make_message(rte, _, value):
            return var_id + "." + raw_name + " ← " + om_simple_repr(Context(rte, None, ast), value)

        make_message = _make_message
    else:
        def _make_message(rte, obj, value):
            ctx = Context(rte, None, ast)

            obj_repr = om_simple_repr(ctx, obj)
            value_repr = om_simple_repr(ctx, value)

            # NOTE: obj_repr cannot be a number since their attributes are not settable as of Python semantics
            # although, as long as this is not enforced in pyinterp, we may end up with weird messages
            # such as "1.x <- 1"
            return obj_repr + "." + raw_name + " ← " + value_repr

        make_message = _make_message

    def code(rte, cont):
        def get_target(target_rte, target_value):
            def do_set(set_rte, value):
                msg = make_message(set_rte, target_value, value)
                cont_stmt_end_with_message = do_stmt_end_with_message(cont, ast)
                return sem_setattribute(Context(set_rte, lambda rte: cont_stmt_end_with_message(rte, msg), ast),
                                        target_value, name, value)
            return value_code(target_rte, do_set)
        return target_code(rte, get_target)

    return value_cte, code

REPR_TOO_LONG_FILLER = "..."

# TODO: Replace class names with class objects once this is supported
def om_tuple_simple_repr(tuple_, rte, max_length):
    if rte_check_seen_repr(rte, tuple_):
        return '(...)'
    else:
        rte_add_seen_repr(rte, tuple_)

        elements = OM_get_tuple_seq(tuple_)
        elements_len = len(elements)

        # account for the '(' + ')' segment of the string
        remaining_length = max_length - 2

        acc = []
        i = 0
        ctx = make_out_of_ast_context(rte, None)
        while i < elements_len:
            if i > 0:
                # Account for ", "
                remaining_length -= 2

            elt_repr = om_simple_repr_with_max_length(ctx, elements[i], remaining_length)
            repr_len = len(elt_repr)

            if repr_len > remaining_length:
                if remaining_length >= 3 or len(acc) == 0:
                    # Enough space to add "..." or the first element was already too long so we add "..."
                    # even though the second option may make the list too long
                    acc.append(REPR_TOO_LONG_FILLER)
                else:
                    # Not enough space to add "...", replace the last element
                    acc[len(acc) - 1] = REPR_TOO_LONG_FILLER
                break
            else:
                remaining_length -= repr_len
                acc.append(elt_repr)
                i += 1

        return '(' + ', '.join(acc) + ')'


def om_list_simple_repr(list_, rte, max_length):
    if rte_check_seen_repr(rte, list_):
        return '[...]'
    else:
        rte_add_seen_repr(rte, list_)

        elements = OM_get_list_seq(list_)
        elements_len = len(elements)

        # account for the '[' + ']' segment of the string
        remaining_length = max_length - 2

        acc = []
        i = 0
        ctx = make_out_of_ast_context(rte, None)
        while i < elements_len and elements[i] is not empty_cell:
            if i > 0:
                # Account for ", "
                remaining_length -= 2

            elt_repr = om_simple_repr_with_max_length(ctx, elements[i], remaining_length)
            repr_len = len(elt_repr)

            if repr_len > remaining_length:
                if remaining_length >= 3 or len(acc) == 0:
                    # Enough space to add "..." or the first element was already too long so we add "..."
                    # even though the second option may make the list too long
                    acc.append(REPR_TOO_LONG_FILLER)
                else:
                    # Not enough space to add "...", replace the last element
                    acc[len(acc) - 1] = REPR_TOO_LONG_FILLER
                break
            else:
                remaining_length -= repr_len
                acc.append(elt_repr)
                i += 1

        return '[' + ', '.join(acc) + ']'


def om_struct_simple_repr(struct, rte, max_length):
    if rte_check_seen_repr(rte, struct):
        return "struct(...)"
    else:
        rte_add_seen_repr(rte, struct)

    attrs_repr = []

    # account for the 'struct(' + ')' segment of the string
    remaining_length = max_length - 8

    fields = OM_get_tuple_seq(OM_get(struct, '_fields'))

    for attr in fields:
        # attr are str
        attr_name = OM_get_boxed_value(attr)
        value = OM_get(struct, attr_name)

        # account for 'name='
        remaining_length_for_value = remaining_length - len(attr_name) - 1

        value_repr = om_simple_repr_with_max_length(make_out_of_ast_context(rte, None), value,
                                                    remaining_length_for_value)

        repr_ = attr_name + '=' + value_repr


        repr_len = len(repr_)

        if repr_len <= remaining_length:
            # Object is short enough, print it
            # account for next ', ' in remaining length
            remaining_length -= repr_len + 2
            attrs_repr.append(repr_)
        elif remaining_length < 3 and len(attrs_repr) > 0:
            attrs_repr[len(attrs_repr) - 1] = REPR_TOO_LONG_FILLER
            break
        else:
            attrs_repr.append(REPR_TOO_LONG_FILLER)
            break

    return 'struct(' + ', '.join(attrs_repr) + ')'


def om_slice_simple_repr(slice_, rte, max_length):
    # account for the 'slice(' + ')' segment of the string
    remaining_length = max_length - 12

    start = OM_get_slice_start(slice_)
    stop = OM_get_slice_stop(slice_)
    step = OM_get_slice_step(slice_)

    reprs = []

    for elt in [start, stop, step]:
        repr_ = om_simple_repr(make_out_of_ast_context(rte, None), elt)

        repr_len = len(repr_)

        if repr_len <= remaining_length:
            # Object is short enough, print it
            # account for next ', ' in remaining length
            remaining_length -= repr_len + 2
            reprs.append(repr_)
        elif remaining_length < 3 and len(reprs) > 0:
            reprs[len(reprs) - 1] = REPR_TOO_LONG_FILLER
            break
        else:
            reprs.append(REPR_TOO_LONG_FILLER)
            break

    return 'struct(' + ', '.join(reprs) + ')'


simple_repr_formatters = {
    "NoneType": om_format_NoneType_repr,
    "int": om_format_int_repr,
    "float": om_format_float_repr,
    "bool": om_format_bool_repr,
    "str": om_format_str_repr,
    "type": om_format_type_repr,
    "range": om_format_range_repr,
    "function": om_format_function_repr,
    "method-wrapper": om_format_MethodWrapper_repr,
    "wrapper_descriptor": om_format_WrapperDescriptor_repr,
    "module": om_format_module_repr,
    "object": om_format_object_repr,
    "NotImplementedType" : om_format_NotImplementedType,
    "TextIOWrapper": om_format_TextIOWrapper
}

def om_simple_repr(ctx, value):
    return om_simple_repr_with_max_length(ctx, value, 80)

def om_simple_repr_with_max_length(ctx, value, max_length):
    rte = ctx.rte
    rte_repr_enter(rte)

    value_cls = OM_get_object_class(value)

    # List and tuple and range are special cases which recursively call repr on elements, we thus treat them separately

    if om_is(value_cls, class_list):
        repr_res = om_list_simple_repr(value, ctx.rte, max_length)
    elif om_is(value_cls, class_tuple):
        repr_res = om_tuple_simple_repr(value, ctx.rte, max_length)
    elif om_is(value_cls, class_struct):
        repr_res = om_struct_simple_repr(value, ctx.rte, max_length)
    elif om_is(value_cls, class_slice):
        repr_res = om_slice_simple_repr(value, ctx.rte, max_length)
    else:
        cls_name = OM_get_boxed_value(OM_get(value_cls, "__name__"))
        formatter = dict_get(simple_repr_formatters, cls_name, om_format_object_repr)

        repr_res = formatter(value, ctx.rte)

    if len(repr_res) > max_length:
        repr_res = repr_res[:max_length - 3] + REPR_TOO_LONG_FILLER

    rte_repr_exit(rte)

    return repr_res

def om_simple_exception_format(ctx, exn):
    exn_name = OM_get_object_class_qualname(exn)
    exn_args = OM_get(exn, 'args')

    if exn_args is absent or not om_isinstance(exn_args, class_tuple):
        return exn_name + ': <unknown exception message>'
    else:
        seq = OM_get_tuple_seq(exn_args)
        if len(seq) == 0:
            return exn_name
        elif len(seq) == 1:
            el = seq[0]
            if om_isinstance(el, class_str):
                return exn_name + ": " + OM_get_boxed_value(el)
            else:
                return exn_name + ": " + om_simple_repr(ctx, seq[0])
        else:
            return exn_name + ": " + om_simple_repr(ctx, exn_args)


def expr_end_with_error(ctx, error):
    return return_to_trampoline(ctx.ast, '', 0, False, False, None, error, lambda: None, ctx)

def expr_end(ctx, val):
    return expr_end_with_step(ctx, val, 1)

def expr_end_with_step(ctx, val, nb_steps):
    if om_is(val, om_None):
        return return_to_trampoline(ctx.ast, "None", nb_steps, False, False, None, None, lambda: ctx.cont(ctx.rte, val), ctx)
    else:
        return return_to_trampoline(ctx.ast, om_simple_repr(ctx, val), nb_steps, True, False, None, None, lambda: ctx.cont(ctx.rte, val), ctx)

def stmt_end(ctx, nb_steps):
    return return_to_trampoline(ctx.ast, '', nb_steps, False, False, None, None, lambda: ctx.cont(ctx.rte), ctx)

# XXX: Default nb_steps to 1 in stmt_end_with_message to minimise changes
def stmt_end_with_message(ctx, msg):
    return return_to_trampoline(ctx.ast, msg, 1, False, False, None, None, lambda: ctx.cont(ctx.rte), ctx)


def stmt_end_breakpoint(ctx):
    return return_to_trampoline(ctx.ast, '', 0, False, True, None, None, lambda: ctx.cont(ctx.rte), ctx)


def stmt_end_with_sleep(ctx, sleep_time):
    return return_to_trampoline(ctx.ast, '', 0, False, False, sleep_time, None, lambda: ctx.cont(ctx.rte), ctx)


def return_to_trampoline(ast, msg, nb_steps, display_result, breakpoint, sleep_time, error, cont, ctx):
    # return to trampoline with current execution state
    res = make_struct()
    struct_set(res, "ast", ast)
    struct_set(res, "msg", msg)
    struct_set(res, "nb_steps", nb_steps)
    struct_set(res, "display_result", display_result)
    struct_set(res, "breakpoint", breakpoint)
    struct_set(res, "sleep_time", sleep_time)
    struct_set(res, "error", error)
    struct_set(res, "cont", cont)
    struct_set(res, "ctx", ctx)
    return res


def comp_event_handler(ast, external_context):
    cte = CTE(None, None, [], [], None, None, external_context, None)

    # Compile the handler code with access to 'event'
    body_ast = ast.body
    arguments_ast = arguments([arg("event", None, None)], [], None, [], [], None, [])

    # Create a fake FunctionDef for storing scoping information during walk methods
    dummy_function = FunctionDef("<event handler>", arguments_ast, body_ast, [], None, None)

    run_walk_methods(cte, dummy_function)

    _, create_function = gen_create_function(cte, arguments_ast, body_ast, "event_handler", dummy_function)

    def convert_event_value(val):
        if val is True:
            return om_True
        elif val is False:
            return om_False
        elif val is None or runtime_is_null(val):
            return om_None
        elif isinstance(val, float):
            return om_float(val)
        elif isinstance(val, str):
            return om_str(val)
        elif runtime_is_domelement(val):
            return om_DOMElement(val)
        else:
            # unrecognized value
            return None

    def code(rte, cont, event):
        # Create a struct event from the event passed as dict
        om_event = om(class_struct)
        fields = []
        for pair in dict_items(event):
            key = pair[0]
            value = pair[1]
            om_value = convert_event_value(value)
            if om_value is not None:
                # Skip values which could not be converted
                fields.append(om_str(key))
                OM_set(om_event, key, om_value)

        OM_set(om_event, '_fields', om_tuple(fields))

        def exec_handler(rte, om_handler_fn):
            return sem_simple_call(Context(rte, cont, ast), om_handler_fn, [om_event])
        return create_function(rte, exec_handler)

    # Typical use case does not require the cte here, so we only return the code
    return code
