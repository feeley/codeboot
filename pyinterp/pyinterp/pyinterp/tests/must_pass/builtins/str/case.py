sample = ["foo", "bar", "BAZ", "wUz", "(foo)", "(foo, BAR, BaZ)", "12345abcde", "!@#$%?&*()qWeRtY"]

for word in sample:
    print(word.upper())
    print(word.lower())
    print(word.swapcase())