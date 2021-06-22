def f():
    x = []
    global A
    class A:
        nonlocal x
        y = x
    x.append(1)

f()
print(A.y)