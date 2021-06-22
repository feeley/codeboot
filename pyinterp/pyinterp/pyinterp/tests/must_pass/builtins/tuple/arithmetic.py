t1 = (1,2,3)
t2 = (5,6,7)
t3 = ()
t4 = (1,)

for t in [t1, t2, t3, t4]:
    for s in [t1, t2, t3, t4]:
        print(t + s)

for t in [t1, t2, t3, t4]:
    for x in [-1, 0, 1, 2, 3, 10, True, False]:
        print(t * x)
        print(x * t)