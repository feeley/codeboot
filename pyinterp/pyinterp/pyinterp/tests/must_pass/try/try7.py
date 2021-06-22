def f():
    try:
        return 1
    except:
        pass
    finally:
        return 2

print(f())

def g():
    try:
        return 1
    except:
        pass
    finally:
        if False:
            return 2

print(g())

def h():
    try:
        raise ValueError
    except:
        return 1
    finally:
        if False:
            return 2

print(h())

def k():
    try:
        raise ValueError
    except:
        return 1
    finally:
        return 3

print(k())

def l():
    try:
        return 10
    except:
        return 1
    else:
        return 100
    finally:
        if True:
            return 3
        else:
            return 5

print(l())

def m():
    try:
        print('foo')
    except:
        return 1
    else:
        return 100
    finally:
        if True:
            return 3
        else:
            return 5

print(m())
