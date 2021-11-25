l = [None] * 100
for _ in range(100):
    del l[0]

print(l)

for _ in range(100):
    l.append(42)

print(l)

for _ in range(50):
    del l[0]

print(l)

for _ in range(250):
    l.append(42)

print(l)
