class A:
    def __enter__(self):
        print("enter(A)")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(A)")
        if exc is not None:
            print("with exception:", exc)
            # Cancel exception reraise
            return True

    def __repr__(self):
        return "A()"

try:
    with A() as a:
        print("inside")
        raise ValueError("foo")
except ValueError:
    print("got exception")
else:
    print("got no exception")
