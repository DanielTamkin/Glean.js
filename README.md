# Glean.js

The Smart variable compiler for html.

With Glean, you can have simple variables within your html,
Drastically making your static site or markdown centered
CMS (`*cough*` [Ghost](https://github.com/TryGhost/Ghost) `*cough*`)

## To start
 Make a couple variables in your html.

``` html
<section class="content">
  <h1>!/Product Link/!</h1>
  <p>http://redbubble.com/DanielTamkin</p>
</section>
```
(for markdown it would be no different)
``` markdown
# !/Product link/!
http://redbubble.com/DanielTamkin
```
Run Glean:

`var html = $("section.content").Glean();`

And now you can simply grab the variable like so:

`var productLink = html.get("Product Link");`

## By the way...
Any variables Glean finds Automatically get hidden from the Dom and thrown in they're own
parent div. Preserving whatever else you had in the main element.

### The full run down.
``` html
<section class="product">
  <h1>Check out My products on <a href="#">redbubble</a></h1>
</section>
<section class="content">
  <h1>!/Product Link/!</h1>
  <p>http://redbubble.com/DanielTamkin</p>
</section>
<script>
  var html = $("section.content").Glean();
  var productLink = html.get("Product link");
  $("section.product h1 a").attr("href",productLink);
</script>
```
