"""
    zast
    ~~~~

    pyinterp's abstract syntax tree module.
"""


from pyinterp.zast._zparse import *
from pyinterp.zast._zast import *


def nocompile(f):
    return f


def parse(source, filename='<unknown>', mode='exec', context=False):
    n = len(source)
    if n > 0 and source[n-1] != '\n':
        source += '\n'
    return py_parse(source, mode, context)


@nocompile
def dump(node, annotate_fields=True, include_attributes=False):
    """
    Return a formatted dump of the tree in node.  This is mainly useful for
    debugging purposes.  If annotate_fields is true (by default),
    the returned string will show the names and the values for fields.
    If annotate_fields is false, the result string will be more compact by
    omitting unambiguous field names.  Attributes such as line
    numbers and column offsets are not dumped by default.  If this is wanted,
    include_attributes can be set to true.
    """
    def _format(node):
        if isinstance(node, AST):
            args = []
            keywords = annotate_fields
            for field in node._fields:
                try:
                    value = getattr(node, field)
                except AttributeError:
                    keywords = True
                else:
                    if keywords:
                        args.append('%s=%s' % (field, _format(value)))
                    else:
                        args.append(_format(value))
            if include_attributes and node._attributes:
                for a in node._attributes:
                    try:
                        args.append('%s=%s' % (a, _format(getattr(node, a))))
                    except AttributeError:
                        pass
            return '%s(%s)' % (node.__class__.__name__, ', '.join(args))
        elif isinstance(node, list):
            return '[%s]' % ', '.join(_format(x) for x in node)
        return repr(node)
    if not isinstance(node, AST):
        raise TypeError("expected AST, got" + node.__class__.__name__)
    return _format(node)


@nocompile
def dump2(node, annotate_fields=True, include_attributes=False):
    """
    Return a formatted dump of the tree in *node*.  This is mainly useful for
    debugging purposes.  The returned string will show the names and the values
    for fields.  This makes the code impossible to evaluate, so if evaluation is
    wanted *annotate_fields* must be set to False.  Attributes such as line
    numbers and column offsets are not dumped by default.  If this is wanted,
    *include_attributes* can be set to True.
    """
    wide = False
    def nest(prefix, content):
        if content == '':
            return prefix
        nl_at_end = (content[-1] == '\n')
        if nl_at_end:
            content = content[:-1]
        indent = ' ' * len(prefix)
        return prefix+('\n'.join(list(map(lambda x:indent+x,content.split('\n')))).lstrip()+('\n' if nl_at_end else ''))
    def _format(node):
        if isinstance(node, str) or isinstance(node, int) or isinstance(node, float) or isinstance(node, bool) or isinstance(node, bytearray) or isinstance(node, bytes) or node is Ellipsis or node is None:
            return repr(node)
        elif isinstance(node, list):
            return nest('[',
                        ',\n'.join(list(map(_format, node)))+']')
        else:
            class_name = node.__class__.__name__
            fields = node._fields + node._attributes
            args = ',\n'.join([nest(name+'=',_format(getattr(node, name)))
                               for name in fields])
            if wide or len(fields) <= 1:
                return nest(class_name+'(',args)+')'
            else:
                return class_name+'(\n'+nest(' ',args)+')'
    #if not isinstance(node, AST):
    #    raise TypeError('expected AST, got %r' % node.__class__.__name__)
    return _format(node)


@nocompile
def iter_fields(node):
    """
    Yield a tuple of ``(fieldname, value)`` for each field in ``node._fields``
    that is present on *node*.
    """
    for field in node._fields:
        try:
            yield field, getattr(node, field)
        except AttributeError:
            pass


@nocompile
def iter_child_nodes(node):
    """
    Yield all direct child nodes of *node*, that is, all fields that are nodes
    and all items of fields that are lists of nodes.
    """
    for name, field in iter_fields(node):
        if isinstance(field, AST):
            yield field
        elif isinstance(field, list):
            for item in field:
                if isinstance(item, AST):
                    yield item

@nocompile
def show_ast(x):
    print(dump2(x, annotate_fields=True, include_attributes=True))
