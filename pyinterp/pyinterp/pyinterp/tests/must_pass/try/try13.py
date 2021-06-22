def f(x):
    res = None
    try:
        res = 42 // x
    except ZeroDivisionError:
        return 0
    except:
        res = None
    else:
        print("No exception happened")
    finally:
        if res is None:
            print("An unknown exception happened")
            return None
    return res

print(f(0))
print(f(1))
print(f(2))
print(f("42"))
