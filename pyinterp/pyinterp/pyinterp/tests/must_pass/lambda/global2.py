def f():
    global x
    return lambda: print(x)

l = f()
x = 42
l()