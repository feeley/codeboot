# and

print(0b1100 & 0b1010)
print(0b0011 & 0b0010)
print(0b1111111111111111 & 0b1101010001)
print(0b0 & 0b11111111111)

x = 0b1100
y = 0b1010
x &= y
print(x)
print(y)

x = 0b0
y = 0b1111111111
x &= y
print(x)
print(y)

# or

print(0b1100 | 0b1010)
print(0b0011 | 0b0010)
print(0b1111111111111111 | 0b1101010001)
print(0b0 | 0b11111111111)

x = 0b111111111111111
y = 0b1010101001001
x |= y
print(x)
print(y)


x = 0b0
y = 0b1111111111
x |= y
print(x)
print(y)
# xor

print(0b1100 ^ 0b1010)
print(0b0011 ^ 0b0010)
print(0b1111111111111111 ^ 0b1101010001)
print(0b0 ^ 0b11111111111)

x = 0b111111111111111
y = 0b1010101001001
x ^= y
print(x)
print(y)


x = 0b0
y = 0b1111111111
x ^= y
print(x)
print(y)
# lshift

print(0b1 << 0)
print(0b1 << 1)
print(0b10010000110 << 2)
print(0b10010011001 << 256)

x = 0b10010000110
y = 2
x <<= y
print(x)
print(y)

x = 0b10010011001
y = 256
x <<= y
print(x)
print(y)

# rshift

print(0b10101010000111001010 >> 0)
print(0b10101010000111001010 >> 1)
print(0b10101010000111001010 >> 2)
print(0b10101010000111001010 >> 256)

x = 0b1010100000111001010
y = 2
x >>= y
print(x)
print(y)


x = 0b1010100000111001010
y = 256
x >>= y
print(x)
print(y)
