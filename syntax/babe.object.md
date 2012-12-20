
 definition of object
========================

a = {}

# var a = {};


a = {"a":1, "b":2}

# var a = {"a":1, "b":2};


a = {1, 2}

# // error


b = {"a":1, "b":2}
for k, v in b:
    print(a + ':' + v)

# var b = {"a":1, "b":2}
# for (var k in b) {
#     var v = b[k];
#     console.log(k + ':' + v);
# }


for k, v in {"a":1, "b":2}:
    print(a + ':' + v)

# for (var k in b = {"a":1, "b":2}) {
#     var v = b[k];
#     console.log(k + ':' + v);
# }


a = {}
a.b = 1

# // error for distinction of class instance


a = {}
a['b'] = 1

# var a = {}
# a['b'] = 1