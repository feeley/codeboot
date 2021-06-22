strings = ['banana', 'foo', '', ' ', 'bar-baz', 'a'*20, '12345']
patterns = ['a', '', 'b', 'aa', 'oo', '1', ' ']
replacements = ['a', 'b', 'cc', 'ddd', ', ', '', '-----']

for s in strings:
    for p in patterns:
        for r in replacements:
            print(s.replace(p, r))