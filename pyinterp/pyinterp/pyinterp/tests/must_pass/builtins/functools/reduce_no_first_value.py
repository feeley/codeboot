import functools

reduce = functools.reduce

print(reduce(lambda acc, x: acc + x, range(0)))