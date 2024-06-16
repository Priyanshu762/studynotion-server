const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate")

const otpSchema = new mongoose.Schema({
    email : {
        type : String,
        required: true,
    },
    otp : {
        type:String,
        required:true,
    },
    createdAt : {
        type: Date,
        default: Date.now(),
        expires: 5*60,
    }
    


});

async function sendVerificationEmail(email,otp) {
    try {
        const emailContent = emailTemplate(otp);
        console.log(emailContent);
        const mailResponse = await mailSender(email, "Verification Email from StudyNotion", emailTemplate(otp));
        console.log("Email Sent Successfully:", mailResponse);
    } catch (error) {
        console.log("Error in sending E-mail", error);
        throw error;
        
    }
}

otpSchema.pre("save", async function(next){
    try{
       await sendVerificationEmail(this.email, this.otp);
        next(); 
    }
    catch(error){
        console.log("Error in saving middleware",error)
    }
    
})
module.exports = mongoose.model("OTP", otpSchema);