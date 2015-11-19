# Glean.js
With glean, you can have simple variables within your html.
Just initialize Glean onto where you've got your variables.
`var html = $("section.html").Glean();`

Make a couple variables in your html.

```
<h1>!/Product Link/!</h1>
<p>http://redbubble.com/DanielTamkin</p>
```

And now simply grab the variable like so.

`var productLink = html.get(Product Link);`
