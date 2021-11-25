sample = ['']

for c in range(256):
    sample.append(chr(c))
    sample.append(chr(c) + 'a')
    sample.append(chr(c) + 'A')
    sample.append(chr(c) + '1')
    sample.append(chr(c) + ' ')
    sample.append(chr(c) + '.')

for word in sample:
    print(word)
    print(word.isalnum())