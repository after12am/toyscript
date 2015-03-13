toyscript
=========

A small experimental programing language works on your browser.


## example

Here is a quick example.

```html
<script type="text/javascript" src="toyscript.js"></script>
<script type="text/toyscript">
class Toy:
    constructor():
        this.name = 'toyscript'
    hello():
        return "Hello there, this is {this.name}!"

console.log((new Toy()).hello())
</script>
```

## Notes

Now under development

## License

Copyright (c) 2012-2015 Satoshi Okami. See the LICENSE file for license rights and limitations (MIT).
