lst = [1, 2, 3, 4]
for i in lst:
    for j in lst:
        if i + j == 3 or i + j == 5:
            continue
        if i + j == 6:
            break
        print(i, j)
    if i == 3:
        break
