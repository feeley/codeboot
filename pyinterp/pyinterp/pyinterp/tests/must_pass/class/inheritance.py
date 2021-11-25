class A:
    pass

class B(A):
    pass

class C:
    pass

class D(A, C):
    pass

class E(B, D):
    pass

for c1 in [A, B, C, D, E]:
    for c2 in [A, B, C, D, E]:
        print(c1.__name__, c2.__name__, isinstance(c1(), c2))
