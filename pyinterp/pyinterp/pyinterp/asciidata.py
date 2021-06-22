# Simplified version of the Python unicodedata module to allow similar support but only for extended ascii

# Adapted unicode categories adapted to mimic Python behaviour on extended ascci
# Can be generated from:

# import unicodedata
#
# extended_ascii_chars = [chr(c) for c in range(256)]
# categories = [unicodedata.category(c) for c in extended_ascii_chars]
#
# category_map = {}
# for i, cat in enumerate(sorted(set(categories), key=lambda cat: (cat[0], -categories.count(cat), cat))):
#     print(f'extended_ascii_category_{cat} = {i}')
#     category_map[cat] = i
#
# extended_ascii_data = [category_map.get(unicodedata.category((c))) for c in extended_ascii_chars]
#
# print()
# print("extended_ascii_data =", extended_ascii_data)

extended_ascii_category_Cc = 0
extended_ascii_category_Cf = 1
extended_ascii_category_Ll = 2
extended_ascii_category_Lu = 3
extended_ascii_category_Lo = 4
extended_ascii_category_Nd = 5
extended_ascii_category_No = 6
extended_ascii_category_Po = 7
extended_ascii_category_Pe = 8
extended_ascii_category_Ps = 9
extended_ascii_category_Pc = 10
extended_ascii_category_Pd = 11
extended_ascii_category_Pf = 12
extended_ascii_category_Pi = 13
extended_ascii_category_Sm = 14
extended_ascii_category_Sk = 15
extended_ascii_category_Sc = 16
extended_ascii_category_So = 17
extended_ascii_category_Zs = 18

extended_ascii_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                       18, 7, 7, 7, 16, 7, 7, 7, 9, 8, 7, 14, 7, 11, 7, 7, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 7, 7, 14, 14,
                       14, 7, 7, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 9, 7, 8,
                       15, 10, 15, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9, 14,
                       8, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                       0, 0, 0, 18, 7, 16, 16, 16, 16, 17, 7, 15, 17, 4, 13, 14, 1, 17, 15, 17, 14, 6, 6, 15, 2, 7, 7,
                       15, 6, 4, 12, 6, 6, 6, 7, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
                       14, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
                       14, 2, 2, 2, 2, 2, 2, 2, 2]


def extended_ascii_is_alpha(code):
    if code <= 255:
        category = extended_ascii_data[code]
        return extended_ascii_category_Ll <= category and category <= extended_ascii_category_Lo
    else:
        return None


def extended_ascii_is_alnum(code):
    if code <= 255:
        category = extended_ascii_data[code]
        return extended_ascii_category_Ll <= category and category <= extended_ascii_category_No
    else:
        return None


def extended_ascii_is_lower(code):
    if code <= 255:
        return extended_ascii_data[code] == extended_ascii_category_Ll
    else:
        return None


def extended_ascii_is_not_upper(code):
    if code <= 255:
        return extended_ascii_data[code] != extended_ascii_category_Lu
    else:
        return None


def extended_ascii_is_upper(code):
    if code <= 255:
        return extended_ascii_data[code] == extended_ascii_category_Lu
    else:
        return None


def extended_ascii_is_ascci(code):
    return code <= 127


def extended_ascii_is_decimal(code):
    if code <= 255:
        return extended_ascii_data[code] == extended_ascii_category_Nd
    else:
        return None


def extended_ascii_is_numeric(code):
    if code <= 255:
        category = extended_ascii_data[code]
        return category == extended_ascii_category_Nd or category == extended_ascii_category_No
    else:
        return None

def extended_ascii_is_digit(code):
    if code <= 255:
        category = extended_ascii_data[code]
        if category == extended_ascii_category_Nd:
            return True
        elif category == extended_ascii_category_No:
            # cover only characters that have the property value Numeric_Type=Digit or Numeric_Type=Decimal
            return code == 178 or code == 179 or code == 185
        else:
            return False
    else:
        return None


def extended_ascii_is_whitespace(code):
    if code <= 255:
        # general category is Zs (“Separator, space”), or bidirectional class is one of WS, B, or S.
        return extended_ascii_data[code] == extended_ascii_category_Zs \
               or 9 <= code and code <= 13 \
               or 28 <= code and code <= 31 \
               or code == 133
    else:
        return None
