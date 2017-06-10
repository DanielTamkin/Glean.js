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
      showOnBroken: false,
      onStart: function(){},
      onFail: function(){},
      onDone: function(){}
    };
    $settings       = $.extend(true,{},defaults , options);
    $this           = this;
    $thisItteration = 0;
    $thisCurrent    = '';
    $run = {
      logs: {
        display: function(data){
          var dfd = jQuery.Deferred();
          logOutput(data,function(message){
            console.log(message);
          });
          dfd.resolve(data);
          return dfd.promise();
        },
        debug: function(data){
          var dfd = jQuery.Deferred();
          if($settings.debug){
            logOutputDebug(data,function(debug){
              console.log(debug);
            });
          }
          dfd.resolve(data);
          return dfd.promise();
        }
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
              var message = {
                message: "No syntax was found"
              }
              data.logs = logAdd(data.logs,message);
              dfd.reject(data);
            }
          });
          return dfd.promise();
        }
      },
      compile: {
        failCheck: function(data){
          var dfd = jQuery.Deferred();
          if(data.brokenFatal == true){
            compileHTMLSanatize(function(){
              dfd.reject(data);
            });
          }
          else{
            dfd.resolve(data);
          }
          return dfd.promise();
        },
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
            if($settings.showOnBroken == false && response.broken.length > 0 ){
              var brokenMessage = '';
              for (var i = 0; i < response.broken.length; i++) {
                brokenMessage += "\t\tVariable: "+response.broken[i].key+"\n"
                brokenMessage += "\t\tError: "+response.broken[i].error+"\n"
              }
              var message = {
                message: "Found severe Syntax error in HTML",
                details: "Syntax errors:\n"+brokenMessage
              }
              data.brokenFatal = true; // will cause a failCheck to run
              data.broken      = response.broken;
              data.variables   = [];
              data.logs        = logAdd(data.logs,message);
              dfd.reject(data);
            }
            else{
              if(response.found){
                // console.log(response.broken);
                var message = {
                  message: "Compiled syntax in HTML"
                }
                dfd.resolve(data);
                data.broken    = response.broken;
                data.variables = response.variables;
                data.logs      = logAdd(data.logs,message);
              }
              else{
                var message = {
                  message: "No syntax in HTML",
                  details: response.error
                }
                data.broken = response.broken;
                data.variables = [];
                data.logs   = logAdd(data.logs,message);
                dfd.resolve(data);
              }
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
          if(data.variables.length !== 0){
            htmlStashAdd(data.variables,data.stash,function(response){
              var details = '';
              if(data.variables.length == 1){
                details = "A new variable was added";
              }
              else{
                details = data.variables.length+" Variables added";
              }
              var message   = {
                message: "Adding variables to the data stash",
                details: details
              }
              data.variables = [];
              data.stash     = response;
              data.logs      = logAdd(data.logs,message);
              dfd.resolve(data);
            });
          }
          else{
            var message = {
              message: "No variables to add",
              details: "There's no variables to add to the stash, check for syntax errors."
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
    /**
     * The Brain of the plugin, contains the full procedure list to run.
     * @return {[Promise]}      Returns a full promise to allow the
     *                          .onDone() & .onFail() functions to fire.
     */
    function build(thisCurrent){
      var dfd = jQuery.Deferred();
      $thisCurrent = thisCurrent;
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
        .then($run.logs.display)
        .then($run.compile.failCheck)
        .then($run.logs.debug)
        .done(function(response){
          dfd.resolve(response.functions);
        })
        .fail(function(response){
          // console.log(101);
          logOutput(response,function(output){
            console.log(output);
            // console.log(response.stash.length);
            var message = '';
            if(response.broken.length > -1
              && response.broken[0] == undefined
              && response.stash.length > -1){
                // remove all plainText syntax silently
                message = response.broken[response.broken.length].error;
            }
            else{
              message = "No syntax found"
            }
            dfd.reject(message);
          });
        });
      return dfd.promise();
    };
    function runStart(data){
      var dfd = jQuery.Deferred();
      dfd.resolve(data);
      return dfd.promise();
    }
    function logOutput(data,callback){
      // console.log(data);
      if(data.brokenFatal !== true){
        var messageOpening = "Glean.js compiled "+$this.selector;
        // console.log($settings.showOnBroken);
        if($this.length > 1){
          messageOpening += " of #"+$thisItteration+" ";
        }
        var messageClosing = "and gathered ";
        if(data.stash.length > 2){
          messageClosing += data.stash.length+" variables";
        }
        else{
          messageClosing += "a variable";
        }
        callback(messageOpening+messageClosing);
      }
      else{
        var message = "Glean.js Failed to compile due to a severe";
        message    += " Syntax error. Dumping logs\n";
        // console.log('101');
        logOutputDebug(data,function(debug){
          message += debug;
          callback(message);
        });
      }
    }
    function logOutputDebug(data,callback){
      var message = '';
      for (var i = 0; i < data.logs.length; i++) {
        var date    = new Date(data.logs[i].time);
        var dateMessage = "["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]"
        message += dateMessage+" "+data.logs[i].message+"\n";
        // console.log(data.logs[i].details);
        if(data.logs[i].details !== undefined){
          var details = '';
          for (var j = 0; j < dateMessage.length;j++) {
            details += " ";
          }
          details += "- "+data.logs[i].details;
          message += details+"\n";
        }
      }
      callback(message);
    }
    /**
     * A giant procedure to obtain the text from $thisCurrent and
     * compile any variables found within it. Complete with a
     * recursive strategy and a hard stop on compiling
     * if any syntax is found to be broken.
     * @param  {Function} callback
     * @return {[Object]}            A super helpful assortment of data
     *                               that will help aid in the
     *                               compile -> text workflow.
     */
    function compileText(callback){
      var response   = {
        found: false,
        error: '',
        incomplete: 0,
        text: '',
        variables: []
      }
      var selector = $thisCurrent.selector+" ."+$settings.html.stash;
      var textwHTML = $thisCurrent.html();
      var textnHTML = $thisCurrent.text();
      // textnHTML     = textnHTML.replace($(selector).html(), '');
      syntaxCount(textnHTML,function(dataCount){
        // console.log(dataCount.count);
        if(dataCount.count !== 0){
          for (var i = 0; i < dataCount.count; i++) {
            syntaxGrab(textwHTML,function(data){
              textwHTML = textwHTML.replace(data.syntax, '');
              response.variables.push({key:data.key,value:data.value});
            });
          }
          response.found = true;
        }
        else{
          response.found = false;
          if(dataCount.error){
            response.error = "Syntax errors found in plain-text, rejecting compiling any plain-text.";
          }
          else{
            // make the error code a little bit more digestable.
            response.error = compileError(response);
          }
        }
      });
      $($thisCurrent).html(textwHTML);
      callback(response);
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
     function syntaxCount(text,callback,count,error){
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
         syntaxCount(text,callback,count,error);
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
    function syntaxGrab(text,callback){
      var data = {
        key: '',
        value: '',
        syntax: '',
        error: false,
        incomplete: 0
      };
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
    /**
     * Consumes HTML, finds syntax, validates if
     * syntax is valid syntax. If the syntax is valid
     * then the syntax is pushed to the variables list,
     * and removed from the HTML DOM.
     * @param  {Function} callback
     * @return {[Object]}            The Response object has a flurrly
     *                               of data that is used for
     *                               the compile -> html workflow.
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
  		$thisCurrent.find($settings.html.find).each(function(i, node) {
        syntaxValidate($(node).text(),function(code){
          if(code == true){
            syntaxRemove($(node).text(),function(syntaxClean){
              response.found = true;
              response.variables.push({
                key:syntaxClean,
                value: $(node).next().html()
              });
              // sanatization services
              $(node).next().remove();
              $(node).remove();
            });
          }
          else{
            response.broken.push({
              key:$(node).text(),
              error: compileError({code: code,incomplete:1})
            });
            if($settings.showOnBroken == true){
              syntaxRemove($(node).text(),function(syntaxClean){
                if(syntaxClean){
                  response.incomplete++;
                  $(node).text(syntaxClean);
                }
              });
            }
            else{
              // sanatization services
              $(node).next().remove();
              $(node).remove();
            }
          }
        });
      });
      // make the error code a little bit more digestable.
      response.error = compileError(response);
      callback(response);
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
    function syntaxValidate(syntax,callback){
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
     * Return a clean and consice error message
     * @param  {[Object]} response  Contains usefull syntax data
     * @return {[String]}           the full error described
     */
    function compileError(response){
      if(response.incomplete !== 1){
        response.error = ""+response.incomplete+" variables with broken syntax.";
        if(!($settings.showOnBroken)){
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
          response.error += "Opening brace missing.";
        }
        else{
          response.error += "Closing brace missing.";
        }
        return response.error;
      }
    }
    /**
     * Adds a new set of variables to the variable stash supplied
     * @param  {[Array]}   variables  The variables to be added
     * @param  {[Array]}   stash      All variables already added
     * @param  {Function} callback
     * @return {[Array]}              The Stash with added new variables
     */
    function htmlStashAdd(variables,stash,callback){
      var selector = $thisCurrent.selector+" ."+$settings.html.stash;
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
     * @param  {[String]} variable The string to be slugged
     * @return {[String]}            A slugged version of the @param
     */
    function variableSlugify(variable){
      return variable.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-').toLowerCase();
    }
    /**
     * Does a quick scan if any syntax is in text, if there is
     * then there is a possibility that valid syntax is present.
     * @param  {Function} callback
     * @return {[boolean]}            True if any bit of syntax is found, false
     *                                if not
     */
    function variablesSearch(callback){
      var text = $thisCurrent.text();
      if(text.indexOf($settings.syntax.opening) > 0  && text.indexOf($settings.syntax.closing) > 0){
        callback(false);
      }
      else{
        callback(true);
      }
    }
    function compileHTMLSanatize(callback){
      $thisCurrent.find($settings.html.find).each(function(i, node) {
        if($settings.showOnBroken){
          syntaxRemove($(node).text(),function(syntaxClean){
            if(syntaxClean){
              response.incomplete++;
              $(node).text(syntaxClean);
            }
          });
        }
        else{
          // sanatization services
          $(node).next().remove();
          $(node).remove();
        }
      });
      callback();
    }
    /**
     * Removes all reminants of syntax from text, not only does the
     * function remove the plain syntax opening and closing's but also
     * the opening and closings reversed.
     * @param  {[String]}   syntax  The text that needs to be stripped
     * @param  {Function} callback
     * @return {[String]}           Clean text with no syntax.
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
     * @param  {[boo]} boolean
     * @return {[type]}         [description]
     */
    /**
     * A crutial part of the mix, adds new log entries to
     * the log object. While performing the push a time stamp is
     * added to the object iwth logTime()'s help.
     * @param  {[Array]}  logs    The full list of logs
     * @param  {[Object]} data    A new log entry to be added
     * @return {[Array]}  newLog  An Updated list of logs
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
    /**
     * Appends a timestamp to a soon to be added log
     * @param  {[Object]} message The yet to be added log in question
     * @return {[type]}           The same log with a .time variable
     *                            now included
     */
    function logTime(message){
      if(!message){
        // don't interact with an undefined object
      }
      else{
        message.time = $.now();
      }
      return message;
    }
    /**
     * Runs the whole show.
     * @return {[Function]} Itterates through each child instance
     */
    return $this.each(function() {
      $settings.onStart();
      $thisItteration++;
      build($(this))
        .done(function(data){
          $settings.onDone(data);
        })
        .fail(function(logs){
          $settings.onFail(logs);
        });
    });
  };
}(jQuery));
