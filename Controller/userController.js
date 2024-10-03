const { models } = require("mongoose")
const bcrypt = require("bcrypt")
const userSchema = require("../model/userModel")
const nodemailer = require("nodemailer")
const categorySchema=require("../model/category")
const ProductsSchema=require("../model/productModel")
const saltRound = 10
require('dotenv').config()




//user login page load
const loadUserLogin = (req, res) => {
    const message = req.query.message
    res.render('user/login', { msg: message })
}



//user login verification
const userLoging = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userSchema.findOne({ email })
        if (!user) return res.redirect('/login?message=user not found')
            if(user.isBlocked) return res.redirect('/login?message=user is blocked')
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.redirect('/login?message=password incorrect')
        req.session.user = true
        res.redirect("/")
    } catch (error) {
        console.log(error);
        res.send("somthing went wrong")

    }

}

//user Signup page 
const loadUserSignup = (req, res) => {
    const message = req.query.message
    res.render('user/signup', { msg: message })
}

//otp render 
const otprender = (req, res) => {
    const message = req.query.message
    res.render("user/otp", { msg: message })
}


// user signup verification and otp 
const userSignupVerify = async (req, res) => {
    try {
        const { email, password } = req.body;


        const user = await userSchema.findOne({ email });
        if (user) {
            return res.redirect("/signup?message=email already exist");
        }


        const genotp = Math.floor(1000 + Math.random() * 9000);

          console.log(genotp);
          
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS
            }
        });


        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP for Signup',
            text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`
        };


        await transporter.sendMail(mailOptions)



        // Store OTP and other data in the session
        req.session.otp = genotp;
        req.session.signupdata = req.body
        req.session.otpExpires = Date.now() + 10 * 60 * 1000;

        console.log(req.session.otp);
        res.redirect("/otp");

    } catch (error) {
        console.error(error);
        res.send("Something went wrong");
    }
}



//resend OTP
const resendOTP = async (req, res) => {
    try {
        const email = req.session.email
        if (!email) return res.status(400).send("email not found in session")

        const genotp = Math.floor(1000 + Math.random() * 9000);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS
            }
        });


        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP for Signup',
            text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`
        };


        await transporter.sendMail(mailOptions)
        console.log("mail sended");




        req.session.otp = genotp
        req.session.email = email
        req.session.signupdata = req.body
        req.session.otpExpires = Date.now() + 10 * 60 * 1000;

        res.redirect("/otp")
    } catch (error) {
        console.log(error);

    }
}


//otp verification
const verifyOTP = async (req, res) => {
    try {
        const { otp5, otp2, otp3, otp4 } = req.body
        const userOTP = otp5 + otp2 + otp3 + otp4
        const sessionOTP = req.session.otp
        if (userOTP === sessionOTP.toString()) {
            const newUser = userSchema(req.session.signupdata)
            newUser.save()
            req.session.user = true
            res.redirect("/")
        } else {
            res.redirect("/otp?message=invalid OTP")
        }
    } catch (error) {
        console.log(error);

    }
}


//home page render

const renderHome = async (req, res) => {
 
   const categories=await categorySchema.find( { isListed: true})
   const products=await ProductsSchema.find({ isListed: true}).limit(12).populate('categoryID')

    if(req.session.user){
        res.render('user/home', {user:true,categories,products});
    }else{
        res.render('user/home', {user:false,categories,products});
    }
    
}



const product_detail = async(req,res)=>{
    const id=req.params.id
    const product=await ProductsSchema.findById(id).populate('categoryID')
    const relatedProducts= await ProductsSchema.find({
        categoryID:product.categoryID,
        _id:{$ne:product._id}
    }).limit(4)
        res.render('user/product-detail',{user:true,product,relatedProducts})
   
}






module.exports = { loadUserLogin, loadUserSignup, userSignupVerify, resendOTP, otprender, verifyOTP, userLoging, renderHome,product_detail }