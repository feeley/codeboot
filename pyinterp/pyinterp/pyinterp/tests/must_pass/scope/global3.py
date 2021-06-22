def f():
    global x
    def g():
        x = 1
        print(x)
    return g

f()()