class LinkedList:
    class Node:
        def __init__(self, v, n):
            self._value = v
            self._next = n

    def __init__(self):
        self._head = None
        self._tail = None
        self._size = 0

    def __iter__(self):
        head = self._head
        to_lst = []

        while head is not None:
            to_lst.append(head._value)
            head = head._next

        # At the time of writing this test, 'yield' was not supported
        return iter(to_lst)

    def __repr__(self):
        if self._head is None:
            return "LinkedList()"
        else:
            return "LinkedList" + repr(tuple(self))

    def __len__(self):
        return self._size

    def append(self, v):
        _node = self.Node(v, None)
        if self._head is None:
            self._head = _node
            self._tail = _node
            self._size = 1
        else:
            self._tail._next = _node
            self._tail = _node
            self._size += 1


l = LinkedList()
print(l, len(l))
l.append(10)
print(l, len(l))
l.append(20)
print(l, len(l))
l.append(30)
print(l, len(l))