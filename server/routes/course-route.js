const router = require("express").Router();
const courseValidation = require("../validation").courseValidation;
const Course = require("../models").courseModel;

router.use((req, res, next) => {
    console.log("A request is coming into api...");
    next();
});

router.get("/", (req, res) => {
    Course.find({})
        .populate("instructor", ["username", "email"])
        .then((course) => {
            res.send(course);
        })
        .catch(() => {
            res.status(500).send("Cannot get the courses.");
        });
});

router.get("/instructor/:_instructor_id", (req, res) => {
    let { _instructor_id } = req.params;
    Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .then((data) => {
        res.status(200).send(data);
    })
    .catch(() => {
        res.status(500).send("Cannot get course data.");
    });
});

router.get("/student/:_student_id", (req, res) => {
    let { _student_id } = req.params;
    Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .then((data) => {
        res.status(200).send(data);
    })
    .catch(() => {
        res.status(500).send("Cannot get course data.");
    });
})

router.get("/findbyName/:name", (req, res) => {
    let {name} = req.params;
    Course.find({title: name})
    .populate("instructor", ["username", "email"])
    .then((data) => {
        res.status(200).send(data);
    })
    .catch((err) => {
        res.status(500).send(err);
    });
})

router.get("/:_id", (req,res) => {
    let { _id } = req.params;
    Course.findOne({_id})
        .populate("instructor", ["email"])
        .then((course) => {
            res.send(course);
        })
        .catch((e) => {
            res.send(e);
        });
});

router.post("/", async (req, res) => {
    // validate the inputs before creating a new course
    const { error } = courseValidation(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    let { title, description, price } = req.body;
    if (req.user.isStudent()) {
        return res.status(400).send("Only instructors can post new courses.");
    } 

    let newCourse = new Course({
        id,
        title,
        description,
        price,
        instructor: req.user._id,
        students,
    });

    try {
        await newCourse.save();
        res.status(200).send("New course has been saved.");
    } catch (err) {
        res.status(400).send("Failed to save the course.");
    }
});

router.post("/enroll/:_id", async (req, res) => {
    let { _id } = req.params;
    let { user_id } = req.body;
    try {
        let course = await Course.findOne({ _id });
        course.students.push(user_id);
        await course.save();
        res.send("Enrolled successfully!");
    } catch (err) {
        res.send(err);
    }
});

router.patch("/:_id", async (req, res) => {
    // validate the inputs before creating a new course
    const { error } = courseValidation(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    let { _id } = req.params;
    let course = await Course.findOne({ _id });
    if (!course) {
        res.status(404);
        return res.json({
            success: false,
            message: "Course not found."
        });
    }
    if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
        Course.findOneAndUpdate({_id}, req.body, {
            new: true,
            runValidators: true
        })
            .then(() => {
                res.send("Course updated.");
            })
            .catch(e => {
                res.send({
                    success: false,
                    message: e
                });
            });
    } else {
        res.status(403);
        return res.json({
            success: false,
            message: "Only th instructor of this course or web admin can make modifications."
        });
    }
});

router.delete("/:_id", async (req, res) => {
    let { _id } = req.params;
    let course = await Course.findOne({ _id });
    if (!course) {
        res.status(404);
        return res.json({
            success: false,
            message: "Course not found."
        });
    }

    if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
        Course.deleteOne({_id})
            .then(() => {
                res.send("Course deleted.");
            })
            .catch(e => {
                res.send({
                    success: false,
                    message: e
                });
            });
    } else {
        res.status(403);
        return res.json({
            success: false,
            message: "Only th instructor of this course or web admin can make deletion."
        });
    }
})

module.exports = router;