try:
    raise ValueError
except TypeError:
    print("foo")
else:
    print("bar")

print("baz")
