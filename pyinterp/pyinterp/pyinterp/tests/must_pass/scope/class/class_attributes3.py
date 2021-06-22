class A:
    x = 1
    print(x)
    class B:
        # Should raise NameError
        print(x)


print(A.x)