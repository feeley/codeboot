strings = ["", "foo", "bar", "foobar", "1234", "11234"]
substrings = ["", "f", "1", "bar", "4", "ar", "o", ("f", "b"), ("foo", "x"), ("", "!"), ("2", "3", "4")]
starts = [-1, 0, 1, 2, 3]
stops = [-1, 0, 1, 2, 3]

for st in strings:
    for sub in substrings:
        for i in starts:
            for j in stops:
                print(st, sub, i, j)
                print(st.endswith(sub, i, j))