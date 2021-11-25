def f():
    class A:
        x = 1
        print(x)
    return A

print(f().x)