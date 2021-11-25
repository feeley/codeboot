## Integers

print(pow(2, 1))
print(pow(2, 3))
print(pow(-5, 1))

# Huge exponent
print(pow((-1), 9007199254740993))

#negative exponent
print(pow(2, -1))
print(pow(2, -2))
print(pow(2, -10))
print(pow((-2), -1))
print(pow((-2), -2))
print(pow((-2), -10))


# Huge negative exponent
print(pow((-2), -10000000000001))
print(pow((-2), -100000000000001))
print(pow((-2), -1000000000000001))
print(pow((-2), -10000000000000001))
print(pow((-2), -100000000000000001))

# Huge base
print(pow((-9007199254740993), 0))
print(pow((-9007199254740993), 1))
print(pow((-9007199254740993), 2))
print(pow((-9007199254740993), 3))

# with 3rd argument
print(pow(0,3,4))
print(pow(2,3,4))
print(pow(2,3,5))
print(pow(1,4,9007199254740993))
print(pow(1,9007199254740993,4))
print(pow(9007199254740993,2,4))

## Mixed
print(pow(2,3.0))
print(pow(2.0,3))
print(pow(2.0,3.0))

print(pow(2.0,1e3))
print(pow(2,1.1e2))
print(pow(2.0,1.1e2))

print(pow(2.0,1e309))
print(pow(2,1.1e309))
print(pow(2.0,1.1e309))

print(pow(1e309,2.0))
print(pow(1.1e309,2.0))
print(pow(1.1e309,2))

print(pow(2,-3.0))
print(pow(2.0,-3))
print(pow(2.0,-3.0))

print(pow(2.0,-1e3))
print(pow(2,-1.1e2))
print(pow(2.0,-1.1e2))

print(pow(2.0,-1e309))
print(pow(2,-1.1e309))
print(pow(2.0,-1.1e309))

print(pow(1e309,-2.0))
print(pow(1.1e309,-2.0))
print(pow(1.1e309,-2))

print(pow(1.0,1e400))
print(pow(1.0,-1e400))
print(pow(-1.0,1e400))
print(pow(-1.0,-1e400))
