const RatingAndReviews = require("../models/RatingAndReviews")
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");


exports.createRating = async (req,res)=> {
    try {
        const {rating, reviews, courseId} = req.body;
        const userId = req.user.id;
        const course = await Course.findOne(
            {_id:courseId,
            studentEnrolled : {$elemMatch : {$eq: userId}}});

        if(!course){
            return res.status(404).json({
                success:false,
                message:"Student is not enrolled in this course"
            })
        }

        const alreadyReviewed = await RatingAndReviews.findOne({
            user:userId,
            course:courseId
        })

        if(alreadyReviewed){
            return res.status(401).json({
                success:false,
                message:"User already reviewed the course"
            })
            
        }

        const ratingReview = await RatingAndReviews.create({
            rating,reviews,
            course:courseId,
            user:userId
        })

        await Course.findByIdAndUpdate({courseId},
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            {new:true})

        return res.status(200).json({
            success:true,
            message:"Rating And review added successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in adding rating and review"
        })
        
    }
}

//getAveragerating 

exports.getAverageRating = async (req,res)=>{
    try {
        const {courseId} = req.body;
        // const course = await Course.findById({courseId});
        // if(!course){
        //     return res.status(404).json({
        //         success:false,
        //         message:`No course found with id ${courseId}`
        //     })
        // }

        const rating = await RatingAndReviews.aggregate([
            {
                $match: {course: mongoose.Types.ObjectId(courseId)}
            },
            {
                $group: {
                    _id: null,
                    averagerating: {$avg: "rating"}
                }
            }
        ])

        if(rating.length()>0){
            return res.status(200).json({
                success:true,
                message:"Average Rating is fetched successfully",
                averagerating: rating[0].averagerating,
            })
        }

        return res.status(200).json({
            success:true,
            message:"No ratings are given till now",
            averagerating:0, 
        })


    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in finding average rating"
        })
    }
}


exports.getAllRatingAndReviews = async (req,res)=> {
    try {
        const allRating = await RatingAndReviews.find({})
        .sort({rating: "desc"})
        .populate({
            path:"user",
            select:"firstName lastName image email"
        })
        .populate({
            path:"course",
            select:"courseName"
        })
        .exec();

        return res.status(200).json({
            success:true,
            message:"All ratings fetched successfully",
            data:allRating,
        })


    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}