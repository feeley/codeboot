print(format(1, "+"))
print(format(-120, "+"))
print(format(1, "<"))
print(format(1, ">"))
print(format(1, "="))
print(format(1, "10"))
print(format(1, ""))
print(format(1))

print(format(1.0, "0.3"))
print(format(42.42, "42.42"))
print(format(-42.0, "+10.0"))

print(format(32, "b"))
print(format(32, "d"))
print(format(32, "o"))
print(format(32, "x"))
print(format(32, "X"))
print(format(32, "n"))

hello = "world"
world = "hello"
print(f"{hello} {world}")

hello = 0
world = 42
print(f"{hello} {world}")

hello = 0.0
world = 42
print(f"{hello} {world}")

hello = 0.0
world = 42.3
print(f"{hello} {world}")

print("{hello} {world}".format(world = world, hello = hello))

#more to test here
