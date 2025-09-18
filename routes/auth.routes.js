const express =require('express');
const { register, login, logout, editProfile, deleteAccount, forgotPassword, resetPassword, getProfile, getAllUsers } = require('../controllers/auth.controllers');
const authMiddleware = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('../validations/user.validations');
const validate = require('../middlewares/validate');
const router = express.Router();


router.post('/register', validate(registerSchema),register);
router.post('/login', validate(loginSchema),login);
router.get('/profile',authMiddleware("student","admin","instructor"),getProfile)
router.post('/logout',authMiddleware("student","admin","instructor"),logout);
router.put('/edit-profile',authMiddleware("student","admin","instructor"),editProfile);
router.delete('/delete-account',authMiddleware("student","admin","instructor"),deleteAccount);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password/:token',resetPassword);
router.get('/all-users',authMiddleware('admin','instructor'),getAllUsers)
module.exports=router;