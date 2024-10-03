const adminSchema = require("../model/adminModel");
const bcrypt = require("bcrypt");
const userSchema = require("../model/userModel");
const categorySchema = require("../model/category");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ProductsSchema = require("../model/productModel");

// admin loginpage
const loadAdminLogin = (req, res) => {
  const message = req.query.message;
  res.render("admin/login", { msg: message });
};

// admin login page authentication
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminSchema.findOne({ email });
    if (!admin) return res.redirect("/admin/login?message=admin not found");
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.redirect("/admin/login?message=password incorrect");
    }
    req.session.admin = true;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.send("sorry something went wrong");
  }
};

//admin dashboard
const adminDashBoard = (req, res) => {
  res.render("admin/dashboard");
};

//admin user
const adminUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Count total users
    const totalUsers = await userSchema.countDocuments();

    // Fetch users with pagination
    const users = await userSchema.find().skip(skip).limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // Render the user page with the retrieved data
    res.render("admin/user", { users, currentPage: page, totalPages });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

//user blocking
const isBlock = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBlocked } = req.body;
    console.log(userId, isBlocked);
    const User = await userSchema.findById(userId);
    if (!User) {
      return res
        .status(404)
        .json({ success: false, message: "The user is not exists" });
    }
    User.isBlocked = isBlocked;
    await User.save();
    res.status(200).json({
      success: true,
      message: `The user status is changed`,
      isBlocked: User.isBlocked,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

//admin category
const adminCategory = async (req, res) => {
  const message = req.query.message;
  const perPage = 5;
  const page = parseInt(req.query.page, 10) || 1; // Ensure page is an integer

  try {
    const categories = await categorySchema
      .find()
      .skip(perPage * page - perPage)
      .limit(perPage);

    const count = await categorySchema.countDocuments();

    res.render("admin/category", {
      msg: message,
      categories: categories,
      currentPage: page,
      totalPages: Math.ceil(count / perPage),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

//admin add category
const adminCategoryadd = async (req, res) => {
  const { categoryName } = req.body;

  try {
    const category = await categorySchema.findOne({ categoryName });
    if (category)
      return res.redirect("/admin/category?message=category already exist");
    const newCategory = new categorySchema({ categoryName });
    await newCategory.save();
    res.redirect("/admin/category");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

//admin category listing  error here
const isCategorylist = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { isListed } = req.body; // Grab isListed from the body

    const category = await categorySchema.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category does not exist" });
    }

    // Toggle the category's isListed status
    category.isListed = isListed; // Set it based on the request body
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category status changed`,
      isListed: category.isListed,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
//admin category editing
const adminCategoryEdit = async (req, res) => {
  const { id } = req.params; // Get category ID from route parameters
  const { categoryName } = req.body; // Get the new category name from the form submission

  try {
    // Find the category by ID
    const category = await categorySchema.findById(id);
    if (!category) {
      return res
        .status(200)
        .json({ success: true, message: "Category not found" });
    }

    // Check if the new category name already exists in the database
    const existingCategory = await categorySchema.findOne({ categoryName });
    if (existingCategory) {
      return res
        .status(200)
        .json({ success: true, message: "Category name already exists" });
    }

    // Update the category name
    category.categoryName = categoryName;
    await category.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).send("Internal Server Error");
  }
};

// admin products
const adminProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    // Count total products
    const totalProducts = await ProductsSchema.countDocuments();
    const category = await categorySchema.find();

    // Fetch products with pagination
    const products = await ProductsSchema.find()
      .skip(skip)
      .limit(limit)
      .populate("categoryID");

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Render the product page with the retrieved data
    res.render("admin/products", {
      products,
      currentPage: page,
      totalPages,
      categories: category,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};

const adminAddProduct = async (req, res) => {
  console.log(req.body);
  
  try {
    
    const imageName = req.files.map((file) => file.filename);

    // Create a new product document
    const newProduct = new ProductsSchema({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      categoryID: req.body.categoryID,
      stock: req.body.stock,
      colors: req.body.colors ? req.body.colors.split(",") : [], 
      description: req.body.description,
      images: imageName,
    });


    console.log(newProduct)

    // Save the new product to the database
    await newProduct.save();
console.log("kuhsdfa");

    
    res.status(201).redirect("/admin/products");
    console.log("isdjo");
    
  } catch (error) {
    console.error(error);
    
    return res.status(500).send("An error occurred while adding the product.");
  }
};


//admin edit modal render
const edit_product = async (req, res) => {

  try {
    // Make sure the ID is valid and found in the database
    const product = await Product.findById(req.params.id).populate(
      "categoryID"
    );
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.json({ product });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).send("Error retrieving product");
  }
};

// Handle product editing
const editProductModal = async (req, res) => {
  try {
    const { productId, name, description, price, stock, categoryID, colors } =
      req.body;

    const product = await ProductsSchema.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Update product details
    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.categoryID = categoryID;
    product.colors = colors.split(",");

    // Handle image uploads
    if (req.files["mainImage"]) {
      product.images[0] = req.files["mainImage"][0].filename;
    }
    if (req.files["supportImage1"]) {
      product.images[1] = req.files["supportImage1"][0].filename;
    }
    if (req.files["supportImage2"]) {
      product.images[2] = req.files["supportImage2"][0].filename;
    }

    await product.save();
    res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
};

// is product listed
const isProductListed = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isListed } = req.body; // Expecting a boolean value indicating the new state

    // Validate if isListed is provided and is a boolean
    if (typeof isListed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid listing status provided",
      });
    }

    console.log(productId, isListed);
    const product = await ProductsSchema.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "The product does not exist" });
    }

    product.isListed = isListed; // Update the listing status
    await product.save();

    res.status(200).json({
      success: true,
      message: `The product listing status has been changed`,
      isListed: product.isListed,
    });
  } catch (error) {
    console.error("Error toggling product listing:", error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  loadAdminLogin,
  adminLogin,
  adminDashBoard,
  adminUser,
  isBlock,
  adminCategory,
  adminCategoryadd,
  isCategorylist,
  adminCategoryEdit,
  adminProducts,
  adminAddProduct,
  editProductModal,
  edit_product,
  isProductListed,
};
