for start in range(-4, 5, 2):
    for stop in range(-5, 12, 4):
        for step in range(-3, 4, 2):
            lst = [1, 2, 3, 4, 5, 6]
            del lst[start:stop:step]
            print(lst)

lst = [1, 2, 3, 4, 5]
del lst[:]
print(lst)

lst = [1, 2, 3, 4, 5]
del lst[::-2]
print(lst)
