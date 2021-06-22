def f(*args):
    for a in args:
        for b in args:
            for c in args:
                print(a if b else c)

f(1, True, False, 0, 10)
