const Course = require("../models/Course")
const Category =require("../models/Category")
const User  = require("../models/User")
const SubSection = require("../models/SubSection")
const Section = require("../models/Section");
const courseProgress = require("../models/CourseProgress")
const imageUploadToCloudinary = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config();

exports.createCourse = async (req,res)=>{
    try {
        let {courseName, courseDescription, whatYouWillLearn, price, category, instructions, status } = req.body;
    
        const thumbnail = req.files.thumbnailImage;

        if(!courseName || !courseDescription || !whatYouWillLearn || !price){
            return res.status(401).json({
                success:false,
                message:"All fields are required",
            })
        }
        if (!status || status === undefined) {
            status = "Draft"
          }

        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        // console.log(instructorDetails);
        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:"Instructor not Found",
            })
        }

        const tagDetails = await Category.findById(category);
        if(!tagDetails){
            return res.status(404).json({
                success:false,
                message:"Tag not Found",
            })
        }
       
        const thumb = await imageUploadToCloudinary(thumbnail, process.env.FOLDER_NAME);

        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn,
            tag:tagDetails._id,
            price,
            thumbnail:thumb.secure_url,
            instructions:instructions,
            status,


        })

        await User.findByIdAndUpdate({_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id
                }
            })

        await Category.findByIdAndUpdate({_id:tagDetails._id},
            {
                $push :{
                    course:newCourse._id,
                }

        })

        return res.status(200).json({
            success:true,
            message:"Course added successfully",
            data:newCourse,
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in adding Course"
        })
    }
    
}

exports.getAllCourses = async (req,res)=>{
    try {
        const allCourses = await Course.find({});
            

            console.log(allCourses);

            return res.status(200).json({
                success:true,
                message:"All courses are fetched"
            })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in fetching Courses"
        })
    }
}

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec()

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await imageUploadToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }

exports.getInstructorCourses = async (req,res)=>{
    try {
        const instructorId = req.user.id;

        const instructorCourse = await Course.find({
            instructor: instructorId,
        }).sort({createdAt : -1})

        return res.status(200).json({
            success:true,
            message: "Fecthed All courses Successfully",
            data: instructorCourse
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Error in fetching instructor course",
            error: error.message
        })
        
    }
}

exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }


  exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      let courseProgressCount = await courseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      // console.log("courseProgressCount : ", courseProgressCount)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : []
          
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }