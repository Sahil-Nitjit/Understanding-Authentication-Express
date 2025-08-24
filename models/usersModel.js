const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Please Enter Email"],
        unique:[true,"This Email Already Exists"],
        minlength:[5,"Length of Email atleast 5 characters"],
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true,"Please Enter Password"],
        minlength:[5,"Length of Password is atleast 5 "],
        trim:true,
        select:false
    },
    verified:{
        type:Boolean,
        default:false
    },
    verificationCode:{
        type:String,
        select:false
    },
    verificationCodeValidation:{
        type:Number,
        select:false
    },
    forgotPasswordCode:{
        type:String,
        select:false
    },
    forgotPasswordCodeValidation:{
        type:Number,
        select:false
    }
},{
    timestamps:true
});

module.exports= mongoose.model("User",userSchema);