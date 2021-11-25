for sign in (-1, 1):
    for x in (0, 1,2,3,4,5,6,7,8,9,10):
        for y in (1,2,3,4,5,6,7,8,9,10):
            z = sign * (x * 10 + y)
            for r in (-3, -2, -1, 0, 1, 2, 3):
                print(round(z, r))

for sign in (-1, 1):
    for x in (0, 1,2,4,5,6,7,8,10):
        for y in (1,2,3,5,6,8,9,10):
            for w in (0, 4, 5, 6, 8):
                # float multiplication makes z a float
                z = sign * (x * 10.0 + y) + w / 10
                for r in (-3, -2, -1, 0, 1, 2, 3):
                    print(round(z, r))

print(round(2.5))
print(round(3.5))
print(round(4.4))
print(round(-5.6))
print(round(-5.4))
print(round(math.pi, 3))