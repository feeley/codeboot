lst = list(range(5,55))

starts_stops = list(range(-75, 75, 27)) + [0, None, True, False, 1, -1]
steps = [-10000, -2, -1, None, 1, 2, 7, 34, 10000]

for start in starts_stops:
    for stop in starts_stops:
        for step in steps:
            print(start, stop, step)
            new_lst = lst.copy()
            new_lst[start:stop:step] = range(*slice(start, stop, step).indices(len(new_lst)))
            print(new_lst)


lst2 = []
lst2[:] = [1, 2, 3, 4, 5, 6, 7, 8]
print(lst2)