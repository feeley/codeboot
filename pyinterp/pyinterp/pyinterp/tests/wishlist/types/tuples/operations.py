print((1, 2, 3) + (2, 3, 4))
print((1, 2, 3) + ())

print((1, 2, 3) * 3)
print((1, 2, 3) * 0)
print(() * 7)

print(1 in (1, 2, 3))
print(1 in (2, 3, 4))
print(1 not in (1, 2, 3))
print(1 not in (2, 3, 4))

print(len((1, 2, 3)))
print(len(()))
print(len((1, 2, 3) * 10))

t = (1, 2, 3)
print(t[0])
print(t[1])
print(t[2])
print(t[-1])
print(t[-2])
print(t[-3])

t2 = (1, 1, 2, 3, 4, 5, 1)
print(t2.count(1))
print(t2.count(2))
print(t2.count(10))

print(t2.index(1))
print(t2.index(5))

t3 = (1, 2, 3, 1, 2, 3, 1, 2, 3)

print(
    t3.index(1),
    t3.index(1, 4),
    t3.index(2, 4, 7),
    t3.index(2, 4, 1000),
    t3.index(2, -1000, 1000))

t4 = (1, 2, 3, 4)
for start in range(-5, 5):
    for stop in range(-5, 5):
        for step in range(1, 2):
            print(t4[start:stop:step])
            print(t4[:stop:step])
            print(t4[start::step])
            print(t4[start:stop])
            print(t4[::step])
            print(t4[start::])
