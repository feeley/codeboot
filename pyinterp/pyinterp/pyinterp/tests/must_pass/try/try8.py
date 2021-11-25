def f():
    try:
        raise ValueError
    except TypeError:
        pass
    finally:
        return 42

print(f())
