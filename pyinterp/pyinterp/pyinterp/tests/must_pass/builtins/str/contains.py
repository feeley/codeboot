strings = ["", "foo", "bar", "foobar", "1234", "11234"]
substrings = ["", "f", "1", "bar", "4", "ar", "o"]

for st in strings:
    for sub in substrings:
        print(st, sub)
        print(sub in st)
        print(st in sub)
