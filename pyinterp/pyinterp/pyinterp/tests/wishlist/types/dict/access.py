d = {1: 'foo', 2: 'bar', 3: 'baz'}

print(len(d))

print(d[1])
print(d[2])
print(d[3])

d[4] = 'fizz'
d[5] = 'buzz'
d[6] = 'spam'
d[7] = 'blah'
d[8] = 'wibble'
d[9] = 'thingy'
d[10] = 'thangy'

print(len(d))

print(d[1])
print(d[2])
print(d[3])
print(d[4])
print(d[5])
print(d[6])
print(d[7])
print(d[8])
print(d[9])
print(d[10])

print(d.get(1, False))
print(d.get(10, False))
print(d.get(100, False))

d2 = {"foo": 1, "bar": 2, "baz": 3}

for k in d2:
    print(k)
    print(d2[k])

d2["foo"] = 10
del d2["bar"]
d2["bar"] = 20

for k in d2:
    print(k)
    print(d2[k])
