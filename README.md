toyscript
=========

[![Build Status](https://travis-ci.org/after12am/toyscript.svg?branch=master)](https://travis-ci.org/after12am/toyscript)

A small experimental programing language works on your browser.


## example

Here is a quick example.

```html
<script type="text/javascript" src="toyscript.js"></script>
<script type="text/toyscript">
class Toy:
    constructor():
        this.name = 'Toy'
    hello():
        return "Hello there, I am {this.name}!"

console.log((new Toy()).hello())
</script>
```

## License

Copyright (c) 2012-2015 Satoshi Okami. See the LICENSE file for license rights and limitations (MIT).
