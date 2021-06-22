try:
    try:
        raise Exception
    except Exception:
        print(1)
    finally:
        raise ValueError
except:
    try:
        print(2)
    except:
        pass
    else:
        raise IndexError
    finally:
        print(3)
finally:
    print(4)