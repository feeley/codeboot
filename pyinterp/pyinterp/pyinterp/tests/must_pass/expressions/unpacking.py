print(*[1,2,3])
type(print).__call__(print, *[1, 2])

for x in range(10):
    print(*x*"0")