lst = []
lst.extend(range(10))
print(lst)

lst += (1,2,3)
print(lst)

lst += [1,2,3,4]
print(lst)

for _ in range(8):
    lst.append(0)
    print(lst)

lst1 = []
lst2 = lst1

lst1 += range(10)

print(lst1, lst2)

lst1 += lst1

print(lst1, lst2)

lst1 += [5, 6, 7]

print(lst1, lst2)