# Extended slices
l1=[1,2,3,4,5,6]
print(l1)

l1[1:4:2] = [9, 10]
print(l1)

l1[-1::-2] = [0, -1, -2]
print(l1)

l1[::-1] = [0, 0, 0, 0, 0, 0]
print(l1)

l1[1:3:-1] = []
print(l1)

l1[5:0:-3] = [11, 12]
print(l1)


# Simple slices (step=1)
l2 = [1, 2, 3, 4, 5, 6, 7, 8]
print(l2)

l2[0:3] = [11, 12, 13]
print(l2)

l2[0:3] = [-1, -2, -3, -4, -5, -6]
print(l2)

l2[0:3] = [42]
print(l2)

l2[:] = [9, 8, 7]
print(l2)

l2[::-1] = [10, 11, 12]
print(l2)

# Set slice to iterable
l3 = []
l3[:] = range(10)
print(l3)

l3[:5] = [0, 0, 0, 0, 0]
print(l3)

l3[7:1:-2] = (-1, -2, -3)
print(l3)
