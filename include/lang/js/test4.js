var f = function () { print(888); return Math.sqrt(9); };

for (var i=0; i<4; i++) {
switch (i) {
case 9-8: print(1); //continue;
default:
case 8/4: print(2); break;
case f(): print(3);
    case 4: print(444);
}
    print(333);
}

print(999);
