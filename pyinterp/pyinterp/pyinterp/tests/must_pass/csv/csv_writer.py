# Adapatation of test_csv.py from https://github.com/python/cpython/blob/5445e173e76ec792358082caf660fbdc846c64b2/Lib/test/test_csv.py#L8
import csv

class FakeFile:
    def __init__(self):
        self.content = ""

    def write(self, val):
        self.content = self.content + val
        return len(val)

    def read(self):
        return self.content

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

class BrokenFile:
    def write(self, buf):
        raise OSError

class BadIterable:
    def __iter__(self):
        raise OSError

class BadList:
    def __len__(self):
        return 10
    def __getitem__(self, i):
        if i > 2:
            raise OSError

class BadItem:
    def __str__(self):
        raise OSError


def assertEqual(result, expected):
    assert result == expected, "\n" + str(result) + "\n!=\n" + str(expected)

def assertRaises(exc_type, fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except Exception as e:
        if not isinstance(e, exc_type):
            assert False, "wrong exception: " + type(e).__name__ + ": " + str(e)

def _write_test(fields, expect, **kwargs):
    # hack to get lineterminator while Dialect is not accessible in pyinterp
    with FakeFile() as f:
        writer = csv.writer(f, **kwargs)
        writer.writerow([])
        lineterminator = f.read()

    with FakeFile() as fileobj:
        writer = csv.writer(fileobj, **kwargs)
        writer.writerow(fields)
        assertEqual(fileobj.read(), expect + lineterminator)

def _write_error_test(exc, fields, **kwargs):
    with FakeFile() as fileobj:
        writer = csv.writer(fileobj, **kwargs)
        assertRaises(exc, writer.writerow, fields)
        assertEqual(fileobj.read(), '')

# test_write_arg_valid
print("test_write_arg_valid")
_write_error_test(csv.Error, None)
_write_test((), '')
_write_test([None], '""')
_write_error_test(csv.Error, [None], quoting = csv.QUOTE_NONE)
print("OK")

# Check that exceptions are passed up the chain
print("Check that exceptions are passed up the chain")
_write_error_test(OSError, BadIterable())
_write_error_test(OSError, BadList())
_write_error_test(OSError, [BadItem()])
print("OK")

# test_write_quoting
print("test_write_quoting")
_write_test(['a',1,'p,q'], 'a,1,"p,q"')
_write_error_test(csv.Error, ['a',1,'p,q'],
                           quoting = csv.QUOTE_NONE)
_write_test(['a',1,'p,q'], 'a,1,"p,q"',
                     quoting = csv.QUOTE_MINIMAL)
_write_test(['a',1,'p,q'], '"a",1,"p,q"',
                     quoting = csv.QUOTE_NONNUMERIC)
_write_test(['a',1,'p,q'], '"a","1","p,q"',
                     quoting = csv.QUOTE_ALL)
_write_test(['a\nb',1], '"a\nb","1"',
                     quoting = csv.QUOTE_ALL)
print("OK")

# test_write_escape
print("test_write_escape")
_write_test(['a',1,'p,q'], 'a,1,"p,q"',
                     escapechar='\\')
_write_error_test(csv.Error, ['a',1,'p,"q"'],
                           escapechar=None, doublequote=False)
_write_test(['a',1,'p,"q"'], 'a,1,"p,\\"q\\""',
                     escapechar='\\', doublequote = False)
_write_test(['"'], '""""',
                     escapechar='\\', quoting = csv.QUOTE_MINIMAL)
_write_test(['"'], '\\"',
                     escapechar='\\', quoting = csv.QUOTE_MINIMAL,
                     doublequote = False)
_write_test(['"'], '\\"',
                     escapechar='\\', quoting = csv.QUOTE_NONE)
_write_test(['a',1,'p,q'], 'a,1,p\\,q',
                     escapechar='\\', quoting = csv.QUOTE_NONE)
_write_test(['\\', 'a'], '\\\\,a',
                     escapechar='\\', quoting=csv.QUOTE_NONE)
_write_test(['\\', 'a'], '\\\\,a',
                     escapechar='\\', quoting=csv.QUOTE_MINIMAL)
_write_test(['\\', 'a'], '"\\\\","a"',
                     escapechar='\\', quoting=csv.QUOTE_ALL)
_write_test(['\\ ', 'a'], '\\\\ ,a',
                     escapechar='\\', quoting=csv.QUOTE_MINIMAL)
_write_test(['\\,', 'a'], '\\\\\\,,a',
                     escapechar='\\', quoting=csv.QUOTE_NONE)
_write_test([',\\', 'a'], '",\\\\",a',
                     escapechar='\\', quoting=csv.QUOTE_MINIMAL)
_write_test(['C\\', '6', '7', 'X"'], 'C\\\\,6,7,"X"""',
                     escapechar='\\', quoting=csv.QUOTE_MINIMAL)
print("OK")

# test_write_lineterminator
print("test_write_lineterminator")
for lineterminator in '\r\n', '\n', '\r', '!@#', '\0':
    with FakeFile() as f:
        writer = csv.writer(f, lineterminator=lineterminator)
        writer.writerow(['a', 'b'])
        writer.writerow([1, 2])
        assertEqual(f.read(), 'a,b' + lineterminator + '1,2' + lineterminator)
print("OK")

# test_write_iterable
print("test_write_iterable")
_write_test(iter(['a', 1, 'p,q']), 'a,1,"p,q"')
_write_test(iter(['a', 1, None]), 'a,1,')
_write_test(iter([]), '')
_write_test(iter([None]), '""')
_write_error_test(csv.Error, iter([None]), quoting=csv.QUOTE_NONE)
_write_test(iter([None, None]), ',')
print("OK")

# TODO: uncomment when csv.writer.writerows exist

# test_writerows
#print("test_writerows")

#writer = csv.writer(BrokenFile())
#self.assertRaises(OSError, writer.writerows, [['a']])

#with FakeFile() as fileobj:
#    writer = csv.writer(fileobj, lineterminator="\n")
#    self.assertRaises(TypeError, writer.writerows, None)
#    writer.writerows([['a', 'b'], ['c', 'd']])
#    self.assertEqual(fileobj.read(), "a,b\nc,d\n")
#print("OK")

# test_writerows_with_none
#print("test_writerows_with_none")
#with FakeFile() as fileobj:
#    writer = csv.writer(fileobj, lineterminator="\n")
#    writer.writerows([['a', None], [None, 'd']])
#    self.assertEqual(fileobj.read(), "a,\n,d\n")

#with FakeFile() as fileobj:
#    writer = csv.writer(fileobj, lineterminator="\n")
#    writer.writerows([[None], ['a']])
#    self.assertEqual(fileobj.read(), '""\na\n')

#with FakeFile() as fileobj:
#    writer = csv.writer(fileobj, lineterminator="\n")
#    writer.writerows([['a'], [None]])
#    self.assertEqual(fileobj.read(), 'a\n""\n')
#print("OK")

# test_writerows_errors
#print("test_writerows_errors")
#with FakeFile() as fileobj:
#    writer = csv.writer(fileobj)
#    self.assertRaises(TypeError, writer.writerows, None)
#    self.assertRaises(OSError, writer.writerows, BadIterable())
#print("OK")
