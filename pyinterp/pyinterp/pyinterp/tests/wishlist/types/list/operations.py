print([1, 2, 3])
print([1, 2, 3] + [1, 2, 3])
print([1, 2, 3] + [])
print([] +  [1, 2, 3])
print([1, 2, 3] + [4, 5, 6] + [7, 8, 9])

print([1, 2, 3] * 5)
print(4 * [6, 7, 8])
print(2 * [])
print(0 * [1, 2, 3])

l = [1, 2, 3]
print(len(l))
print(len(l + l))
print(len(8 * l))
print(len([]))
print(len([] * 9))
print(len(l + l + 8 * l))
print(len(l * 0))

l2 = [1, 2, 3]
l3 = l2
l2 += [1, 2, 3]
print(l2, l3)

l2 += (1, 2, 3)
print(l2, l3)

l2 += range(5)
print(l2, l3)

l4 = [1, 2, 3]
l5 = l4
l4 *= 2
print(l4, l5)
