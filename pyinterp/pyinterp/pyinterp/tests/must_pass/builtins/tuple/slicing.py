tpl = tuple(range(100))

starts_stops = list(range(-150, 150, 27)) + [0, None, True, False, 1, -1]
steps = [-10000, -10, -5, -2, -1, None, 1, 2, 5, 10, 7, 34, 10000]

for start in starts_stops:
    for stop in starts_stops:
        for step in steps:
            print(start, stop, step, ":", tpl[start:stop:step])