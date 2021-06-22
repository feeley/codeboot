#representation
print(None)
repr(None)
x = None

#truthness
if None:
    print("oops")
else:
    print("foo!")

#uniqueness
x = None
y = type(None)()
print(x is y)