# This is a sample program to parse.

def fib(n):
    if n < 2:
        return 1  # base case
    else:
        return fib(n-1) + fib(n-2)

print(fib(20))
