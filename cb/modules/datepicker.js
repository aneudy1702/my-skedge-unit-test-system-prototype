/** @type {function(goog.date.Date=):ModulerInterface} */
modules.DatePicker = function(presetDate){

	/*-------------------------------------------------------------------------------------------
		presetDate is an optional google date object or null						
		Library References:
		http://jqueryui.com/datepicker/
	-------------------------------------------------------------------------------------------*/
	presetDate = presetDate || null;
	var datepickerParams = {};
			datepickerParams.dateFormat = "mm/dd/yy";
	
	var textInput = new Moduler(presetDate,	'input type="text" placeholder="mm/dd/yyyy"', function (d, e){
		//if the data is a date element, populate the textbox and set the datepicker param 
		if(d instanceof goog.date.Date){
			datepickerParams.setDate = d;
			var psd = formatDate(d);
			e.val(psd);
		}

		
		// Blur the textbox when a date is selected
		datepickerParams.onClose = function(d){
			e.blur();
		}
		e.unbind("change",changeHandler).change(changeHandler);
		//add the date picker
		e.datepicker(datepickerParams);
			//console.log("data()==" + textInput.data()); // sanity test
		return ''
	});

textInput.addCSSClass("input-small dateInput");


/* helper functions:
----------------------------------------------------------------*/

function formatDate(date){
	var mm = date.getMonth() + 1;
			mm = (mm > 9)? mm : "0" + mm;
	var dd = date.getDate();
			dd = (dd > 9)? dd : "0" + dd;
	var yy = date.getFullYear().toString();
	return (mm + "/" + dd  + "/" + yy);
}

// bind change function to element to set data
function changeHandler(eventObj){
	var el = $(eventObj.target),
			newData = setGoogDate(el);
			textInput.setData(newData) ;
	el.removeClass("errorState");
	if(newData == "invalid date"){
		el.addClass("errorState");		
	}
}

function setGoogDate(el){
	// format --> goog.date.Date(opt_year, opt_month, opt_date)
	var newDate = null;
	if(el.val() != ''){
		try{
			el.datepicker( "setDate", el.val());
			var dateObj = new Date(el.datepicker("getDate")); // make a raw Date Obj so Closure doesn't complain
					newDate = new goog.date.Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
		}
		catch(error){
			newDate = "invalid date";
		}
	}
	return (newDate);
}
/*----------------------------------------------------------------*/
	return textInput.getInterface();
}
