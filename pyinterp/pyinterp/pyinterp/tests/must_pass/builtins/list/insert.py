lst1 = []
lst1.insert(0, 42)
print(lst1)
lst1.insert(0, 41)
print(lst1)
lst1.insert(0, 40)
print(lst1)

lst1.insert(2, 1)
print(lst1)
lst1.insert(2, 2)
print(lst1)
lst1.insert(2, 3)
print(lst1)

lst1.insert(-5, "foo")
print(lst1)
lst1.insert(-5, "bar")
print(lst1)
lst1.insert(-5, "baz")
print(lst1)

lst1.insert(-100, "qzz")
print(lst1)