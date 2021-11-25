def f():
    try:
        raise ValueError
    except:
        raise TypeError

f()
