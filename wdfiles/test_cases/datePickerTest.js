var config = require('./config');
var jobpassed = config.jobPassed;
var resestPollingFreq = function(){return polling = 0;};
var getGoogDateString = function(browser, string, cb){
  //this only will work with MM/DD/YYYY format
  var splittedDateString = string.match(/\d+/g);//grab the numbers only.
  var year = parseInt(splittedDateString[2]), month = parseInt(splittedDateString[1]) - 1, day = parseInt(splittedDateString[0]) 
  var dateString = 'goog.date.Date('+year+','+month+','+day+').date_.toString()';
  browser.execute('return new '+dateString+';', function(err, result){
    if(err && err.status ==13 || !err && result == null){ // this covers the case when you dont have a presetDate or a date previously picked by the 'user'. 
      dateString = 'none';
    } else {
      dateString = result;  
    } 
    if(cb && typeof cb == 'function'){
      return cb(dateString);
    }else{
      return dateString;  
    }        
  });
};

exports.datePicker = function(browser, sessionId){

  if(!sessionId){
    console.log('Critical error. There is no sessionId. Quitting test.');
    browser.quit();
  }

  return {
    //get presetDate &  module.data
    //if presetDate == null && module.data == null
    // assert textbox exist and it is empty
    //else 
    //assert textbox has DATE in mm/dd/yyyy format 
    //assert module.data == DATE 
    onLoad: function(next){
      //declaring variables.
      var getPresetDate, getModuleData, presetDate = null, moduleData = null, presetDateReady = false, moduleDataReady = false;  
      //get presetDate
      getPresetDate = browser.execute('return presetDate', function(err, result){
        if(err && err.status == 13 || !err && result == null){ // this means presetDate is undefined. this is an expected behavior.
          presetDateReady = true;
          console.log('presetDate succesfuly retrieved. There is not presetDate');
          getModuleDataFunction();
        }else{ //otherwise populate presetDate
          browser.execute('return presetDate.toString()',function(err, result){        
            if(!err){ // no errors
              presetDate = result;
              console.log('presetDate sucessfuly retrieved.');
              presetDateReady = true;
              getModuleDataFunction();
            } else { //log the error and quit the test.
              jobpassed(sessionId, false, function(err){
                console.log('there was an error retrieving PresetDate. error: ' + err);
                browser.quit();            
              });
            }   
          });
        }
      });
      //get the moduleData    
      var getModuleDataFunction = function(){          
        if(presetDateReady){
          getModuleData = browser.execute('return dp1.data()', function(err, result){
            if(result === presetDate){//module data is null when preset data is undefined
              moduleDataReady = true;
              console.log('module data and presetDate are congruently set to undefined/null');
              doTest();
            } else { // otherwise populate moduleData
              if(presetDate == null &&  result != null || presetDate != null &&  result == null){
                console.log('moduleData is not set properly. Quiting test!');
                browser.quit();
              } else {          
                browser.execute('return dp1.data().toString()', function(err, result){
                  if(!err){// no errors
                    moduleData = result;
                    console.log('moduleData sucessfuly retrieved.');
                    moduleDataReady = true;                  
                    doTest();
                  } else { //logging the error and ending the test.
                    jobpassed(sessionId, false, function(err){
                      console.log('there was an error retrieving moduleData. ' + err);
                      browser.quit();            
                    });
                  }
                });
              }
            }
          });
        } else {
          jobpassed(sessionId, false, function(err){
            console.log('there was an error retrieving moduleData. ' + err);
            browser.quit();            
          });
        }                 
      };   

      var doTest = function(){
        if(presetDateReady & moduleDataReady){
          if(presetDate && moduleData){
            browser.execute('return $(".dateInput").val();', function(err, result){
              if(!err){ // no errors          
                console.log('there was no error retrieving the textbox value.');
                if(result){              
                  var month = parseInt((result.split('/')[0])) - 1; //using the minus one since goog.date.Date months start from 0.
                  var day = parseInt(result.split('/')[1]);
                  var year = parseInt(result.split('/')[2]);
                  var dateString = 'goog.date.Date('+year+','+month+','+day+').toString()';
                  browser.execute('return new '+dateString+';', function(err, result){
                    // do the comparison in here
                    if(!err){
                      if(presetDate == moduleData){//verify data congruency
                        if(result == presetDate){
                          console.log("Date Picker on load test succesfully passed!");
                          if(next){ //this indicates what to do next
                            return next();
                          }
                        } else {
                          jobpassed(sessionId, false, function(err){
                            console.log("There was an error. The textbox date is different to the presetDate/ModuleData. Quitting test.");
                            browser.quit();            
                          });                                        
                        }
                      } else {
                        jobpassed(sessionId, false, function(err){
                          console.log("There was an error. presetDate and ModuleData are incongruent. Quitting test.");
                          browser.quit();            
                        });                                        
                      }
                    }
                  });
                } else {
                  jobpassed(sessionId, false, function(err){
                  console.log("There was an Error. The textbox is empty even though presetDate and moduleData aren't empty. Quitting test.");
                  browser.quit();            
                  });
                }
              } else { //log the error and quit the test.
                jobpassed(sessionId, false, function(err){
                  console.log("There was an error retrieving the inputfield. Quitting the test.");
                  browser.quit();            
                });                            
              }
            });
          } else {    
            browser.execute('return $(".dateInput").is(":visible");', function(err, result){
              if(!err){//in case of no errors
                if(result){ // result is a boolean where true indicates that the element is visible.
                  console.log('The textbox is visible');
                  browser.execute('return $(".dateInput").val();', function(err, result){ //retrieve the input field value
                    if(!err){ // if no errors                  
                      if(result == '' || result == undefined){
                        console.log("Date Picker on load test succesfully passed!");
                        if(next){ //this indicates what to do next
                          return next();
                        }
                      } else {// log the error and quit the test
                        var msg = "Error: the texbox appears to have a value even though preseDate nor moduleData has data. Quitting test."
                        jobpassed(sessionId, false, function(err){
                          console.log(msg);
                          browser.quit();            
                        }, msg);                       
                      }
                    }
                  })
                }
              } else {
                var msg = "error Retriving the moduleData/preseDate";
                jobpassed(sessionId, false, function(err){
                  console.log(msg + err);
                  browser.quit();            
                }, msg); 
              }          
            });
          }
        } else {
          console.log('doTest')
          var msg = 'there was an error retrieving moduleData. ';
          jobpassed(sessionId, false, function(err){
            console.log(msg + err);
            browser.quit();            
          }, 'there was an error retrieving moduleData. ');
        }    
      };
    },

    //focus on the textbox
    //wait for the datepicker to come up 
    //assert the datepicker is visible 
    onFocus: function(next){
      browser.elementByCssSelectorIfExists('.dateInput',function(err, element){
        if(!err){ // there is no errors. Textbox exist.
          element.click(function(err){
            // waitForElementByCss(value, timeout, cb) -> cb(err)
            browser.waitForElementByCss('.ui-datepicker', 800, function(err){
              if(!err){
                console.log('onFocus test sucessfuly passed.');
                if(next){
                  return next();
                }
              } else {
                jobpassed(sessionId, false, function(err){
                  console.log('There was error loading the datepicker. '+err);
                  browser.quit();            
                });                
              }
            })
          });
        } else { // log the error
          jobpassed(sessionId, false, function(err){
            console.log('There was an error. The textbox was not found. Quitting test.');
            browser.quit();            
          });                
        }
      });
    },

    onDateClick: function(next){
      browser.elementByCssSelectorIfExists('.dateInput',function(err, element){
        var currentDate;
        browser.execute('return $(".dateInput").val()', function(err, result){
          if(!err){
            currentDate = result;
          } else {
            jobpassed(sessionId, false, function(err){
              console.log('There was an error. retrieving the dateInput val. '+ err);
              browser.quit();            
            });                            
          }
        });
        console.log(err);
        console.log(element);
        if(!err){ // there is no errors. Textbox exist.
          element.click(function(err){
            // waitForElementByCss(value, timeout, cb) -> cb(err)
            browser.waitForElementByCss('.ui-datepicker', 1000, function(err){
              if(!err){
                // click on a date here
                browser.elementByCssSelectorIfExists('.ui-state-default:not(.ui-state-active)', function(err, element){
                  console.log(err);
                  console.log(element);
                  element.click(function(err){
                    browser.execute('return $(".dateInput").val()', function(err, result){
                      if(!err){
                        if(result == currentDate){
                          jobpassed(sessionId, false, function(err){
                            console.log('There was an error updating the date. Date did not get updated. Quitting Test');
                            browser.quit();            
                          });                                                                              
                        } else {
                          console.log('onDateClick test sucessfuly passed.');
                          if(next){
                            return next();
                          }
                        }
                      } else {
                        jobpassed(sessionId, false, function(err){
                          console.log('There was an error. retrieving the dateInput val. '+ err);
                          browser.quit();            
                        });                                                                                                                                 
                      }
                    });
                  });    
                });
              } else {
                jobpassed(sessionId, false, function(err){
                  console.log('There was error loading the datepicker. '+err);
                  browser.quit();            
                });                                                                                                         
              }
            })
          });
        } else { // log the error
          jobpassed(sessionId, false, function(err){
            console.log('There was an error. The textbox was not found. Quitting test.');
            browser.quit();            
          });          
        }
      });
    },

    //type value "1/22/2013"
    //blur
    //assert module.data is set up to the proper goog.date.Date object
    typeInValue: function(next){
      browser.elementByCssSelectorIfExists('.dateInput',function(err, element){
        if(!err){
          var dateString = '1/23/2013'; // change this to indicate a different date to be tested. You might want to consider injecting a list of dates, to make sure the date picker takes it.
          var typeInFunction = getGoogDateString(browser, dateString, function(oldGooDateS){
               element.click(function(err){
                element.clear();
                element.type(dateString, function(err){
                  if(!err){ //if there is not error
                    browser.execute('$(".dateInput").blur()', function(){// mouse out of the input field
                      element.getValue(function(err, value){// get the value out of the input field.
                        console.log('inputfield');
                        console.log(value);
                        if(!err){
                          var moduleData; // moduleData will be compared against oldGooDate to make sure the module data was update after bluring.
                          //get the moduleData
                          getModuleData = browser.execute('return dp1.data()', function(err, result){//get module data first
                            console.log('moduledata');
                            console.log(result);
                            if(!err){// if no errors
                              browser.execute('return dp1.data().date_.toString()', function(err, result){// get the module.data String 
                                if(!err){// no errors
                                  moduleData = result; //assign the result(module.data()._date) to var moduleData
                                  console.log('moduleData sucessfuly retrieved.');
                                  if(moduleData != oldGooDateS){
                                    console.log('typeInValue test sucessfuly passed.');
                                    if(next){
                                      return next();
                                    }
                                  } else {
                                    jobpassed(sessionId, false, function(err){
                                      console.log('There was an error. The module data did not get updated. Quitting test.');
                                      browser.quit();            
                                    });                                      
                                  } 
                                } else { //logging the error and ending the test.
                                  jobpassed(sessionId, false, function(err){
                                    console.log('there was an error retrieving the presunted updated moduleData._date. ' + err);
                                    browser.quit();            
                                  });                          
                                }
                              });
                            } else {
                              jobpassed(sessionId, false, function(err){
                                console.log('There was an error retrieving module data. '+ err);
                                browser.quit();            
                             });                                                        
                            }
                          });
                        } else {
                          jobpassed(sessionId, false, function(err){
                            console.log('There was an error retrieving the value out of the textbox. Quitting test. ' +err);
                            browser.quit();            
                          });                                                                                  
                        }
                      });
                    });
                  } else {
                    jobpassed(sessionId, false, function(err){
                      console.log('There was an error typing the value. Quitting test. '+err);
                      browser.quit();            
                    });                                                                                  
                  }
                });
              });  
          }); //end of oldGoogDate  
        } else  {
          jobpassed(sessionId, false, function(err){
            console.log('There was an error. The textbox was not found. Quitting test.');
            browser.quit();            
          });                                                                                  
        }   
      });
    },

    //emty out the textbox.
    //blur
    //assert module.data == null
    //assert textbox is empty.
    removeValue: function(next){
      browser.elementByCssSelectorIfExists('.dateInput',function(err, element){
        if(!err){ // there is no errors. Textbox exist.
          element.click(function(err){
            element.clear(function(err){
              if(!err){ //if there is not error
                browser.execute('$(".dateInput").blur()', function(){// mouse out of the input field
                  element.getValue(function(err, value){// get the value out of the input field.
                    if(!err){
                      var moduleData; // moduleData will be compared against oldGooDate to make sure the module data was update after bluring.
                      //get the moduleData
                      getModuleData = browser.execute('return dp1.data()', function(err, result){//get module data first
                        if(!err && !result){// if no errors and result equal null
                          console.log('Remove value test sucessfuly passed.');
                          if(next){
                            return next();
                          }
                        } else { //log error here
                          jobpassed(sessionId, false, function(err){
                            console.log('There was an error retrieving module data. '+ err);
                            browser.quit();            
                          });                              
                        }
                      });
                    } else {// log error here
                      jobpassed(sessionId, false, function(err){
                        console.log('There was an error reading the value from the textbox. '+err);
                        browser.quit();            
                      });                                                                          
                    }
                  })
                });
              } else {
                jobpassed(sessionId, false, function(err){
                  console.log('There was an error typing the value. Quitting test. '+err);
                  browser.quit();            
                });                                                                    
              }
            });
          });
        } else { // log the error
          jobpassed(sessionId, false, function(err){
            console.log('There was an error. The textbox was not found. Quitting test.');
            browser.quit();            
          });   
        }
      });
    },

    //type in "111/12"
    //blur
    //assert module data is set up to "invalid date"
    //assert texbox is in errorState
    //assert text remains
    validDateAssertion: function(next){
      browser.elementByCssSelectorIfExists('.dateInput',function(err, element){
        if(!err){
          var dateString = '111/12'; // change this to indicate a different date to be tested. You might want to consider injecting a list of dates, to make sure the date picker takes it.
          var validDateAssertionFunction = getGoogDateString(browser, dateString, function(oldGooDateS){
               element.click(function(err){
                element.clear();
                element.type(dateString, function(err){
                  if(!err){ //if there is not error
                    browser.execute('$(".dateInput").blur()', function(){// mouse out of the input field
                      element.getValue(function(err, value){// get the value out of the input field.
                        if(!err){
                          var moduleData; // moduleData will be compared against oldGooDate to make sure the module data was update after bluring.
                          //get the moduleData
                          getModuleData = browser.execute('return dp1.data()', function(err, result){//get module data first
                            if(!err){// if no errors
                              if(result == 'invalid date' || result == null){
                                browser.hasElementByCssSelector('.dateInput.errorState', function(err, result){
                                  if(!err){
                                    if(result){
                                      console.log('validDateAssertion test sucessfuly passed.');                                    
                                      if (next){
                                        return next();
                                      }
                                    } else {
                                      jobpassed(sessionId, false, function(err){
                                        console.log('There was an error. The textbox has not reacted to invalid date. Quitting test.');
                                        browser.quit();            
                                      });                                                                             
                                    }
                                  } else {
                                    jobpassed(sessionId, false, function(err){
                                      console.log('There was an error retrieving the element. '+err);
                                      browser.quit();            
                                    }); 
                                  }
                                });
                              } else {
                                console.log(result)
                                jobpassed(sessionId, false, function(err){
                                  console.log('There was an error. The module data wasn\'t set up to "invalid date". Quitting test.');
                                  browser.quit();            
                                });                                 
                              }
                            } else {
                              jobpassed(sessionId, false, function(err){
                                console.log('There was an error retrieving module data. '+ err);
                                browser.quit();            
                              });                               
                            }
                          });
                        } else {
                          jobpassed(sessionId, false, function(err){
                            console.log('There was an error retrieving the value out of the textbox. Quitting test. ' +err);
                            browser.quit();            
                          }); 
                          
                          browser.quit();
                        }
                      });
                    });
                  } else {
                    jobpassed(sessionId, false, function(err){
                      console.log('There was an error typing the value. Quitting test. '+err);
                      browser.quit();            
                    }); 
                  }
                });
              });  
          }); //end of validDateAssertionFunction  
        } else  {
          jobpassed(sessionId, false, function(err){
            console.log('There was an error. The textbox was not found. Quitting test.');
            browser.quit();            
          }); 
        }   
      });
    }
  };
}; 