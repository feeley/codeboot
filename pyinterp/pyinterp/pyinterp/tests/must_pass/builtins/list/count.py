lst = [1, 2, 3, 4, 1, 2, 3, 4, 2, 3, 4, "foo", "bar", None, True, False, -42, [], [1, 2, 3]]

for x in [1, 2, 3, 4, "foo", "bar", "baz", None, True, False, -1, [], ()]:
    print(x,  ":", lst.count(x))

lst2 = list(range(10000))
print(lst2.count(9999))