sample = list(range(-5, 5, 2)) + [None, 1000, -1000, 0]
step_sample = list(range(-5, 5, 2)) + [None, 1000, -1000]

for start in sample:
    for stop in sample:
        for step in step_sample:
            for len_ in range(0, 10, 2):
                s = slice(start, stop, step)
                print(s, len_, "--->", s.indices(len_))