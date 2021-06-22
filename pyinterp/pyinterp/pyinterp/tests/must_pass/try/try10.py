def f():
    try:
        raise ValueError
    except:
        raise TypeError
    finally:
        print("foo")

f()
