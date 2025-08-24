const express=require('express');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cookieParser=require('cookie-parser');
const cors=require('cors');
const app=express();
const mongo_uri="mongodb://localhost:27017/";
mongoose.connect(mongo_uri)
.then(()=>{
    console.log("Mongodb Connected Successfully!!");
}).catch((error)=>{
    console.log(error);
})
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.get('/',(req,res)=>{
    res.send({status:200,msg:"I m OK"});
})

try{
app.use('/api/routes',require('./routers/authRouter.js'));
app.use('api/post',require('./routers/postsRouter.js'));
}catch(error){
    console.log(error);
}


const port=5000;
app.listen(port,()=>{
    console.log(`Server is listening at ${port}`);
});