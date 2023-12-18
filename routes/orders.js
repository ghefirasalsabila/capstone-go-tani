const express = require('express');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');

const router = express.Router();

router.get('/', async (req, res) => {
  const orderList = await Order.find().populate('user', 'name').sort({ dateOrdered: -1 });

  if (!orderList) {
    return res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({
      path: 'orderItems',
      populate: { path: 'product', populate: 'category' },
    });

  if (!order) {
    return res.status(500).json({ success: false });
  }
  res.send(order);
});

router.post('/', async (req, res) => {
  const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
    let newOrderItem = new OrderItem({
      quantity: orderItem.quantity,
      product: orderItem.product,
    });

    newOrderItem = await newOrderItem.save();

    return newOrderItem.id;
  }));

  const orderItemsIdsResolved = await orderItemsIds;

  const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
    const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
    const totalPrice = orderItem.product.price * orderItem.quantity;
    return totalPrice;
  }));

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress: req.body.shippingAddress,
    city: req.body.city,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice,
    user: req.body.user,
  });

  order = await order.save();

  if (!order) {
    return res.status(400).send('The order cannot be created!');
  }

  res.send(order);
});

router.put('/:id', async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true },
  );

  if (!order) {
    return res.status(400).send('The order cannot be updated!');
  }

  res.send(order);
});

router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndRemove(req.params.id);

    if (order) {
      await Promise.all(order.orderItems.map(async (orderItem) => {
        await OrderItem.findByIdAndRemove(orderItem);
      }));
      return res.status(200).json({ success: true, message: 'The order is deleted!' });
    }
    return res.status(404).json({ success: false, message: 'Order not found!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/get/totalsales', async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } },
    ]);

    if (!totalSales.length) {
      return res.status(400).send('The order sales cannot be generated');
    }

    res.send({ totalsales: totalSales[0].totalsales });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/get/count', async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();

    res.send({ orderCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/get/userorders/:userid', async (req, res) => {
  try {
    const userOrderList = await Order.find({ user: req.params.userid }).populate({
      path: 'orderItems',
      populate: { path: 'product', populate: 'category' },
    }).sort({ dateOrdered: -1 });

    res.send(userOrderList);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
