const { default: mongoose } = require("mongoose")
const {instance} = require("../config/razorpay")
const Course = require("../models/Course")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
require("dotenv").config()
const crypto = require("crypto")
const CourseProgress = require("../models/CourseProgress")

// capture payment

exports.capturePayment = async (req,res)=>{
    const {courses} = req.body;
    const userId = req.user.id;

    if(courses.length === 0){
        return res.json({status:false, message:"Please provide course Id"})
    }

    let totalAmount = 0;
    
    for(const course_id of courses){
        let course;
        try {
            course = await Course.findById(course_id)
            if(!course){
                return res.status(200).json({success:false, message:"No Course found"})
            }

            const uid = new mongoose.Types.ObjectId(userId)
            if(course.studentEnrolled.includes(uid)){
                return res.status(200).json({success:false,message:"Student is already enrolled for this course"})
            }
            totalAmount +=course.price;

        } catch (error) {
                    console.log(error)
                    return res.status(500).json({success:false, message:error.message})

            
        }
    }

    const options = {
        amount : totalAmount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    }

    try {
        const paymentResponse = await instance.orders.create(options)
        res.json({
            success:true,
            message:paymentResponse
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false, message:"Could not initialize order"})
    }
}

//verify the payment

exports.verifyPayment = async (req,res)=> {
    const razorpay_order_id = req.body?.razorpay_order_id
    const razorpay_signature = req.body?.razorpay_signature
    const razorpay_payment_id = req.body?.razorpay_payment_id
    const courses = req.body?.courses
    const userId = req.user.id

    if(!razorpay_order_id || 
        !razorpay_payment_id ||
        !razorpay_signature || 
        !courses || !userId
    ){
        return res.status(200).json({success:false, message:"Paymnet Failed"})
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto.createHmac("sha256" , process.env.RAZORPAY_SECRET).update(body.toString()).digest("hex")

    if(expectedSignature === razorpay_signature){
        await enrollStudents(courses,userId,res)
        return res.status(200).json({success:true, message:"Payment Verified"})
    }

    return res.status(500).json({success:false, message:"Payment Failed"})


}


const enrollStudents = async (courses,userId,res)=> {
    if(!courses || !userId){
        return res.status(400).json({success:false,message:"Please provide data for courseId and userId"})
    }

    for(const courseId of courses){
        try {
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id:courseId},
                {$push:{studentEnrolled:userId}},
                {new:true}
            )
    
            if(!enrolledCourse){
                return res.status(404).json({success:false, message:"No course Found"})
            }

            const courseProgress = await CourseProgress.create({
                courseID:courseId,
                userId:userId,
                completedVideos:[]
            })
    
            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {$push:{
                    courses:courseId
                }},
                {new:true}
            )
    
            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, enrolledStudent.firstName)
            )
    
            console.log("Email Sent Successfully", emailResponse.response)
        } 
        catch (error) {
            console.log(error)
            return res.status(500).json({success:false, message:error.message})
            
        }


    }
}

exports.sendPaymentSuccessEmail = async (req,res)=>{
    const {orderId, paymentId, amount} = req.body
    const userId = req.user.id

    if(!orderId || !paymentId || !amount || !userId){
        return res.status(400).json({success:false, message:"Please provide all fields"})
    }

    try {
        const enrolledStudent = await User.findById(userId)
        await mailSender(
            enrolledStudent.email,
            `Payment Received`,
            paymentSuccessEmail(`${enrolledStudent.firstname}`, amount/100, orderId, paymentId)
        )
    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false, message:"Could Not send Email"})
    }
}


// exports.capturePayment = async (req,res)=>{
    
//         const {courseId} = req.body;
//         const userId = req.user.id;
//         if(!courseId || !userId){
//             return res.status(400).json({
//                 success:false,
//                 message:"All fields required"
//             })
//         }
//         let course;
//         try {
//             course = await Course.findById(courseId);
//         if(!course){
//             return res.status(404).json({
//                 success:false,
//                 message:"No course found",
//             })
//         }
        
//         const uid =  mongoose.Types.ObjectId(userId);

//         if(course.studentEnrolled.includes(uid)){
//             return res.status(200).json({
//                 success:false,
//                 message:"Student is already enrolled for this course"
//             })

//         }
//     } 
        
//         catch (error) {
//             return res.status(500).json({
//                 success:false,
//                 message:"Error in enrolling in the course"
//             })
//         }

//         const amount = course.price;
//         const currency = "INR";
         
//         const options = {
//             price: amount*100,
//             currency,
//             receipt: Math.random(Date.now()).toString(),
//             notes:{
//                 courseId:course._id,
//                 userId,

//             }}

            

        
//         try {
//             const paymentresponse = await instance.orders.create(options);
//             console.log(paymentresponse)
//             return res.status(200).json({
//                 success:true,
//                 message:"Created order successfully",
//                 courseName:course.courseName,
//                 courseDescription:course.courseDescription,
//                 thumbnail:course.thumbnail,
//                 orderid:paymentresponse.id,
//                 currency:paymentresponse.currency,
//                 amount:paymentresponse.amount,
//             })
//         } catch (error) {
//             console.log(error)
//             return res.status(500).json({
//                 success:false,
//                 message:"Could not initiate order"
//             })
//         }
// }       


// exports.verifySignature = async (req,res)=>{
//     const webhooksecret= "12345678";
//     const signature = req.headers["x-razorpay-signature"];
//     const shasum = crypto.createHmac("sha256", webhooksecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");
    
//     if(digest === signature){
//         console.log("Payment is Authorised")
        
//         const  {courseId, userId} = req.body.payload.payment.entity.notes;

//     try {
//         const course = await Course.findByIdAndUpdate({_id:courseId},
//             {
//                 $push:{
//                     studentEnrolled:userId,

//                 }
//             },
//             {new:true})
//             if(!course){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Error in finding course"

//                 })
//             }

//             console.log(course);

//             const user = await User.findByIdAndUpdate({_id:userId},
//                 {
//                     $push:{
//                         courses:courseId,
//                     }
//                 },
//                 {new:true})

//                 console.log(user);

//                 const emailResponse = await mailSender(user.email, "Congratulations from Study Notion", "Congratulations you have succesfully registered for the course")

//                 return res.status(200).json({
//                     success:true,
//                     message:"Signature Verified"
//                 })
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         })
        
//     }
//     }

//     else{
//         return res.status(400).json({
//             success:false,
//             message:"Invalid request"
//         })
//     }


    


// };
    
