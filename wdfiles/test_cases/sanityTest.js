var webdriver = require('wd'), assert = require('assert'), config = require('./config'),
desiredCapabilities = config.caps(), jobPassed = config.jobPassed, cr = config.credentials(),
testHolder = config.testHolder ;
var local = true;
if(local){
  desiredCapabilities = desiredCapabilities.local;
} else {
  desiredCapabilities = desiredCapabilities.sauceLabs;
}
//"http://skedge.me/ux/testing/datetime/main-dev.html"
// process.argv.forEach(function (val, index, array) {
//   var param = val.toString();
//   if(param.indexOf('http') > -1){
//     url = param;
//   }
// });

var host = '';
var params = true;
if(process.argv.length != 3){
  //print out help
  console.log('expected: node file.js host');
  params = false;
} else {
  host = process.argv[2]
}

//datepicker container
var datepickerContainer = require('./datePickerTest');
var datePicker;
//pop up test container
var popOverContainer = require('./popOverTest');
var popOverTest;

var datePickerTest = function(brwsr, desiredCaps){
  var caps = desiredCaps, browser = brwsr;
  testHolder(browser, 'http://' + host + '/wdfiles/environments/datePicker/main-dev.html', desiredCapabilities, function(browser, sessionId, counter){// testHolder starts here.
    datePicker = datepickerContainer.datePicker(browser, sessionId);
    //datepicker test starts here
    datePicker.onLoad(function(){
      datePicker.onFocus(function(){
        datePicker.onDateClick(function(){
          datePicker.typeInValue(function(){
            datePicker.removeValue(function(){
              datePicker.validDateAssertion(function(){
                browser.quit();
                jobPassed(sessionId, true);
                if (counter < (desiredCapabilities.length - 1)){
                  c = counter + 1;
                  return c;
                }
              })
            })
          })
        })
      })
    });
  });// testHolder ends here.  
};

var dayViewTestContainer = require('./dayview');
var dayViewTester = function(browser, desiredCapabilitiesx){
  testHolder(browser, 'http://' + host + '/main-dev.html', desiredCapabilities, function(b, sessionId, counter){
    var dayViewTest = new dayViewTestContainer.dayViewTest(b, sessionId);
    dayViewTest.checkDate(function(){
      browser.quit();
      jobPassed(sessionId, true);
    });

    //always do this part to end your test. so you update the report on saucelabs
    
    //********************************//
  });
};

if(params){
  var browser = local ? webdriver.remote() : webdriver.remote(cr.host, cr.port, cr.username, cr.accessKey);
  browser.on('status', function(info){console.log('\x1b[36m%s\x1b[0m', info);});
  browser.on('command', function(meth, path){console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);});
  // call all your test functions from here
  //datePickerTest(browser, desiredCapabilities);
	dayViewTester(browser, desiredCapabilities);
}else{
  process.exit(1);
}
