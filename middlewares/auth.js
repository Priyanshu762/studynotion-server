const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//auth
exports.auth = async (req,res,next)=>{
    try {
        const token = req.cookies.token || req.body.token || req.header("Authorisation").replace("Bearer ","");
        if(!token){
            return res.status(401).json({
                success:false,
                message:"No token found",
            })
        }
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET)
            // console.log(decode)
            req.user = decode;
        } catch (error) {
            return res.status(401).json({
                success:false,
                message:"Invalid Token"
            })
            
        }
        next();
        
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            success:false,
            message:"error in validating token"
        })
    }

}

//isStudent

exports.isStudent = async (req, res, next) => {
    try {
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Student only",
            })
        }
        next();
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error in verifying role as Student"
        })
        
    }

}


//isInstructor

exports.isInstructor = async (req, res, next) => {
    try {
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Instructor only",
            })
        }
        next();
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error in verifying role, please try again"
        })
        
    }

}



//isAdmin

exports.isAdmin = async (req, res, next) => {
    try {
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is protected route for Admin only",
            })
        }
        next();
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error in verifying role, please try again"
        })
        
    }

}

