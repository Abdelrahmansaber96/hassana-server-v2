const express = require('express');
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addAnimal,
  getMyAnimals,
  updateAnimal,
  deleteAnimal,
  getVaccinationsForAnimal,
  bookVaccination,
  getMyBookings,
  cancelBooking,
  createCustomerConsultation,
  getCustomerConsultations
} = require('../controllers/customerApiController');
const { 
  getCustomerNotifications, 
  getCustomerUnreadCount, 
  markAsReadForCustomer 
} = require('../controllers/notificationController');
const { validate } = require('../validators');
const {
  animalValidator,
  updateAnimalValidator,
  customerBookingValidator
} = require('../validators');

const router = express.Router();

// Public routes - No authentication required
// Authentication
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Notifications routes (support both formats)
// Format 1: /notifications?customerId=xxx
router.get('/notifications', getCustomerNotifications);
router.get('/notifications/unread-count', getCustomerUnreadCount);
router.patch('/notifications/:id/read', markAsReadForCustomer);

// Profile management
router.get('/profile/:customerId', getCustomerProfile);
router.put('/profile/:customerId', updateCustomerProfile);

// Device token management (for Firebase Push Notifications)
router.post('/:customerId/device-token', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device token is required' 
      });
    }

    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // إضافة token إذا لم يكن موجود
    if (!customer.deviceTokens.includes(deviceToken)) {
      customer.deviceTokens.push(deviceToken);
      await customer.save();
    }

    res.json({ 
      success: true, 
      message: 'Device token registered successfully',
      data: { deviceTokens: customer.deviceTokens }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Remove device token (عند logout)
router.delete('/:customerId/device-token', async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device token is required' 
      });
    }

    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // إزالة token
    customer.deviceTokens = customer.deviceTokens.filter(t => t !== deviceToken);
    await customer.save();

    res.json({ 
      success: true, 
      message: 'Device token removed successfully',
      data: { deviceTokens: customer.deviceTokens }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Animal management routes (using customerId)
router.post('/:customerId/animals', validate(animalValidator), addAnimal);
router.get('/:customerId/animals', getMyAnimals);
router.put('/:customerId/animals/:animalId', validate(updateAnimalValidator), updateAnimal);
router.delete('/:customerId/animals/:animalId', deleteAnimal);

// Vaccination routes
router.get('/:customerId/animals/:animalId/vaccinations', getVaccinationsForAnimal);

// Booking routes
router.post('/:customerId/bookings', validate(customerBookingValidator), bookVaccination);
router.get('/:customerId/bookings', getMyBookings);
router.put('/:customerId/bookings/:bookingId/cancel', cancelBooking);

// Consultation routes (No authentication required)
router.post('/consultations', createCustomerConsultation);
router.get('/consultations', getCustomerConsultations);

// Format 2: /:customerId/notifications (alternative format)
router.get('/:customerId/notifications', getCustomerNotifications);
router.get('/:customerId/notifications/unread-count', getCustomerUnreadCount);
router.patch('/:customerId/notifications/:id/read', markAsReadForCustomer);

module.exports = router;