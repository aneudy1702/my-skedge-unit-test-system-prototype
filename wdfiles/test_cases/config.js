var config = {};
// should = require('should');
var request = require('request');
var nodemailer = require("nodemailer");


var oCredentials = { 
  host: "ondemand.saucelabs.com", 
  port: 80,
  username: "skedgeMeTest", 
  accessKey: "ffb25e0a-ec6f-402e-b5ec-8494cf0d756e"
};

exports.credentials = function(){
  return oCredentials;
};

exports.caps = function(){
  return {
   'sauceLabs': [
      //chrome browser capabilities
      { 
        browserName: 'chrome', 
        seleniumProtocol: 'WebDriver', 
        name: 'datePicker test on Chrome', 
        tags: ['chrome', 'selenium', 'datePicker', 'test'],
        'chrome,switches': ['--window-size=1366,768'],// this is only needed it when testing locally.
        platform: 'Mac 10.6'
      },
      // safari browser capabilities  
      {
        browserName: 'safari',
        tags: ['safari', 'selenium', 'datePicker', 'test'],
        name: 'datePicker test on safari',
        platform: 'Mac 10.8',
        version: '6'
      },
      // ie 9 on windows 2008 (win xp)
      {
        browserName: 'internet explorer',
        name: 'datePicker test on internet explorer', 
        tags: ['internet explorer','ie', 'selenium', 'datePicker', 'test'],
        platform:'Windows 2008',
        version: '9'
      },
      // firefox
      {
        browserName: 'firefox',
        tags: ['firefox', 'selenium', 'ff', 'datePicker', 'test'],
        name: 'datePicker test on firefox',
        platform: 'Mac 10.6',
        version: '14'
      }
    ],
    'local': [
      //chrome
      { 
        browserName: 'chrome', 
        seleniumProtocol: 'WebDriver', 
        name: 'datePicker test on Chrome', 
        tags: ['chrome', 'selenium', 'datePicker', 'test'],
        'chrome,switches': ['--window-size=1366,768']// this is only needed it when testing locally.
      }
    ]
  }
  
};

//function that changes the test status on saucelabs: pass/fail
exports.jobPassed = function(sessionId, decision, cb, msg) {  
  var httpOpts = {
    url: 'http://' + oCredentials.username + ':' + oCredentials.accessKey + '@saucelabs.com/rest/v1/' + oCredentials.username + '/jobs/' + sessionId,
    method: 'PUT',
    headers: {
      'Content-Type': 'text/json'
    },
    body: JSON.stringify({
      passed: decision // bolean
      , public: false
      , build: 'mileston zero'
      ,'custom-data': msg ? {'error': msg} : {}
    })
  };

  request(httpOpts, function(err, res) {
    if(err){ 
      console.log(err); 
    } else {    
      console.log("> job:", sessionId, "marked as " + (decision == true ? "passed." : "failed.")); 
      var isPassCode = decision == true ? 0 : 1;
      process.exit(isPassCode);
    } 
    if(cb){
      cb(true);
    }    
  });
};
var $this = this;
exports.testHolder = function(browser, url, desiredCapabilities, testSuite){
  var counter = 0;
  var jobPassed = $this.jobPassed
  var testFunction = function(browser,counter, desiredCapabilities, testSuite){
    browser.init(desiredCapabilities[counter], function(err, sessionId) {
      if (!err) {
        browser.get(url, function(err){
          if(!err){            
            if(typeof testSuite == 'function'){
              var newCounter = testSuite(browser, sessionId, counter);
              if(newCounter != counter && typeof newCounter == 'number'){//We want to really be cautious about the integrity of the data
                testFunction(counter);  
              }              
            }
          } else {
            jobPassed(sessionId, false, function(b){
              browser.quit();
            }, 'There was an error getting the url. ' + err)
          }
        })
      } else {
        jobPassed(sessionId, false, function(b){
          browser.quit()
        },'There was an error initializing the browser. ' + err)
      }
    });
  };

  testFunction(browser, counter, desiredCapabilities, testSuite);
};

function sendReportEmail(msg){
  // create reusable transport method (opens pool of SMTP connections)
  var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
      user: "put your email here",
      pass: "put your pswd here"
    }
  });

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: "Rock Star Developer <aneudy@skedge.me>", // sender address
    to: "tech@skedge.me", // list of receivers
    subject: "Front-End Testing, Something went Wrong", // Subject line
    text: "Some sexy coding going at skedge.me today", // plaintext body
    html: "<b>"+msg+"</b>" // html body
  }

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
  });  
}
