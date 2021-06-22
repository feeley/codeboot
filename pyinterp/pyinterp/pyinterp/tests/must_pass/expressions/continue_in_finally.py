for x in range(10):
    try:
        if x == 5:
            print("continue")
            continue
        print(x)
    finally:
        print("continuing bad?")