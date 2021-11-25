def f(x, y, z=1):
    print(x + y + z)

f(1, 2, 3)
f(4, 5)

glo = 9

def g(x=glo):
    print(glo)

g()

def h(x=7*6):
    print(x)

h()
