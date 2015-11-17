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
				$this.find("#"+$data.settings.cullTo).append($(this));
			});
		}
		else{
			appWarn("no variables detected.");
			// dont do anything. You cant, no variables.
		}
	}
	function syntaxPossible(){
		$this.find("h1, h2, h3, h4, h5, h6").addClass("glean-possible");
		var possible = 0;
		$this.find('.glean-possible').each(function(i, node) {
			var approv = syntaxApprove($(this).text());
			if(approv == 100){
				$(this).removeClass("glean-possible");
				$(this).addClass("glean-gather");
				$(this).next().addClass("glean-gather");
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
		if(possible != 0){
			return true;
		}
		else{
			return false;
		}
	}
	function syntaxApprove(content){
		if(content.indexOf($data.syntax.opening) == 0){
			if(content.lastIndexOf($data.syntax.closing) == content.length - $data.syntax.closing.length){
				return 100;// all good pass
			}
			else{
				return 206;// errors in the syntax
			}
		}
		else{
			return 406;// no syntax detected
		}
	}
/*> html*/
	/*
	 Checks to see if the get is true or not,
	 if its false then we read the html.
	*/
	function htmlGet(){
		var html = "1";// just inits the variable
		if($data.html.get != true){// first time grabbing html
			$data.html.taken 	= $($data.settings.content).html();
			$data.html.get 		= true;
			html = $data.html.taken;
		}
		else{
			html = $data.html.taken;
		}
		return html;
	}
	function htmlFind(variable){
		var content = $this.find("#"+$data.html.cullTo),
				element = content.find("#"+variable),
				data 		=  element.next().html();
		return data.trim();// removes whitespaces
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
	/*simply takes away the approved variables or doesnt*/
	function htmlCull(){
		if($data.settings.cull != true){
			return null;// dont do anything.
		}
		else{
			$this.append("<div id=\""+$data.settings.cullTo+"\" style=\"display:none;\"></div>");
			syntaxGather();
		}
	}
/*> IdCheck*/
function IdCheck(){
	var	content		= $($data.settings.content).html();
	appLog("test");
	appLog(content);
}
/*> Idify*/
	function Idify(variable){
		return variable.replace(/\s/g, "").toLowerCase();
	}
/*> app*/
	function app(){
		IdCheck();
		appCalculation();
	}
	function appCalculation(){
		htmlCull();
	}
	function appWarn(message){
		console.warn("Glean: WARN - "+message);
	}
	function appError(message){
		console.error("Glean: ERROR - "+message);
	}
	function appLog(message){
		console.log("Glean: "+message);
	}
	function appGet(variable){
		if(variable != undefined){
			variable = Idify(variable);
			return htmlFind(variable);
		}
		else{
			return $data.settings;
		}
	}
/*> objective functions / Runnables*/
	app();
	return {
	  get: function(variable) {
	    return appGet(variable);
	  },
		reload: function(){
			app(reload);// just reloads the app model to get new info.
		}
	}
};
