def make_adder(x):
    return lambda y: x + y

adder = make_adder(10)

print(adder(1))
print(adder(2))
print(adder(3))

f = lambda x, y: x + y

print(f(1, 4))
