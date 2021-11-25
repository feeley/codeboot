# Root class of ASTs

class AST:

    _fields = ()
    _attributes = ()

# Modules

class mod(AST):

    _fields = ()
    _attributes = ()

class Module(mod):

    _fields = ('body', 'type_ignores')
    _attributes = ()

    def __init__(self, body, type_ignores):
        self.body = body
        self.type_ignores = type_ignores

class type_ignore(AST):

    _fields = ()
    _attributes = ()

class TypeIgnore(type_ignore):

    _fields = ('lineno', 'tag')
    _attributes = ()

    def __init__(self, lineno, tag):
        self.lineno = lineno
        self.tag = tag

class Interactive(mod):

    _fields = ('body',)
    _attributes = ()

    def __init__(self, body):
        self.body = body

class Expression(mod):

    _fields = ('body',)
    _attributes = ()

    def __init__(self, body):
        self.body = body

class FunctionType(mod):

    _fields = ('argtypes', 'returns')
    _attributes = ()

    def __init__(self, argtypes, returns):
        self.argtypes = argtypes
        self.returns = returns

class Suite(mod):

    _fields = ('body',)
    _attributes = ()

    def __init__(self, body):
        self.body = body

# Statements

class stmt(AST):

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

class FunctionDef(stmt): # function definition

    _fields = ('name', 'args', 'body', 'decorator_list', 'returns', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, name, args, body, decorator_list, returns, type_comment):
        self.name = name
        self.args = args
        self.body = body
        self.decorator_list = decorator_list
        self.returns = returns
        self.type_comment = type_comment

class arguments(AST): # arguments of a function

    _fields = ('posonlyargs', 'args', 'vararg', 'kwonlyargs', 'kw_defaults', 'kwarg', 'defaults')
    _attributes = ()

    def __init__(self, args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwarg, defaults):
        self.args = args
        self.posonlyargs = posonlyargs
        self.vararg = vararg
        self.kwonlyargs = kwonlyargs
        self.kw_defaults = kw_defaults
        self.kwarg = kwarg
        self.defaults = defaults

class arg(AST): # single argument

    _fields = ('arg', 'annotation', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, arg, annotation, type_comment):
        self.arg = arg
        self.annotation = annotation
        self.type_comment = type_comment

class AsyncFunctionDef(stmt): # 'async def' function definition

    _fields = ('name', 'args', 'body', 'decorator_list', 'returns', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, name, args, body, decorator_list, returns, type_comment):
        self.name = name
        self.args = args
        self.body = body
        self.decorator_list = decorator_list
        self.returns = returns
        self.type_comment = type_comment

class ClassDef(stmt): # class definition

    _fields = ('name', 'bases', 'keywords', 'body', 'decorator_list')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, name, bases, keywords, body, decorator_list):
        self.name = name
        self.bases = bases
        self.keywords = keywords
        self.body = body
        self.decorator_list = decorator_list

class Return(stmt): # 'return' statement

    _fields = ('value',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value):
        self.value = value

class Delete(stmt): # 'del' statement

    _fields = ('targets',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, targets):
        self.targets = targets

class Assign(stmt): # assignment

    _fields = ('targets', 'value', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, targets, value, type_comment):
        self.targets = targets
        self.value = value
        self.type_comment = type_comment

class AugAssign(stmt): # augmented assignment

    _fields = ('target', 'op', 'value')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, target, op, value):
        self.target = target
        self.op = op
        self.value = value

class AnnAssign(stmt): # assignment with type annotation

    _fields = ('target', 'annotation', 'value', 'simple')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, target, annotation, value, simple):
        self.target = target
        self.annotation = annotation
        self.value = value
        self.simple = simple

class For(stmt): # 'for' statement

    _fields = ('target', 'iter', 'body', 'orelse', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, target, iter, body, orelse, type_comment):
        self.target = target
        self.iter = iter
        self.body = body
        self.orelse = orelse
        self.type_comment = type_comment

class AsyncFor(stmt): # 'async for' statement

    _fields = ('target', 'iter', 'body', 'orelse', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, target, iter, body, orelse, type_comment):
        self.target = target
        self.iter = iter
        self.body = body
        self.orelse = orelse
        self.type_comment = type_comment

class While(stmt): # 'while' statement

    _fields = ('test', 'body', 'orelse')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, test, body, orelse):
        self.test = test
        self.body = body
        self.orelse = orelse

class If(stmt): # 'if' statement

    _fields = ('test', 'body', 'orelse')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, test, body, orelse):
        self.test = test
        self.body = body
        self.orelse = orelse

class With(stmt): # 'with' statement

    _fields = ('items', 'body', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, items, body, type_comment):
        self.items = items
        self.body = body
        self.type_comment = type_comment

class AsyncWith(stmt): # 'async with' statement

    _fields = ('items', 'body', 'type_comment')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, items, body, type_comment):
        self.items = items
        self.body = body
        self.type_comment = type_comment

class withitem(AST): # context manager in a 'with' statement

    _fields = ('context_expr', 'optional_vars')
    _attributes = ()

    def __init__(self, context_expr, optional_vars):
        self.context_expr = context_expr
        self.optional_vars = optional_vars

