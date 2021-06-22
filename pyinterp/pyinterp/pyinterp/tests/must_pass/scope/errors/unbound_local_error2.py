def f(c):
    def g():
        nonlocal x
        print(x)

    if c:
        x = 42

    return g

f(False)()