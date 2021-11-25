def g():
    def f():
        nonlocal x
        return x
x = 1
g()