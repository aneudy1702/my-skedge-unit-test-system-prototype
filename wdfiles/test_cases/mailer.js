var nodemailer = require("nodemailer");

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "aneudy@skedge.me",
        pass: "asnmer12780923"
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: "Rock Star Developer <aneudy@skedge.me>", // sender address
    to: "tech@skedge.me", // list of receivers
    subject: "Integrating Front-end report emails", // Subject line
    text: "Some sexy coding going at skedge.me today", // plaintext body
    html: "<b>Happy Friday Guys</b>" // html body
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