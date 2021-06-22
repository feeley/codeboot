r1 = range(10)
r2 = range(4, 7)
r3 = range(1, 9, 2)
print(len(r1))
print(len(r2))
print(len(r3))
print(1 in r1)
print(10 in r1)
print(2 in r3)
print(3 in r3)

r = range(5)

i = iter(r)

x = next(i, 999)

while x != 999:
    print(x)
    x = next(i, 999)

for x in range(1, 100, 3):
    print(x)

q = range(9, -5, -3)
for x in range(-10, 10):
    print(x in q)
