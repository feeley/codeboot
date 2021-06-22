lst1 = [1,2,3]
lst2 = lst1.copy()

print(lst1 is lst2)
lst1[0] = 9

print(lst1)
print(lst2)