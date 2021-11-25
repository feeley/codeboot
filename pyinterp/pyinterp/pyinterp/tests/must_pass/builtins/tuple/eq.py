sample = [
    (),
    (1,),
    (1, 2, 3),
    (1, 2, 3, 4),
    ("foo", "bar", "baz"),
    (1, False, None, "baz"),
    None,
    1,
    [1, 2, 3],
]

for x in sample:
    for y in sample:
        print(x, "==", y, ":", x == y)