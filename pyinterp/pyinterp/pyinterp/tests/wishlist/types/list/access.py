l1 = [1, 2, 3]
print(l1[0])
print(l1[1])
print(l1[2])
print(l1[-1])
print(l1[-2])
print(l1[-3])

l1[0] = 42
l1[-1] = 43

print(l1)

del l1[0]

print(len(l1))
print(l1)

del l1[-1]

print(len(l1))
print(l1)

del l1[0]

print(l1)

l2 = [1, 2, 3, 4]

for start in range(-5, 5):
    for stop in range(-5, 5):
        for step in range(1, 2):
            print(l2[start:stop:step])
            print(l2[:stop:step])
            print(l2[start::step])
            print(l2[start:stop])
            print(l2[::step])
            print(l2[start::])

l3 = l2[:]
l3[0] = 42
print(l2, l3)
