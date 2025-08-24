const joi=require('joi');

exports.signupValidator=joi.object({
    email:joi.string().min(6).max(50).required().email({
        tlds:{
            allow:['com','net','in']
        }
    }),
    password:joi.string()
    .required()
})

exports.loginValidator=joi.object({
     email:joi.string().min(6).max(50).required().email({
        tlds:{
            allow:['com','net','in']
        }
    }),
    password:joi.string()
    .required()
})

exports.acceptCodeValidator = joi.object({
	email: joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net','in'] },
		}),
	providedCode: joi.number().required(),
});

exports.changePasswordValidator=joi.object({
    oldPassword: joi.string()
                    .required(),
    newPassword: joi.string()
                    .required()
});

exports.acceptFPCodeValidator = joi.object({
	email: joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com','net','in'] },
		}),
	providedCode: joi.number().required(),
	newPassword: joi.string()
		.required()
		
});