# _runtime.py
# Runtime for zp compiler


def nocompile(f):
    return f


###
# Dict operations
###

def make_dict():
    return dict()


def dict_get(d, key, default_value):
    return d.get(key, default_value)


def dict_set(d, key, value):
    d[key] = value

def dict_pop(d, key, default_):
    return d.pop(key, default_)

def dict_has(d, key):
    return key in d.keys()

def dict_keys(d):
    return list(d.keys())

def dict_items(d):
    return list(d.items())

def dict_copy(d):
    return d.copy()

def dict_len(d):
    return len(d)


###
# Struct operations
###

# struct are optimized by the zp compiler for the JS version of pyinterp
# this implementation is probably very slow but it allows to do a python test-run
# to check that dict_... and struct_... are not mixed at runtime

class __Struct(dict):
    pass

def make_struct():
    return __Struct()

def struct_get(struct, attr):
    if isinstance(struct, __Struct):
        return struct[attr]
    else:
        raise TypeError("struct_get requires a __Struct as first argument")

def struct_set(struct, attr, val):
    if isinstance(struct, __Struct):
        struct[attr] = val
    else:
        raise TypeError("struct_set requires a __Struct as first argument")

###
# Int operations
###

def int_instance(n):
    return isinstance(n, int)


def int_from_num(u):
    return int(u)


def int_is_zero(u):
    return u == 0


def int_is_neg(u):
    return u < 0

def int_is_pos(u):
    return u > 0

def int_is_nonneg(u):
    return u >= 0


def int_cmp(u, v):
    if u < v:
        return -1
    elif u == v:
        return 0
    elif u > v:
        return 1


def int_eq(u, v):
    return u == v


def int_ne(u, v):
    return u != v


def int_lt(u, v):
    return u < v


def int_le(u, v):
    return u <= v


def int_gt(u, v):
    return u > v


def int_ge(u, v):
    return u >= v


def int_abs(u):
    return abs(u)


def int_neg(u):
    return -u


def int_add(u, v):
    return u + v


def int_sub(u, v):
    return u - v


def int_mul(u, v):
    return u * v


def int_div_floor(u, v):
    return u // v


def int_mod_floor(u, v):
    return u % v


def int_divmod_floor(u, v):
    return divmod(u, v)


def int_not(u):
    return ~u


def int_min(u, v):
    return min(u, v)


def int_max(u, v):
    return max(u, v)


def float_inf():
    return float("inf")


def float_neg_inf():
    return float("-inf")


def float_nan():
    return float("nan")


def int_to_num(u, exact=None):
    try:
        float(u)
        return u
    except OverflowError:
        if exact:
            return False
        elif int_is_neg(u):
            return float_neg_inf()
        else:
            return float_int()


def int_and(u, v):
    return u & v


def int_neg(n):
    return -n


def int_not(n):
    return ~n


def int_or(u, v):
    return u | v


def int_xor(u, v):
    return u ^ v


def int_lshift(u, v):
    return u << v


def int_rshift(u, v):
    return u >> v


def int_to_string(u, radix):
    if radix == 2:
        return format(u, "b")
    elif radix == 8:
        return format(u, "o")
    elif radix == 16:
        return format(u, "x")
    else:
        return str(u)


def int_pow_mod(u, v, m):
    return pow(u, v, m)


def int_pow(u, v):
    return pow(u, v)


def int_is_even(u):
    return u % 2 == 0


def int_round(x, ndigits):
    return round(x, ndigits)


def int_from_string(string, radix):
    try:
        return int(string, radix)
    except ValueError:
        return False


def int_from_substring(string, start, stop, radix):
    try:
        return int(string[start:stop], radix)
    except ValueError:
        return False


###
# Float operations
###

def float_instance(u):
    return isinstance(u, float)


def float_from_num(u):
    return float(u)


def float_to_num(u):
    return u


def float_is_zero(u):
    return u == 0


def float_is_infinite(u):
    return math.isinf(u)


def float_is_finite(u):
    return math.isfinite(u)


def float_is_nan(u):
    return math.isnan(u)


def float_is_pos(u):
    return u > 0.0


def float_is_nonneg(u):
    return u >= 0.0


def float_eq(u, v):
    return u == v


def float_ne(u, v):
    return u != v


def float_lt(u, v):
    return u < v


def float_le(u, v):
    return u <= v


def float_gt(u, v):
    return u > v


def float_ge(u, v):
    return u >= v


def float_abs(u):
    return abs(u)


def float_neg(u):
    return -u


def float_add(u, v):
    return u + v


