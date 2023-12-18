const mongoose = require('mongoose');

const orderitemSchema = mongoose.Schema({
  quantity: {
    type: Number,
    requires: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
});

exports.OrderItem = mongoose.model('ordeItem', orderitemSchema);
