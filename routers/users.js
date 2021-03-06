const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

//get all users 
router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash')

    
    if(!userList) {
        res.status(500).json({success: false})
    }
    res.send(userList);
})

//get user by id
router.get(`/:id`, async (req, res)=> {
    const user = await User.findById(req.params.id).select('-passwordHash')

    if(!user)
    res.status(500).json({message: "No user Found"})

    res.status(200).send(user);
})

//post new user
router.post(`/`, async(req, res) => {
    let user = new User({

        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,     
        addrress: req.body.addrress,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })

    user = await user.save();

    if(!user)
    return res.status.apply(400).send("The user cannot be created!")

    res.send(user);
})

// user login
router.post('/login' , async (req, res) => {
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.secret
    if(!user) {
        return res.status(400).send('User not found');
    } 

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {

        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn: '1d'}
        )
        res.status(200).send({user: user.email, token: token});
    }
    else {
        res.status(500).send('Wrong password')
    }    
}) 

//get amount of users
router.get(`/get/count`, async (req, res) => {

    const userCount = await User.countDocuments((count) => count)
    if (!userCount) {
        res.status(400).json({ success: false , message: "No Users not found!!" })
    }
    res.send({
        userCount: userCount
    })

})

//delete users
router.delete(`/:id`, (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({ success: true, message: 'user successfully deleted!!!' })
        } else {
            return res.status(404).json({ success: false, message: 'user not found!!!' })
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err })
    })
})

//update user from id
router.put(`/:id`, async (req, res) => {

    const userExist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password){
        newPassword = bcrypt.hashSync(req.body.password, 10)
    }else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        passwordHash: newPassword,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,     
        addrress: req.body.addrress,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
        },
        {new: true}
    )

    if(!user)
    return res.status(400).send('User cannot be updated!')

    res.send(user)
})

module.exports = router;

