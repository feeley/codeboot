def f(x):
    print(x)

f(0)
f(1)
f(10)
f("hello")
f("")

def f(x, y):
    print(x+y)

f(0, 1)
f(1, 1)


y = 42
def f():
    print(y)

f()

def g():
    print(y)

def h(g):
    g()

h(g)

def f(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z):
    print(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z)

f(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5)

over=12
def f(over):
    print(over)

f(42)

def f():
    pass

def g():
    return

print(f())
print(g())

def f(x):
    return x

print(f(42))

def f(x):
    return "24"

print(f(42))

