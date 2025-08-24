const nodeMailer=require('nodemailer');
require('dotenv').config();
const transport=nodeMailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        pass:process.env.NODE_CODE_SENDING_PASSWORD
    }
});

module.exports=transport;