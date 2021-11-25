def f():
    global x
    def g():
        nonlocal x
        return x
    return g

x = 1
f()