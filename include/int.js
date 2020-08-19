//=============================================================================

// File: "int.js"

// Copyright (c) 2011-2020 by Marc Feeley, All Rights Reserved.

//=============================================================================

// This library implements infinite precision integers, the Int type.

//-----------------------------------------------------------------------------

/*

An Int is represented using an array of "big digits".  Each big digit
is a binary number of a certain width (int_radix_log2).  A 2's
complement little-endian representation is used, in other words the
big digit at index 0 is the least significant and the sign of the
number is the most significant bit of the most significant big digit.
For efficiency, the representation is normalized so that the array
with the fewest big digits is used.

For example, if int_radix_log2 = 2, here is how the numbers from
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

var int_radix_log2 = 14; // must be between 5 and 14 (could be as low as 1 if it wasn't for the division by 10 required by int_to_string)
var int_radix = 1 << int_radix_log2;
var int_radix_div2 = 1 << (int_radix_log2-1);

function Int(digs) { // concrete Int type
    this.digs = digs;
}

// For convenience, tie toString() to int_to_string():
Int.prototype.toString = function (radix) {
    return int_to_string(this, radix);
}

function int_instance(val) {

    // Test if a value is a Int instance.

    return val instanceof Int;

    // Alternative implementations:
    // return val instanceof Array; // when an Int is simply an array
    // return val instanceof Uint16Array; // when an Int is a typed array
}

function int_to_digs(int_a) {

    // Return an Int's indexable sequence of normalized big digits.

    return int_a.digs;

    // Alternative implementation:
    // return int_a; // when an Int is simply an array or typed array
}

function int_from_digs(digs) {

    // Creates an Int from an array of normalized big digits.

     return new Int(digs);

    // Alternative implementations:
    // return digs;                   // when an Int is simply an array
    // return new Uint16Array(digs);  // return a typed array of the digits
}

function int_dig_array(len) {
    if (isNaN(len) || len>100000000)
        throw RangeError('Maximum Int size exceeded');
    return new Array(len);
}

function int_from_unnormalized_digs(digs) {

    // Creates an Int from an array of unnormalized big digits (by
    // removing redundant top big digits).

    var len = digs.length;
    var last = digs[len-1];

    if (last < int_radix_div2) {
        while (len >= 2 && last === 0 && (last=digs[len-2]) < int_radix_div2)
            len--;
    } else {
        while (len >= 2 && last === int_radix-1 && (last=digs[len-2]) >= int_radix_div2)
            len--;
    }

    digs.length = len;

    return int_from_digs(digs);
}

function is_Int_or_BigInt(n) {
  if (globalThis.BigInt) {
    return n.constructor === Int || n.constructor === BigInt;
  }
  else {
    return n.constructor === Int;
  }
};

function int_from_float(n) {

    // Constructs a normalized Int from a floating point integer value.

    if (!Number.isInteger(n))
        throw "int_from_float's parameter must be an integer value";

    var digs = [];  // Array accumulating digits with digs.push(digit)
    var i = 0;

    if (n < 0) {

        while (n < -int_radix_div2) {
            digs.push(((n % int_radix) + int_radix) % int_radix);
            n = Math.floor(n / int_radix);
        } 

        digs.push(((n % int_radix) + int_radix) % int_radix);
    } else {

        while (n >= int_radix_div2) {
            digs.push(n % int_radix);
            n = Math.floor(n / int_radix);
        } 

        digs.push(n % int_radix);
    }

    return int_from_digs(digs);
}

function int_to_float(int_a, exact) {

    // Converts an Int to a floating point integer value.  If the
    // number cannot be represented exactly (loss of significant
    // bits), false is returned when exact is true, otherwise a close
    // floating point value is returned (possibly Infinity).

    var digs = int_to_digs(int_a);
    var len = digs.length;
    var i = len-1;

    if (digs[i] < int_radix_div2) {
        var n = 0;

        while (i >= 0) {

            var d = digs[i--];
            var x = n * int_radix + d;

            if (exact &&
                (Math.floor(x / int_radix) !== n ||
                 x % int_radix !== d))
                return false;

            n = x;
        }

        return n;

    } else {

        var n = -1;

        while (i >= 0) {

            var d = digs[i--];
            var x = n * int_radix + d;

            if (exact &&
                (Math.floor(x / int_radix) !== n ||
                 ((x % int_radix) + int_radix) % int_radix !== d))
                return false;

            n = x;
        }

        return n;
    }
}

function int_is_zero(int_a) {

    // Tests if a normalized Int is zero.

    var digs = int_to_digs(int_a);

    return digs.length === 1 && digs[0] === 0;
}

function int_is_pos(int_a) {

    // Tests if a normalized Int is positive.

    var digs = int_to_digs(int_a);

    return digs[digs.length-1] < int_radix_div2 &&
           !(digs.length === 1 && digs[0] === 0);
}

function int_is_neg(int_a) {

    // Tests if a normalized Int is negative.

    var digs = int_to_digs(int_a);

    return digs[digs.length-1] >= int_radix_div2;
}

function int_is_nonneg(int_a) {

    // Tests if a normalized Int is nonnegative.

    var digs = int_to_digs(int_a);

    return digs[digs.length-1] < int_radix_div2;
}

function int_cmp(int_a, int_b) {

    // Compares two normalized Ints.  Returns -1, 0, or 1 if
    // int_a is respectively less than, equal, or greater than
    // int_b.

    if (int_is_nonneg(int_a)) {
        if (!int_is_nonneg(int_b))
            return 1;
    } else {
        if (int_is_nonneg(int_b))
            return -1;
    }

    // Ints have same sign

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;
    var result;

    if (len_a === len_b) {

        // Ints have same number of big digits

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

        if (!int_is_nonneg(int_a))
            result = -result;
    }

    return result;
}

function int_eq(int_a, int_b) {

    // Compares two normalized Ints and returns true iff first
    // is equal to second.

    // return int_cmp(int_a, int_b) === 0;

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
    var i = digs_a.length;

    if (i !== digs_b.length)
        return false;

    while (--i >= 0) {
        if (digs_a[i] !== digs_b[i])
            return false;
    }

    return true;
}

function int_ne(int_a, int_b) {

    // Compares two normalized Ints and returns true iff first
    // is not equal to second.

    return !int_eq(int_a, int_b);
}

function int_lt(int_a, int_b) {

    // Compares two normalized Ints and returns true iff first
    // is less than second.

    return int_cmp(int_a, int_b) < 0;
}

function int_le(int_a, int_b) {

    // Compares two normalized Ints and returns true iff first
    // is less than or equal to the second.

    return int_cmp(int_a, int_b) <= 0;
}

function int_gt(int_a, int_b) {

    // Compares two normalized Ints and returns true iff first
    // is greater than second.

    return int_cmp(int_a, int_b) > 0;
}

function int_ge(int_a, int_b) {

    // Compares two normalized Ints and returns true iff first
    // is greater than or equal to the second.

    return int_cmp(int_a, int_b) >= 0;
}

function int_abs(int_a) {
    if (int_is_nonneg(int_a))
        return int_a;
    else
        return int_neg(int_a);
}

function int_neg(int_a) {

    // Negates a normalized Int.

    var digs_a = int_to_digs(int_a);
    var len_a = digs_a.length;
    var digs = int_dig_array(len_a+1);
    var carry = 1;
    var i = 0;

    do {
        var a = (int_radix-1) - digs_a[i] + carry;
        digs[i++] = a & (int_radix-1);
        carry = a >> int_radix_log2;
    } while (i < len_a);

    var ext_a = (digs_a[i-1] < int_radix_div2) ? 0 : int_radix-1;

    digs[i] = ((int_radix-1) - ext_a + carry) & (int_radix-1); 

    return int_from_unnormalized_digs(digs);
}

function int_add(int_a, int_b) {

    // Adds two normalized Ints.

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
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

    var digs = int_dig_array(len_a+1);
    var carry = 0;
    var i = 0;

    do {
        var ab = digs_a[i] + digs_b[i] + carry;
        digs[i++] = ab & (int_radix-1);
        carry = ab >> int_radix_log2;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < int_radix_div2) ? 0 : int_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] + ext_b + carry;
        digs[i++] = ab & (int_radix-1);
        carry = ab >> int_radix_log2;
    }

    var ext_a = (digs_a[i-1] < int_radix_div2) ? 0 : int_radix-1;

    digs[i] = (ext_a + ext_b + carry) & (int_radix-1); 

    return int_from_unnormalized_digs(digs);
}

function int_sub(int_a, int_b) {

    // Substracts two normalized Ints.

    return int_add(int_a, int_neg(int_b));
}

function int_mul(int_a, int_b) {

    // Multiplies two normalized Ints.

    var neg = false;

    if (!int_is_nonneg(int_a)) {
        neg = !neg;
        int_a = int_neg(int_a);
    }

    if (!int_is_nonneg(int_b)) {
        neg = !neg;
        int_b = int_neg(int_b);
    }

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;
    var digs = int_dig_array(len_a+len_b+1).fill(0);

    for (var i=0; i<len_a; i++) {
        var mult = digs_a[i];
        var carry = 0;
        var k = i;
        for (var j=0; j<len_b; j++) {
            var ab = mult * digs_b[j] + digs[k] + carry;
            digs[k++] = ab & (int_radix-1);
            carry = ab >> int_radix_log2;
        }
        digs[k] = carry;
    }

    var val = int_from_unnormalized_digs(digs);

    if (neg)
        return int_neg(val);
    else
        return val;
}

function int_div(int_a, int_b) {

    // Division of two normalized Ints.

    var dm = int_divmod_nonneg(int_abs(int_a), int_abs(int_b));

    if (int_is_nonneg(int_a) === int_is_nonneg(int_b))
        return dm[0];
    else
        return int_neg(dm[0]);
}

function int_mod(int_a, int_b) {

    // Modulo of two normalized Ints.

    var dm = int_divmod_nonneg(int_abs(int_a), int_abs(int_b));

    if (int_is_nonneg(int_a))
        return dm[1];
    else
        return int_neg(dm[1]);
}

function int_divmod(int_a, int_b) {

    // Division and modulo of two normalized Ints.

    var dm = int_divmod_nonneg(int_abs(int_a), int_abs(int_b));

    if (int_is_nonneg(int_a)) {
        if (int_is_nonneg(int_b))
            return dm;
        else
            return [int_neg(dm[0]), dm[1]];
    } else {
        if (int_is_nonneg(int_b))
            return [int_neg(dm[0]), int_neg(dm[1])];
        else
            return [dm[0], int_neg(dm[1])];
    }
}

function int_divmod_nonneg(int_a, int_b) {

    // Computes division and modulo of two nonnegative normalized
    // Ints.

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
    var len_a = digs_a.length;
    var len_b = digs_b.length;

    if (len_b === 1) {

        // simple algo for single digit divisor

        var digs = int_dig_array(len_a);
        var d = digs_b[0]; // divisor
        var n = 0;

        for (var i=len_a-1; i>=0; i--) {
            n = (n << int_radix_log2) + digs_a[i];
            var q = Math.floor(n/d); // integer division
            digs[i] = q;
            n = n - q*d;
        }

        return [int_from_unnormalized_digs(digs),
                int_from_digs([n])]; // we know n fits in single digit
    } else {

        // multi digit divisor case

        throw "multi-digit divisors not yet supported";
    }
}

function int_not(int_a) {

    // Bitwise not of a normalized Ints.

    var digs_a = int_to_digs(int_a);
    var len_a = digs_a.length;
    var digs = int_dig_array(len_a+1);
    var i = 0;

    do {
        var a = (int_radix-1) ^ digs_a[i];
        digs[i++] = a;
    } while (i < len_a);

    var ext_a = (digs_a[i-1] < int_radix_div2) ? 0 : int_radix-1;

    digs[i] = (int_radix-1) ^ ext_a;

    return int_from_unnormalized_digs(digs);
}

function int_and(int_a, int_b) {

    // Bitwise and of two normalized Ints.

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
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

    var digs = int_dig_array(len_a+1);
    var i = 0;

    do {
        var ab = digs_a[i] & digs_b[i];
        digs[i++] = ab;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < int_radix_div2) ? 0 : int_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] & ext_b;
        digs[i++] = ab;
    }

    var ext_a = (digs_a[i-1] < int_radix_div2) ? 0 : int_radix-1;

    digs[i] = ext_a & ext_b;

    return int_from_unnormalized_digs(digs);
}

function int_or(int_a, int_b) {

    // Bitwise or of two normalized Ints.

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
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

    var digs = int_dig_array(len_a+1);
    var i = 0;

    do {
        var ab = digs_a[i] | digs_b[i];
        digs[i++] = ab;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < int_radix_div2) ? 0 : int_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] | ext_b;
        digs[i++] = ab;
    }

    var ext_a = (digs_a[i-1] < int_radix_div2) ? 0 : int_radix-1;

    digs[i] = ext_a | ext_b;

    return int_from_unnormalized_digs(digs);
}

function int_xor(int_a, int_b) {

    // Bitwise xor of two normalized Ints.

    var digs_a = int_to_digs(int_a);
    var digs_b = int_to_digs(int_b);
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

    var digs = int_dig_array(len_a+1);
    var i = 0;

    do {
        var ab = digs_a[i] ^ digs_b[i];
        digs[i++] = ab;
    } while (i < len_b);

    var ext_b = (digs_b[i-1] < int_radix_div2) ? 0 : int_radix-1;

    while (i < len_a) {
        var ab = digs_a[i] ^ ext_b;
        digs[i++] = ab;
    }

    var ext_a = (digs_a[i-1] < int_radix_div2) ? 0 : int_radix-1;

    digs[i] = ext_a ^ ext_b;

    return int_from_unnormalized_digs(digs);
}

function int_shift(int_a, int_b) {

    // Shifting a normalized Int.  A positive int_b shifts to the left and
    // a negative int_b shifts to the right.

    var digs_a = int_to_digs(int_a);
    var len_a = digs_a.length;

    var shift = Math.max(int_to_float(int_b), -(len_a*int_radix_log2));
    var bit_shift;

    if (shift < 0)
        bit_shift = (int_radix_log2-1) + (shift+1) % int_radix_log2;
    else
        bit_shift = shift % int_radix_log2;
        
    var dig_shift = (shift - bit_shift) / int_radix_log2;
    var len = len_a + dig_shift + (bit_shift===0 ? 0 : 1);

    if (len <= 0) {
        if (digs_a[len_a-1] < int_radix_div2)
            return int_from_digs([0]);
        else
            return int_from_digs([int_radix-1]);
    } else {

        var digs = int_dig_array(len);

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
                reg = (reg >> int_radix_log2) + (digs_a[j++] << bit_shift);
                digs[i++] = reg & (int_radix-1);
            }

            var ext_a = (digs_a[len_a-1] < int_radix_div2) ? 0 : int_radix-1;

            reg = (reg >> int_radix_log2) + (ext_a << bit_shift);
            digs[i] = reg & (int_radix-1);
        }

        return int_from_unnormalized_digs(digs);
    }
}

function int_lshift(int_a, int_b) {

    // Shifting a normalized Int to the left.

    return int_shift(int_a, int_b);
}

function int_rshift(int_a, int_b) {

    // Shifting a normalized Int to the right.

    return int_shift(int_a, int_neg(int_b));
}

var int_digits = "0123456789abcdefghijklmnopqrstuvwxyz";

function int_to_string(int_a, radix) {

    // Convert a normalized Int to a string of digits.

    var str = "";

    if (radix === void 0)
        radix = 10;

    if (int_is_zero(int_a))
        return "0";

    var sign;

    if (int_is_nonneg(int_a)) {
        sign = "";
    } else {
        sign = "-";
        int_a = int_neg(int_a);
    }

    var int_rad = int_from_digs([radix]); // assumes radix < int_radix_div2

    while (!int_is_zero(int_a)) {
        var dm = int_divmod_nonneg(int_a, int_rad);
        var d = int_to_digs(dm[1])[0];
        str = int_digits.slice(d, d+1) + str;
        int_a = dm[0];
    }

    return sign + str;
}

function int_from_string_radix10(str) {
    return int_from_string(str, 10);
}

function int_from_string(str, radix) { // radix defaults to 10

    // Convert a string of digits to an Int.  The string can be
    // prefixed with a '+' or '-' sign.  If the string is invalid
    // false is returned.

    var len = str.length;

    if (len === 0)
        return false;

    var start = ((str[0] === '+') || (str[0] === '-')) ? 1 : 0;

    var val = int_from_substring(str, start, len, radix);

    if (val === false)
        return false;

    if (str[0] === '-')
        return int_neg(val);
    else
        return val;
}

function int_from_substring(str, start, end, radix) {

    var len = end - start;
    var levels = 32 - Math.clz32(len-1);
    var scale = int_dig_array(levels);

    var pow = int_from_float(radix);
    var i = 0;
    while (i < levels) {
        scale[i++] = pow;
        pow = int_mul(pow, pow);
    }

    function value(start, end, i) {
        if (start >= end) {
            return int_from_float(0);
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
            return int_from_float(d);
        } else {
            var split = end - (1<<i);
            var val1 = value(Math.max(split,start), end, i-1);
            if (val1 === false)
                return false;
            var val2 = value(start, split, i-1);
            if (val2 === false)
                return false;
            return int_add(int_mul(val2, scale[i]), val1);
        }
    }

    return value(start, end, levels-1);
}

//-----------------------------------------------------------------------------

// use BigInt if available

if (globalThis.BigInt) {

    function int_instance(val) { return val instanceof BigInt; }
    function int_from_float(n) { return BigInt(n); } // n must be int. value
    function int_to_float(int_a, exact) {
        var val = Number(int_a);
        if (exact && int_a != val) val = false;
        return val;
    }
    function int_is_zero(int_a) { return int_a == 0; }
    function int_is_pos(int_a) { return int_a > 0; }
    function int_is_neg(int_a) { return int_a < 0; }
    function int_is_nonneg(int_a) { return int_a >= 0; }
    function int_eq(int_a, int_b) { return int_a == int_b; }
    function int_ne(int_a, int_b) { return int_a != int_b; }
    function int_lt(int_a, int_b) { return int_a < int_b; }
    function int_le(int_a, int_b) { return int_a <= int_b; }
    function int_gt(int_a, int_b) { return int_a > int_b; }
    function int_ge(int_a, int_b) { return int_a >= int_b; }
    function int_abs(int_a) { return int_a<0 ? -int_a : int_a; }
    function int_neg(int_a) { return -int_a; }
    function int_add(int_a, int_b) { return int_a+int_b; }
    function int_sub(int_a, int_b) { return int_a-int_b; }
    function int_mul(int_a, int_b) { return int_a*int_b; }
    function int_div(int_a, int_b) { return int_a/int_b; } // integer div
    function int_mod(int_a, int_b) { return int_a%int_b; }
    function int_divmod(int_a, int_b) { return [int_a/int_b, int_a%int_b]; }
    function int_not(int_a) { return ~int_a; }
    function int_and(int_a, int_b) { return int_a&int_b; }
    function int_or(int_a, int_b)  { return int_a|int_b; }
    function int_xor(int_a, int_b) { return int_a^int_b; }
    function int_shift(int_a, int_b) { return int_a<<int_b; }
    function int_lshift(int_a, int_b) { return int_a<<int_b; }
    function int_rshift(int_a, int_b) { return int_a>>int_b; }
    function int_to_string(int_a, radix) { return int_a.toString(radix); }
    function int_from_string_radix10(str) { return BigInt(str); }
    // function int_from_string(str, radix) // not a method of BigInt
}

//-----------------------------------------------------------------------------
