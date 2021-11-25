def is_big(x):
    return x > 2

def is_even(x):
    return x % 2 == 0

print(list(filter(is_big, [0,1,2,3,4,5,6,7])))
print(list(filter(is_big, range(10))))

print(list(filter(is_even, [0,1,2,3,4,5,6,7])))
print(list(filter(is_even, range(10))))

print(list(filter(print, [0,1,2,3,4,5,6,7])))
print(list(filter(print, range(10))))

print(list(filter(None, [0,1,2,3,4,5,6,7])))
print(list(filter(None, range(10))))
print(list(filter(None, ["", "bar", (), ("baz",), [], ["foo"], 0, 1, True, False, None])))
