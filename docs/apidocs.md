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
