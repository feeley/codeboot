def f(x):
    def g():
        print(x)

    g()

    x += 1

    g()

    return g


g1 = f(0)
g1()
g1()

g2 = f(10)
g2()
g2()
g1()
g2()