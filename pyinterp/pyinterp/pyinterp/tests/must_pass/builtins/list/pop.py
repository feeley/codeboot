lst1 = [1, 2, 3]
print(lst1.pop(), lst1, len(lst1))
print(lst1.pop(), lst1, len(lst1))
print(lst1.pop(), lst1, len(lst1))

lst2 = [4, 5, 6]
print(lst2.pop(0), lst2, len(lst2))
print(lst2.pop(0), lst2, len(lst2))
print(lst2.pop(0), lst2, len(lst2))

lst3 = [1, 2, 3, 4, 5, 6]
print(lst3.pop(3), lst3, len(lst3))
print(lst3.pop(4), lst3, len(lst3))
print(lst3.pop(1), lst3, len(lst3))

lst4 = [11, 22, 33, 44, 55, 66]
print(lst4.pop(-3), lst4, len(lst4))
print(lst4.pop(-4), lst4, len(lst4))
print(lst4.pop(-1), lst4, len(lst4))

lst = list(range(10))
print(lst)

for _ in range(5):
    for x in range(4):
        lst.append(x)
    print(lst)
    for y in range(6):
        lst.pop()
    print(lst)