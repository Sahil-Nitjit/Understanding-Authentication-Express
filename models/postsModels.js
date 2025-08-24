const mongoose=require('mongoose');
const postSchema=new mongoose.Schema({
   title:{
      type:String,
      required:[true,"title is Required!"],
      trim:true
   },
   description:{
      type:String,
      required:[true,"Description is Required!"]
   },
   userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
      required:true
   }
},{
    timestamps:true
});
module.exports=mongoose.model("Post",postSchema);