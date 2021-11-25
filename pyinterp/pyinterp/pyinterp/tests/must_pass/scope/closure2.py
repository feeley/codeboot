def f(x):
    def g():
        def h(y):
            nonlocal x
            x = y

        return h

    def print_x():
        print(x)

    return g, print_x


g1, print_x1 = f(0)
h1 = g1()

print_x1()
h1(42)
print_x1()

g2, print_x2 = f(5)

h2 = g2()

print_x2()
h2(-42)
print_x2()

