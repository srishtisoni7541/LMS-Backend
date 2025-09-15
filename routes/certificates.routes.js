const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { issueCertificate, getCertificates, getCertificatesByStudent, getCertificateById, deleteCertificate } = require('../controllers/certificate.controllers');
const upload = require('../config/multer');

const router = express.Router();

router.post(
  "/issue",
  authMiddleware("admin"),
  upload.single("certificate"), 
 issueCertificate
);
router.get('/get-all-certificates',authMiddleware('instructor','admin'),getCertificates);
router.get('/student/:studentId',authMiddleware('instructor','admin','student'),getCertificatesByStudent);
router.get('/:certificateId',authMiddleware('instructor','admin','student'),getCertificateById);
router.get('/delete/:certificateId',authMiddleware('instructor','admin'),deleteCertificate);


module.exports=router;