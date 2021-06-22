def fn1(x):
    return x + 1

def fn2(x, y):
    return x + y

it1 = [1, 2, 3, 4, 5]
it2 = [5, 6, 7, 8, 9]

it3 = [1, 2, 3]
it4 = [5, 6, 7, 8, 9]

it5 = range(10)

print(list(map(fn1, it1)))
print(list(map(fn2, it1, it2)))
print(list(map(print, it1, it2, it3)))

for x in map(fn2, it4, it5):
    print(x)