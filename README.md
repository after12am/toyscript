toyscript
=========

toyscript is a small programing language works on your browser.


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