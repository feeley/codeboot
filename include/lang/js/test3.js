var fib = function (n)
{
//    print(n);
    if (n < 2)
        return 1;
    else
        return fib(n-1) + fib(n-2);
};

fib(35);
