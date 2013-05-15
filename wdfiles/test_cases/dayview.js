
exports.dayViewTest = function(browser, sessionId){
	this.browser = browser;
	this.sessionId = sessionId;
	this.checkDate = function(next){
		browser.elementByXPath('/html/body/div[1]/div[2]/div/div/ul/li[1]/a', function(err, element){
			if(!err){
				element.click(function(err){
					//check for no error and check for dates to see if matches the one in the system.
					if(!err){
						browser.waitForElementByCssSelector('ul.timeNav a', 5000, function(err){ 
							if(err){
								console.log(err)
								//do something about this error... - timeout error, couldnt find the element.
							} else {
								browser.elementByCssSelector('ul.timeNav a', function(err, element){
									if(!err){
										element.text(function(err, text) {
											if (!err){
												console.log(text);
												// compare string Date coming from the link against some string format date 
												//next();												
											} else {
												// do something about this error... - couldn't read the link text
											}
										});
									} else {
										// do something about this error... - couldnt find timeNac
									}											
								});
							}
						});						
					} else {
						// do something about this error... - something went wrong clicking on the link
					}
				});
			} else {
				// do something about this error... - browser didnt find the element in the Dom
				jobpassed(sessionId, false, function(err){
					console.log('browser didnt find the element in the Dom. error: ' + err);
					browser.quit();            
				});
			}
		});
	};
};