// const express = require('express');
// const router = express.Router();
// const Admin = require('../Models/admin');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');


// router.post('/login', async (req, res) => {
//     const { username, password } = req.body;

//     const admin = await admin.findone({ username});

//     if(!admin){
//         return res.status(400).json({ message: 'Admin not found' });
//     }

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//         // return res.status(400).json({ message: 'Invalid password' });
//     }


//     const token = jwt.sign({id: admin._id, role:'admin'}, process.env.JWT_SECRET);
//     res.json({token});
// });

// module.exports = router;