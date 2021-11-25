def f():
    class A:
        global x
        x = 1
        print(x)

f()
print(x)