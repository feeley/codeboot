def f():
    x = 1

    def g():
        nonlocal x
        x += 1
        return x

    print(x)
    return g


g1 = f()
print(g1())
print(g1())
print(g1())

g2 = f()
print(g2())
print(g2())
print(g2())

print(g1())
print(g1())