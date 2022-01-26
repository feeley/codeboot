# Tests adapted from https://github.com/python/cpython/blob/91e33ac3d08a1c6004c469da2c0e2a97b5bdc53c/Lib/test/test_csv.py

import csv


def _read_test(input, expected, *args, **kwargs):
    result = list(csv.reader(input, *args, **kwargs))
    assert result == expected, "\n" + str(result) + "\n!=\n" + str(expected)
    # Sanity check
    print("OK")

def assertRaises(exc_type, fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except Exception as e:
        if isinstance(e, exc_type):
            return True
        else:
            assert False, "wrong exception: " + type(e).__name__ + ": " + str(e)

_read_test([], [])
_read_test([''], [[]])
assertRaises(csv.Error, _read_test, ['"ab"c'], None, strict = 1)
_read_test(['"ab"c'], [['abc']], doublequote = 0)

# test_read_oddinputs
print("test_read_oddinputs")
_read_test(['a,b'], [['a','b']])
_read_test(['a,b\n'], [['a','b']])
_read_test(['a,b\r\n'], [['a','b']])
_read_test(['a,b\r'], [['a','b']])
assertRaises(csv.Error, _read_test, ['a,b\rc,d'], [])
assertRaises(csv.Error, _read_test, ['a,b\nc,d'], [])
assertRaises(csv.Error, _read_test, ['a,b\r\nc,d'], [])

# test_read_eol
print("test_read_eol")
_read_test(['a,"'], [['a', '']])
_read_test(['"a'], [['a']])
_read_test(['^'], [['\n']], escapechar='^')
assertRaises(csv.Error, _read_test, ['a,"'], [], strict=True)
assertRaises(csv.Error, _read_test, ['"a'], [], strict=True)
assertRaises(csv.Error, _read_test,
             ['^'], [], escapechar='^', strict=True)

# test_read_nul
# TODO: add thoses tests when different encodings are supported
#print("test_read_nul")
#_read_test(['\0'], [['\0']])
#_read_test(['a,\0b,c'], [['a', '\0b', 'c']])
#_read_test(['a,b\0,c'], [['a', 'b\0', 'c']])
#_read_test(['a,b\\\0,c'], [['a', 'b\0', 'c']], escapechar='\\')
#_read_test(['a,"\0b",c'], [['a', '\0b', 'c']])

# test_read_delimiter
print("test_read_delimiter")
_read_test(['a,b,c'], [['a', 'b', 'c']])
_read_test(['a;b;c'], [['a', 'b', 'c']], delimiter=';')
_read_test(['a\\b\\c'], [['a', 'b', 'c']], delimiter='\\')

# test_read_escape
print("test_read_escape")
_read_test(['a,\\b,c'], [['a', 'b', 'c']], escapechar='\\')
_read_test(['a,b\\,c'], [['a', 'b,c']], escapechar='\\')
_read_test(['a,"b\\,c"'], [['a', 'b,c']], escapechar='\\')
_read_test(['a,"b,\\c"'], [['a', 'b,c']], escapechar='\\')
_read_test(['a,"b,c\\""'], [['a', 'b,c"']], escapechar='\\')
_read_test(['a,"b,c"\\'], [['a', 'b,c\\']], escapechar='\\')
_read_test(['a,^b,c'], [['a', 'b', 'c']], escapechar='^')
_read_test(['a,\\b,c'], [['a', '\\b', 'c']], escapechar=None)
_read_test(['a,\\b,c'], [['a', '\\b', 'c']])

# test_read_quoting
print("test_read_quoting")
_read_test(['1,",3,",5'], [['1', ',3,', '5']])
_read_test(['1,",3,",5'], [['1', '"', '3', '"', '5']],
            quotechar=None, escapechar='\\')
_read_test(['1,",3,",5'], [['1', '"', '3', '"', '5']],
            quoting=csv.QUOTE_NONE, escapechar='\\')
    # will this fail where locale uses comma for decimals?
_read_test([',3,"5",7.3, 9'], [['', 3, '5', 7.3, 9]],
            quoting=csv.QUOTE_NONNUMERIC)
_read_test(['"a\nb", 7'], [['a\nb', ' 7']])
assertRaises(ValueError, _read_test,
                      ['abc,3'], [[]],
            quoting=csv.QUOTE_NONNUMERIC)
_read_test(['1,@,3,@,5'], [['1', ',3,', '5']], quotechar='@')
