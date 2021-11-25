for x in range(10):
    try:
        if x == 5:
            print("break")
            break
        print(x)
    finally:
        print("breaking bad!")