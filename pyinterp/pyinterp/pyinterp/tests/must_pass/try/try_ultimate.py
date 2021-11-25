
try:
    raise ValueError("foo bar baz")
except ValueError as a:
    print("in except block")
    print(type(a))

# Unreachable
print(1)
def f():
    try:
        raise ValueError
        print("foo")
    except ValueError as a:
        print("bar")
        print(type(a))
    except Exception as a:
        print(type(a))
        print("baz")
    else:
        print("qux")
        return 6

def g():
    try:
        raise TypeError
        print("foo")
    except ValueError as a:
        print(type(a))
    except Exception as a:
        print(type(a))
        return a
    else:
        print("qux")
        return 6

def h():
    try:
        raise TypeError
        print("foo")
    except ValueError as a:
        print("bar")
        return 42
    except Exception as a:
        print("baz")
    else:
        print("qux")
        return 42

print(f())
print(g())
print(h())


print("baz")
def f():
    try:
        return 1
    except Exception as a:
        print(type(a))
        pass
    finally:
        return 2

print(f())

def g():
    try:
        return 1
    except Exception as a:
        print(type(a))
        pass
    finally:
        if False:
            return 2

print(g())

def h():
    try:
        raise ValueError
    except Exception as a:
        print(type(a))
        return 1
    finally:
        if False:
            return 2

print(h())

def k():
    try:
        raise ValueError
    except Exception as a:
        print(type(a))
        return 1
    finally:
        return 3

print(k())

def l():
    try:
        return 10
    except Exception as a:
        print(type(a))
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
    except Exception as a:
        print(type(a))
        return 1
    else:
        return 100
    finally:
        if True:
            return 3
        else:
            return 5

print(m())
def f():
    try:
        raise ValueError
    except TypeError as t:
        print(type(t))
        pass
    finally:
        return 42

print(f())
def f():
    try:
        print("try")
    except Exception as e:
        print(type(e))
        print("except")
    else:
        return 42
    finally:
        return 44

print(f())
def f(x):
    res = None
    try:
        res = 42 // x
    except ZeroDivisionError as e:
        print(type(e))
        print("hello")
        return 0
    except Exception as e:
        print(e)
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
def f(x):
    res = None
    try:
        res = 42 // x
    except ZeroDivisionError as hh:
        print(type(hh))
    except Exception as x:
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
def trying():
    try:
        1//0
    except Exception as e:
        return type(e)
    else:
        print("hello")
    finally:
        print("hello 2")
print(trying())
