def f1(x):
    def g():
        nonlocal x
        print(x)

        def h():
            global x
            print(x)
        return h
    return g

x = 10
f1(11)()()

def f2(y):
    def g():
        global y
        print(y)

        def h(y):
            def i():
                nonlocal y
                print(y)
            return i
        return h
    return g

y = 13
f2(11)()(12)()