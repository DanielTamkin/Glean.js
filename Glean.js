(function($){
  // Written By Daniel Tamkin. github.com/danieltamkin, danieltamkin.com
  $.fn.Glean = function(options){
    var defaults = {
      content: this,
      html: {
        find: "h1, h2, h3, h4, h5, h6"
      },
      syntax: {
        opening: "!/",
        closing: "/!"
      },
      hideBroken: true,
      onStart: function(){},
      onFail: function(){},
      onDone: function(){}
    };
    /* * * Globals * * */
    $settings       = $.extend(true,{},defaults , options);
    /* * *   Run   * * */
    $run = {
      compile: {
        html: function(data){
          var dfd = $.Deferred();
          compileHTML(data,function(error){
              dfd.resolve(data);
          });
          return dfd.promise();
        },
        text: function(data){
          var dfd = $.Deferred();
          compileText(data,function(error,data){
            if(!error)
              dfd.resolve(data);
            else
              dfd.reject(data);
          });
          return dfd.promise();
        },
        errorPass: function(data){
          var dfd = $.Deferred();
          if(data.details.broken.length !== 0){
            if(data.variables.length > 0)
              dfd.resolve(data);
            else
              dfd.reject(data);
          }
          else{
            dfd.resolve(data);
          }
          return dfd.promise();
        }
      },
      functions: function(data){
        var dfd = jQuery.Deferred();
        /**
         * Pretty sweet little function here.
         * Either just blissfully grab the value of a variable
         * or return a callback and allow futher testing
         * if a variable exists.
         * @type {Object}
         */
        data.functions = returnFunctions(data);
        dfd.resolve(data);
        return dfd.promise();
      }
    };
    /* * * Private * * */
    function build(thisCurrent,callback){
      buildStart(thisCurrent)
        .then($run.compile.html)
        .then($run.compile.text)
        .then($run.compile.errorPass)
        .then($run.functions)
        .done(function(data){
          buildEnd(data);
          callback(false,data);
        })
        .fail(function(data){
          buildEnd(data);
          callback(data.error);
        });
    }
    function buildStart(thisCurrent){
      var dfd   = $.Deferred();
      var data  = {
        this: thisCurrent,
        error: undefined,
        details: {
          pass: true,
          broken: []
        },
        variables: [],
        functions: {},
        logs:[{
              message:'Starting a new glean instance.',
              time: $.now()
        }]
      };
      dfd.resolve(data);
      $settings.onStart(returnFunctions(data).that());
      return dfd.promise();
    }
    function buildEnd(data){
      var timeStart = new Date(data.logs[0].time).getMilliseconds();
      var timeEnd   = new Date($.now()).getMilliseconds();
      var diffrence = timeStart-timeEnd;
      var message   = "Glean ";
      if(data.variables.length > 0 && data.details.pass == true && data.details.broken.length == 0){
        if(data.variables.length == 1)
          message += "compiled a variable in "+diffrence+" miliseconds.";
        else
          message += "compiled "+data.variables.length+" variables in "+diffrence+" miliseconds.";
      }
      else if(data.variables.length > 0 && data.details.broken.length > 0 && data.details.pass == true) {
        message   += "found variable syntax errors; Valid syntax compiled successfully."
      }
      else if((data.variables.length > 0 && data.details.broken.length > 0)) {
        message   += "found plain-text syntax errors, HTML variables only compiled."
      }
      else{
        message   += "Found no syntax to compile. If you're using plain-text, check the syntax."
      }
      message += " @";
      console.log(message);
      console.log(data.this);
    }
    function returnFunctions(data){
      return {
        get: function(key,callback){
          if(callback !== undefined){
            stashFind(key,data.variables,function(value){
              if(value !== undefined){
                callback(value);
              }
              else{
                stashFindBroken(key,data.details.broken,function(error){
                  if(error !== undefined)
                    callback(false,error)
                  else
                    callback(false,"No variables with that name");
                });
              }
            });
          }
          else{
            stashFind(key,data.variables,function(value){
              return value;
            });
          }
        },
        that: function(){
          return data.this;
        }
      };
    }
    /**
     * Finds the correct variable in the variable list
     * and returns its value.
     * @param  {[type]}   key
     * @param  {[type]}   stash
     * @param  {Function} callback
     * @return {[type]}   found variables value
     */
    function stashFind(key,variables,callback){
      let value = undefined;
      for (var i = 0; i < variables.length; i++) {
        if(variables[i].key == variableSlugify(key)){
          value = variables[i].value;
        }
      }
      callback(value);
    }
    function stashFindBroken(key,variables,callback){
      let value = undefined;
      for (var i = 0; i < variables.length; i++) {
        if(variables[i].key == variableSlugify(key)){
          value = variables[i].error;
        }
      }
      callback(value);
    }
    /* * * compile:HTML * * */
    /**
     * Consumes HTML, finds syntax, validates if
     * syntax is valid syntax. If the syntax is valid
     * then the syntax is pushed to the variables list,
     * and removed from the HTML DOM.
     * @param  {Function} callback
     * @return {[Object]}            The Data object has a flurrly
     *                               of data that is used for
     *                               the compile -> html workflow.
     */
    function compileHTML(data,callback){
      $that   = data.this;
      $stash  = data.stash;
      var count = ($that.find($settings.html.find).length)-1;
      var compileData = {
        incomplete:0,
        error: ''
      };
      $that.find($settings.html.find).each(function(i, node) {
        var error = true;
        compileHTMLValidate($(node).text(),function(code){
          if(code == true){
            compileHTMLRemove($(node).text(),function(syntaxClean){
              data.details.pass = true;
              data.variables.push({
                key: variableSlugify(syntaxClean),
                value: $(node).next().html()
              });
              // sanatization services
              $(node).next().remove();
              $(node).remove();
            });
          }
          else if (code == 2 || code == 3) {
            // data.details.pass = false;
            compileData.incomplete++;

            if($settings.hideBroken == true){
              data.details.broken.push({
                key: variableSlugify($(node).text()),
                error: compileHTMLError({code: code,incomplete:1})
              });
              // sanatization services
              $(node).next().remove();
              $(node).remove();
            }
            else{
              compileHTMLRemove($(node).text(),function(syntaxClean){
                if(syntaxClean){
                  $(node).text(syntaxClean);
                }
              });
            }
          }
        });
      }).promise().done(function() {
        data.error =  compileHTMLError(compileData);
        callback(data);
      });
    }
    /**
     * Validates whatever syntax is given to it by
     * determining that it has the intended opening
     * syntax($settings.syntax.opening) and closing
     * syntax($settings.syntax.closing)
     * @param  {[type]}   syntax       The syntax in question
     * @param  {Function} callback
     * @return {[int or false]}        Each error code describes a different
     *                                 error.
     *                                 true  : Valid syntax
     *                                 2     : Only opening brace present
     *                                 3     : Only Closing brace present
     *                                 false : No syntax detected
     */
    function compileHTMLValidate(syntax,callback){
  		if(syntax.indexOf($settings.syntax.opening) == 0){
        // has both opening and closing braces
  			if(syntax.lastIndexOf($settings.syntax.closing) == syntax.length - $settings.syntax.closing.length){
  				callback(true);
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
     * Removes all reminants of syntax from text, not only does the
     * function remove the plain syntax opening and closing's but also
     * the opening and closings reversed.
     * @param  {[String]}   syntax  The text that needs to be stripped
     * @param  {Function} callback
     * @return {[String]}           Clean text with no syntax.
     */
    function compileHTMLRemove(syntax,callback){
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
     * Return a clean and consice error message
     * @param  {[Object]} response  Contains usefull syntax data
     * @return {[String]}           the full error described
     */
    function compileHTMLError(response){
      if(response.incomplete > 1){
        response.error = ""+response.incomplete+" variables with broken syntax.";
        if(!($settings.hideBroken)){
          response.error += "They've been hidden from view.";
        }
        else{
          response.error += "They've been removed of broken syntax.";
        }
        return response.error;
      }
      else if(response.incomplete == 1){
        response.error = "Syntax is";
        if($settings.hideBroken){
          response.error += " hidden, ";
        }
        else{
          response.error += " broken, ";
        }
        if(response.code = 2){
          response.error += "Opening brace is missing.";
        }
        else{
          response.error += "Closing brace is missing.";
        }
        return response.error;
      }
      else{
        return undefined;
      }
    }
    /* * * compile:Text * * */
    /**
     * A giant procedure to obtain the text from $that and
     * compile any variables found within it. Complete with a
     * recursive strategy and a hard stop on compiling
     * if any syntax is found to be broken.
     * @param  {Function} callback
     * @return {[Object]}            A super helpful assortment of data
     *                               that will help aid in the
     *                               compile -> text workflow.
     */
    function compileText(data,callback){
      $that = data.this;
      var textwHTML = $that.html();
      var textnHTML = $that.text();
      // textnHTML     = textnHTML.replace($(selector).html(), '');
      compileTextCount(textnHTML,function(dataCount){
        if(dataCount.count !== 0){
          for (var i = 0; i < dataCount.count; i++) {
            compileTextGrab(textwHTML,function(response){
              textwHTML = textwHTML.replace(response.syntax, '');
              data.variables.push({
                key: variableSlugify(response.key),
                value: response.value
              });
            });
          }
          data.details.pass = true;
        }
        else if(dataCount.error){
          data.details.pass = false;
          data.error = "Syntax errors found in plain-text, rejecting compiling any plain-text.";
        }
        else{
          data.details.pass = data.details.pass;
        }
        $that.html(textwHTML);
        callback(!data.details.pass,data);
      });
    }
    /**
     * Counts the ammount of times full syntax is
     * found in the text. If broken syntax is found then
     * the entire count is rejected.
     * @param  {[type]}   text      The text to parse
     * @param  {Function} callback
     * @param  {[Int]}    count
     * @return {[Object]}           Contains the final count and
     *                              an error boolean
     */
    function compileTextCount(text,callback,count,error){
     if(count == undefined){
       count = 0;
     }
     if(text.indexOf($settings.syntax.opening) > 0  && text.indexOf($settings.syntax.closing) > 0){
       var SyntaxOpening          = text.indexOf($settings.syntax.opening);
           syntaxChunkStart       = text.indexOf($settings.syntax.opening),
           syntaxChunkEnd         = text.indexOf($settings.syntax.closing),
           syntaxChunk            = text.substring(syntaxChunkEnd,syntaxChunkStart);
       // is there an error in the syntax?
       if(syntaxChunk.indexOf($settings.syntax.opening) == -1  && syntaxChunk.indexOf($settings.syntax.closing < 0) == -1){
         var Syntax            = text.replace($settings.syntax.opening,'');
             Syntax            = text.replace($settings.syntax.opening,'');
         error = true;
         text  = Syntax;
         count = 0;
       }
       else{
         var SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1;
         var Syntax            = text.substring(SyntaxOpening, SyntaxClosing);
         text  = text.replace(Syntax, '');
         count++;
       }
       compileTextCount(text,callback,count,error);
     }
     else{
       callback({count: count, error: error});
     }
    }
    /**
     * Compiles variables from plain text.
     * @param  {[String]}   text    String to compile off of
     * @param  {Function} callback
     * @return {[Object]}           Contains a plethera of variable data to
     *                              assist in the compiling procedure
     */
    function compileTextGrab(text,callback){
      var data = {key: '',value: '',syntax: '',error: false,};
      var SyntaxOpening     = text.indexOf($settings.syntax.opening),
          SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1,
          Syntax            = text.substring(SyntaxOpening, SyntaxClosing);
      if(text.indexOf($settings.syntax.opening) && text.indexOf($settings.syntax.closing)){
        var SyntaxOpening     = text.indexOf($settings.syntax.opening)
            SyntaxClosing     = text.indexOf("\"", text.indexOf("\"")+1)+1,
            Syntax            = text.substring(SyntaxOpening, SyntaxClosing),
            indexKeyOpening   = Syntax.indexOf($settings.syntax.opening)+$settings.syntax.opening.length,
            indexKeyClosing   = Syntax.indexOf($settings.syntax.closing),
            indexKeyData      = Syntax.substring(indexKeyOpening, indexKeyClosing),
            textRemovedKey    = Syntax.substring(indexKeyClosing),
            indexValueOpening = textRemovedKey.indexOf("\"")+1,
            indexValueClosing = textRemovedKey.indexOf("\"", textRemovedKey.indexOf("\"")+1),
            indexValueData    = textRemovedKey.substring(indexValueOpening, indexValueClosing);
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
    /* * *  Helpers  * * */
    /**
     * Slugs whatever variable is handed to it.
     * @param  {[String]} variable The string to be slugged
     * @return {[String]}            A slugged version of the @param
     */
    function variableSlugify(variable){
      return variable.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-').toLowerCase();
    }
    /* * * Iterator * * */
    var now = this;
    if(now.length > 1){
      now.each(function() {
        build($(this),function(error,data){
          if(error==false) {
            $settings.onDone(data.functions);
          }
          else{
            $settings.onFail(error);
          }
        });
      });
    }
    else{
      build($(now),function(error,data){
        if(error==false) {
          $settings.onDone(data.functions,data.functions.that());
        }
        else{
          $settings.onFail(error);
        }
      });
    }
    return this;
  };
}(jQuery));
