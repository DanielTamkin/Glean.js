(function($){

  $.fn.Glean = function(options){
    var defaults = {
      content: this,
      html: {
        get: "glean-get",
        find: "h1, h2, h3, h4, h5, h6",
        gather: "glean-gather"
      },
      syntax: {
        opening: "!/",
        closing: "/!"
      },
      onStart: function(){},
      onDone: function(){}
    };
    $settings   = $.extend(true,{},defaults , options);
    $variables  = {};
    $this       = this;
    /*
     Public functions
    */
    this.build = function(){
      var dfd = jQuery.Deferred();
      $settings.onStart();
      $.when(
        htmlAppend(),
        htmlIdCheck(),
        syntaxGather(),
        varsLoad()
      ).done(function(){
        $settings.onDone($variables);
        dfd.resolve($variables);
      })
      .fail(function(){
        dfd.reject();
      });
      return dfd.promise();
    };
    /**
     * Get a variable specified.
     * @param  {[String]}   [variables title/key]
     * @return {[type]}     [The variables value]
     */
    this.get = function(variable){
      if(variable != undefined){
  			return htmlFind(htmlSlugify(variable));
  		}
  		else{
  			return undefined;
  		}
    }
    /*
     Private functions
    */

    /**
     * Checks that each $settings.html.find has an id that
     * is a slugged version of its data, if it does not then make it
     * have one.
     * @param  {Function} callback [called at end of function]
     */
    function htmlIdCheck(){
      var dfd = jQuery.Deferred();
      var	content		= $(this).html();
      $this.find($settings.html.find).each(function(i, node) {
        var data 			= htmlSlugify($(this).text()),
            id 				= $(this).attr("id");
        if(data != id){
          $(this).removeAttr("id");
          $(this).attr("id",data);// re inits the new id
        }
        else{
          // has id already
        }
      });
      dfd.resolve();
      return dfd.promise();
    }
    /**
     * Slugs whatever variable is handed to it.
     * @param  {[String]} variable [Hand this string]
     * @return {[type]}          [A slugged version of the @param]
     */
    function htmlSlugify(variable){
      return variable.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-').toLowerCase();
    }
    /*
    * Appends a stashed version of the html that we will touch,
    * we do this so we can scrub the visible html of any variables immediatly.
     */
    function htmlAppend(){
      var dfd = jQuery.Deferred();
      $this.append("<div id=\""+$settings.html.get+"\" style=\"display:none;\"></div>");
      dfd.resolve();
      return dfd.promise();
    }
    /**
     * Find and return the value of a variable
     * @param  {[String]} variable    [the slugged variable to be searched]
     * @return {[type]}   data.trim() [the variables value]
     */
    function htmlFind(variable){
  		var content =  $this.find("#"+$settings.html.get),
  				element =  content.find("#"+variable),
  				data 		=  element.next().hasClass($settings.html.gather).html();
  		if(data == undefined){
  			return undefined;
  		}
  		else{
  			return data.trim();// removes whitespaces
  		}
  	}
    // variables
    function varsLoad(){
      var dfd = jQuery.Deferred();
      $(".glean-gather").each(function(i,node){
        if($(this).hasClass('glean-key')){
          var key   = varsSlugify($(this).text());
          $variables[key] = $(this).next().html();
        }
      });
      dfd.resolve();
      return dfd.promise();
    }
    /**
     * Slugs whatever variable is handed to it.
     * @param  {[String]} variable [Hand this string]
     * @return {[type]}          [A slugged version of the @param]
     */
    function varsSlugify(variable){
      return variable.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '').toLowerCase();
    }
    // syntax

    /**
     * Gathers all Validated variables and shoots them to a hidden
     * div for future use.
     * @return {[Promise]}          [returns promise for procedure list]
     */
    function syntaxGather(){
      var dfd = jQuery.Deferred();
  		syntaxPossible(function(valid){
        if(valid){
    			$(".glean-gather").each(function(i,node){
    				$this.find("#"+$settings.html.get).append($(this));//populate
    			});
          dfd.resolve();
    		}
    		else{
    			// dont do anything. You cant, no variables.
    			dfd.reject("no variables");
    		}
        return dfd.promise();
      });
  	}
    /**
     * tags all variables that are valid with the Class 'glean-gather'
     * @param  {[callback]} function [ran with either true or false on the
     *                               possibilities]
     * @callback {[true/false]} [true if there is syntax, false if there is not.]
     */
  	function syntaxPossible(callback){
  		var possibilities = false;
  		$this.find($settings.html.find).each(function(i, node) {
        var syntax = $(node).text();
        syntaxValidate(syntax,function(valid){
          if(valid==true){
            $(node).removeClass("glean-possible");
    				$(node).addClass($settings.html.gather).addClass('glean-key');
    				$(node).next().addClass($settings.html.gather).addClass('glean-value');//capture that <p> tag
    				possibilities = true;
    			}
    			else{
    				// $(this).removeClass("glean-possible");
    				// warn and remove class + the tag that still exits.
    			}

        });
  		});
      callback(possibilities);
  	}

    /**
     * Validates the syntax of a $settings.html.find by
     * determining that it has the intended opening syntax($settings.syntax.opening)
     * and closing syntax($settings.syntax.closing)
     * @param  {[syntax]}   string   [the syntax in question]
     * @param  {[callback]} variable [Hand this string]
     * @callback {[true/false]}      [true if valid, false if not]
     */
    function syntaxValidate(syntax,callback){
  		if(syntax.indexOf($settings.syntax.opening) == 0){
        // has both opening and closing braces
  			if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
  				callback(true);
  			}
  			else{
  				callback(false);// errors in the syntax
  			}
  		}
  		else{
        // has closing brace but no opening brace
  			if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
  				callback(true)// errors in the syntax
  			}
  			else{
  				callback(false)// no syntax detected
  			}
  		}
  	}
    /**
     * [callbackMessage description]
     * @param  {[type]} message
     * @param  {[type]} boolean
     * @return {[type]}         [description]
     */
    function callbackMessage(message,boolean){
      return {
        message: message,
        status: boolean
      }
    }

    // Compile
    return $this.each(function() {
      $this.build();
    });
  };
}(jQuery));
