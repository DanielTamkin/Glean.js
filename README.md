# Glean.js
With glean, you can have simple variables within your markdown or html.

To start, you want to initialize the plugin, point it to where you have all
your html.


`var html = $("section.markdown").Glean();`

Now get a variable, its as simple as this.

`html.get("Purchase Link");`

Assuming you have somewhere in your html, the variable.

```
<h1>!/Purchase link/!</h1>
<p>http://redbubble.com/DanielTamkin</p>
```

You would get the link.
