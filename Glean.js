/*
	Glean.js - the final product from the ShopDown.js tests.
	proposed use.
  ----
  	var Glean 	= $("thiselement.section").Glean(),
  			link 		= Glean.get("link");
  	console.log(link);
	----
	output: http://danieltamkin.com
*/
$.fn.Glean = function(data) {
	$this = $(this);
	$data = [];
	$data.settings = datacheck(data);
	$data.html = {
		cullTo: $data.settings.cullTo,
		get: false,
		taken: null
	}
	$data.syntax = {
		opening: "!/",
		closing: "/!"
	}
/*> data*/
	function datacheck(data){
	  return datascrub(data);
	}
	function datatemplate(){
	  return {
	    content: $this,
	    cull: true,
			cullTo: "glean-get"
		}
	}
	function datascrub(data){
	  template = datatemplate();
		if(data == undefined || $.isEmptyObject(data) == true){
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
/*> syntax*/
	function syntaxGather(){
		var possible 	= syntaxPossible();
		if(possible == true){

			$(".glean-gather").each(function(i,node){

			});
		}
		else{
			// dont do anything you cant, no variables.
		}
		var html 			= htmlGet();
		console.log("syntaxGather() = "+html);
	}
	function syntaxPossible(){
		$this.find("h1, h2, h3, h4, h5, h6").addClass("glean-possible");
		var possible = 0;
		$('.glean-possible').each(function(i, node) {
			var approv = syntaxApprove($(this).text());
			if(approv == 100){
				console.log("syntax approved: "+ $(this).text());
				$(this).removeClass("glean-possible");
				$(this).addClass("glean-gather");
				possible++;
			}
			else if(approv == 206){
				$(this).removeClass("glean-possible");
				// warn and remove class + the tag that still exits.
			}
			else{
				$(this).removeClass("glean-possible");
			}
		});
		if(possible > 1){
			return true;
		}
		else{
			return false;
		}
	}
	function syntaxApprove(content){
		console.log(content)
		if(content.indexOf($data.syntax.opening) == 0){
			if(content.lastIndexOf($data.syntax.closing) == content.length - $data.syntax.closing.length){
				return 100;
			}
			else{
				return 206;
			}
		}
		else{
			return 406;
		}
	}
/*> html*/
	/*
	 Checks to see if the get is true or not,
	 if its false then we read the html.
	*/
	function htmlGet(){
		var html = "1";
		if($data.html.get != true){
			$data.html.taken 	= $($data.settings.content).html();
			$data.html.get 		= true;
			html = $data.html.taken;
		}
		else{
			html = $data.html.taken;
		}
		return html;
	}
	function htmlSiftTo(id){
		var data = {
			h1: 'h1#'+id,
			h2: 'h2#'+id,
			h3: 'h3#'+id,
			h4: 'h4#'+id,
			h5: 'h5#'+id,
			h6: 'h6#'+id
		};
		var	content		= htmlGet(),
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
	function htmlCull(){
		if($data.settings.cull != true){
			return null;// dont do anything.
		}
		else{
			$this.append("<div id=\""+$data.settings.cullTo+"\" style=\"display:none;\"></div>");
			syntaxGather();
			var html = htmlGet();
		}
	}
/*> app*/
	function app(){
		appCalculation();
	}
	function appCalculation(){
		htmlCull();
	}
	function appGet(){
		return $data.html;
	}
/*> objective functions / Runnables*/
	app();
	return {
	  get: function(data) {
	    return appGet(data);
	  },
		reload: function(){
			app();// just reloads the app model to get new info.
		}
	}
};
