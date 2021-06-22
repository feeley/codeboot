def f():
    x = 0
    class A:
        nonlocal x
        x = 1
        print(x)

    print(x)

f()