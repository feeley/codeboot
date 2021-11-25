for r in range(5):
    for i in range(r):
        print(i)
        if i == 2:
            print("continue")
            continue
        else:
            print("break")
            break

        print('after if')
    else:
        print('else')