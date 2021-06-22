def f():
    global x
    x += 1

x = 0

f()
print(x)
f()
print(x)