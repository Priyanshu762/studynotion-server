const CourseProgress = require("../models/CourseProgress");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course")
const imageUploadToCloudinary = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config()

exports.updateProfile = async (req, res) => {
	try {
	  const {
		firstName = "",
		lastName = "",
		dateOfBirth = "",
		about = "",
		contactNumber = "",
		gender = "",
	  } = req.body
	  const id = req.user.id
  
	  // Find the profile by id
	  const userDetails = await User.findById(id)
	  const profile = await Profile.findById(userDetails.additionalDetails)
  
	  const user = await User.findByIdAndUpdate(id, {
		firstName,
		lastName,
	  })
	  await user.save()
  
	  // Update the profile fields
	  profile.dateOfBirth = dateOfBirth
	  profile.about = about
	  profile.contactNumber = contactNumber
	  profile.gender = gender
  
	  // Save the updated profile
	  await profile.save()
  
	  // Find the updated user details
	  const updatedUserDetails = await User.findById(id)
		.populate("additionalDetails")
		.exec()
  
	  return res.json({
		success: true,
		message: "Profile updated successfully",
		updatedUserDetails,
	  })
	} catch (error) {
	  console.log(error)
	  return res.status(500).json({
		success: false,
		error: error.message,
	  })
	}
  }
  

exports.deleteAccount = async (req,res) =>{
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});
        await User.findByIdAndDelete({_id:id});
        return res.status(200).json({
            success:true,
            message:"Account deleted successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in deleting Account"
        })
        
    }
};

exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.getEnrolledCourses = async (req, res) => {
	try {
	  const userId = req.user.id;
	  let userDetails = await User.findOne({
		_id: userId,
	  })
		.populate({
		  path: "courses",
		  populate: {
			path: "courseContent",
			populate: {
			  path: "subSection",
			},
		  },
		})
		.exec()

	  userDetails = userDetails.toObject()
	  var SubsectionLength = 0
	  for (var i = 0; i < userDetails.courses.length; i++) {
		let totalDurationInSeconds = 0
		SubsectionLength = 0
		for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
		  totalDurationInSeconds += userDetails.courses[i].courseContent[
			j
		  ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
		  userDetails.courses[i].totalDuration = convertSecondsToDuration(
			totalDurationInSeconds
		  )
		  SubsectionLength +=
			userDetails.courses[i].courseContent[j].subSection.length
		}
		let courseProgressCount = await CourseProgress.findOne({
		  courseID: userDetails.courses[i]._id,
		  userId: userId,
		})
		courseProgressCount = courseProgressCount?.completedVideos.length
		if (SubsectionLength === 0) {
		  userDetails.courses[i].progressPercentage = 100
		} else {
		  // To make it up to 2 decimal point
		  const multiplier = Math.pow(10, 2)
		  userDetails.courses[i].progressPercentage =
			Math.round(
			  (courseProgressCount / SubsectionLength) * 100 * multiplier
			) / multiplier
		}
	  }
  
	  if (!userDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find user with id: ${userDetails}`,
		})
	  }
	  return res.status(200).json({
		success: true,
		data: userDetails.courses,
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
  }

exports.updateDisplayPicture = async (req, res) => {
	try {

	const id = req.user.id;
  
    console.log("User id",id)
	const user = await User.findById(id);
	if (!user) {
		return res.status(404).json({
            success: false,
            message: "User not found",
        });
	}
	const image = req.files.pfp;
	if (!image) {
		return res.status(404).json({
            success: false,
            message: "Image not found",
        });
    }
	const uploadDetails = await imageUploadToCloudinary(
		image,
		process.env.FOLDER_NAME
	);
	console.log(uploadDetails);

	const updatedImage = await User.findByIdAndUpdate({_id:id},{image:uploadDetails.secure_url},{ new: true });

    res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: updatedImage,
    });
		
	} catch (error) { 
        console.log(error)
		return res.status(500).json({
            success: false,
            message: error.message,
        });
		
	}



}

exports.instructorDashboard = async (req,res) => {
	try {

		const courseDetails = await Course.find({instructor : req.user.id})
		const courseData = courseDetails.map((course)=>{
			const totalStudentEnrolled = course.studentEnrolled.length
			const totalAmountGenerated = totalStudentEnrolled * course.price

			const courseDatawithStats = {
				_id : course._id,
				courseName : course.courseName,
				courseDescription: course.courseDescription,
				totalStudentEnrolled,
				totalAmountGenerated,
			}

			return courseDatawithStats
		})

		res.status(200).json({
			success:true,
			courses : courseData
		})

		
	} catch (error) {
		console.log(error)
		res.status(500).json({
			success:false,
			message:"Internal Server Error"
		})
	}
}