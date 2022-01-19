class A:
    def __enter__(self):
        print("enter(A)")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(A)")

    def __repr__(self):
        return "A()"

class B:
    def __enter__(self):
        print("enter(B)")
        return self

    def __exit__(self, exc_type, exc, tb):
        print("exit(B)")

    def __repr__(self):
        return "B()"

def f():
    for i in range(2):
        with A() as a, B() as b:
            print(i)
            continue
            print(-i)

    return i

print(f())
