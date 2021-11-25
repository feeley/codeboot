import functools

reduce = functools.reduce

print(reduce(print, range(10)))