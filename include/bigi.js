//=============================================================================

// File: "bigi.js"

// Copyright (c) 2011-2020 by Marc Feeley, All Rights Reserved.

//=============================================================================

// This library implements infinite precision integers, the "bigi" type.

//-----------------------------------------------------------------------------

/*

Bigi integers are represented using an array of "big digits".  Each
big digit is a binary number of a certain width (bigi_radix_log2).  A
2's complement little-endian representation is used, in other words
the big digit at index 0 is the least significant and the sign of the
number is the most significant bit of the most significant big digit.
For efficiency, the representation is normalized so that the array
with the fewest big digits is used.

For example, if bigi_radix_log2 = 2, here is how the numbers from
-10 to 10 are represented:

-10 -> [2,1,3]
-9  -> [3,1,3]
-8  -> [0,2]
-7  -> [1,2]
-6  -> [2,2]
-5  -> [3,2]
-4  -> [0,3]
-3  -> [1,3]
-2  -> [2]
-1  -> [3]
0   -> [0]
1   -> [1]
2   -> [2,0]
3   -> [3,0]
4   -> [0,1]
5   -> [1,1]
6   -> [2,1]
7   -> [3,1]
8   -> [0,2,0]
9   -> [1,2,0]
10  -> [2,2,0]

*/

var bigi_radix_log2 = 14; // must be between 5 and 14 (could be as low as 1 if it wasn't for the division by 10 required by bigi_to_string)
var bigi_radix = 1 << bigi_radix_log2;
var bigi_radix_div2 = 1 << (bigi_radix_log2-1);

function Bigi(digs) { // concrete bigi type
    this.digs = digs;
}

// For convenience, tie toString() to bigi_to_string():
Bigi.prototype.toString = function (radix) {
    return bigi_to_string(this, radix);
}

function bigi_instance(val) {

    // Test if a value is a bigi instance.

    return val instanceof Bigi;

    // Alternative implementations:
    // return val instanceof Array; // when bigis are simply arrays
    // return val instanceof Uint16Array; // when using typed arrays
}

function bigi_to_digs(bigi) {

    // Return a bigi's indexable sequence of normalized big digits.

    return bigi.digs;

    // Alternative implementation:
    // return bigi; // when bigis are simply arrays or typed arrays
}

function bigi_from_digs(digs) {

    // Creates a bigi from an array of normalized big digits.

     return new Bigi(digs);

    // Alternative implementations:
    // return digs;                   // when bigis are simply arrays
    // return new Uint16Array(digs);  // return a typed array of the digits
}

function bigi_from_unnormalized_digs(digs) {

    // Creates a bigi from an array of unnormalized big digits (by
    // removing redundant top big digits).

    var len = digs.length;
    var last = digs[len-1];

    if (last < bigi_radix_div2) {
        while (len >= 2 && last === 0 && (last=digs[len-2]) < bigi_radix_div2)
            len--;
    } else {
        while (len >= 2 && last === bigi_radix-1 && (last=digs[len-2]) >= bigi_radix_div2)
            len--;
    }

    digs.length = len;

    return bigi_from_digs(digs);
}

function bigi_from_float(n) {

    // Constructs a normalized bigi from a floating point integer value.

    if (!isFinite(n) || Math.floor(n) !== n)
        throw "bigi_from_float's parameter must be an integer value";

    var digs = [];
    var i = 0;

    if (n < 0) {

        while (n < -bigi_radix_div2) {
            digs.push(((n % bigi_radix) + bigi_radix) % bigi_radix);
            n = Math.floor(n / bigi_radix);
        } 

        digs.push(((n % bigi_radix) + bigi_radix) % bigi_radix);
    } else {

        while (n >= bigi_radix_div2) {
            digs.push(n % bigi_radix);
            n = Math.floor(n / bigi_radix);
        } 

        digs.push(n % bigi_radix);
    }

    return bigi_from_digs(digs);
}

