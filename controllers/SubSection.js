const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const imageUploadToCloudinary = require("../utils/imageUploader");
const Course = require("../models/Course");
require("dotenv").config();



exports.createSubSection = async (req,res)=>{
    try {
        const {sectionId, title, description,courseId} = req.body;
        const video = req.files.videoFile;
    if(!title || !description || !sectionId || !video){
        return res.status(400).json({
            success:false,
            message:"All fields required"
        })
    }
    
    const videoUpload = await imageUploadToCloudinary(video, process.env.FOLDER_NAME);

    

    const SubSectionDetails = await SubSection.create({
        title: title,
        timeDuration: `${videoUpload.duration}`,
        description: description,
        videoUrl: videoUpload.secure_url,
      })
  
      // Update the corresponding section with the newly created sub-section
      const updatedSection = await Section.findByIdAndUpdate(
        { _id: sectionId },
        { $push: { subSection: SubSectionDetails._id } },
        { new: true }
      ).populate("subSection")

        return res.status(200).json({
            success:true,
            message:"SubSection created successfully",
            data: updatedSection
        })

    } catch (error) {

        return res.status(500).json({
            success:false,
            message:"Error occured in creating subsection"
        })
        
    }
    
}

//update SubSection

exports.updateSubSection = async (req,res)=>{
    try {
        const {title, description, subSectionId, sectionId} = req.body;
        const subSection = await SubSection.findById(subSectionId)
  
        if (!subSection) {
          return res.status(404).json({
            success: false,
            message: "SubSection not found",
          })
        }
    
        if (title !== undefined) {
          subSection.title = title
        }
    
        if (description !== undefined) {
          subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
          const video = req.files.video
          const uploadDetails = await imageUploadToCloudinary(
            video,
            process.env.FOLDER_NAME
          )
          subSection.videoUrl = uploadDetails.secure_url
          subSection.timeDuration = `${uploadDetails.duration}`
        }
    
        await subSection.save()
    
        const updatedSection = await Section.findById(sectionId).populate("subSection")
  
  
        return res.json({
          success: true,
          data:updatedSection,
          message: "Section updated successfully",
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            
            success:false,
            message:"Error occured in updating subsection"
        })
    }
}

//deleting subsection

exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }
  
      // find updated section and return it
      const updatedSection = await Section.findById(sectionId).populate(
        "subSection"
      )
  
      return res.json({
        success: true,
        message: "SubSection deleted successfully",
        data: updatedSection,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }