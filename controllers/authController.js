const { signupValidator, loginValidator, acceptCodeValidator, changePasswordValidator } = require("../middlewares/validator");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const User = require('../models/usersModel');
const jwt=require('jsonwebtoken');
const transport = require("../middlewares/sendMail");
require('dotenv').config()
exports.signup=async(req,res)=>{
   const {email,password}=req.body;
   try {
     const {error,value}=signupValidator.validate({email,password});
     if(error){
        return res.status(401).json({success:false,message:error.details[0].message});
     }
     const existingUser=await User.findOne({email});
     if(existingUser){
        return res.status(401).json({success:false,message:"User Already Exists"});
     }

     const hashPassword=await doHash(password,10);
     const newUser=new User({
      email:email,
      password:hashPassword
     });
     const result=await newUser.save();
     result.password=undefined; 
     res.status(201).json({
      msg:"Your account has been created!!",
      success:true,
      result,
     })
   } catch (error) {
    console.log("Calling signup Catch Block",error);
   }
}

exports.login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const { error, value } = loginValidator.validate({ email, password });
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		const existingUser = await User.findOne({ email }).select('+password');
		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}
		const result = await doHashValidation(password, existingUser.password);
		if (!result) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials!' });
		}
		const token = jwt.sign(
			{
				userId: existingUser._id,
				email: existingUser.email,
				verified: existingUser.verified,
			},
			process.env.TOKEN_SECRET,
			{
				expiresIn: '8h',
			}
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000),
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})
			.json({
				success: true,
				token,
				message: 'logged in successfully',
			});
	} catch (error) {
		console.log(error);
	}
};

exports.logout=(req,res)=>{
    res.clearCookie('Authorization')
	   .status(200)
	   .json({success:true,message:"Logged Out Successfully!!"})
}

exports.sendVerificationCode=async(req,res)=>{
    const {email}=req.body;
	try {
		const existingUser=await User.findOne({email});
		if(!existingUser){
			res.status(401).json({success:false,message:"User does Not Exists!!"});
		}
		if(existingUser.verified){
			res.status(400).json({success:false,message:"You are already Verified!!"});
		}
		const codeValue=Math.floor(Math.random()*1000000).toString();

		//  Sending Verification Code to Email

		const info=await transport.sendMail({
			from:process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to:existingUser.email,
			subject:"Verification Code",
			html:'<h1>'+ codeValue + '</h1>'
		});

		if(info.accepted[0]===existingUser.email){
            const hashedCodeValue=hmacProcess(codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);
			existingUser.verificationCode=hashedCodeValue;
			existingUser.verificationCodeValidation=Date.now();
			await existingUser.save();
			return res.status(200).json({success:true,message:"Code Sent Successfully!!"});
		}
		 res.status(401).json({success:true,message:"Code Not Sent!!"});
	} catch (error) {
		console.log("Calling sendVerification Code Block ",error);
	}
};

exports.verifyVerifcationCode=async(req,res)=>{
	const {email,providedCode}=req.body;
	try{
       const {error,value}=acceptCodeValidator.validate({email,providedCode});
	   if(error){
		res.status(401).json({success:false,message:error.details[0].message});
	   }
	   const codeValue=providedCode.toString();
	   const existingUser=await User.findOne({email}).select("+verificationCode +verificationCodeValidation");
	   if(!existingUser){
			res.status(401).json({success:false,message:"User does Not Exists!!"});
		}
	   if(existingUser.verified){
		return res.status(401).json({success:false,message:"User is Already Verified!!"});
	   }
	   if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
		return res.status(401).json({success:false, message:"Something is wrong with verification Code"});
	   }
	   if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
			return res
				.status(400)
				.json({ success: false, message: 'code has been expired!' });
		}
       const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_VERIFICATION_CODE_SECRET
		);

		if (hashedCodeValue === existingUser.verificationCode) {
			existingUser.verified = true;
			existingUser.verificationCode = undefined;
			existingUser.verificationCodeValidation = undefined;
			await existingUser.save();
			return res
				.status(200)
				.json({ success: true, message: 'your account has been verified!' });
		}
		return res
			.status(400)
			.json({ success: false, message: 'unexpected occured!!' });
	}catch(error){

	}
}

exports.changePassword=async(req,res)=>{
const {userId,verified}=req.user;
const {oldPassword,newPassword}=req.body;
try{
    const {error,value}=changePasswordValidator.validate({oldPassword,newPassword});
	if(error){
		return res.status(401).json({success:false,message:"Invalid Password!!"});
	}
	if(!verified){
		return res.status(401).json({success:false,message:"You are Not Verified!!"});
	}
	const existingUser=await User.findOne({_id:userId}).select('+password');
	if(!existingUser){
		return res.status(401).json({success:false,message:"User Does Not Exists!!"});
	}

	const result = await doHashValidation(oldPassword,existingUser.password);
	if(!result){
        return res.status(401).json({success:false,message:"Invalid credentials!!"})
	}
	const hashedPassword=await doHash(newPassword,10);
	existingUser.password=hashedPassword;
	await existingUser.save();
	return res.status(200).json({success:true,json:"Password Changed Successfully!!"})
}catch(error){
	console.log(error);
}
};

exports.sendForgotPasswordCode = async (req, res) => {
	const {email} = req.body;
	try {
		const existingUser = await User.findOne({email});
		if (!existingUser) {
			return res
				.status(404)
				.json({ success: false, message: 'User does not exists!' });
		}

		const codeValue = Math.floor(Math.random() * 1000000).toString();
		let info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: existingUser.email,
			subject: 'Forgot password code',
			html: '<h1>' + codeValue + '</h1>',
		});

		if (info.accepted[0] === existingUser.email) {
			const hashedCodeValue = hmacProcess(
				codeValue,
				process.env.HMAC_VERIFICATION_CODE_SECRET
			);
			existingUser.forgotPasswordCode = hashedCodeValue;
			existingUser.forgotPasswordCodeValidation = Date.now();
			await existingUser.save();
			return res.status(200).json({ success: true, message: 'Code sent!' });
		}
		res.status(400).json({ success: false, message: 'Code sent failed!' });
	} catch (error) {
		console.log(error);
	}
};

exports.verifyForgotPasswordCode = async (req, res) => {
	const { email, providedCode, newPassword } = req.body;
	try {
		const { error, value } = acceptFPCodeValidator.validate({
			email,
			providedCode,
			newPassword,
		});
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		const codeValue = providedCode.toString();
		const existingUser = await User.findOne({ email }).select(
			'+forgotPasswordCode +forgotPasswordCodeValidation'
		);

		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}

		if (
			!existingUser.forgotPasswordCode ||
			!existingUser.forgotPasswordCodeValidation
		) {
			return res
				.status(400)
				.json({ success: false, message: 'something is wrong with the code!' });
		}

		if (
			Date.now() - existingUser.forgotPasswordCodeValidation >
			5 * 60 * 1000
		) {
			return res
				.status(400)
				.json({ success: false, message: 'code has been expired!' });
		}

		const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_VERIFICATION_CODE_SECRET
		);

		if (hashedCodeValue === existingUser.forgotPasswordCode) {
			const hashedPassword = await doHash(newPassword, 12);
			existingUser.password = hashedPassword;
			existingUser.forgotPasswordCode = undefined;
			existingUser.forgotPasswordCodeValidation = undefined;
			await existingUser.save();
			return res
				.status(200)
				.json({ success: true, message: 'Password updated!!' });
		}
		return res
			.status(400)
			.json({ success: false, message: 'unexpected occured!!' });
	} catch (error) {
		console.log(error);
	}
};