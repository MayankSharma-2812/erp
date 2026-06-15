const mongoose = require('mongoose');

const razorpayOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'attempted', 'paid', 'failed'],
      default: 'created',
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    heads: [
      {
        type: String,
      },
    ],
    session: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

razorpayOrderSchema.index({ orderId: 1 });

const RazorpayOrder = mongoose.model('RazorpayOrder', razorpayOrderSchema);

module.exports = RazorpayOrder;
