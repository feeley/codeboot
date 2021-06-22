String.prototype.lstrip = function() {
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
