print(1 < 2)
print(1 < 2 < 3)
print(1 < 2 > 3)
print(1 > 2 > 3)

def print_and_return(x):
    print(x)
    return x

print(print_and_return(1) < print_and_return(2) < print_and_return(3))
print(print_and_return(1) < print_and_return(2) > print_and_return(3))
print(print_and_return(1) > print_and_return(2) > print_and_return(3))

print(print_and_return(3) > print_and_return(2) > print_and_return(1))
print(print_and_return(3) < print_and_return(2) > print_and_return(1))
print(print_and_return(3) > print_and_return(2) < print_and_return(1))

print(print_and_return(3) > print_and_return(2) > print_and_return(1) > print_and_return(0) > print_and_return(-1))
print(print_and_return(3) < print_and_return(2) > print_and_return(1) > print_and_return(0) > print_and_return(-1))
print(print_and_return(3) >= print_and_return(2) > print_and_return(1) > print_and_return(0) > print_and_return(-1))
print(print_and_return(3) > print_and_return(2) > print_and_return(1) == print_and_return(0) > print_and_return(-1))
print(print_and_return(3) > print_and_return(2) > print_and_return(1) != print_and_return(0) > print_and_return(-1))