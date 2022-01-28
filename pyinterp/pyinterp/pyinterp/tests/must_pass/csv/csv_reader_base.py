# Tests adapted from https://github.com/python/cpython/blob/91e33ac3d08a1c6004c469da2c0e2a97b5bdc53c/Lib/test/test_csv.py

import csv

def readerAssertEqual(input, expected):
    as_file = input.splitlines(True)
    result = list(csv.reader(as_file))
    assert result == expected, "\n" + str(result) + "\n!=\n" + str(expected)
    # Sanity check
    print("OK")


readerAssertEqual('abc', [['abc']])
readerAssertEqual('1,2,3,4,5', [['1','2','3','4','5']])
readerAssertEqual('', [])
readerAssertEqual(',', [['', '']])
readerAssertEqual('""', [['']])
readerAssertEqual('"",', [['','']])
readerAssertEqual(',""', [['','']])
readerAssertEqual('""""', [['"']])
readerAssertEqual('""""""', [['""']])
readerAssertEqual('a""b', [['a""b']])
readerAssertEqual('a"b"c', [['a"b"c']])
readerAssertEqual('"a"b', [['ab']])
readerAssertEqual('a"b', [['a"b']])
readerAssertEqual('"a" "b"', [['a "b"']])
readerAssertEqual(' "a"', [[' "a"']])
readerAssertEqual('1,2,3,"I think, therefore I am",5,6',
                   [['1', '2', '3',
                     'I think, therefore I am',
                     '5', '6']])
readerAssertEqual('1,2,3,"""I see,"" said the blind man","as he picked up his hammer and saw"',
                   [['1', '2', '3',
                     '"I see," said the blind man',
                     'as he picked up his hammer and saw']])

input = '''\
1,2,3,"""I see,""
said the blind man","as he picked up his
hammer and saw"
9,8,7,6'''
readerAssertEqual(input,
                   [['1', '2', '3',
                       '"I see,"\nsaid the blind man',
                       'as he picked up his\nhammer and saw'],
                    ['9','8','7','6']])

readerAssertEqual('12,12,1",', [['12', '12', '1"', '']])
