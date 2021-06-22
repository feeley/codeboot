d = {1: 'foo', 3: 'bar', 2: 'baz'}

d[4] = 'buzz'
d[6] = 'fizz'
d[5] = 'wibble'

for key in d:
    d[9] = 7
    print(key)
