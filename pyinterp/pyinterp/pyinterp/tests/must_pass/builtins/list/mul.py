t1 = [1, 2, 3]
t2 = []
t3 = [1]

for t in [t1, t2, t3]:
    for x in [-1, 0, 1, 2, 3, 10, True, False]:
        print(t * x)
        print(x * t)