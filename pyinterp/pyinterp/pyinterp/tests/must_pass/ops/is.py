x = 1
print(x.__class__ is int)
print(x.__class__ is str)

print(x.__class__ is not str)
print(x.__class__ is int)

x = True
print(x is True)
print(x is False)
print(x is not True)
print(x is not False)

x = False
print(x is True)
print(x is False)
print(x is not True)
print(x is not False)

x = None
print(x is None)
print(x is not None)

x = object()
print(object() == object())
print(object() != object())
print(x == x)
print(x != x)