def float_sub(u, v):
    return u - v


def float_mul(u, v):
    return u * v


def float_div(u, v):
    return u / v


def float_mod(u, v):
    return u % v


def float_mod_floor(u, v):
    return u % v


def float_is_zero(u):
    return u == 0


def float_is_neg(u):
    return math.copysign(1.0, u) == -1.0


def float_from_string(string):
    return float(string)


def float_to_string(u):
    return str(u)


##
# module math
##


def float_sqrt(u):
    return math.sqrt(u)


lowest_float_with_precision_1 = 2.0 ** 52


def float_floor(u):
    if abs(u) < lowest_float_with_precision_1:
        return float(math.floor(u))
    else:
        return u


def float_trunc(u):
    if abs(u) < lowest_float_with_precision_1:
        return float(math.trunc(u))
    else:
        return u


def float_ceil(u):
    if abs(u) < lowest_float_with_precision_1:
        return float(math.ceil(u))
    else:
        return u


def float_sin(u):
    return math.sin(u)


def float_cos(u):
    return math.cos(u)


def float_tan(u):
    return math.tan(u)


def float_asin(u):
    return math.asin(u)


def float_acos(u):
    return math.acos(u)


def float_atan(u):
    return math.atan(u)


def float_atan2(u, v):
    return math.atan2(u, v)


def float_exp(u):
    return math.exp(u)


def float_log(u):
    return math.log(u)


def float_log2(u):
    return math.log2(u)


def float_log10(u):
    return math.log10(u)

def float_log1p(u):
    return math.log1p(u)

def float_pow(u, v):
    try:
        return math.pow(u, v)
    except OverflowError:
        if u < 0:
            return float_neg_inf()
        else:
            return float_inf()
    except ValueError:
        return float_nan()


def float_pi():
    return math.pi


def float_e():
    return math.e


def float_epsilon():
    return sys.float_info.epsilon


def float_round(x):
    return round(x, 0)


def float_round_to_digits(x, ndigits):
    return round(x, ndigits)


###
# List operations
###

def list_new(size, default_):
    return [default_] * size


def list_concat(l1, l2):
    new_lst = []
    for x in l1:
        new_lst.append(x)

    for y in l2:
        new_lst.append(y)

    return new_lst


def list_repeat(lst, n):
    return lst * n


def list_reversed(l):
    return l[::-1]


def list_pop(l):
    return l.pop()


def list_set_slice(lst, start, stop, step, seq):
    for i, j in enumerate(range(start, stop, step)):
        lst[j] = seq[i]

def list_get_slice(lst, start, stop, step):
    return [lst[i] for i in range(start, stop, step)]

def list_copy(lst):
    return lst.copy()

###
# Str operations
###

def string_mul(s, times):
    return s * times


def string_eq(s1, s2):
    return s1 == s2


def string_ne(s1, s2):
    return s1 != s2


def string_lt(s1, s2):
    return s1 < s2


def string_le(s1, s2):
    return s1 <= s2


def string_gt(s1, s2):
    return s1 > s2


def string_ge(s1, s2):
    return s1 >= s2


def string_contains(s, sub_s):
    return sub_s in s


def string_join(sep, strings):
    return sep.join(strings)


def string_replace(string, pattern, replacement):
    return string.replace(pattern, replacement)


def string_upper(string):
    return string.upper()


def string_lower(string):
    return string.lower()


def string_swapcase(string):
    return string.swapcase()


def string_split(string, sep, maxsplit=-1):
    return string.split(sep, maxsplit)


def string_whitespace_split(string, maxsplit=-1):
    return string.split(maxsplit=maxsplit)


def string_right_split(string, sep, maxsplit=-1):
    return string.rsplit(sep, maxsplit)


def string_whitespace_right_split(string, maxsplit=-1):
    return string.rsplit(maxsplit=maxsplit)


def string_index_of(string, substring, start, stop):
    return string.find(substring, start, stop)


def string_last_index_of(string, substring, start, stop):
    return string.rfind(substring, start, stop)


def string_startswith(string, substring, start, stop):
    return string.startswith(substring, start, stop)


def string_endswith(string, substring, start, stop):
    return string.endswith(substring, start, stop)


def string_count(string, substring, start, stop):
    return string.count(substring, start, stop)


def string_trim_left_whitespaces(string):
    return string.lstrip()


def string_trim_right_whitespaces(string):
    return string.rstrip()


def string_trim_whitespaces(string):
    return string.strip()


def string_trim_left(string, chars):
    return string.lstrip(chars)


def string_trim_right(string, chars):
    return string.rstrip(chars)


