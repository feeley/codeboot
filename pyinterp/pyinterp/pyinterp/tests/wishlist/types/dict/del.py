d = {1: 'foo', 2: 'bar', 3: 'baz'}

print(list(d))
del d[1]
print(list(d))
del d[3]
print(list(d))

d[3] = 'qux'
d[1] = 'quux'

print(list(d))
