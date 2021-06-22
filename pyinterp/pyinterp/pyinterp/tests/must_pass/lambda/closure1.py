def adder(n):
    return lambda x: x + n

add2 = adder(2)
print(add2(10))