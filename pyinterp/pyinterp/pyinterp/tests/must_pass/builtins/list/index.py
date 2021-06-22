lst = [1, "foo", False]

print(lst.index(1))
print(lst.index("foo"))
print(lst.index(False))

print(lst.index(1, 0, 3))
print(lst.index("foo", 0, 3))
print(lst.index(False, 0, 3))

print(lst.index(1, 0, 1))
print(lst.index("foo", 1, 2))
print(lst.index(False, 1, 3))

print(lst.index("foo", 0, 1000))
print(lst.index("foo", -1000))
print(lst.index("foo", -1000, 1000))

print(lst.index(1, -3, -1))
print(lst.index("foo", -2, -1))
print(lst.index(False, -10))

print(list(range(10000)).index(9999))