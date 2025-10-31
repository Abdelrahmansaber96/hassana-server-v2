const express = require('express');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  deactivateCustomer,
  activateCustomer,
  addAnimal,
  updateAnimal,
  deleteAnimal,
  getCustomerStats,
  saveDeviceToken,
  removeDeviceToken
} = require('../controllers/customerController');
const auth = require('../middlewares/auth');
const { authorize, checkActionPermission } = require('../middlewares/authorize');
const { validate } = require('../validators');
const { customerValidator, dashboardCustomerValidator, simpleCustomerValidator, updateCustomerValidator } = require('../validators');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Customer stats
router.get('/stats', checkActionPermission('read', 'customer'), getCustomerStats);

// Customer CRUD
router.route('/')
  .get(checkActionPermission('read', 'customer'), getCustomers)
  .post(checkActionPermission('create', 'customer'), validate(dashboardCustomerValidator), createCustomer);

router.route('/:id')
  .get(checkActionPermission('read', 'customer'), getCustomer)
  .put(checkActionPermission('update', 'customer'), validate(updateCustomerValidator), updateCustomer)
  .delete(authorize('admin'), deleteCustomer);

// Customer status management
router.patch('/:id/deactivate', checkActionPermission('update', 'customer'), deactivateCustomer);
router.patch('/:id/activate', checkActionPermission('update', 'customer'), activateCustomer);

// Animal management
router.post('/:id/animals', checkActionPermission('update', 'customer'), addAnimal);
router.put('/:id/animals/:animalId', checkActionPermission('update', 'customer'), updateAnimal);
router.delete('/:id/animals/:animalId', checkActionPermission('update', 'customer'), deleteAnimal);

// Device token management (for push notifications)
router.post('/device-token/save', saveDeviceToken);
router.post('/device-token/remove', removeDeviceToken);

module.exports = router;