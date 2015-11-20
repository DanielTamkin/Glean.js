# Glean.js
With Glean, you can have simple variables within your html,
Drastically making your static site or markdown centered
CMS (`*cough*` [Ghost](https://github.com/TryGhost/Ghost) `*cough`)

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

`var html = $("section.html").Glean();`

And now you can simply grab the variable like so:

`var productLink = html.get("Product Link");`
