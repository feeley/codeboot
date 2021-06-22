tpl = (1, "foo", False)

print(tpl.index(1))
print(tpl.index("foo"))
print(tpl.index(False))

print(tpl.index(1, 0, 3))
print(tpl.index("foo", 0, 3))
print(tpl.index(False, 0, 3))

print(tpl.index(1, 0, 1))
print(tpl.index("foo", 1, 2))
print(tpl.index(False, 1, 3))

print(tpl.index("foo", 0, 1000))
print(tpl.index("foo", -1000))
print(tpl.index("foo", -1000, 1000))

print(tpl.index(1, -3, -1))
print(tpl.index("foo", -2, -1))
print(tpl.index(False, -10))

print(tuple(range(10000)).index(9999))