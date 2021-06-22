def f():
    global x
    return lambda: print(x)

f()()