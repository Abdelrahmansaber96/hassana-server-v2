﻿const Customer = require('../models/customer');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../utils/AppError');
const { sendSuccess, sendError, sendNotFound } = require('../utils/helpers');

const getCustomers = asyncHandler(async (req, res) => {
  let customers;
  
  // If user is a doctor, get only customers who have bookings in their branch
  if (req.user.role === 'doctor' && req.user.branch) {
    // Get all bookings in the doctor's branch
    const bookingsInBranch = await Booking.find({ branch: req.user.branch }).distinct('customer');
    
    // Get customers who have bookings in this branch
    customers = await Customer.find({
      _id: { $in: bookingsInBranch }
    });
  } else {
    // Admin and other roles see all customers
    customers = await Customer.find();
  }
  
  sendSuccess(res, customers, 'Customers fetched successfully');
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  sendSuccess(res, customer, 'Customer details fetched successfully');
});

const createCustomer = asyncHandler(async (req, res) => {
  // التحقق من عدم وجود رقم الهاتف مسبقاً
  const existingCustomer = await Customer.findOne({ phone: req.body.phone });
  if (existingCustomer) {
    return sendError(res, 'رقم الهاتف موجود مسبقاً. الرجاء استخدام رقم آخر', 400);
  }
  
  const customer = await Customer.create(req.body);
  sendSuccess(res, customer, 'Customer created successfully', 201);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  sendSuccess(res, customer, 'Customer updated successfully');
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  sendSuccess(res, null, 'Customer deleted successfully');
});

const deactivateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  sendSuccess(res, customer, 'Customer deactivated successfully');
});

const activateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  sendSuccess(res, customer, 'Customer activated successfully');
});

const addAnimal = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  customer.animals.push(req.body);
  await customer.save();
  sendSuccess(res, customer, 'Animal added successfully');
});

const updateAnimal = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  const animal = customer.animals.id(req.params.animalId);
  if (!animal) {
    return sendNotFound(res, 'Animal');
  }
  Object.assign(animal, req.body);
  await customer.save();
  sendSuccess(res, customer, 'Animal updated successfully');
});

const deleteAnimal = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }
  customer.animals.id(req.params.animalId).remove();
  await customer.save();
  sendSuccess(res, customer, 'Animal deleted successfully');
});

const getCustomerStats = asyncHandler(async (req, res) => {
  const totalCustomers = await Customer.countDocuments();
  const activeCustomers = await Customer.countDocuments({ isActive: true });
  sendSuccess(res, { totalCustomers, activeCustomers }, 'Customer statistics fetched successfully');
});

const saveDeviceToken = asyncHandler(async (req, res) => {
  const { customerId, deviceToken } = req.body;

  if (!customerId || !deviceToken) {
    return sendError(res, 'Customer ID and device token are required', 400);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return sendNotFound(res, 'Customer');
  }

  // Add device token if not already exists
  if (!customer.deviceTokens.includes(deviceToken)) {
    customer.deviceTokens.push(deviceToken);
    await customer.save();
  }

  sendSuccess(res, { 
    customerId: customer._id,
    deviceTokenCount: customer.deviceTokens.length,
    message: 'Device token saved successfully'
  }, 'Device token saved successfully');
});

const removeDeviceToken = asyncHandler(async (req, res) => {
  const { customerId, deviceToken } = req.body;

  if (!customerId || !deviceToken) {
    return sendError(res, 'Customer ID and device token are required', 400);
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $pull: { deviceTokens: deviceToken } },
    { new: true }
  );

  if (!customer) {
    return sendNotFound(res, 'Customer');
  }

  sendSuccess(res, {
    customerId: customer._id,
    deviceTokenCount: customer.deviceTokens.length,
    message: 'Device token removed successfully'
  }, 'Device token removed successfully');
});

module.exports = {
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
};
