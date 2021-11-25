def do():
    f = lambda x: x + 1
    print(f(0))

    compose_n = lambda f, n: f if n == 1 else lambda x: f(compose_n(f, n - 1)(x))

    f2 = compose_n(f, 2)
    f3 = compose_n(f, 3)
    print(f2(0))
    print(f3(0))

    return f3


print(do()(10))