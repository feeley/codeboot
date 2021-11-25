def f():
    x = 0
    class A:
        x = 9
        class B:
            nonlocal x
            print(x)
            x = 1
            print(x)
    print(x)

f()