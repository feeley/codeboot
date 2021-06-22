lst1 = [1, 2, 3]
print(lst1.remove(1), lst1, len(lst1))
print(lst1.remove(2), lst1, len(lst1))
print(lst1.remove(3), lst1, len(lst1))

lst3 = [1, 2, 3, 3, 2, 1]
print(lst3.remove(1), lst3, len(lst3))
print(lst3.remove(2), lst3, len(lst3))
print(lst3.remove(1), lst3, len(lst3))

listy = [1,2,3]
listy.remove(3)
print(listy)
listy.append(3)
print(listy)
listy.remove(3)
print(listy)