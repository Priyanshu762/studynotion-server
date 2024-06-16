const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    courseName: {
        type:String,
        required:true,
        trim:true,
    },
    courseDescription: {
        type:String,
        required:true,
        trim:true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    whatYouWillLearn: {
        type:String,
    },
    courseContent: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Section",
        }
    ],
    ratingAndReviews : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReviews"
        }
    ],
    price: {
        type:Number,
    },
    totalDuration: {
        type:String,

    },
    thumbnail:{
        type:String,
    },
    tag : {
        type:[String],
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    studentEnrolled:[{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User", 

    }],
    status:{
        type:String,
        enum : ["Draft", "Published"]
    },
    instructions:{
        type:[String],
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }


})

module.exports = mongoose.model("Course", courseSchema);