def string_trim(string, chars):
    return string.strip(chars)


def string_split_lines(string, keepends):
    return string.splitlines(keepends)


def string_get_slice(s, start, stop, step):
    return ''.join([s[i] for i in range(start, stop, step)])

###
# IO operations
###

def runtime_alert(msg):
    print(msg)


def runtime_confirm(msg):
    try:
        input(msg)
        return True
    except Exception:
        return False


def runtime_print(msg, rte):
    print(msg)


def runtime_input(msg):
    try:
        return input(msg)
    except Exception:
        return None


def runtime_prompt(msg):
    return runtime_input(msg)


def runtime_sleep(ms):
    time.sleep(ms / 1000)


def runtime_read_file(rte, filename):
    try:
        with open(filename, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return None

def runtime_attach_ast_to_file(rte, ast, filename):
    pass

def runtime_ast_is_from_repl(ast):
    return False

# Module random
import random, math, sys, time


def runtime_random():
    return random.random()


# Module turtle (graphics) placeholder
def drawing_cs(rte, width=None, height=None):
    pass

def drawing_fd(rte, xdist, ydist):
    pass

def drawing_bk(rte, xdist, ydist):
    pass

def drawing_lt(rte, angle):
    pass

def drawing_rt(rte, angle):
    pass

def drawing_ht(rte):
    pass

def drawing_st(rte):
    pass

def drawing_pd(rte):
    pass

def drawing_pu(rte):
    pass

def drawing_mv(rte, x, y):
    pass

def drawing_setpc(rte, r, g, b):
    pass

def drawing_setpw(rte, width):
    pass

def drawing_drawtext(rte, text):
    pass

# Pixels functions
def drawing_setScreenMode(rte, width, height):
    pass

def drawing_getScreenMode(rte):
    return 0

def drawing_getScreenHeight(rte):
    return 0

def drawing_setPixel(rte, x, y, color):
    pass

def drawing_fillRectangle(rte, x, y, width, height):
    pass

def drawing_exportScreen(rte):
    return ''

def drawing_getScreenWidth(rte):
    return 0

getMouse = None
getMouseX = None
getMouseY = None
getMouseButton = None
getMouseShift = None
getMouseCtrl = None
getMouseAlt = None

debug = False

if debug:
    for k, v in globals().copy().items():
        if "from_string" in k:
            def wrapper(*args, v=v):
                if all(isinstance(x, str) for x in args):
                    return v(*args)
                else:
                    raise TypeError(v, args)


            globals()[k] = wrapper
        elif k == "int_from_num":
            def wrapper(*args, v=v):
                if all(int(x) == x for x in args):
                    return v(*args)
                else:
                    raise TypeError(v, args)


            globals()[k] = wrapper
        elif k.startswith("int_"):
            def wrapper(*args, v=v):
                if all(isinstance(x, int) for x in args):
                    return v(*args)
                else:
                    raise TypeError(v, args)


            globals()[k] = wrapper

        elif k.startswith("float_"):
            def wrapper(*args, v=v):
                if all(isinstance(x, float) for x in args):
                    return v(*args)
                else:
                    raise TypeError(v, args)


            globals()[k] = wrapper

def runtime_get_compilationError_thrower(vm, container, src):
    return None

def runtime_get_syntaxError_thrower(compilation_error):
    return None

def runtime_get_file_container(rte, filename):
    return None

def runtime_readFile(rte, filename):
    try:
        with open(filename, 'r') as f:
            return f.read()
    except OSError:
        return None

def runtime_writeFile(rte, filename, content):
    try:
        with open(filename, 'w') as f:
            return f.write(content)
    except OSError:
        return None

def runtime_querySelector(rte, selector):
    raise NotImplementedError("not running in a browser")

def runtime_getInnerHTML(rte, elem):
    raise NotImplementedError("not running in a browser")

def runtime_setInnerHTML(rte, elem, content):
    raise NotImplementedError("not running in a browser")

def runtime_getValue(rte, elem):
    raise NotImplementedError("not running in a browser")

def runtime_setValue(rte, elem, content):
    raise NotImplementedError("not running in a browser")

def runtime_hasAttribute(rte, elem, attr):
    raise NotImplementedError("not running in a browser")

def runtime_setAttribute(rte, elem, attr, value):
    raise NotImplementedError("not running in a browser")

def runtime_removeAttribute(rte, elem, attr):
    raise NotImplementedError("not running in a browser")

def runtime_getAttribute(rte, elem, attr):
    raise NotImplementedError("not running in a browser")
