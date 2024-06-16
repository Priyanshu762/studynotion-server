const User = require("../models/User")
const OTP = require("../models/OTP")
const Profile = require("../models/Profile")
const optGenerator = require("otp-generator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config();
//sendOTP

exports.sendOtp = async (req,res)=>{
     try {
        const {email} =req.body;
    const checkUserPresent = await User.findOne({email});

    if(checkUserPresent){
        return res.status(401).json({
            success:false,
            message: "User already registered"
        })
    }
    //generate OTP
    var otp = optGenerator.generate(6, {
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    });

    console.log("OTP Generated",otp);

    //check otp exists

    let otpCheck = await OTP.findOne({otp: otp});

    while(otpCheck){
        otp = optGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        otpCheck = await OTP.findOne({otp: otp});
    }

    const otpPayload = {email, otp};
    const otpbody = await OTP.create(otpPayload);
    console.log(otpbody);

    res.status(200).json({
        success:true,
        message:"OTP sent Successfully",
    })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:error.message, 

        })
        
        
    }
}



//signUp
exports.signUp = async (req,res)=>{

    try {
        const {firstName, lastName, email, password, confirmPassword, contactNumber, otp, accountType} = req.body;
    if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
        res.status(403).json({
            success:false,
            message:"All fields are required",
        })
    }

    if( password !== confirmPassword){
        res.status(403).json({
            success:false,
            message:"Passwords are not same"
        })
    }
    
    const existingUser = await User.findOne({email});
    if(existingUser){
        res.status(400).json({
            success:false,
            message:"User Already Exists"
        })
    }

    const recentOtp = await OTP.find({email}).sort({cretedAt:-1}).limit(1);
    // console.log(recentOtp);
    if(recentOtp.length === 0){
        return res.status(400).json({
            success:false,
            message:"Otp not found",
        })
    }
    else if (otp !== recentOtp[0].otp){
        return res.status(400).json({
            success:false,
            message:"Invalid Otp",
        })
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const profileDetails = await Profile.create({
        gender:null,
        dateOfBirth:null,
        about:null,
        contactNumber:null,
    })

    const user = await User.create({
        firstName,
        lastName,
        email,
        password:hashedPassword,
        accountType,
        additionalDetails:profileDetails._id,
        image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    })

    return res.status(200).json({
        success:true,
        message:"User signed up successfully",
        user,
    })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"User can't be registered successfully"

        })
        
    }
    
}

//logIn
exports.logIn = async (req,res) => {
    

    try {
       const { email, password } = req.body;
       if(!email || !password){
        return res.status(403).json({
            success:false,
            message:"All fields are required",
        })
       }
       const user = await User.findOne({email});
       if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered, Signup first",
            })
    }
    if(await bcrypt.compare(password, user.password)){
        const payload = {
            email:user.email,
            id:user._id,
            accountType:user.accountType,

        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn:"2h",
        })
        user.token=token;
        user.password=undefined;
        const options = {
            expiresIn: new Date(Date.now()+ 3*24*60*60*1000),
            httpOnly:true,

        }
        res.cookie("token",token, options ).status(200).json({
            success:true,
            token,
            user,
            message:"Logged In succesfully"
        })
    }

    else{
         return res.status(401).json({
            success:false,
            message:"Incorrect Password",
         })
    }


    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Can't be logged In"

        })
        
    }
}


//changePassword

exports.changePassword = async (req,res)=>{
    try {
        const {oldPassword,  newPassword, confirmNewPassword} = req.body;
        const id = req.user.id;
    const user = await User.findOne({_id:id});
    if(!user){
        return res.status(401).json({
            success:false,
            message:"User not Found",
        })
    }

    const storedPassword = user.password;

    if(!oldPassword || !newPassword || !confirmNewPassword){
        return res.status(402).json({
            success:false,
            message:"All fields are required",
        })
    }

    console.log("Old password", storedPassword)
    

    const verify = await bcrypt.compare(oldPassword,storedPassword);
     if(!verify){
        return res.status(400).json({
            success:false,
            message:"Enter correct password",
        })
     }

    

    if(newPassword !== confirmNewPassword){
        return res.status(402).json({
            success:false,
            message:"Both passwords should be same"
        })
    }

    const checkPassword = await bcrypt.compare(newPassword,oldPassword);
    if(checkPassword){
        return res.status(402).json({
            success:false,
            message:"new password should be different from old password"
        })
    }
    const hashedPassword = await bcrypt.hash(newPassword,10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
        success:true,
        message:"Password changed successfully",
    })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Password can't be changed",
        })
        
    }
    



}