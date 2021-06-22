def cache(func):
    def wrapper(x, cache=[]):
        for entry in cache:
            key = entry[0]
            result = entry[1]
            if x == key:
                return result
        result = func(x)
        cache.append((x, result))
        return result
    return wrapper

def f(x):
    print("f() was called")
    return 2 * x

cached_f = cache(f)
cached_f2 = cache(f)

print(cached_f(1))
print(cached_f(1))
print(cached_f(2))
print(cached_f2(1))
print(cached_f2(1))
print(cached_f2(2))

print(cached_f(1, []))
print(cached_f(1, []))
print(cached_f2(1, []))
print(cached_f2(1, []))
