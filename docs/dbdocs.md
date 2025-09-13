LMS Database Models Documentation

This document describes the Mongoose schemas used in the LMS (Learning Management System) project.

👤 User Model

File: models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
role: {
type: String,
enum: ["student", "instructor", "admin"],
default: "student",
},
refreshToken: { type: String },
resetPasswordToken: { type: String },
resetPasswordExpires: { type: Date },
enrolledCourses: [
{ type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
],
createdAt: { type: Date, default: Date.now },
});

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
if (!this.isModified("password")) return next();
this.password = await bcrypt.hash(this.password, 10);
next();
});

// 🔑 Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

📌 Fields

name → User’s full name (required).

email → Unique email address (required).

password → Hashed password stored in DB (required).

role → Defines user type:

"student" (default)

"instructor"

"admin"

refreshToken → Stores JWT refresh token (for authentication).

resetPasswordToken → Token generated for password reset.

resetPasswordExpires → Expiry time for reset token.

enrolledCourses → Array of references to Enrollment documents.

createdAt → Auto-set timestamp when user is created.

⚙️ Hooks & Methods
pre("save")

Before saving a user, the password is hashed using bcrypt.

If the password field is not modified, it skips hashing.

comparePassword

Compares entered password with the stored hashed password.

Returns true if match, false otherwise.

🔗 Relations

User → Enrollment

A user (student) can have multiple enrollments.

Instructor User → Can be assigned as instructor in Course.

Admin User → Manages platform-wide operations.

🏫 Course Model

File: models/Course.js

const courseSchema = new mongoose.Schema({
title: { type: String, required: true },
slug: { type: String, unique: true }, // SEO-friendly URL
description: String,
instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
price: { type: Number, default: 0 },
thumbnail: String,
category: String,
createdAt: { type: Date, default: Date.now }
});

Fields:

title → Course name.

slug → SEO-friendly unique identifier.

instructor → Refers to User (instructor).

modules → Array of Module references.

price, thumbnail, category → Metadata.

📦 Module Model

File: models/Module.js

const moduleSchema = new mongoose.Schema({
title: { type: String, required: true },
course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
order: { type: Number, default: 0 }
});

Fields:

title → Module name.

course → Refers to Course.

lessons → List of Lesson IDs.

order → Position in course flow.

🎬 Lesson Model

File: models/Lesson.js

const lessonSchema = new mongoose.Schema({
title: { type: String, required: true },
module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
type: { type: String, enum: ["video", "pdf"], required: true },
contentUrl: String,
duration: Number,
order: { type: Number, default: 0 }
});

Fields:

type → "video" or "pdf".

contentUrl → Media/PDF link (Cloudinary, S3 etc.).

duration → In seconds.

📝 Quiz Model

File: models/Quiz.js

const questionSchema = new mongoose.Schema({
questionText: { type: String, required: true },
options: [{ type: String, required: true }],
correctAnswer: { type: Number, required: true } // index of correct option
});

const quizSchema = new mongoose.Schema({
title: { type: String, required: true },
module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
questions: [questionSchema],
timeLimit: Number
});

Fields:

title → Quiz title.

questions → List of MCQs.

correctAnswer → Stores index of correct option.

timeLimit → Optional time limit.

🎯 Progress Model

File: models/Progress.js

const progressSchema = new mongoose.Schema({
student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
watchedDuration: { type: Number, default: 0 }, // seconds watched
completed: { type: Boolean, default: false },
lastAccessed: { type: Date, default: Date.now }
});

Fields:

student → Refers to User.

lesson → Refers to Lesson.

watchedDuration → Track watch time (video).

completed → Lesson completion status.

🎓 Enrollment Model

File: models/Enrollment.js

const enrollmentSchema = new mongoose.Schema({
course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
progress: { type: Number, default: 0 }, // percentage
status: { type: String, enum: ["active", "completed"], default: "active" },
enrolledAt: { type: Date, default: Date.now }
});

Fields:

course → Refers to Course.

student → Refers to User.

progress → % progress in course.

status → "active" or "completed".

🏅 Certificate Model

File: models/Certificate.js

const certificateSchema = new mongoose.Schema({
student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
issuedAt: { type: Date, default: Date.now },
certificateUrl: String
});

Fields:

student → Refers to User.

course → Refers to Course.

certificateUrl → Generated certificate (PDF/Image).

🔗 Relations Overview

Course → Modules → Lessons

Lesson → Progress (per student)

Module → Quiz

Course → Enrollment (per student)

Course + Student → Certificate
