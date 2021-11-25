for start in (-100, -25, -5, -1, 0, 1, 2, 3, 4, 50, 100):
    for stop in (-100, -25, -5, -1, 0, 1, 2, 3, 4, 50, 100):
        for step in (-10, -5, -2, -1, 1, 2, 3, 5, 50, 1000):
            print(len(range(start, stop, step)))