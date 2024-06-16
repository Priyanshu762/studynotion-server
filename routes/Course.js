const express = require("express");

const router = express.Router();

const {
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/Section");

const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require("../controllers/SubSection");

const { 
    createCourse,
    getAllCourses,
    getCourseDetails,
    editCourse,
    getInstructorCourses,
    deleteCourse,
    getFullCourseDetails,
} = require("../controllers/Course")

const {
    createCategory,
    getAllCategory,
    categoryPageDetails,
} = require("../controllers/Category");

const {
    createRating,
    getAverageRating,
    getAllRatingAndReviews,
} = require("../controllers/RatingAndReview");



const {auth, isStudent, isAdmin, isInstructor} = require("../middlewares/auth");
const { updateCourseProgress } = require("../controllers/courseProgress");


router.post("/createCourse",auth, isInstructor, createCourse);
router.post("/editCourse",auth, isInstructor, editCourse);
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
router.delete("/deleteCourse",auth, isInstructor, deleteCourse);
router.get("/getInstructorCourses",auth, isInstructor, getInstructorCourses);
router.post("/createSection", auth, isInstructor, createSection);
router.post("/createSubSection", auth ,isInstructor, createSubSection);
router.post("/updateSection", auth, isInstructor, updateSection);
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
router.post("/deleteSection", auth, isInstructor, deleteSection);
router.post("/deleteSubSection", auth ,isInstructor, deleteSubSection);
router.get("/getAllCourse", getAllCourses);
router.post("/getCourseDetails", getCourseDetails);
router.post("/createRating", auth , isStudent, createRating);
router.get("/getAverageRating", getAverageRating);
router.get("/getAllRating", getAllRatingAndReviews);
router.post("/createCategory",createCategory)
router.get("/getAllCategory", getAllCategory)
router.post("/getCategoryPageDetails",categoryPageDetails);
router.post("/updateCourseProgress",auth,isStudent,updateCourseProgress);

module.exports = router;
