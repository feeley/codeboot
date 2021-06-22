def f():
    try:
        print("try")
    except:
        print("except")
    else:
        raise ValueError
    finally:
        print("finally")

f()