class Raise(stmt): # 'raise' statement

    _fields = ('exc', 'cause')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, exc, cause):
        self.exc = exc
        self.cause = cause

class Try(stmt): # 'try' statement

    _fields = ('body', 'handlers', 'orelse', 'finalbody')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, body, handlers, orelse, finalbody):
        self.body = body
        self.handlers = handlers
        self.orelse = orelse
        self.finalbody = finalbody

class excepthandler(AST):

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

class ExceptHandler(excepthandler): # 'except' clause

    _fields = ('type', 'name', 'body')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, type, name, body):
        self.type = type
        self.name = name
        self.body = body

class Assert(stmt): # assertion

    _fields = ('test', 'msg')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, test, msg):
        self.test = test
        self.msg = msg

class Import(stmt): # 'import' statement

    _fields = ('names',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, names):
        self.names = names

class ImportFrom(stmt): # 'from x import y' statement

    _fields = ('module', 'names', 'level')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, module, names, level):
        self.module = module
        self.names = names
        self.level = level

class alias(AST): # import alias for 'from x import y as z'

    _fields = ('name', 'asname')
    _attributes = ()

    def __init__(self, name, asname):
        self.name = name
        self.asname = asname

class Global(stmt): # 'global' statement

    _fields = ('names',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, names):
        self.names = names

class Nonlocal(stmt): # 'nonlocal' statement

    _fields = ('names',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, names):
        self.names = names

class Expr(stmt): # expression statement

    _fields = ('value',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value):
        self.value = value

class Pass(stmt): # 'pass' statement

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

class Break(stmt): # 'break' statement

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

class Continue(stmt): # 'continue' statement

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

# Expressions

class expr(AST):

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

class expr_context(AST):

    _fields = ()
    _attributes = ()

class Load(expr_context):

    _fields = ()
    _attributes = ()

class Store(expr_context):

    _fields = ()
    _attributes = ()

class Del(expr_context):

    _fields = ()
    _attributes = ()

class AugLoad(expr_context):

    _fields = ()
    _attributes = ()

class AugStore(expr_context):

    _fields = ()
    _attributes = ()

class Param(expr_context):

    _fields = ()
    _attributes = ()

class BoolOp(expr): # Boolean operation

    _fields = ('op', 'values')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, op, values):
        self.op = op
        self.values = values

class boolop(AST):

    _fields = ()
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

class And(boolop): # 'and' operator

    _fields = ()
    _attributes = ()

class Or(boolop): # 'or' operator

    _fields = ()
    _attributes = ()

class NamedExpr(expr):

    _fields = ('target', 'value')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, target, value):
        self.target = target
        self.value = value

class BinOp(expr): # Binary operation

    _fields = ('left', 'op', 'right')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, left, op, right):
        self.left = left
        self.op = op
        self.right = right

class operator(AST):

    _fields = ()
    _attributes = ()

class Add(operator): # '+' operator

    _fields = ()
    _attributes = ()

class Sub(operator): # '-' operator

    _fields = ()
    _attributes = ()

class Mult(operator): # '*' operator

    _fields = ()
    _attributes = ()

class Div(operator): # '/' operator

    _fields = ()
    _attributes = ()

class FloorDiv(operator): # '//' operator

    _fields = ()
    _attributes = ()

class Mod(operator): # '%' operator

    _fields = ()
    _attributes = ()

class Pow(operator): # '**' operator

    _fields = ()
    _attributes = ()

class LShift(operator): # '<<' operator

    _fields = ()
    _attributes = ()

class RShift(operator): # '>>' operator

    _fields = ()
    _attributes = ()

class BitOr(operator): # '|' operator

    _fields = ()
    _attributes = ()

class BitXor(operator): # '^' operator

    _fields = ()
    _attributes = ()

class BitAnd(operator): # '&' operator

    _fields = ()
    _attributes = ()

class MatMult(operator): # '@' operator

    _fields = ()
    _attributes = ()

class UnaryOp(expr): # Unary operation

    _fields = ('op', 'operand')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, op, operand):
        self.op = op
        self.operand = operand

class unaryop(AST):

    _fields = ()
    _attributes = ()

class UAdd(unaryop): # unary '+' operator

    _fields = ()
    _attributes = ()

class USub(unaryop): # unary '-' operator

    _fields = ()
    _attributes = ()

class Not(unaryop): # 'not' operator

    _fields = ()
    _attributes = ()

class Invert(unaryop): # '~' operator

    _fields = ()
    _attributes = ()

class Lambda(expr): # lambda expression

    _fields = ('args', 'body')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, args, body):
        self.args = args
        self.body = body

class IfExp(expr): # expression 'a if b else c'

    _fields = ('test', 'body', 'orelse')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, test, body, orelse):
        self.test = test
        self.body = body
        self.orelse = orelse

class Dict(expr): # dictionary expression

    _fields = ('keys', 'values')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, keys, values):
        self.keys = keys
        self.values = values

