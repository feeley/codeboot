def f(x, y):
    print(x, y)

f(y=2, x=1)
f(2, y=3)

def g(x, y, **kwargs):
    print(x, y)
    print(kwargs.get('x'))
    print(kwargs.get('y'))
    print(kwargs.get('a'))
    print(kwargs.get('b'))
    print(kwargs.get('c'))
    print(kwargs.get('d'))
    print(kwargs.get('z'))

g(y=2, x=1)
g(2, y=3)
g(1, 2, z=4)
g(y=1, x=2, z=4)
g(3, z=5, y=4, a=10)
g(1, 2, a=1, b=2, c=3, d=4)
g(1, 2, b=1, d=2, c=3, a=4)
g(1, 2)
g(1, *(2,), z=5)
g(*(1, 2))

def h(x, y, z=10, *args, foo='foo', **kwargs):
    print(x, y, z, args, foo)
    print(kwargs.get('x'))
    print(kwargs.get('y'))
    print(kwargs.get('foo'))
    print(kwargs.get('bar'))
    print(kwargs.get('baz'))

h(1, 2, 9, 8, bar=98)
h(1, 2, 4, bar=99)
h(1, 8, z=4, foo=100)
h(x=1, y=6, foo=101)
h(1, z=2, y=9, bar='bar', baz=4200, foo=101)
h(*(1, 2, 9, 8), bar=200)
