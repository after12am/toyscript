ToyScript
=========

[![Build Status](https://travis-ci.org/after12am/toyscript.svg?branch=master)](https://travis-ci.org/after12am/toyscript)

A small experimental programing language works on your browser.


## example

Here is the quick example.

```html
<script type="text/javascript" src="toyscript.js"></script>
<script type="text/toyscript">

class Bot:
  constructor():
    this.name = 'ToyScript'
  hello():
    return "Hello there, I'm {this.name}!"

console.log((new Bot()).hello())

</script>
```

Result:

```
Hello there, I'm ToyScript!
```

## License

Copyright (c) 2012-2016 Satoshi Okami. See the LICENSE file for license rights and limitations (MIT).
