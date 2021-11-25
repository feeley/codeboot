strings = ["foo", "  foo  ", "abfooab", "", "foo  foo", " \n \t"]
chars = ["f", " ", None, "a", "ab", "o", "fo", "x"]

for s in strings:
    print(s, "NO ARGUMENT")
    print(s.strip())
    print(s.lstrip())
    print(s.rstrip())
    for c in chars:
        print(s, c)
        print(s.strip(c))
        print(s.lstrip(c))
        print(s.rstrip(c))
