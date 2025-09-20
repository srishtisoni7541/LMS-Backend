const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { addModule, getModules, getModuleById, updateModule } = require('../controllers/admin/module.controllers');
const router = express.Router();


router.post('/create-module',authMiddleware('admin'),addModule);
router.get('/all-modules',authMiddleware('admin','instructor','student'),getModules);
router.get('/module/get-module-by-id/:id',authMiddleware('admin','instructor','student'),getModuleById);
router.put('/update-module/:id',authMiddleware('admin','instructor'),updateModule)

module.exports = router;