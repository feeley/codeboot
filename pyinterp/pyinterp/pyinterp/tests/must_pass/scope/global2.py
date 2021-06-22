def f(x):
    def g():
        global x
        print(x)

    def h():
        nonlocal x
        print(x)

    return g, h

x = 123
g, h = f(42)

g()
h()