def f1(x):
    if x > 0:
        try:
            print("try:", x)
        finally:
            return f1(x - 1)
    else:
        return x

print(f1(5))


def f2(x):
    def g(x):
        return 100 * x

    try:
        print("try:", g(x))
    finally:
        if x > 0:
            return f2(x - 1)
        else:
            return g(x)

print(f2(5))