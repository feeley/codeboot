"use strict"; var pyinterp = (function () { String.prototype.lstrip = function() {
    return this.replace(/^\s+/g, '');
};

Array.prototype.extend = function(arr) {
  arr.forEach(function(v) {
    this.push(v);
  }, this);
};

function isEmpty(obj) {
    if (obj === absent) {
        return true;
    } else {
        return false;
    }
};

function make_dict() {
    return {};
};

function dict_get(d, key, _default) {
    if (Object.prototype.hasOwnProperty.call(d, key)) {
        return d[key];
    } else {
        return _default;
    }
};

function dict_set(d, key, value) {
    d[key] = value;
};

function dict_pop(d, key, default_) {
    if (Object.prototype.hasOwnProperty.call(d, key)) {
        var val = d[key];
        delete d[key];
        return val;
    } else {
        return default_;
    }
};

function dict_keys(d) {
    return Object.keys(d);
}

function dict_copy(d) {
    return Object.assign(make_dict(), d);
}

function dict_items(d) {
    return Object.entries(d);
}

function gui_wait_for_click(ast, msg, continue_execution) {
    console.log('at ' + ast.lineno + '.' + (ast.col_offset + 1) + '-' + ast.end_lineno + '.' + (ast.end_col_offset + 1) + msg);
    return continue_execution;
};

function py_tokenset() {
    return Array.prototype.slice.call(arguments, py_tokenset.length);
};

function dict_has(d, a) {
    if (d === undefined) {
        return false;
    } else return Object.prototype.hasOwnProperty.call(d, a);
}

function dict_len(obj) {
    return Object.keys(obj).length
}

function chr(code) {
    return String.fromCodePoint.apply(null, [code]);
}

function ord(char) {
    return char.charCodeAt(0);
}

function hasattr(obj, attr) {
    return obj !== undefined && obj[attr] !== undefined;
}

function getattr(obj, attr, default_) {
    let val = obj[attr];
    if (val === undefined){
        return default_;
    } else {
        return val;
    }
}

function tuple_to_list(tup) {tup.slice();};

function list_to_tuple(lst) {lst.slice();};

function runtime_random() {
    return Math.random();
}

function runtime_time() {
    return new Date() / 1000.0; // convert milliseconds to seconds
}

function list_new(size, default_) {
    return Array.from({length: size}, function() {return default_;});
}

function list_concat(lst1, lst2){
    return lst1.concat(lst2);
}

function list_repeat(lst, n) {
    var lst_length = lst.length;

    if (lst_length === 0) {
        return [];
    }
    else if (lst_length === 1) {
        return Array(n).fill(lst[0]);
    }
    else {
        return Array(n).fill(lst).flat();
    }
}

function list_reversed(lst) {
    return lst.slice().reverse();
}

function list_pop(lst) {
    return lst.pop();
}

function list_copy(lst){
    return lst.slice();
}

function list_set_slice(lst, start, stop, step, seq) {
    if (step === 1) {
        Array.prototype.splice.apply(lst, [start, stop - start].concat(seq.slice(0, stop - start)));
    } else {
        var i;
        var j = 0;
        if (step > 0) {
            for (i = start; i < stop; i += step) {
                lst[i] = seq[j];
                j ++;
            }
        } else {
            for (i = start; i > stop; i += step) {
                lst[i] = seq[j];
                j ++;
            }
        }
    }
}

function list_get_slice(lst, start, stop, step) {
    if (step === 1) {
        return lst.slice(start, stop);
    } else {
        var new_lst = list_new(Math.floor((stop - start) / step))
        var i;
        var j = 0;
        if (step > 0) {
            for (i = start; i < stop; i += step) {
                new_lst[j] = lst[i];
                j++;
            }
        } else {
            for (i = start; i > stop; i += step) {
                new_lst[j] = lst[i];
                j++;
            }
        }
        return new_lst;
    }
}

function string_mul(s, times) {
    if (times <= 0) {
        return "";
    } else {
        return s.repeat(times);
    }
}

function string_eq(s1, s2) {
    return s1 === s2;
}

function string_ne(s1, s2) {
    return s1 !== s2;
}

function string_lt(s1, s2) {
    return s1 < s2;
}

function string_le(s1, s2) {
    return s1 <= s2;
}

function string_gt(s1, s2) {
    return s1 > s2;
}

function string_ge(s1, s2) {
    return s1 >= s2;
}

function string_contains(s, sub_s) {
    return s.includes(sub_s);
}

function string_join(sep, strings) {
    return strings.join(sep)
}

function string_lower(string) {
    return string.toLowerCase();
}

function string_upper(string) {
    return string.toUpperCase();
}


function string_swapcase(string){
    return string.split('').map(
                function (char) {
                    var upperCaseChar = char.toUpperCase();
                    return char === upperCaseChar ? char.toLowerCase() : upperCaseChar
                }
            ).join('');
}


function string_replace(string, pattern, replacement) {
    if (pattern === '') {
        // Treat the string as if it started and ended with empty strings (imitates Python behaviour instead of JS)
        if (string === ''){
            return replacement;
        } else {
            return replacement + string.split('').join(replacement) + replacement;
        }
    } else {
        return string.split(pattern).join(replacement);
    }
}


function string_split(string, sep, maxsplit=-1) {
    if (maxsplit === -1) {
        return string.split(sep);
    } else {
        var words = string.split(sep);

        if (maxsplit >= words.length) {
            // Case where maxsplit is higher or equal to maximum possible splits
            return words
        } else {
            var res = words.slice(0,maxsplit);
            res.push(words.slice(maxsplit).join(sep));
            return res;
        }
    }
}


function string_whitespace_split(string, maxsplit=-1) {
    var res;
    var trimmed_string = string.trimStart();

    if (trimmed_string.length === 0) {
        return []
    } else if (maxsplit === -1) {
        return trimmed_string.trim().split(/\s+/);
    } else if (maxsplit === 0) {
        return [trimmed_string];
    } else {
        // We have to do some fiddling manually to recover the tail
        // inspiration from: https://stackoverflow.com/a/19736877/5079316
        var re = new RegExp("^((?:\\S*\\s+){" + (maxsplit - 1) + "}\\S+)\\s+([\\s\\S]*)$");
        var halves = re.exec(trimmed_string);

        if (halves === null) {
            // maxsplit is bigger than maximum possible number of splits
            return trimmed_string.trim().split(/\s+/);
        } else {
            res = halves[1].split(/\s+/);
            res.push(halves[2])
            return res
        }
    }
}

// The two following implementation may seem like cheating, but they are actually very hard to get right in JS otherwise
// Consider the fact where the separator is 'aa' and splits at a point where the string is 'aaa', then the split must be
// done on the right most a's. So it is not possible to use String.split to implement right split methods
// The other option is probably to use string_last_index_of iteratively... but this is may not be faster than
// reversing the string and using the native JS implementation of split
function string_right_split(string, sep, maxsplit=-1) {
    var reversed_string = string.split("").reverse().join("");
    var reversed_res = string_split(reversed_string, sep.split("").reverse().join(""), maxsplit);
    return reversed_res.map(function (s) {return s.split("").reverse().join("")}).reverse()
}


function string_whitespace_right_split(string, maxsplit = -1){
    var reversed_string = string.split("").reverse().join("");
    var reversed_res = string_whitespace_split(reversed_string, maxsplit);
    return reversed_res.map(function (s) {return s.split("").reverse().join("")}).reverse()
}


function string_index_of(string, substring, start, stop) {
    var index = string.indexOf(substring, start);

    if (index === -1) {
        return index;
    } else {
        return (index + substring.length <= stop) ? index : -1;
    }
}


function string_last_index_of(string, substring, start, stop) {
    if (Math.max(0, stop - start) < substring.length){
        return -1
    } else {
        var index = string.lastIndexOf(substring, stop - substring.length);
        return index < start ? -1 : index
    }
}


function string_startswith(string, substring, start, stop) {
    if (substring.length > stop - start) {
        return false;
    } else {
        return string_index_of(string, substring, start, start + substring.length) === start;
    }
}


function string_endswith(string, substring, start, stop) {
    if (substring.length > stop - start) {
        return false;
    } else {
        var substring_start_index = stop - substring.length;
        return string_last_index_of(string, substring, substring_start_index, stop) === substring_start_index;
    }
}


function string_count(string, substring, start, stop) {
    var step = substring.length;
    var end = Math.min(stop, string.length);

    if (step === 0) {
        if (start > end) {
            return 0;
        } else {
            return end - start + 1;
        }
    } else {
        var i = start;
        var count = 0;
        var found;
        while (i < end) {
            found = string_index_of(string, substring, i, stop)
            if (found === -1) {
                return count;
            } else {
                count++;
                i = found + step;
            }
        }
        return count;
    }
}


function string_trim_left_whitespaces(string) {
    return string.trimLeft();
}


function string_trim_right_whitespaces(string) {
    return string.trimRight();
}


function string_trim_whitespaces(string) {
    return string.trim();
}


function string_trim_left_index(string, chars) {
    var start = 0;
    var stop = string.length;
    while (start < stop) {
        if (chars.includes(string.charAt(start))) {
            start ++;
        } else {
            break;
        }
    }
    return start
}


function string_trim_right_index(string, chars) {
    var stop = string.length - 1;
    while (stop >= 0) {
        if (chars.includes(string.charAt(stop))) {
            stop --;
        } else {
            break;
        }
    }
    return stop + 1;
}


function string_trim_left(string, chars) {
    var start = string_trim_left_index(string, chars);
    return string.slice(start);
}


function string_trim_right(string, chars) {
    var stop = string_trim_right_index(string, chars);
    return string.slice(0, stop);
}


function string_trim(string, chars) {
    var start = string_trim_left_index(string, chars);

    if (start < string.length){
        var stop = string_trim_right_index(string, chars);
        return string.slice(start, stop);
    } else {
        return "";
    }
}


function string_split_lines(string, keepends) {
    var res = string_split(string, '\n');

    if (keepends){
        var last_index = res.length - 1;
        res = res.map(function (s, i) {return i < last_index ? s + '\n' : s})
    }

    if (res.length > 0 && res[res.length - 1] === "") {
        // empty string at the end is not an actual line, but rather a file terminating by a '\n'
        res.pop();
    }
    return res;
}



function string_get_slice(s, start, stop, step) {
    if (step === 1) {
        return s.slice(start, stop);
    } else {
        var chars = list_new(Math.floor((stop - start) / step))
        var i;
        var j = 0;
        if (step > 0) {
            for (i = start; i < stop; i += step) {
                chars[j] = s[i];
                j++;
            }
        } else {
            for (i = start; i > stop; i += step) {
                chars[j] = s[i];
                j++;
            }
        }
        return chars.join('');
    }
}
function runtime_alert(msg) {console.log(msg);};function runtime_print(msg,rte) {console.log(msg);};function drawing_cs(rte, width, height) {};function drawing_fd(rte, xdist, ydist) {};function drawing_bk(rte, xdist, ydist) {};function drawing_lt(rte, angle) {};function drawing_rt(rte, angle) {};function drawing_ht(rte) {};function drawing_st(rte) {};function drawing_pd(rte) {};function drawing_pu(rte) {};function drawing_setpc(rte, r, g, b) {};function drawing_setpw(rte, width) {};function drawing_drawtext(rte, text) {};function drawing_setScreenMode(rte, width, height) {};function drawing_getScreenWidth(rte) { return 0; };function drawing_getScreenHeight(rte) { return 0; };function drawing_setPixel(rte, x, y, color) {};function drawing_fillRectangle(rte, x, y, width, height, color) {};function drawing_exportScreen(rte) { return ''; }var getMouseX = undefined;var getMouseY = undefined;var getMouseDown = undefined;function runtime_ast_is_from_repl(ast) {return false;}function runtime_getInnerHTML(rte, elem) { return false;}function runtime_setInnerHTML(rte, elem, content) { return false;}function runtime_hasAttribute(rte, elem, attr) {return false;}function runtime_getAttribute(rte, elem, attr) {return false;}function runtime_setAttribute(rte, elem, attr, val) {return false;}function runtime_removeAttribute(rte, elem, attr) {return false;} //=============================================================================

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

    return val.constructor === Int;

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

function int_from_num(n) {

    // Constructs a normalized Int from a floating point integer value.

    if (!Number.isInteger(n))
        throw "int_from_num's parameter must be an integer value";

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

function int_to_num(int_a, exact) {

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

function int_is_even(int_a) {

    // Tests if a normalized Int is even.

    var digs = int_to_digs(int_a);

    return (digs[0] & 1) === 0;
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

function int_div_floor(int_a, int_b) {

    var divmod = int_divmod_trunc(int_a, int_b);
    var div = divmod[0];
    var mod = divmod[1];

    if (int_is_zero(mod) || (int_is_neg(int_a) === int_is_neg(int_b))) {
        return div;
    } else {
        return int_sub(div, int_from_num(1));
    }
}

function int_mod_floor(int_a, int_b) {

    var mod = int_mod_trunc(int_a, int_b);

    if (int_is_zero(mod) || (int_is_neg(int_a) === int_is_neg(int_b))) {
        return mod;
    } else {
        return int_add(mod, int_b);
    }
}

function int_divmod_floor(int_a, int_b) {

    var divmod = int_divmod_trunc(int_a, int_b);
    var div = divmod[0];
    var mod = divmod[1];

    if (int_is_zero(mod) || (int_is_neg(int_a) === int_is_neg(int_b))) {
        return [div, mod];
    } else {
        return [int_sub(div, int_from_num(1)), int_add(mod, int_b)];
    }
}

function int_div_trunc(int_a, int_b) {

    // Division of two normalized Ints.

    var dm = int_divmod_nonneg(int_abs(int_a), int_abs(int_b));

    if (int_is_nonneg(int_a) === int_is_nonneg(int_b))
        return dm[0];
    else
        return int_neg(dm[0]);
}

function int_mod_trunc(int_a, int_b) {

    // Modulo of two normalized Ints.

    var dm = int_divmod_nonneg(int_abs(int_a), int_abs(int_b));

    if (int_is_nonneg(int_a))
        return dm[1];
    else
        return int_neg(dm[1]);
}

function int_divmod_trunc(int_a, int_b) {

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

function int_pow(int_a, int_b) {

    function pow(int_a, int_b) {
        if (int_is_zero(int_b)) {
            return int_from_num(1);
        } else {
            var sq = int_mul(int_a, int_a);
            var temp = pow(sq, int_shift(int_b, int_from_num(-1)));
            if (int_is_even(int_b)) {
                return temp;
            } else {
                return int_mul(int_a, temp);
            }
        }
    }

    return pow(int_a, int_b);
}

function int_pow_mod(int_a, int_b, int_c) {

    function pow(int_a, int_b) {
        if (int_is_zero(int_b)) {
            return int_mod_floor(int_from_num(1), int_c);
        } else {
            var sq = int_mod_floor(int_mul(int_a, int_a), int_c);
            var temp = pow(sq, int_shift(int_b, int_from_num(-1)));
            if (int_is_even(int_b)) {
                return temp;
            } else {
                return int_mod_floor(int_mul(int_a, temp), int_c);
            }
        }
    }

    return pow(int_mod_floor(int_a, int_c), int_b);
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

    var shift = Math.max(int_to_num(int_b), -(len_a*int_radix_log2));
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


function int_min(a, b) {
    if (int_lt(a, b)){
        return a;
    } else {
        return b;
    }
}


function int_max(a, b) {
    if (int_gt(a, b)){
        return a;
    } else {
        return b;
    }
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
    var scale = new Array(levels);

    var pow = int_from_num(radix);
    var i = 0;
    while (i < levels) {
        scale[i++] = pow;
        pow = int_mul(pow, pow);
    }

    function value(start, end, i) {
        if (start >= end) {
            return int_from_num(0);
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
            return int_from_num(d);
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

var getGlobalObject = function () {
    if (typeof self !== 'undefined') { return self; }
    else if (typeof window !== 'undefined') { return window; }
    else if (typeof global !== 'undefined') { return global; }
    else return this;
};

if (getGlobalObject().BigInt && !getGlobalObject().disableBigInt) {

    int_instance = function (val) { return val.constructor === BigInt; };
    int_from_num = function (n) { return BigInt(n); }; // n must be int. value
    int_to_num = function (int_a, exact) {
        var val = Number(int_a);
        if (exact && int_a != val) val = false;
        return val;
    };
    int_is_zero = function (int_a) { return int_a == 0; };
    int_is_pos = function (int_a) { return int_a > 0; };
    int_is_neg = function (int_a) { return int_a < 0; };
    int_is_nonneg = function (int_a) { return int_a >= 0; };
    int_eq = function (int_a, int_b) { return int_a == int_b; };
    int_ne = function (int_a, int_b) { return int_a != int_b; };
    int_lt = function (int_a, int_b) { return int_a < int_b; };
    int_le = function (int_a, int_b) { return int_a <= int_b; };
    int_gt = function (int_a, int_b) { return int_a > int_b; };
    int_ge = function (int_a, int_b) { return int_a >= int_b; };
    int_abs = function (int_a) { return int_a<0 ? -int_a : int_a; };
    int_neg = function (int_a) { return -int_a; };
    int_add = function (int_a, int_b) { return int_a+int_b; };
    int_sub = function (int_a, int_b) { return int_a-int_b; };
    int_mul = function (int_a, int_b) { return int_a*int_b; };
    int_is_even = function (int_a) { return (int_a % BigInt(2)) == 0; };

    int_div_floor = function (int_a, int_b) {
        return int_divmod_floor(int_a, int_b)[0];
    };

    int_mod_floor = function (int_a, int_b) {
        return int_divmod_floor(int_a, int_b)[1];
    };

    int_divmod_floor = function (int_a, int_b) {

        var div = int_a / int_b;
        var mod = int_a % int_b;

        if (mod == 0 || (int_a<0 === int_b<0)) {
            return [div, mod];
        } else {
            return [div-BigInt(1), mod+int_b];
        }
    };

    int_div_trunc = function (int_a, int_b) {
        return int_a/int_b; // integer div
    };

    int_mod_trunc = function (int_a, int_b) {
        return int_a%int_b;
    };

    int_divmod_trunc = function (int_a, int_b) {
        return [int_a/int_b, int_a%int_b];
    };

    int_pow = function (int_a, int_b) {
        return int_a ** int_b;
    };

    int_not = function (int_a) { return ~int_a; };
    int_and = function (int_a, int_b) { return int_a&int_b; };
    int_or = function (int_a, int_b)  { return int_a|int_b; };
    int_xor = function (int_a, int_b) { return int_a^int_b; };
    int_shift = function (int_a, int_b) { return int_a<<int_b; };
    int_lshift = function (int_a, int_b) { return int_a<<int_b; };
    int_rshift = function (int_a, int_b) { return int_a>>int_b; };
    int_to_string = function (int_a, radix) { return int_a.toString(radix); };
    int_from_string_radix10 = function (str) { return BigInt(str); };
    // int_from_string is not a method of BigInt
}

//-----------------------------------------------------------------------------
 //=============================================================================

// File: "float.js"

// Copyright (c) 2020 by Marc Feeley, All Rights Reserved.

//=============================================================================

// This library implements common floating point operations.

//-----------------------------------------------------------------------------

function float_instance(val) {
    // assumes ints are a separate type such as BigInt (see int.js)
    return typeof val === 'number';
}

function float_from_num(n) {
    return n;
}

function float_to_num(float_a) {
    return float_a;
}

function float_is_finite(float_a) {
    return isFinite(float_a);
}

function float_is_infinite(float_a) {
    return float_a === Infinity || float_a === -Infinity;
}

function float_is_nan(float_a) {
    return isNaN(float_a);
}

function float_is_zero(float_a) {
    return float_a === 0.0;
}

function float_is_pos(float_a) {
    return float_a > 0.0;
}

function float_is_neg(float_a) {
    if (float_a === 0) {
        // Special case for detecting -0.0
        return 1 / float_a < 0;
    } else {
        return float_a < 0.0;
    }
}

function float_is_nonneg(float_a) {
    return float_a >= 0.0;
}

function float_eq(float_a, float_b) {
    return float_a === float_b;
}

function float_ne(float_a, float_b) {
    return float_a !== float_b;
}

function float_lt(float_a, float_b) {
    return float_a < float_b;
}

function float_le(float_a, float_b) {
    return float_a <= float_b;
}

function float_gt(float_a, float_b) {
    return float_a > float_b;
}

function float_ge(float_a, float_b) {
    return float_a >= float_b;
}

function float_abs(float_a) {
    return Math.abs(float_a);
}

function float_neg(float_a) {
    return -float_a;
}

function float_add(float_a, float_b) {
    return float_a+float_b;
}

function float_sub(float_a, float_b) {
    return float_a-float_b;
}

function float_mul(float_a, float_b) {
    return float_a*float_b;
}

function float_div(float_a, float_b) {
    return float_a/float_b;
}

function float_mod(float_a, float_b) {
    return float_a%float_b;
}

function float_round(float_a) {
    return Math.round(float_a);
}

function float_round_to_digits(float_a, ndigits) {
    try {
        return parseFloat(float_a.toFixed(ndigits));
    } catch (e) {
        if (float_is_nonneg(ndigits) && (e instanceof RangeError)) {
            if (float_is_nonneg(float_a)) {
                return float_from_float(0.0);
            } else {
                return float_from_float(-0.0);
            }
        } else {
            throw e;
        }
    }
}

function float_mod_floor(float_a, float_b){
    return float_a - float_floor(float_a / float_b) * float_b
}

function float_trunc(float_a) {
    return Math.trunc(float_a);
}

function float_floor(float_a) {
    return Math.floor(float_a);
}

function float_ceil(float_a) {
    return Math.ceil(float_a);
}

function float_exp(float_a) {
    return Math.exp(float_a);
}

function float_expm1(float_a) {
    return Math.expm1(float_a);
}

function float_log(float_a) {
    return Math.log(float_a);
}

function float_log2(float_a) {
    return Math.log2(float_a);
}

function float_log10(float_a) {
    return Math.log10(float_a);
}

function float_log1p(float_a) {
    return Math.log1p(float_a);
}

function float_pow(float_a, float_b) {
    return Math.pow(float_a, float_b);
}

function float_sqrt(float_a) {
    return Math.sqrt(float_a);
}

function float_sin(float_a) {
    return Math.sin(float_a);
}

function float_cos(float_a) {
    return Math.cos(float_a);
}

function float_tan(float_a) {
    return Math.tan(float_a);
}

function float_asin(float_a) {
    return Math.asin(float_a);
}

function float_acos(float_a) {
    return Math.acos(float_a);
}

function float_atan(float_a) {
    return Math.atan(float_a);
}

function float_atan2(float_a, float_b) {
    return Math.atan2(float_a, float_b);
}

function float_pi() {
    return Math.PI;
}

function float_e() {
    return Math.E;
}

function float_inf() {
    return Infinity;
}

function float_neg_inf() {
    return -Infinity;
}

function float_nan() {
    return NaN;
}

function float_to_string(float_a) {
    if (isNaN(float_a)) {
        return 'nan';
    } else if (!isFinite(float_a)) {
        return (float_a < 0) ? '-inf' : 'inf';
    } else if (float_a === 0) {
        return (1/float_a < 0) ? '-0.0' : '0.0';
    } else {
        var str_a = float_a + '';
        if (str_a.includes('.') || str_a.includes('e'))
            return str_a;
        else
            return str_a + ".0";
    }
}

function float_from_string(str) {
    return parseFloat(str);
}

//-----------------------------------------------------------------------------