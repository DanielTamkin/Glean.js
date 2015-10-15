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
		sanitizeTo: $data.settings.sanitizeTo,
		get: false,
		taken: null
	}
	/*data*/
	function datacheck(data){
	  return datascrub(data);
	}
	function datatemplate(){
	  return {
	    content: $this,
	    sanitize: true,
			sanitizeTo: "#glean-sanitized"
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
	function syntaxGather(){}
	function syntaxApprove(){}
/*> html*/
	function html(){
		if($data.html.get != true){
			var html = $($data.settings.content).html();
		}
	}
	function htmlGet(){}
	function htmlSiftTo(id){
		data = {
			h1: 'h1#'+id,
			h2: 'h2#'+id,
			h3: 'h3#'+id,
			h4: 'h4#'+id,
			h5: 'h5#'+id,
			h6: 'h6#'+id
		}
		var	content		= html(),
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
	function htmlSanitize(){
		if($data.settings.sanitize != true){
			return null;// dont do anything.
		}
		else{

		}
	}
/*> app*/
	function app(){
		appCalculation();
	}
	function appCalculation(){

	}
	function appGet(){
		return $data.settings;
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
