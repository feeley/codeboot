def f():
    try:
        print("try")
    except:
        print("except")
    else:
        return 42
    finally:
        return 44

print(f())
