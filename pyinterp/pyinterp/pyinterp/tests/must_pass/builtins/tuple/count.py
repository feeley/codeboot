tp = (1, 2, 3, 4, 1, 2, 3, 4, 2, 3, 4, "foo", "bar", None, True, False, -42, [], [1, 2, 3])

for x in [1, 2, 3, 4, "foo", "bar", "baz", None, True, False, -1, [], ()]:
    print(x,  ":", tp.count(x))

tp2 = tuple(range(10000))
print(tp2.count(9999))