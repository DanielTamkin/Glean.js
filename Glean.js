(function($){

  $.fn.Glean = function(options){
    var defaults = {
      content: this,
      html: {
        find: "h1, h2, h3, h4, h5, h6",
      },
      syntax: {
        opening: "!/",
        closing: "/!"
      },
      hideOnBroken: false,
      onStart: function(){},
      onFail: function(){},
      onDone: function(){}
    };
    $settings      = $.extend(true,{},defaults , options);
    $variables     = {};
    $this          = this;

    $run = {
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
      variable: {
        search: function(data){
          var dfd = jQuery.Deferred();
          variablesSearch(function(error){
            if(!error){
              var message = {
                message: "A peliminary search for variables came back true"
              }
              data.logs = logAdd(data.logs,message);
              dfd.resolve(data);
            }
            else{
              // no syntax, however find any bits of it and remove it.
              variablesRemove(function(message){
                var message = {
                  message: "No syntax was found"
                }
                data.logs = logAdd(data.logs,message);
                dfd.reject(data);
              });
            }
          });
          return dfd.promise();
        }
      },
      compile: {
        text: function(data){
          var dfd = jQuery.Deferred();
          compileText(function(response){
            if(response.found){
              var message = {
                message: "Compiled syntax in plain text"
              }
              data.variables = response.variables;
              data.logs = logAdd(data.logs,message);
              dfd.resolve(data);
            }
            else{
              var message = {
                message: "No syntax in plain text",
                details: response.error
              }
              data.logs = logAdd(data.logs,message);
              dfd.resolve(data);
            }
          })
          return dfd.promise();
        },
        html: function(data){
          var dfd = jQuery.Deferred();
          compileHTML(function(response){
            if(response.found){
              var message = {
                message: "Compiled syntax in HTML"
              }
              console.log(response.broken);
              data.broken    = response.broken;
              data.variables = response.variables;
              data.logs      = logAdd(data.logs,message);
              dfd.resolve(data);
            }
            else{
              var message = {
                message: "No syntax in HTML",
                details: response.error
              }
              data.broken = response.broken;
              data.logs   = logAdd(data.logs,message);
              dfd.resolve(data);
            }
          })
          return dfd.promise();
        }
      },
      stash: {
        create: function(data){
          var dfd = jQuery.Deferred();
          var message = {
            message: "Object Created to stash all variables found."
          }
          data.stash  = [];
          data.logs   = logAdd(data.logs,message);
          dfd.resolve(data);
          return dfd.promise();
        },
        add: function(data){
          var dfd = jQuery.Deferred();
          console.log(data.variables);
          if(data.variables !== undefined){
            htmlStashAdd(data.variables,data.stash,function(response){
              var message   = {
                message: "Adding variables to the data stash",
                details: data.variables.length+" Variables added"
              }
              data.variables = [];
              data.stash     = response;
              $variables     = response;
              data.logs      = logAdd(data.logs,message);
              dfd.resolve(data);
            });
          }
          else{
            var message = {
              message: "No variables to add",
              details: "There's no variables to add to the stash."
            }
            data.variables = [];
            data.logs = logAdd(data.logs,message);
            dfd.resolve(data);
          }
          return dfd.promise();
        },
        get: function(data){
          var dfd = jQuery.Deferred();
          /**
           * Pretty sweet little function here.
           * Either just blissfully grab the value of a variable
           * or return a callback and allow futher testing if a variable exists.
           * @type {Object}
           */
          data.functions = {
            get: function(key,callback){
              var find = '';
              if(callback !== undefined){
                stashFind(key,data.stash,function(value){
                  find = value;
                });
                if(find !== undefined){
                  callback(find);
                }
                else{
                  callback();
                }
              }
              else{
                stashFind(key,data.stash,function(value){
                  find = value;
                });
                return find;
              }
            }
          }
          dfd.resolve(data);
          return dfd.promise();
        }
      }
    }
    /*
     build function
    */
    function build(){
      var dfd = jQuery.Deferred();
      $settings.onStart();
      runStart({
        data: '',
        logs:[{
              message:'Starting a new glean instance.',
              time: $.now()
        }]
      })
        .then($run.stash.create)
        .then($run.variable.search)
        .then($run.compile.html)
        .then($run.stash.add)
        .then($run.compile.text)
        .then($run.stash.add)
        .then($run.stash.get)
        .done(function(response){
          console.log(response.stash);
          dfd.resolve(response.functions);
        })
        .fail(function(logs){
          dfd.reject();
        });
      return dfd.promise();
    };
    function runStart(data){
      var dfd = jQuery.Deferred();
      dfd.resolve(data);
      return dfd.promise();
    }
    /**
     * [compileText description]
     * @param  {Function} callback
     * @return {[type]}            [description]
     */
    function compileText(callback){
      var response   = {
        found: false,
        error: '',
        incomplete: 0,
        text: '',
        variables: []
      }
      var selector = $this.selector+" ."+$settings.html.stash;
      var textwHTML = $this.html();
      var textnHTML = $this.text();
      // textnHTML     = textnHTML.replace($(selector).html(), '');
      syntaxCount(textnHTML,function(count){
        console.log(count);
        if(count !== 0){
          for (var i = 0; i < count; i++) {
            syntaxGrab(textwHTML,function(data){
              textwHTML = textwHTML.replace(data.syntax, '');
              response.variables.push({key:data.key,value:data.value});
            });
          }
          response.found = true;
        }
        else{
          response.found = false;
        }
      });
      $($this).html(textwHTML);
      // make the error code a little bit more digestable.
      response.error = compileError(response);
      callback(response);
    }
    /**
     * Counts the ammount of times full syntax is found in the text
     * @param  {[type]}   text
     * @param  {Function} callback
     * @param  {[type]}   count
     * @return {[type]}            [description]
     */
     function syntaxCount(text,callback,count){
      //  console.log(text);
       if(count == undefined){
         count = 0;
       }
       if(text.indexOf($settings.syntax.opening) > 0  && text.indexOf($settings.syntax.closing) > 0){
         var SyntaxOpening       = text.indexOf($settings.syntax.opening);
         console.log(SyntaxOpening);
         var syntaxChunkStart       = text.indexOf($settings.syntax.opening);
         var syntaxChunkEnd         = text.indexOf($settings.syntax.closing);
         var syntaxChunk            = text.substring(syntaxChunkEnd,syntaxChunkStart);
         console.log(syntaxChunk);
         // console.log(text.indexOf($settings.syntax.opening));
         // console.log(text.indexOf($settings.syntax.closing));
         if(syntaxChunk.indexOf($settings.syntax.opening) == -1  && syntaxChunk.indexOf($settings.syntax.closing < 0) == -1){
           var Syntax            = text.replace($settings.syntax.opening,'');
               Syntax            = text.replace($settings.syntax.opening,'');
               console.log(Syntax);
           console.log('invalid syntax: ');
           text                  = Syntax;
           count = 0;
         }
         else{
           var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;
           var Syntax            = text.substring(SyntaxOpening, SyntaxClosing);
           console.log('valid syntax');
           text                  = text.replace(Syntax, '');
           count++;
         }
        //  console.log(syntaxChunk);
        //  if(count == 0 && SyntaxOpening !== 0){
        //    var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;
        //    var Syntax            = text.substring(1, SyntaxClosing);
        //    text                  = text.replace(Syntax, '');
        //    SyntaxOpening         = text.indexOf($settings.syntax.opening);
        //  }
        //  else{
        //  }
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
      var data = {
        key: '',
        value: '',
        syntax: '',
        error: false,
        incomplete: 0
      };
      var SyntaxOpening     = text.indexOf($settings.syntax.opening);
      var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;
      var Syntax            = text.substring(SyntaxOpening, SyntaxClosing);
      syntaxValidate(Syntax,function(code){
        console.log(code);
      });
      if(text.indexOf($settings.syntax.opening) && text.indexOf($settings.syntax.closing)){
        var SyntaxOpening     = text.indexOf($settings.syntax.opening);
        var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;
        var Syntax            = text.substring(SyntaxOpening, SyntaxClosing);
        console.log(Syntax);

        var indexKeyOpening   = Syntax.indexOf($settings.syntax.opening)+$settings.syntax.opening.length;
        var indexKeyClosing   = Syntax.indexOf($settings.syntax.closing);
        var indexKeyData      = Syntax.substring(indexKeyOpening, indexKeyClosing);
        var textRemovedKey    = Syntax.substring(indexKeyClosing);
        var indexValueOpening = textRemovedKey.indexOf("\"")+1;
        var indexValueClosing = textRemovedKey.indexOf("\"", textRemovedKey.indexOf("\"")+1);
        var indexValueData    = textRemovedKey.substring(indexValueOpening, indexValueClosing);
        data.key    = indexKeyData;
        data.value  = indexValueData;
        data.syntax   = Syntax;
        data.syntax   = data.syntax.trim();
      }
      else{
        data.syntax = text.replace($settings.syntax.opening,'');
        data.syntax = text.replace($settings.syntax.closing,'');
        data.syntax = text;
        data.error = true;
      }
      callback(data);
    }
    /**
     * [compileHTML description]
     * @param  {Function} callback
     * @return {[type]}            [description]
     */
    function compileHTML(callback){
      var response   = {
        found: false,
        error: '',
        incomplete: 0,
        text: '',
        variables: [],
        broken: []
      }
  		$this.find($settings.html.find).each(function(i, node) {
        console.log('------------------------------------');
        var text                   = $(node).text();
        console.log("Diffrence: "+text);

        console.log('---------------------------------------------------');
        // console.log($settings.syntax.opening.length);
        syntaxValidate($(node).text(),function(code){
          if(code == 1){
            syntaxRemove($(node).text(),function(syntaxClean){
              var variable = {
                key:syntaxClean,
                value: $(node).next().html()
              }
              // sanatization services
              $(node).next().remove();
              $(node).remove();

              response.found = true;
              response.variables.push(variable);
            });
          }
          else{
            console.log('101');
            var variable = {
              key:$(node).text(),
              error: compileError({code: code,incomplete:1})
            }
            console.log(variable);
            response.broken.push(variable);
            if($settings.hideOnBroken){
              $(node).css("visibility","hidden");
              $(node).next().css("visibility","hidden");
            }
            else{
              syntaxRemove($(node).text(),function(syntaxClean){
                if(syntaxClean){
                  response.incomplete++;
                  $(node).text(syntaxClean);
                }
              });
            }
          }
        });
      });
      // make the error code a little bit more digestable.
      response.error = compileError(response);
      callback(response);
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
  				callback(1);
  			}
  			else{
  				callback(2);// has only opening syntax
  			}
  		}
  		else{
        // has only closing brace but no opening brace
  			if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
  				callback(3)// has only closing syntax
  			}
  			else{
  				callback(false)// no syntax detected
  			}
  		}
  	}
    /**
     * Return a clean and consice error message
     * @param  {[type]} response
     * @return {[type]}          [description]
     */
    function compileError(response){
      if(response.incomplete !== 1){
        response.error = ""+response.incomplete+" variables with broken syntax.";
        if($settings.hideOnBroken){
          response.error += "They've been hidden from view.";
        }
        else{
          response.error += "They've been removed of broken syntax.";
        }
        return response.error;
      }
      else{
        response.error = "Syntax was found broken. ";
        if(response.code = 2){
          response.error += "Closing brace missing.";
        }
        else{
          response.error += "Opening brace missing.";
        }
        return response.error;
      }
    }
    /**
     * [htmlStashAdd description]
     * @param  {[type]} variables
     * @return {[type]}           [description]
     */
    function htmlStashAdd(variables,stash,callback){
      var selector = $this.selector+" ."+$settings.html.stash;
      var latest   = variables.length;
      for (var i = 0; i < variables.length; i++) {
        variables[i].key = variableSlugify(variables[i].key);
        if(stash.length !== 0){
          stash.push(variables[i]);
        }
        else{
          stash[0] =variables[i];
        }
      }
      callback(stash);
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
    /**
     * [varLoad description]
     * @param  {Function} callback
     * @return {[type]}            [description]
     */
    function varLoad(callback){
      $(".glean-gather").each(function(i,node){
        if($(this).hasClass('glean-key')){
          var key   = variableSlugify($(this).text());
          $variables[key] = $(this).next().html();
        }
      });
      callback();
    }
    /**
     * Finds the correct variable in the stack and returns
     * its value.
     * @param  {[type]}   key
     * @param  {[type]}   stash
     * @param  {Function} callback
     * @return {[type]}   found variables value
     */
    function stashFind(key,stash,callback){
      let value = '';
      for (var i = 0; i < stash.length; i++) {
        if(stash[i].key == variableSlugify(key)){
          value = stash[i].value;
        }
      }
      callback(value);
    }
    function stashFindBroken(key,stash,callback){
      let value = '';
      for (var i = 0; i < stash.length; i++) {
        if(stash[i].key == variableSlugify(key)){
          value = stash[i].value;
        }
      }
      callback(value);
    }
    /**
     * Slugs whatever variable is handed to it.
     * @param  {[String]} variable [Hand this string]
     * @return {[type]}          [A slugged version of the @param]
     */
    function variableSlugify(variable){
      return variable.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-').toLowerCase();
    }
    /**
     * Does a quick scan if any syntax is in text, if there is
     * then there is a possibility that valid syntax is present.
     * @param  {Function} callback
     * @return {[type]}            [description]
     */
    function variablesSearch(callback){
      var text = $this.text();
      if(text.indexOf($settings.syntax.opening) > 0  && text.indexOf($settings.syntax.closing) > 0){
        callback(false);
      }
      else{
        callback(true);
      }
    }
    /**
     * Removes all reminants of syntax from text.
     * @param  {[type]}   syntax
     * @param  {Function} callback
     * @return {[type]}            [description]
     */
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
    function logAdd(logs,data){
      var newLog = logs;
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
      build()
        .done(function(data){
          $settings.onDone(data);
        })
        .fail(function(logs){
          $settings.onFail(logs);
        });
    });
  };
}(jQuery));
