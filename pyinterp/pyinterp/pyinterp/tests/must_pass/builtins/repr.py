l1 = []
l1.append(l1)
print(l1)
l1.append([])
print(l1)

l2 = []
t2 = (l2,)
l2.append(t2)
print(l2)
print(t2)

l3 = [1,2,3]
l4 = [l3, l3, l3]
print(l3)
print(l4)