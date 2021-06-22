
# test de bytearray avec un seul argument

a = bytearray(255)
b = bytearray(300)
c = bytearray(0)
h = bytearray()
# set item

a[10] = 3
a[8] = 4
a[3] = 0

a[254] = 0

a[-254] = 0
a[-255] = 0

# get item

z = a[-4]


g = 1
for i in range(0, 255):
    g += a[i]

#append

y=bytearray()
for i in range (0, 255):
    y.append(i)

for i in range(-255, 254):
    print(y[i])


#iter

for b in y:
    print(b)

# mul

print(len(y))
print(len(y*3))
for i in y*3:
    print(i)

# imul
y*=3
for i in range(-len(y), len(y)):
    print(y[i])

#add

x1 = []
for i in range(1, 3):
    b=bytearray(i)
    b[0]=1
    b[-1]=1
    x1.append(b)

for i in range(2):
    for j in range(2):
        z=x1[i]+x1[j]
        for k in range(len(z)):
            print(z[k])

#iadd 

x=bytearray()
for i in range(255):
    x.append(255-i-1)

x+=bytearray(0)
x+=bytearray(1)
x+=y

for i in range(len(x)):
    print(x[i])

#slice get


l2 = bytearray(4)
l2[0] = 1
l2[1] = 2
l2[2] = 3
l2[3] = 4

for start in range(-5, 5):
    for stop in range(-5, 5):
        for step in range(1, 2):
            tests = l2[start:stop:step] + l2[:stop:step] + l2[start::step] + l2[start:stop] + l2[::step] + l2[start::]
            for byte in tests:
                print(byte)

#test comparison

a = bytearray(4)
b = bytearray(4)
a[0] = 1
a[1] = 2
a[2] = 3
a[3] = 4
b[0] = 1
b[1] = 2
b[2] = 3
b[3] = 4


print(a < b)
print(a > b)
print(a <= b)
print(a >= b)
print(a == b)
print(a != b)

a.append(5)

print(a < b)
print(a > b)
print(a <= b)
print(a >= b)
print(a == b)
print(a != b)

b.append(6)

print(a < b)
print(a > b)
print(a <= b)
print(a >= b)
print(a == b)
print(a != b)

# count

x=bytearray(10)
x[0] = 10
x[2] = 3


print(x.rfind(10))
print(x.rfind(10, 2, 3))
print(x.rfind(0))
print(x.rfind(0, 3))
print(x.rfind(3))
print(x.rfind(3, 3, 3))
print(x.find(10))
print(x.find(10, 2, 3))
print(x.find(0))
print(x.find(0, 3))
print(x.find(3))
print(x.find(3, 3, 3))
print(x.index(10))
print(x.index(0))
print(x.index(0, 3))
print(x.index(3))
print(x.rindex(10))
print(x.rindex(0))
print(x.rindex(0, 3))
print(x.rindex(3))


# Extended slices
l1=bytearray()
for i in [1,2,3,4,5,6]:
    l1.append(i)

for i in l1:
    print(i)

l1[1:4:2] = [9, 10]
for i in l1:
    print(i)

l1[-1::-2] = [0, 1, 2]
for i in l1:
    print(i)

l1[::-1] = [0, 0, 0, 0, 0, 0]
for i in l1:
    print(i)

l1[1:3:-1] = []
for i in l1:
    print(i)

l1[5:0:-3] = [11, 12]
for i in l1:
    print(i)


# Simple slices (step=1)
l2=bytearray()
for i in [1,2,3,4,5,6,7,8]:
    l2.append(i)
for i in l2:
    print(i)
l2[0:3] = [11, 12, 13]
for i in l2:
    print(i)

l2[0:3] = [1, 2, 3, 4, 5, 6]
for i in l2:
    print(i)

l2[0:3] = [42]
for i in l2:
    print(i)

l2[:] = [9, 8, 7]
for i in l2:
    print(i)

l2[::-1] = [10, 11, 12]
for i in l2:
    print(i)

# Set slice to iterable
l3 = bytearray()
l3[:] = range(10)
for i in l3:
    print(i)

l3[:5] = [0, 0, 0, 0, 0]
for i in l3:
    print(i)

l3[7:1:-2] = (1, 2, 3)
for i in l3:
    print(i)
