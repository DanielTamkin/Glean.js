/*
	ShopDown testing[Alpha 1]- by Danieltamkin:

	Main Plugin in development(Compiler),
	Compiling html to a product object.

*/
$.fn.ShopDown = function(data) {
	$this = $(this);
	$data = datacheck(data);
	/*data*/
	function datacheck(data){
	  return datascrub(data);
	}
	function datatemplate(){
	  return data.settings = {
			Stiffen: true,
	    content: $this,
	    sanitize: true,
			cull: true,
			images: true,
			compile: true
	  }
	}
	function datascrub(data){
	  template = datatemplate();
		if(data == undefined || data.length < 1){
			data = template;
		}
		else{
		  $.each(template,function(key,value){
		    $.each(data,function(bravokey,bravovalue){
		      if(bravokey == key){
		        if(bravovalue.length === -1){
		          value = value;
		        }
		        else{
		          // do nothing, bravovalue is in bravokey
		        }
		      }
		      else{
		        if(!(key in data)){// that key doesnt exist? make it.
		          data[key] = value;
		        }
		      }
		    });
		  });
		}
		return data;
	}
	/*html*/
	function htmlGet(){
		if(window.htmlGot !== true){
			htmlCull();// removes images from the Dom.
			html = $($data.settings.content).html();
			// $data.html.html = html Work on this on a later date.
			window.html 		= html;
			window.htmlGot  = true;// so not to look for html again.
	  	return html;
		}
		else{
			return window.html;
		}
	}
	function htmlSiftTo(id){
	  data = {
	    h1: 'h1#'+id,
	    h2: 'h2#'+id,
	    h3: 'h3#'+id,
	    h4: 'h4#'+id,
	    h5: 'h5#'+id,
	    h6: 'h6#'+id
	  }
	  var	content		= $($data.settings.content),
	      SiftedTo 	= null;
	  $.each(data,function(key,value){
	    Sift = content.find(value);
	    if(Sift.length < 1){
	      // continue to find the proper value, this one doesn't exist.
	    }
	    else{
	      SiftedTo = value;
	      return false;// break out of loop
	    }
	  });
	  return SiftedTo;
	}
	function htmlFind(id,multipleGet=false){
	  if(id == "productimages"){
			return htmlImages();
		}
		else{
			var	content			= $($data.settings.content),
		      multiple 		= content.find(htmlSiftTo(id)).get();
		  if(multiple.length < 1){
		    console.warn("Error, We're missing the tag "+id+"");
		  }
		  else if(multiple.length > 1 && multipleGet == true){
		    console.info(multipleGet);
		    // work on this in a later date.
		  }
		  else{
		    var html 				= htmlGet(),
		        element 		= content.find("#"+id),
		        data 				= element.next("p").html();
		    return data.trim();
		  }
		}
	}
	function htmlCull(){
	  if($data.settings.cull == true){
	    var	content				= $($data.settings.content),
					htmlOriginal 	= content.html();
			content.find("img").addClass("remove");
			content.append("<div id=\"htmlOriginal\">"+htmlOriginal+"</div>");
			content.find("img").remove(".remove");
	  }
	}
	function htmlImages(){
		var html 			= $($data.settings.content).find("#htmlOriginal"),
				images 		= html.find("img"),
				multiples = [];
		$.each(images,function(key,value){
			image = {
				src: $(this).attr("src"),
				alt: $(this).attr("alt"),
				title: $(this).attr("title")
			}
			multiples.push(image);
		});
		return multiples;
	}
	function htmlParse(){
	  var html        = htmlGet();
	  console.log("!html! "+html);
	}
	/*app*/
	function appCalculation(){
	  product = {
	    name:   htmlFind("productname"),
	    price:  htmlFind("productprice"),
	    link:	  htmlFind("productlink"),
			description: htmlFind("productdescription")
	  }
		if($data.settings.images == true){
			product.images = htmlFind("productimages");
		}
	  console.log(product);
	  console.log("ShopDown ran Sucessfully!");
	  $data.settings.product = product;
	}
	function appSanitize(){
	  if($data.settings.sanitize == true){
	    $($data.settings.content).html("");
	  }
	}
	function appOutput(data){
		var output = null;
		if(data == undefined){
			output = $data;
		}
		else{
			$.each($data.settings.product,function(key,value){
				if(key == data){
					output = value;
					return false;//break this loop!
				}
			});
		}
		return output;
	}
	function app(){
	  window.htmlGot = false;// yes your allowed to grab HTML!
		appCalculation();
	  appSanitize();
	}
	app();
	/*objective functions*/
	return {
	  output: function(data) {
	    return appOutput(data);
	  },
		reload: function(){
			app();// just reloads the app model to get new info.
		}
	}
};
