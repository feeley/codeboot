for sign in (-1, 1):
    for x in (0, 1,2,3,4,5,6,7,8,9,10):
        for y in (1,2,3,4,5,6,7,8,9,10):
            z = sign * (x * 10 + y)
            print(math.ceil(z))

for sign in (-1, 1):
    for x in (0, 1,2,4,5,6,7,8,10):
        for y in (1,2,3,5,6,8,9,10):
            for w in (0, 4, 5, 6, 8):
                # float multiplication makes z a float
                z = sign * (x * 10.0 + y) + w / 10
                print(math.ceil(z))