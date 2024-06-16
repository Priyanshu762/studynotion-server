const User = require("../models/User");
const mailSender = require("../utils/mailSender")
const crypto = require("crypto")
const bcrypt = require("bcrypt")

//ResetPasswordToken
exports.resetPasswordToken = async (req,res)=>{

    try {
        const {email} = req.body;
    const user = await User.findOne({email})
    if(!user){
        return res.status(402).json({
            success:false,
            message:"Email is not registered"
        })
    }

    const token = crypto.randomUUID();
    await User.findOneAndUpdate({email:email},
        {
            token:token,
            resetPasswordExpires: Date.now() + 5*60*1000,
        },
        {new:true},
        )

        const url = `http://localhost:3000/update-password/${token}`;

        await mailSender(email, "Reset Password mail", `Password reset link : ${url}`)

        return res.status(200).json({
            success:true,
            message:"Email sent successfully, check your e-mail inbox"
        })
        
    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"Error in sending reset password mail"
        })
        
    }
    
}



//resetPassword

exports.resetPassword = async (req, res) => {
	try {
		const { password, confirmPassword, token } = req.body;

		if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}
		const userDetails = await User.findOne({ token: token });
		if (!userDetails) {
			return res.json({
				success: false,
				message: "Token is Invalid",
			});
		}
		if (!(userDetails.resetPasswordExpires > Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}
		const encryptedPassword = await bcrypt.hash(password, 10);
		await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
		);
		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};