function bigi_to_float(bigi) {

    // Converts a bigi to a floating point integer value.  If the
    // number cannot be represented exactly (loss of significant
    // bits), false is returned.

    var digs = bigi_to_digs(bigi);
    var len = digs.length;
    var i = len-1;

    if (digs[i] < bigi_radix_div2) {
        var n = 0;

        while (i >= 0) {

            var d = digs[i--];
            var x = n * bigi_radix + d;

            if (Math.floor(x / bigi_radix) !== n ||
                x % bigi_radix !== d)
                return false;

            n = x;
        }

        return n;

    } else {

        var n = -1;

        while (i >= 0) {

            var d = digs[i--];
            var x = n * bigi_radix + d;

            if (Math.floor(x / bigi_radix) !== n ||
                ((x % bigi_radix) + bigi_radix) % bigi_radix !== d)
                return false;

            n = x;
        }

        return n;
    }
}

function bigi_nonneg(bigi) {

    // Tests if a normalized bigi is nonnegative.

    var digs = bigi_to_digs(bigi);

    return digs[digs.length-1] < bigi_radix_div2;
}

function bigi_zero(bigi) {

    // Tests if a normalized bigi is zero.

    var digs = bigi_to_digs(bigi);

    return (digs.length === 1) && (digs[0] === 0);
}

function bigi_cmp(bigi_a, bigi_b) {

    // Compares two normalized bigis.  Returns -1, 0, or 1 if
    // bigi_a is respectively less than, equal, or greater than
    // bigi_b.

    if (bigi_nonneg(bigi_a)) {
        if (!bigi_nonneg(bigi_b))
            return 1;
    } else {
        if (bigi_nonneg(bigi_b))
            return -1;
    }

    // bigis have same sign

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;
    var result;

    if (len_a === len_b) {

        // bigis have same number of big digits

        result = 0;
        while (--len_a >= 0) {
            var dig_a = digs_a[len_a];
            var dig_b = digs_b[len_a];
            if (dig_a < dig_b) {
                result = -1;
                break;
            } else if (dig_a > dig_b) {
                result = 1;
                break;
            }
        }
    } else {

        if (len_a < len_b)
            result = -1;
        else
            result = 1;

        if (!bigi_nonneg(bigi_a))
            result = -result;
    }

    return result;
}

function bigi_lt(bigi_a, bigi_b) {

    // Compares two normalized bigis and returns true iff first
    // is less than second.

    return bigi_cmp(bigi_a, bigi_b) < 0;
}

function bigi_eq(bigi_a, bigi_b) {

    // Compares two normalized bigis and returns true iff first
    // is equal to second.

    // return bigi_cmp(bigi_a, bigi_b) === 0;

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var i = digs_a.length;

    if (i !== digs_b.length)
        return false;

    while (--i >= 0) {
        if (digs_a[i] !== digs_b[i])
            return false;
    }

    return true;
}

function bigi_gt(bigi_a, bigi_b) {

    // Compares two normalized bigis and returns true iff first
    // is greater than second.

    return bigi_cmp(bigi_a, bigi_b) > 0;
}

function bigi_abs(bigi_a) {
    if (bigi_nonneg(bigi_a))
        return bigi_a;
    else
        return bigi_neg(bigi_a);
}

