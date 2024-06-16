const cloudinary = require("cloudinary").v2;


const imageUploadToCloudinary = async (file,folder,quality,height)=>{
        const options = {folder};
        if(height){
            options.height= height;
        }
        if(quality){
            options.quality= quality;
        }
        options.resource_type="auto";
        console.log("temp path", file.tempFilePath);
        return await cloudinary.uploader.upload(file.tempFilePath, options);
}

module.exports = imageUploadToCloudinary;