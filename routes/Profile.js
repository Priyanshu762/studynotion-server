const express = require("express");

const router = express.Router();

const {auth} = require("../middlewares/auth")

const {
    deleteAccount,
    getAllUserDetails,
    updateProfile,
    getEnrolledCourses,
    updateDisplayPicture,
    instructorDashboard
} = require("../controllers/Profile");

router.delete("/deleteProfile",auth, deleteAccount);
router.put("/updateProfile",auth, updateProfile);
router.get("/getAllUserDetails",auth,  getAllUserDetails);
router.get("/getEnrolledCourses",auth , getEnrolledCourses);
router.get("/getInstructorDashboardDetails",auth,instructorDashboard);
router.put("/updateDisplayPicture",auth,updateDisplayPicture)

module.exports = router ; 