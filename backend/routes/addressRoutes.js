const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault,
} = require('../controllers/addressController');

router.use(authenticate);

router.get('/', getMyAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefault);

module.exports = router;
