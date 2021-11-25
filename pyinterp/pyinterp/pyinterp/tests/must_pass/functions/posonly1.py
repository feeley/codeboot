def f(x, y, /):
    print(x, y)

print(f(1, 2))
print(f(*[1, 2]))
print(f(1, *[2]))