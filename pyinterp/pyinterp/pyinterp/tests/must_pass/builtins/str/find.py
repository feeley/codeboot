sample = ["fooo", "foo1", "1foo", "abcabcabc", ""]
targets = ["o", "1", "bca", ""]
starts = [-2, -1, None, 0, 1, 2, 5, 10]
stops = [-2, -1, None, 0, 1, 2, 5, 10]

for word in sample:
    for sub in targets:
        for start in starts:
            for stop in stops:
                print(word, sub, start, stop)
                print(word.find(sub, start, stop))

for word in sample:
    for sub in targets:
        for start in starts:
            print(word, sub, start)
            print(word.find(sub, start))

for word in sample:
    for sub in targets:
        print(word, sub)
        print(word.find(sub))

for word in sample:
    for sub in targets:
        for start in starts:
            for stop in stops:
                print("r", word, sub, start, stop)
                print(word.rfind(sub, start, stop))

for word in sample:
    for sub in targets:
        for start in starts:
            print("r", word, sub, start)
            print(word.rfind(sub, start))

for word in sample:
    for sub in targets:
        print("r", word, sub)
        print(word.rfind(sub))