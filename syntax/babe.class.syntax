
 definition of class
=====================

class Person:
    
    constructor(@name):
        print('my name is ' + this.name)

# var Person = function(name) {
#     this.name = name;
#     console.log('my name is ' + this.name)
# }
# 
# person = new Person('bob')


class Person:
    
    constructor(name):
        print('my name is ' + name)

# var Person = function(name) {
#     console.log('my name is ' + name)
# }
# 
# person = new Person('bob')


class Person:
    
    constructor(@name):
    
    say():
        print('my name is ' + this.name)

# var Person = function(name) {
#     this.name = name;
# }
# 
# Person.prototype.say = function() {
#     console.log('my name is ' + this.name);
# }
# 
# person = new Person('bob')
# person.say()





 definition of inheritance
===========================

class Person:
    
    constructor(@name):
    
    say():
        print('my name is ' + this.name)

class Bob extends Person:
    
    constructor():
        this.name = 'bob'
    
    say():
        parent.say()

person = new Bob()
person.say() // or new Bob().say()

# var Person = function(name) {
#     this.name = name;
# }
# 
# Person.prototype.say = function() {
#     console.log('my name is ' + this.name);
# }
# 
# var Bob = function() {
#     this.name = 'bob';
# }
# 
# Bob.prototype = Object.create(Person.prototype)
# Bob.prototype.say = function() {
#     Person.prototype.say()
# }
