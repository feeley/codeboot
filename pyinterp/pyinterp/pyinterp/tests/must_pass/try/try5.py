def f():
    try:
        raise ValueError
        print("foo")
    except ValueError:
        print("bar")
    except:
        print("baz")
    else:
        print("qux")
        return 6

def g():
    try:
        raise TypeError
        print("foo")
    except ValueError:
        print("bar")
    except:
        print("baz")
        return 2
    else:
        print("qux")
        return 6

def h():
    try:
        raise TypeError
        print("foo")
    except ValueError:
        print("bar")
        return 42
    except:
        print("baz")
    else:
        print("qux")
        return 42

print(f())
print(g())
print(h())
