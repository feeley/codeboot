class A:
    def __add__(self, other):
        print("A")
        return 1

class B(A):
    def __add__(self, other):
        print("B")
        return 1

class C:
    def __add__(self, other):
        print("C")
        return 1

class D(A, C):
    def __add__(self, other):
        print("D")
        return 1

class E(B, D):
    def __add__(self, other):
        print("E")
        return 1

class F(E, D):
    pass

class G(C, B):
    pass

for c1 in [A, B, C, D, E, F, G]:
    print(c1)
    print(c1() + 1)
