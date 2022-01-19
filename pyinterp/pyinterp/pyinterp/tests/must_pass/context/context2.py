class A:
    def __enter__(self):
        print("enter(A)")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(A)")

class B:
    def __enter__(self):
        print("enter(B)")
        raise ValueError("foo")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(B)")

try:
    with A() as a, B() as b:
        print(a is b)
except ValueError as e:
    print(e)
