var x = 111;

var y = function () { print(x); }

var z = function x() { print(x); x = 999; print(x); }

y(222);
z(222);
y(222);
z(222);
y(222);
