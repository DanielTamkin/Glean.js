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
$.fn.ShopDown = function(data) {
	$this = $(this);
	$data = [];
	$data.settings = datacheck(data);
	/*data*/
	function datacheck(data){
	  return datascrub(data);
	}
	function datatemplate(){
	  return {
			leftovers: false,
	    content: $this,
	    sanitize: true,
			cull: true,
			images: true,
			compile: true
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
/*> app*/
	function app(){
	  window.htmlGot = false;// yes your allowed to grab HTML!
		appCalculation();
		appCleanup();
	}
	app();
/*> objective functions*/
	return {
	  output: function(data) {
	    return appOutput(data);
	  },
		reload: function(){
			app();// just reloads the app model to get new info.
		}
	}
};
