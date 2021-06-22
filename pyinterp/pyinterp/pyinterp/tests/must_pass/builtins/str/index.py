sample = ["fooo", "foo1", "1foo", "abcabcabc", ""]
targets = ["o", "1", "bca", ""]
starts = [-2, -1, None, 0, 1, 2, 5, 10]
stops = [-2, -1, None, 0, 1, 2, 5, 10]

for word in sample:
    for sub in targets:
        for start in starts:
            for stop in stops:
                if word.find(sub, start, stop) >= 0:
                    print(word, sub, start, stop)
                    print(word.index(sub, start, stop))

for word in sample:
    for sub in targets:
        for start in starts:
            if word.find(sub, start) >= 0:
                print(word, sub, start)
                print(word.index(sub, start))

for word in sample:
    for sub in targets:
        if word.find(sub) >= 0:
            print(word, sub)
            print(word.index(sub))

for word in sample:
    for sub in targets:
        for start in starts:
            for stop in stops:
                if word.find(sub, start, stop) >= 0:
                    print("r", word, sub, start, stop)
                    print(word.rindex(sub, start, stop))

for word in sample:
    for sub in targets:
        for start in starts:
            if word.find(sub, start) >= 0:
                print("r", word, sub, start)
                print(word.rindex(sub, start))

for word in sample:
    for sub in targets:
        if word.find(sub) >= 0:
            print("r", word, sub)
            print(word.rindex(sub))
