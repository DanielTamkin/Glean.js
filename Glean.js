(function($){

  $.fn.Glean = function(options){
    var defaults = {
      content: this,
      html: {
        stash: "glean-data-stash",
        find: "h1, h2, h3, h4, h5, h6",
        gather: "glean-gather"
      },
      syntax: {
        opening: "!/",
        closing: "/!"
      },
      plainText: false,
      hideOnBroken: false,
      onStart: function(){},
      onFail: function(){},
      onDone: function(){}
    };
    $settings      = $.extend(true,{},defaults , options);
    $variables     = {};
    $this          = this;
    /*
    pluginHead
     Catagorized into two sections based on how the plugin should
     consume data to return values.
     */
    $run = {
      getVariables: function(){
        return $variables;
      },
      varLoad: function(data){
        var dfd = jQuery.Deferred();
        varLoad(function(){
          var message = {
            message: "Loading all variables for the onDone() handle."
          }
          dfd.resolve(logAdd(data,message));
        });
        return dfd.promise();
      },
      html: {
        // test: function(data){
        //   console.log(data);
        //   var dfd = jQuery.Deferred();
        //   callbackTest(function(error){
        //     console.log(101);
        //
        //     if(!error){
        //       asyncTest()
        //         .done(function(message){
        //           console.log('passed: '+message);
        //           var message = {
        //             message: "perfect run!"
        //           }
        //           dfd.resolve(logAdd(data,message));
        //         })
        //         .fail(function(error){
        //           console.log('failed: '+error);
        //           var message = {
        //             message: "we have an error",
        //             error: error
        //           }
        //           dfd.reject(logAdd(data,message));
        //         });
        //     }
        //     else{
        //       var message = {
        //         message: "Looks like the callback has an error!",
        //         error: error
        //       }
        //       dfd.resolve(logAdd(data,message));
        //     }
        //   });
        //   return dfd.promise();
        // },
        stashCreate: function(data){
          var dfd = jQuery.Deferred();
          htmlStash(function(){
            var message = {
              message: "Creating a div called #"+$settings.html.stash+" to stash all data found."
            }
            dfd.resolve(logAdd(data,message));
          });
          return dfd.promise();
        },
        variableSearch: function(data){
          var dfd = jQuery.Deferred();
          htmlIdSlugify(function(error){
            if(!error){
              var message = {
                message: "Slugifying all id's with data, search elements are: "+$settings.html.find
              }
              dfd.resolve(logAdd(data,message));
            }
            else{
              var message = {
                message: "Slugifying all id's with data, search elements are: "+$settings.html.find,
                details: error
              }
              dfd.reject(logAdd(data,message));
            }
          });
          return dfd.promise();
        },
        stashPopulate: function(data){
          var dfd = jQuery.Deferred();
          stashPopulate()
            .done(function(message){
              console.log('passed: '+message);
              var message = {
                message: "All valid syntax is tagged for consumption."
              };
              dfd.resolve(logAdd(data,message));
            })
            .fail(function(error){
              console.log('failed: '+error);
              var message = {
                message: "No syntax found.",
                details: error
              };
              dfd.reject(logAdd(data,message));
            });
          return dfd.promise();
        }
      },
      text:{
        convert: function(data){
          var dfd = jQuery.Deferred();
          syntaxParseText()
            .done(function(variables){
              textToHTML(variables,function(error){
                if(!error){
                  var message = {
                    message: "Found syntax in plain text form, converted to HTML."
                  };
                  dfd.resolve(logAdd(data,message));
                }
                else{
                  var message = {
                    message: "An unexpected error occured converting to html",
                    details: error
                  };
                  dfd.reject(logAdd(data,message));
                }
              });
            })
            .fail(function(error){
              console.log('failed: '+error);
              var message = {
                message: "No syntax found.",
                details: error
              };
              dfd.reject(logAdd(data,message));
            });
          return dfd.promise();
        }
      }
    }
    /*
     Public functions
    */
    this.build = function(){
      var dfd = jQuery.Deferred();
      $settings.onStart();
      if($settings.plainText !== true){
        // use html
        runStart()
          .then($run.html.stashCreate)
          .then($run.html.variableSearch)
          .then($run.html.stashPopulate)
          .then($run.varLoad)
          .done(function(logs){
            console.log(logs);
            dfd.resolve();
          })
          .fail(function(logs){
            console.log(logs);
            console.log('fail');
            dfd.reject();
          });
      }
      else{
        runStart()
          .then($run.html.stashCreate)
          .then($run.text.convert)
          .then($run.html.variableSearch)
          .then($run.html.stashPopulate)
          .then($run.varLoad)
          .done(function(logs){
            console.log(logs);
            dfd.resolve();
          })
          .fail(function(logs){
            console.log(logs);
            console.log('fail');
            dfd.reject();
          });
      }
      return dfd.promise();
    };
    function runStart(){
      var dfd = jQuery.Deferred();
      dfd.resolve([{
            message:'Starting a glean instance in html-mode'
      }]);
      return dfd.promise();
    }
    /**
     * Get a variable specified.
     * @param  {[String]}   [variables title/key]
     * @return {[type]}     [The variables value]
     */
    this.get = function(variable){
      return getVariable(variable);
    }
    /*
     Private functions
    */
    function getVariable(variable){
      if(variable != undefined){
  			return htmlFind(htmlSlugify(variable));
  		}
  		else{
  			return undefined;
  		}
    }
    /**
     * Checks that each $settings.html.find has an id that
     * is a slugged version of its data, if it does not then make it
     * have one.
     * @param  {Function} callback [called at end of function]
     */
    function htmlIdSlugify(callback){
      var	content		  = $(this).html();
      var count       = 0;
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
        count++;
      });
      console.log(count);
      if(count !== 0){
        callback();
      }
      else{
        callback("No search objects: '"+$settings.html.find+"' we're found.");
      }
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
    function htmlStash(callback){
      $($this).add("<div id=\""+$settings.html.stash+"\" style=\"display:none;\"></div>").appendTo($this);
      callback();
    }
    /**
     * Find and return the value of a variable
     * @param  {[String]} variable    [the slugged variable to be searched]
     * @return {[type]}   data.trim() [the variables value]
     */
    function htmlFind(variable){
  		var content =  $this.find("#"+$settings.html.stash),
  				element =  content.find("#"+variable),
  				data 		=  element.next().html();
      if(data == undefined){
  			return undefined;
  		}
  		else{
  			return data.trim();// removes whitespaces
  		}
  	}
    // variables
    function varLoad(callback){
      $(".glean-gather").each(function(i,node){
        if($(this).hasClass('glean-key')){
          var key   = varsSlugify($(this).text());
          $variables[key] = $(this).next().html();
        }
      });
      callback();
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
    function stashPopulate(){
      var dfd = jQuery.Deferred();
      var found = false;
  		syntaxParseHTML(function(syntax){
        console.log(syntax);
        found = syntax.found;
        if(syntax.found){
    			$(".glean-gather").each(function(i,node){
    				$this.find("#"+$settings.html.stash).append($(this));//populate
    			});
          if(syntax.error !== undefined){
            dfd.resolve(syntax.error);
          }
          else{
            dfd.resolve();
          }
    		}
    		else{
          console.log('101');
    			// dont do anything. You cant, no variables.
          dfd.reject(syntax.error);
    		}
      });
      return dfd.promise();
  	}

    function textToHTML(variables,callback){
      console.log(variables);
      for (var i = 0; i < variables.length; i++) {
        var key   = $settings.syntax.opening+variables[i].key+$settings.syntax.closing;
        var value = variables[i].value;
        $($this).add("<h1 style=\"display:none;\">"+key+"</h1> <p style=\"display:none;\">"+value+"</p>").appendTo($this);
      }
      callback();
    }
    /**
     * [syntaxParseText description]
     * @param  {Function} callback
     * @return {[type]}            [description]
     */
    function syntaxParseText(callback){
      var dfd = jQuery.Deferred();
      var message = {
        found: false,
        incomplete: 0,
        error: ''
      };
      var variables = [];
      // console.log($this.text());
      syntaxCount($this.text(),function(count){
        var text  = $this.text();
        if(count !== 0){
          for (var i = 0; i < count; i++) {
            syntaxGrab(text,function(data){
              // console.log(data);
              text = data.text;
              variables.push({key:data.key,value:data.value});
            });
          }
          console.log(count);
          $this.text(text);
          dfd.resolve(variables);
        }
        else{
          dfd.reject("No syntax Detected. ");
        }
      });
      // console.log(syntaxCount($this.text(),0));
      console.log(variables);
      return dfd.promise();
    }
    /**
     * [syntaxCount description]
     * @param  {[type]}   text
     * @param  {Function} callback
     * @param  {[type]}   count
     * @return {[type]}            [description]
     */
    function syntaxCount(text,callback,count){
      if(count == undefined){
        count = 0;
      }
      if(text.indexOf($settings.syntax.opening) > 0  && text.indexOf($settings.syntax.closing) > 0){
        var SyntaxOpening     = text.indexOf($settings.syntax.opening);
        var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;
        var Syntax            = text.substring(SyntaxOpening, SyntaxClosing);
        text                  = text.replace(Syntax, '');
        count++;
        syntaxCount(text,callback,count);
      }
      else{
        callback(count);
      }
    }
    /**
     * [syntaxGrab description]
     * @param  {[type]}   text
     * @param  {Function} callback
     * @param  {[type]}   syntax
     * @return {[type]}            [description]
     */
    function syntaxGrab(text,callback,variables){
      // console.log(variables);
      // console.log(text);
      var data = {
        key: '',
        value: '',
        text: '',
        error: false,
        incomplete: 0
      };
      if(text.indexOf($settings.syntax.opening) && text.indexOf($settings.syntax.closing)){
        var SyntaxOpening     = text.indexOf($settings.syntax.opening);
        var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;

        var Syntax            = text.substring(SyntaxOpening, SyntaxClosing);

        var indexKeyOpening   = Syntax.indexOf($settings.syntax.opening)+$settings.syntax.opening.length;
        var indexKeyClosing   = Syntax.indexOf($settings.syntax.closing);
        var indexKeyData      = Syntax.substring(indexKeyOpening, indexKeyClosing);

        var textRemovedKey    = Syntax.substring(indexKeyClosing);

        var indexValueOpening = textRemovedKey.indexOf("\"")+1;
        var indexValueClosing = textRemovedKey.indexOf("\"", textRemovedKey.indexOf("\"")+1);
        var indexValueData    = textRemovedKey.substring(indexValueOpening, indexValueClosing);
        data.key    = indexKeyData;
        data.value  = indexValueData;
        data.text   = text.replace(Syntax, '');
        data.text   = data.text.trim();
        console.log(data.text);
        // console.log(indexKeyOpening);
        // console.log(indexKeyClosing);
        // console.log("Syntax: "+Syntax);
        // console.log("That: "+textRemovedKey);
        // console.log("key: "+indexKeyData);
        // console.log("value: "+indexValueData);
        // console.log(indexValueOpening);
        // console.log(indexValueClosing);
      }
      else{
        text = text.replace($settings.syntax.opening,'');
        text = text.replace($settings.syntax.closing,'');
        data.text = text;
        data.error = true;
      }
      callback(data);
    }
    /**
     * tags all variables that are valid with the Class '$settings.html.gather'
     * @param  {[callback]} function [ran with either true or false on the
     *                               possibilities]
     * @callback {[true/false]} [true if there is syntax, false if there is not.]
     */
  	function syntaxParseHTML(callback){
  		var message = {
        found: false,
        incomplete: 0,
        error: ''
      };
  		$this.find($settings.html.find).each(function(i, node) {
        var syntax = $(node).text();
        syntaxValidate(syntax,function(data){
          if(data.valid == true){
            $(node).removeClass("glean-possible");
    				$(node).addClass($settings.html.gather).addClass('glean-key');
    				$(node).next().addClass($settings.html.gather).addClass('glean-value');//capture that <p> tag
    				message.found = true;
    			}
    			else{
            // If there is no syntax make sure there isnt
            // an incomplete bit of syntax. If there is remove it.
            console.log('1');
            if($settings.hideOnBroken){
              $(node).css("visibility","hidden");
              $(node).next().css("visibility","hidden");
            }
            else{
              syntaxRemove(syntax,function(syntaxClean){
                console.log(syntaxClean);
                if(syntaxClean){
                  $(node).text(syntaxClean);
                  message.incomplete++;
                }
              });
            }
    			}
        });
  		});
      // make the error code a little bit more digestable.
      if(message.incomplete == 1){
        message.error = "You have a variable with incomplete syntax. ";
      }
      else if(message.incomplete >= 2){
        message.error = "You have "+message.incomplete+" variables with incomplete syntax. ";
      }
      if(message.found){
        if($settings.hideOnBroken){
          message.error += "All incomplete variables have been hidden.";
        }
        else if(message.incomplete >= 2){
          message.error += "All incomplete syntax has been removed.";
        }
      }
      else{
        if($settings.hideOnBroken){
          message.error += "The entire variable has been hidden.";
        }
        else{
          message.error += "That syntax has been removed.";
        }
      }
      callback(message);
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
      var data = {
        key: '',
        value: '',
        valid: false
      };
  		if(syntax.indexOf($settings.syntax.opening) == 0){
        // has both opening and closing braces
  			if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
          data.valid = true;
  				callback(data);
  			}
  			else{
  				callback(data);// errors in the syntax
  			}
  		}
  		else{
        // has closing brace but no opening brace
  			if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
          data.valid = true;
  				callback(data)// errors in the syntax
  			}
  			else{
  				callback(data)// no syntax detected
  			}
  		}
  	}
    function syntaxRemove(syntax,callback){
      $reverse = {
        opening: $settings.syntax.opening.split("").reverse().join(""),
        closing: $settings.syntax.closing.split("").reverse().join("")
      };
      // opening
      if(syntax.indexOf($settings.syntax.opening) == 0) {
        syntax = syntax.replace($settings.syntax.opening,'');
      }
      if(syntax.indexOf($reverse.opening) == 0) {
        syntax = syntax.replace($reverse.opening,'');
      }
      // closing
      if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
        syntax = syntax.replace($settings.syntax.closing,'');
      }
      if(syntax.lastIndexOf($reverse.closing) == syntax.length - $reverse.closing.length){
        syntax = syntax.replace($reverse.closing,'');
      }
      callback(syntax);
    }
    /**
     * [logAdd description]
     * @param  {[type]} message
     * @param  {[type]} boolean
     * @return {[type]}         [description]
     */
    // function callbackMessage(message,error){
    //   return {
    //     message: message,
    //     error: boolean
    //   }
    // }
    function logAdd(logs,data){
      var newLog = logs;
      console.log(logs);
      if(!data){
        // do nothing
      }
      else{
        newLog.push(logTime(data));
      }
      return newLog;
    }
    function logTime(message){
      if(!message){
        // don't interact with an undefined object
      }
      else{
        message.time = $.now();
      }
      return message;
    }
    // Compile
    return $this.each(function() {
      $this.build()
        .done(function(logs){
          $settings.onDone($run.getVariables());
        })
        .fail(function(logs){
          // force plainText
          $settings.onFail();
        });
    });
  };
}(jQuery));