function bigi_neg(bigi_a) {

    // Negates a normalized bigi.

    var digs_a = bigi_to_digs(bigi_a);
    var len_a = digs_a.length;
    var digs = new Array(len_a+1);
    var carry = 1;
    var i = 0;

    do {
        var a = (bigi_radix-1) - digs_a[i] + carry;
        digs[i++] = a & (bigi_radix-1);
        carry = a >> bigi_radix_log2;
    } while (i < len_a);

    var ext_a = (digs_a[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    digs[i] = ((bigi_radix-1) - ext_a + carry) & (bigi_radix-1); 

    return bigi_from_unnormalized_digs(digs);
}

function bigi_add(bigi_a, bigi_b) {

    // Adds two normalized bigis.

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;

    if (len_a < len_b) {
        var digs_tmp = digs_a;
        var len_tmp = len_a;
        digs_a = digs_b;
        len_a = len_b;
        digs_b = digs_tmp;
        len_b = len_tmp;
    }

    var digs = new Array(len_a+1);
    var carry = 0;
    var i = 0;

    do {
        var ab = digs_a[i] + digs_b[i] + carry;
        digs[i++] = ab & (bigi_radix-1);
        carry = ab >> bigi_radix_log2;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] + ext_b + carry;
        digs[i++] = ab & (bigi_radix-1);
        carry = ab >> bigi_radix_log2;
    }

    var ext_a = (digs_a[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    digs[i] = (ext_a + ext_b + carry) & (bigi_radix-1); 

    return bigi_from_unnormalized_digs(digs);
}

function bigi_sub(bigi_a, bigi_b) {

    // Substracts two normalized bigis.

    return bigi_add(bigi_a, bigi_neg(bigi_b));
}

function bigi_mul(bigi_a, bigi_b) {

    // Multiplies two normalized bigis.

    var neg = false;

    if (!bigi_nonneg(bigi_a)) {
        neg = !neg;
        bigi_a = bigi_neg(bigi_a);
    }

    if (!bigi_nonneg(bigi_b)) {
        neg = !neg;
        bigi_b = bigi_neg(bigi_b);
    }

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;
    var digs = new Array(len_a+len_b+1).fill(0);

    for (var i=0; i<len_a; i++) {
        var mult = digs_a[i];
        var carry = 0;
        var k = i;
        for (var j=0; j<len_b; j++) {
            var ab = mult * digs_b[j] + digs[k] + carry;
            digs[k++] = ab & (bigi_radix-1);
            carry = ab >> bigi_radix_log2;
        }
        digs[k] = carry;
    }

    var bigi = bigi_from_unnormalized_digs(digs);

    if (neg)
        return bigi_neg(bigi);
    else
        return bigi;
}

function bigi_div(bigi_a, bigi_b) {

    // Quotient of two normalized bigis.

    var qr = bigi_nonneg_quorem(bigi_abs(bigi_a), bigi_abs(bigi_b));

    if (bigi_nonneg(bigi_a) === bigi_nonneg(bigi_b))
        return qr.quo;
    else
        return bigi_neg(qr.quo);
}

function bigi_mod(bigi_a, bigi_b) {

    // Modulo of two normalized bigis.

    var qr = bigi_nonneg_quorem(bigi_abs(bigi_a), bigi_abs(bigi_b));

    if (bigi_nonneg(bigi_a))
        return qr.rem;
    else
        return bigi_neg(qr.rem);
}

function bigi_nonneg_quorem(bigi_a, bigi_b) {

    // Computes quotient and remainder of two nonnegative normalized
    // bigis.

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;

    if (len_b === 1) {

        // simple algo for single digit divisor

        var digs = new Array(len_a);
        var d = digs_b[0]; // divisor
        var n = 0;

        for (var i=len_a-1; i>=0; i--) {
            n = (n << bigi_radix_log2) + digs_a[i];
            var q = Math.floor(n/d); // integer division
            digs[i] = q;
            n = n - q*d;
        }

        return { quo: bigi_from_unnormalized_digs(digs),
                 rem: bigi_from_digs([n]) // we know n fits in single digit
               };
    } else {

        // multi digit divisor case

        throw "multi-digit divisors not yet supported";
    }
}

function bigi_not(bigi_a) {

    // Bitwise not of a normalized bigi.

    var digs_a = bigi_to_digs(bigi_a);
    var len_a = digs_a.length;
    var digs = new Array(len_a+1);
    var i = 0;

    do {
        var a = (bigi_radix-1) ^ digs_a[i];
        digs[i++] = a;
    } while (i < len_a);

    var ext_a = (digs_a[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    digs[i] = (bigi_radix-1) ^ ext_a;

    return bigi_from_unnormalized_digs(digs);
}

function bigi_and(bigi_a, bigi_b) {

    // Bitwise and of two normalized bigis.

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;

    if (len_a < len_b) {
        var digs_tmp = digs_a;
        var len_tmp = len_a;
        digs_a = digs_b;
        len_a = len_b;
        digs_b = digs_tmp;
        len_b = len_tmp;
    }

    var digs = new Array(len_a+1);
    var i = 0;

    do {
        var ab = digs_a[i] & digs_b[i];
        digs[i++] = ab;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] & ext_b;
        digs[i++] = ab;
    }

    var ext_a = (digs_a[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    digs[i] = ext_a & ext_b;

    return bigi_from_unnormalized_digs(digs);
}

function bigi_or(bigi_a, bigi_b) {

    // Bitwise or of two normalized bigis.

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;

    if (len_a < len_b) {
        var digs_tmp = digs_a;
        var len_tmp = len_a;
        digs_a = digs_b;
        len_a = len_b;
        digs_b = digs_tmp;
        len_b = len_tmp;
    }

    var digs = new Array(len_a+1);
    var i = 0;

    do {
        var ab = digs_a[i] | digs_b[i];
        digs[i++] = ab;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] | ext_b;
        digs[i++] = ab;
    }

    var ext_a = (digs_a[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    digs[i] = ext_a | ext_b;

    return bigi_from_unnormalized_digs(digs);
}

function bigi_xor(bigi_a, bigi_b) {

    // Bitwise xor of two normalized bigis.

    var digs_a = bigi_to_digs(bigi_a);
    var digs_b = bigi_to_digs(bigi_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;

    if (len_a < len_b) {
        var digs_tmp = digs_a;
        var len_tmp = len_a;
        digs_a = digs_b;
        len_a = len_b;
        digs_b = digs_tmp;
        len_b = len_tmp;
    }

    var digs = new Array(len_a+1);
    var i = 0;

    do {
        var ab = digs_a[i] ^ digs_b[i];
        digs[i++] = ab;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] ^ ext_b;
        digs[i++] = ab;
    }

    var ext_a = (digs_a[i-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

    digs[i] = ext_a ^ ext_b;

    return bigi_from_unnormalized_digs(digs);
}

function bigi_shift(bigi_a, shift) {

    // Shifting a normalized bigi.

    var bit_shift;

    if (shift < 0)
        bit_shift = (bigi_radix_log2-1) + (shift+1) % bigi_radix_log2;
    else
        bit_shift = shift % bigi_radix_log2;
        
    var dig_shift = (shift - bit_shift) / bigi_radix_log2;

    var digs_a = bigi_to_digs(bigi_a);
    var len_a = digs_a.length;
    var len = len_a + dig_shift + (bit_shift===0 ? 0 : 1);

    if (len <= 0) {
        if (digs_a[len_a-1] < bigi_radix_div2)
            return bigi_from_digs([0]);
        else
            return bigi_from_digs([bigi_radix-1]);
    } else {

        var digs = new Array(len);

        if (bit_shift === 0) {

            /* optimize when only shifting big digits */

            var i = 0;
            var j = -dig_shift;

            while (j < 0) {
                digs[i++] = 0;
                j++;
            }

            while (j < len_a) {
                digs[i++] = digs_a[j++];
            }
        } else {

            var i = 0;
            var j = -dig_shift;
            var reg;

            if (j > 0) {
                reg = digs_a[j-1] << bit_shift;
            } else {
                while (j < 0) {
                    digs[i++] = 0;
                    j++;
                }
                reg = 0;
            }

            while (j < len_a) {
                reg = (reg >> bigi_radix_log2) + (digs_a[j++] << bit_shift);
                digs[i++] = reg & (bigi_radix-1);
            }

            var ext_a = (digs_a[len_a-1] < bigi_radix_div2) ? 0 : bigi_radix-1;

            reg = (reg >> bigi_radix_log2) + (ext_a << bit_shift);
            digs[i] = reg & (bigi_radix-1);
        }

        return bigi_from_unnormalized_digs(digs);
    }
}

var bigi_digits = "0123456789abcdefghijklmnopqrstuvwxyz";

function bigi_to_string(bigi_a, radix) {

    // Convert a normalized bigi to a string of digits.

    var str = "";

    if (radix === void 0)
        radix = 10;

    if (bigi_zero(bigi_a))
        return "0";

    var sign;

    if (bigi_nonneg(bigi_a)) {
        sign = "";
    } else {
        sign = "-";
        bigi_a = bigi_neg(bigi_a);
    }

    var bigi_rad = bigi_from_digs([radix]); // assumes radix < bigi_radix_div2

    while (!bigi_zero(bigi_a)) {
        var qr = bigi_nonneg_quorem(bigi_a, bigi_rad);
        var d = bigi_to_digs(qr.rem)[0];
        str = bigi_digits.slice(d, d+1) + str;
        bigi_a = qr.quo;
    }

    return sign + str;
}

function bigi_from_string_radix10(str) {
    return bigi_from_string(str, 10);
}

function bigi_from_string(str, radix) { // radix defaults to 10

    // Convert a string of digits to a bigi.  The string can be
    // prefixed with a '+' or '-' sign.  If the string is invalid
    // false is returned.

    var len = str.length;

    if (len === 0)
        return false;

    var start = ((str[0] === '+') || (str[0] === '-')) ? 1 : 0;

    var val = bigi_from_substring(str, start, len, radix);

    if (val === false)
        return false;

    if (str[0] === '-')
        return bigi_neg(val);
    else
        return val;
}

function bigi_from_substring(str, start, end, radix) {

    var len = end - start;
    var levels = 32 - Math.clz32(len-1);
    var scale = new Array(levels);

    var pow = bigi_from_float(radix);
    var i = 0;
    while (i < levels) {
        scale[i++] = pow;
        pow = bigi_mul(pow, pow);
    }

    function value(start, end, i) {
        if (start >= end) {
            return bigi_from_float(0);
        } else if (start+1 === end) {
            var c = str.charCodeAt(start);
            var d = 99;
            if (c >= 48 && c <= 57) // '0' .. '9'
                d = c - 48;
            else if (c >= 97 && c <= 122) // 'a' .. 'z'
                d = c - 87;
            else if (c >= 65 && c <= 90) // 'A' .. 'Z'
                d = c - 55;
            if (d >= radix)
                return false;
            return bigi_from_float(d);
        } else {
            var split = end - (1<<i);
            var val1 = value(Math.max(split,start), end, i-1);
            if (val1 === false)
                return false;
            var val2 = value(start, split, i-1);
            if (val2 === false)
                return false;
            return bigi_add(bigi_mul(val2, scale[i]), val1);
        }
    }

    return value(start, end, levels-1);
}

//-----------------------------------------------------------------------------

// use BigInt if available

if ((function () { return this.BigInt; })()) {

    function bigi_instance(val) { return val instanceof BigInt; }
    function bigi_from_float(n) { return BigInt(n); } // n must be int. value
    function bigi_to_float(bigi) { return Number(n); }
    function bigi_nonneg(bigi) { return bigi >= 0; }
    function bigi_zero(bigi) { return bigi == 0; }
    function bigi_lt(bigi_a, bigi_b) { return bigi_a < bigi_b; }
    function bigi_eq(bigi_a, bigi_b) { return bigi_a == bigi_b; }
    function bigi_gt(bigi_a, bigi_b) { return bigi_a > bigi_b; }
    function bigi_abs(bigi_a) { return bigi_a<0 ? -bigi_a : bigi_a; }
    function bigi_neg(bigi_a) { return -bigi_a; }
    function bigi_add(bigi_a, bigi_b) { return bigi_a+bigi_b; }
    function bigi_sub(bigi_a, bigi_b) { return bigi_a-bigi_b; }
    function bigi_mul(bigi_a, bigi_b) { return bigi_a*bigi_b; }
    function bigi_div(bigi_a, bigi_b) { return bigi_a/bigi_b; } // integer div
    function bigi_mod(bigi_a, bigi_b) { return bigi_a%bigi_b; }
    function bigi_not(bigi_a) { return ~bigi_a; }
    function bigi_and(bigi_a, bigi_b) { return bigi_a&bigi_b; }
    function bigi_or(bigi_a, bigi_b)  { return bigi_a|bigi_b; }
    function bigi_xor(bigi_a, bigi_b) { return bigi_a^bigi_b; }
    function bigi_and(bigi_a, bigi_b) { return bigi_a&bigi_b; }
    function bigi_shift(bigi_a, shift) { return bigi_a<<BigInt(shift); }
    function bigi_to_string(bigi_a, radix) { return bigi_a.toString(radix); }
    function bigi_from_string_radix10(str) { return BigInt(str); }
    // function bigi_from_string(str, radix) // not a method of BigInt
}

//-----------------------------------------------------------------------------
