![Glean by Daniel Tamkin](images/Banner.png)
The Smart variable compiler for html.

With Glean, you can have simple variables within your html.
Drastically making your static or markdown centered
site (`*cough*` [Ghost](https://github.com/TryGhost/Ghost) `*cough*`) into a much more customizable workspace.

## To start
 Make a couple variables in your html.

```
<h1>!/Product Link/!</h1>
<p>http://redbubble.com/DanielTamkin</p>
```
(for markdown it would be no diffrent)
```
# !/Product link/!
http://redbubble.com/DanielTamkin
```
Run Glean:

```javascript
var link = null;
var html = $("section.html").Glean({
  onStart: function(){
    // do something on start
  },
  onDone: function(data){
    // do something after render.
    // like so:
    link = data.get('Product Link');
  }
});
```

And now you can simply grab the variable in two ways:

Method 1:
`var productLink = html.get("Product Link");`

Method 2:
```javascript
var html = $("section.html").Glean({
  onStart: function(){
    // do something on start
  },
  onDone: function(data){
    var productLink = data.productlink;
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
