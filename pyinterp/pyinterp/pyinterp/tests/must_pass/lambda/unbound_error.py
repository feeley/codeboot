def f():
    if False:
        x = 1
    return lambda : x

f()()