const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").userModel;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
    console.log("A request is coming into auth.js");
    next();
});

router.get("/testAPI", (req, res) => {
    const msgObj = {
        message: "Test API is working.",
    };
    return res.json(msgObj);
});

router.post("/register", async (req, res) => {
    // check the validation of registration data
    console.log("Register!!!");
    const {error} = registerValidation(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // check if the user already exists
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) {
        return res.status(400).send("Email has already been registered.");
    }

    // register the user
    const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        role: req.body.role
    });
    try {
        const savedUser = await newUser.save();
        res.status(200).send({
            msg: "Success",
            savedObject: savedUser,
        });
    } catch (e) {
        res.status(400).send("User not saved.");
    }
});

router.post("/login", async (req, res) => {
    try {
        // validate login data
        console.log("Login!!!");
        const { error } = loginValidation(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        // find the user by email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).send("User not found.");
        }

        // compare password in a Promise
        const isMatch = await new Promise((resolve, reject) => {
            user.comparePassword(req.body.password, (err, isMatch) => {
                if (err) return reject(err);
                resolve(isMatch);
            });
        });

        if (isMatch) {
            const tokenObject = { _id: user.id, email: user.email };
            const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
            res.send({ success: true, token: "JWT " + token, user });
        } else {
            res.status(401).send("Wrong password.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});



module.exports = router;