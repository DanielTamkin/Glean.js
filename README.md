![Glean by Daniel Tamkin](images/Banner.png)
The Smart variable compiler for html.

With Glean, you can have simple variables within your html.
Drastically making your static or markdown centered
site (`*cough*` [Ghost](https://github.com/TryGhost/Ghost) `*cough*`) into a much more customizable workspace.

## Make a few variables
There are three ways to define variables, each one
allowing the developer a different form of flexibility.

__HTML__:

``` html
<section class="store-description">
  <h1>!/Store Link/!</h1>
  <p>http://store.roosterteeth.com/</p>
</section>
```
__Markdown__:
``` html
# !/Store link/!
http://store.roosterteeth.com/
```
__Plain Text__:
``` html
!/Store link/! "http://store.roosterteeth.com/"
```

__Get a variable:__

It's seriously simple to grab a variable.
```javascript
var link = null;
var html = $("section.store-description").Glean({
  onStart: function(){
    // do something on start
  },
  onDone: function(data){
    // do something after render.
    // like so:
    link = data.get('Store Link');
  }
});
```

## Settings
``` javascript
var html = $("section.html").Glean({
  html: {
    get: "glean-get",               // The name of the hidden div
    find: "h1, h2, h3, h4, h5, h6", // What elements to parse for variables
    gather: "glean-gather"          // Name for all validated elements.
  },
  syntax: {
    opening: "!/",                  // You can change the syntax if you wish.
    closing: "/!"
  },
  onStart: function(){
    // do something before compile
  },
  onDone: function(){
    // do something after compile
  }
});

```
