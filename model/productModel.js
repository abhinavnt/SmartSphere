const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProductSchema = new Schema({
  colors: [{ type: String }], 
  name: { type: String, required: true },
  description: { type: String, required: true },
  categoryID: { type: Schema.Types.ObjectId, required: true, ref: 'Category' }, 
  stock: { type: Number, required: true },
  price: { type: Number, required: true }, 
  images:[{ type: String, required: true }],
  isListed: { type: Boolean, required: true, default: true },
}, { timestamps: true });


 
module.exports= mongoose.model('products', ProductSchema)