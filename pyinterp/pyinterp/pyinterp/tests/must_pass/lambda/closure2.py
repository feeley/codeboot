def subber(n):
    f = lambda x: x + n
    n = - n
    return f

sub3 = subber(3)
print(sub3(10))