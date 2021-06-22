lst1 = [1,2,3] + [4,5,6]
print(lst1)
for x in range(15):
    lst1.append(x)
    print(lst1)

lst2 = [1,2,3]
lst3 = [4,5,6]

lst4 = lst2 + lst3

print(lst2, lst3, lst4)
lst2[0] = None
print(lst2, lst3, lst4)
lst3[0] = None
print(lst2, lst3, lst4)
lst4[0] = None
print(lst2, lst3, lst4)