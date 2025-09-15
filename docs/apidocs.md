LMS API Documentation
Base URL
http://localhost:3000/api

Authentication Routes
1. Register User

Method: POST

Endpoint: /auth/register

Description: Register a new user (student/instructor/admin).

Headers: Content-Type: application/json

Body:

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "role": "student"
}


Response (201):

{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "64abc1234567890abcdef",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}

2. Login

Method: POST

Endpoint: /auth/login

Body:

{
  "email": "john@example.com",
  "password": "123456"
}


Response (200):

{
  "success": true,
  "message": "Login successful",
  "token": "<jwt-token>",
  "data": {
    "_id": "64abc1234567890abcdef",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}

3. Get Profile

Method: GET

Endpoint: /auth/profile

Headers: Authorization: Bearer <token>

Response (200):

{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "64abc1234567890abcdef",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}

4. Logout

Method: POST

Endpoint: /auth/logout

Headers: Authorization: Bearer <token>

Response (200):

{
  "success": true,
  "message": "Logged out successfully"
}

5. Edit Profile

Method: PUT

Endpoint: /auth/edit-profile

Headers: Authorization: Bearer <token>

Body:

{
  "name": "John Updated",
  "email": "johnupdated@example.com"
}


Response (200):

{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "64abc1234567890abcdef",
    "name": "John Updated",
    "email": "johnupdated@example.com",
    "role": "student"
  }
}

6. Delete Account

Method: DELETE

Endpoint: /auth/delete-account

Headers: Authorization: Bearer <token>

Response (200):

{
  "success": true,
  "message": "Account deleted successfully"
}

7. Forgot Password

Method: POST

Endpoint: /auth/forgot-password

Body:

{
  "email": "john@example.com"
}


Response (200):

{
  "success": true,
  "message": "Password reset email sent"
}

8. Reset Password

Method: POST

Endpoint: /auth/reset-password/:token

Body:

{
  "password": "newpassword123"
}


Response (200):

{
  "success": true,
  "message": "Password reset successfully"
}

Course Routes
1. Create Course

Method: POST

Endpoint: /courses/create-course

Headers: Authorization: Bearer <admin-token>

Body:

{
  "title": "React Basics",
  "slug": "react-basics",
  "description": "Learn React from scratch",
  "instructor": "64abc1234567890abcdef",
  "price": 500,
  "thumbnail": "https://example.com/image.png",
  "category": "Frontend",
  "modules": []
}


Response (201):

{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "64abc1234567890abcdef",
    "title": "React Basics",
    "slug": "react-basics"
  }
}

2. Get All Courses

Method: GET

Endpoint: /courses/get-all-courses

Headers: Authorization: Bearer <token>

3. Get Course by ID

Method: GET

Endpoint: /courses/get-course/:id

Headers: Authorization: Bearer <token>

4. Update Course

Method: PUT

Endpoint: /courses/update-course/:id

Headers: Authorization: Bearer <admin-token>

Body Example:

{
  "price": 600
}

5. Delete Course

Method: DELETE

Endpoint: /courses/delete-course/:id

Headers: Authorization: Bearer <admin-token>

Instructor Routes

Make Instructor: POST /instructor/make-instructor/:id

Remove Instructor: POST /instructor/remove-instructor/:userId

Get All Instructors: GET /instructor/all-instructors

Headers: Authorization: Bearer <admin-token>

Module Routes

Add Module: POST /modules/create-module

Get All Modules: GET /modules/all-modules

Get Module by ID: GET /modules/module/:id

Headers: Authorization: Bearer <token>

Add Module Body Example:

{
  "title": "React Components",
  "courseId": "64abc1234567890abcdef"
}

Lesson Routes
Create Lesson (Video / PDF)

Method: POST

Endpoint: /lesson/create

Headers: Authorization: Bearer <admin-token>

Form Data Fields:

title: "React Intro"
module: "<moduleId>"
type: "video" or "pdf"
order: 1
duration: 300
file: <upload .mp4/.mkv/.pdf>


Response:

{
  "success": true,
  "message": "Lesson created successfully",
  "data": {
    "_id": "64abc1234567890abcdef",
    "title": "React Intro",
    "type": "video",
    "contentUrl": "https://res.cloudinary.com/...",
    "duration": 300
  }
}



🔹 Quiz Routes (/api/quiz)
1. Create Quiz

Endpoint: POST /api/quiz/create-quiz

Access: instructor only

Body Example:

{
  "title": "JavaScript Basics Quiz",
  "module": "64f123abc987def456789012",
  "timeLimit": 20,
  "questions": [
    {
      "questionText": "What is closure in JavaScript?",
      "options": [
        "A function inside another function",
        "A variable declaration",
        "A block scope",
        "None of the above"
      ],
      "correctAnswer": "A function inside another function"
    }
  ]
}


Response (201):

{
  "success": true,
  "message": "Quiz created successfully",
  "data": { ...quizObject }
}

2. Get All Quizzes

Endpoint: GET /api/quiz/get-all-quizzes

Access: admin, instructor, student

Response (200):

{
  "success": true,
  "message": "Quizzes fetched successfully",
  "data": [
    {
      "_id": "65012345abc123",
      "title": "JS Basics",
      "timeLimit": 20,
      "module": {
        "_id": "64f123abc987def456789012",
        "name": "JavaScript"
      },
      "questions": [...],
      "totalQuestions": 10
    }
  ]
}

3. Get Quiz by ID

Endpoint: GET /api/quiz/:quizId

Access: admin, instructor, student

Response (200):

{
  "success": true,
  "message": "Quiz fetched successfully",
  "data": { ...quizObject }
}

4. Update Quiz

Endpoint: PUT /api/quiz/:quizId

Access: admin, instructor

Body Example:

{
  "title": "Updated JS Quiz",
  "timeLimit": 25
}

5. Delete Quiz (Soft Delete)

Endpoint: DELETE /api/quiz/:quizId

Access: instructor

Response (200):

{
  "success": true,
  "message": "Quiz deleted (soft delete) successfully",
  "data": { ...quizObject }
}

🔹 Enrollment Routes (/api/enrollment)
1. Create Enrollment

Endpoint: POST /api/enrollment/enroll

Access: student

Body Example:

{
  "studentId": "64f1234567890abc12345678",
  "courseId": "64f123abc987def456789012"
}

2. Get All Enrollments

Endpoint: GET /api/enrollment/allenrollments

Access: admin, instructor

3. Get Enrollment by ID

Endpoint: GET /api/enrollment/enrollment/:enrollmentId

Access: admin, instructor, student

4. Admin Cancel Enrollment

Endpoint: PUT /api/enrollment/cancel/:enrollmentId

Access: admin

5. Student Request Cancel

Endpoint: PUT /api/enrollment/request-cancel/:enrollmentId

Access: student

6. Admin Handle Refund

Endpoint: POST /api/enrollment/refund/:enrollmentId

Access: admin
