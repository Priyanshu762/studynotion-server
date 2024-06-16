const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection")
const { default: mongoose } = require("mongoose");


//Create Sections
exports.createSection = async (req,res)=>{
    try {
        const {sectionName, courseId} = req.body;
    if(!sectionName || !courseId){
        return res.status(401).json({
            success:false,
            message:"All fields required"
        })
    }
    const newSection = await Section.create({
        sectionName:sectionName,
    })
    console.log(newSection);
    //update course schema
    const updatedCourse = await Course.findByIdAndUpdate({_id:courseId},
        {
            $push:{
                courseContent:newSection._id,
            }
        },
        {new:true}).populate({
            path:"courseContent",
            populate:{
                path: "subSection",
            },
        }).exec();

        console.log("result", updatedCourse)

        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            data:updatedCourse,

        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success:false,
            message:"Error in creating Section"
        })
        
    }
    
}
//Update Section
exports.updateSection = async (req,res)=>{
    
    try {
        const {sectionName, sectionId, courseId} = req.body;
        if(!sectionId || !sectionName){
            return res.status(401).json({
                success:false,
                message:"All fields are required"
            })
        }
        const section = await Section.findByIdAndUpdate({_id:sectionId},
            {
                sectionName:sectionName,
            },
            {
                new:true
            })

            const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();

            console.log(section);
            return res.status(200).json({
                success:true,
                message:"Section updated successfully",
                updatedCourse
            })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Unable to update Section"
        })
        
    }
}

//deletesection

exports.deleteSection = async (req,res)=>{
    try {
        const {sectionId , courseId} = req.body;
    if(!sectionId){
        return res.status(400).json({
            success:false,
            message:"data required"
        })
    }
    const section = await Section.findById(sectionId);

    
    await Section.findByIdAndDelete({_id:sectionId});
    const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();

    return res.status(200).json({
        success:true,
        message:"Deleted Section Successfully",
        data:updatedCourse,

    })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in deleting Section"
        })
    }
    
}