class Set(expr): # set expression

    _fields = ('elts',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, elts):
        self.elts = elts

class ListComp(expr): # list comprehension expression

    _fields = ('elt', 'generators')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, elt, generators):
        self.elt = elt
        self.generators = generators

class SetComp(expr): # set comprehension expression

    _fields = ('elt', 'generators')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, elt, generators):
        self.elt = elt
        self.generators = generators

class DictComp(expr): # dictionary comprehension expression

    _fields = ('key', 'value', 'generators')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, key, value, generators):
        self.key = key
        self.value = value
        self.generators = generators

class comprehension(AST): # clause of a comprehension

    _fields = ('target', 'iter', 'ifs', 'is_async')
    _attributes = ()

    def __init__(self, target, iter, ifs, is_async):
        self.target = target
        self.iter = iter
        self.ifs = ifs
        self.is_async = is_async

class GeneratorExp(expr): # generator expression

    _fields = ('elt', 'generators')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, elt, generators):
        self.elt = elt
        self.generators = generators

class Await(expr): # 'await' expression

    _fields = ('value',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value):
        self.value = value

class Yield(expr): # 'yield' expression

    _fields = ('value',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value):
        self.value = value

class YieldFrom(expr): # 'yield from' expression

    _fields = ('value',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value):
        self.value = value

class Compare(expr): # comparison of two or more values

    _fields = ('left', 'ops', 'comparators')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, left, ops, comparators):
        self.left = left
        self.ops = ops
        self.comparators = comparators

class cmpop(AST):

    _fields = ()
    _attributes = ()

class Eq(cmpop): # '==' operator

    _fields = ()
    _attributes = ()

class NotEq(cmpop): # '!=' operator

    _fields = ()
    _attributes = ()

class Lt(cmpop): # '<' operator

    _fields = ()
    _attributes = ()

class LtE(cmpop): # '<=' operator

    _fields = ()
    _attributes = ()

class Gt(cmpop): # '>' operator

    _fields = ()
    _attributes = ()

class GtE(cmpop): # '>=' operator

    _fields = ()
    _attributes = ()

class Is(cmpop): # 'is' operator

    _fields = ()
    _attributes = ()

class IsNot(cmpop): # 'is not' operator

    _fields = ()
    _attributes = ()

class In(cmpop): # 'in ' operator

    _fields = ()
    _attributes = ()

class NotIn(cmpop): # 'not in' operator

    _fields = ()
    _attributes = ()

class Call(expr): # function call

    _fields = ('func', 'args', 'keywords')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, func, args, keywords):
        self.func = func
        self.args = args
        self.keywords = keywords

class keyword(AST): # keyword argument

    _fields = ('arg', 'value')
    _attributes = ()

    def __init__(self, arg, value):
        self.arg = arg
        self.value = value

class FormattedValue(expr): # single formatting field in an f-string

    _fields = ('value', 'conversion', 'format_spec')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value, conversion, format_spec):
        self.value = value
        self.conversion = conversion
        self.format_spec = format_spec

class JoinedStr(expr):

    _fields = ('values',)
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, values):
        self.values = values

class Constant(expr):

    _fields = ('value', 'kind')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value, kind):
        self.value = value
        self.kind = kind

class Attribute(expr): # attribute access

    _fields = ('value', 'attr', 'ctx')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value, attr, ctx):
        self.value = value
        self.attr = attr
        self.ctx = ctx

class Subscript(expr): # subscript

    _fields = ('value', 'slice', 'ctx')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value, slice, ctx):
        self.value = value
        self.slice = slice
        self.ctx = ctx

class slice(AST):

    _fields = ()
    _attributes = ()

class Slice(slice): # regular slicing 'a[b:c]'

    _fields = ('lower', 'upper', 'step')
    _attributes = ()

    def __init__(self, lower, upper, step):
        self.lower = lower
        self.upper = upper
        self.step = step

class ExtSlice(slice): # advanced slicing: 'a[b:c, d]'

    _fields = ('dims',)
    _attributes = ()

    def __init__(self, dims):
        self.dims = dims

class Index(slice): # simple subscript 'a[b]'

    _fields = ('value',)
    _attributes = ()

    def __init__(self, value):
        self.value = value

class Starred(expr):

    _fields = ('value', 'ctx')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, value, ctx):
        self.value = value
        self.ctx = ctx

class Name(expr):

    _fields = ('id', 'ctx')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, id, ctx):
        self.id = id
        self.ctx = ctx

class List(expr): # list expression

    _fields = ('elts', 'ctx')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, elts, ctx):
        self.elts = elts
        self.ctx = ctx

class Tuple(expr): # tuple expression

    _fields = ('elts', 'ctx')
    _attributes = ('lineno', 'col_offset', 'end_lineno', 'end_col_offset')

    def __init__(self, elts, ctx):
        self.elts = elts
        self.ctx = ctx

# For compatibility with CPython.

PyCF_ONLY_AST = 1024
PyCF_TYPE_COMMENTS = 4096
PyCF_ALLOW_TOP_LEVEL_AWAIT = 8192
