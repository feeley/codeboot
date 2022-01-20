class A:
    def __enter__(self):
        print("enter(A)")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(A)")

class B:
    def __enter__(self):
        print("enter(B)")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(B)")

try:
    with A() as a, B() as b:
        raise ValueError("bar")
except ValueError as e:
    print(e)
