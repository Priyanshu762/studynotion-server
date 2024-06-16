const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>{console.log("Succesfully Connected to Database")})
    .catch((err)=>{
    console.log("Error in cnnecting to database")
    console.error(err);
    process.exit(1);
    })
}