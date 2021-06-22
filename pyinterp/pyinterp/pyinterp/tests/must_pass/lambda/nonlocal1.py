def f():
    foo = "foo"
    def g():
        nonlocal foo
        return lambda: print(foo)
    g()()
    foo = "bar"
    g()()
    return g

g = f()
g()()