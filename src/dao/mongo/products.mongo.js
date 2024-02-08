import mongoose from "mongoose";
import { productsModel } from "./models/products.model.js";

export default class Products {
  constructor() {}

  // Retrieve all products
  get = async () => {
    try {
      const products = await productsModel.find().lean();
      return products;
    } catch (error) {
      console.error("Error getting products: ", error);
      return "Error getting products";
    }
  };

  // Retrieve a product by its ID
  getProductById = async (id) => {
    try {
      const prod = await productsModel.findById(id).lean();

      if (!prod) {
        return "Product not found";
      }

      return prod;
    } catch (error) {
      console.error("Error getting product:", error);
      return "Error getting product";
    }
  };

  // Retrieve the owner of a product by its ID
  getProductOwnerById = async (productId) => {
    try {
      const product = await productsModel.findById(productId).lean();

      if (!product) {
        return "Product not found";
      }

      const ownerId = product.owner;

      if (ownerId) {
        return { owner: ownerId };
      } else {
        return "Owner not found for this product";
      }
    } catch (error) {
      console.error("Error in obtaining the product owner:", error);
      return "Error in obtaining the product owner";
    }
  };

  // Add a product
  addProduct = async (prodData) => {
    try {
      let prodCreate = await productsModel.create(prodData);
      return prodCreate;
    } catch (error) {
      console.error("Error creating product:", error);
      return "Error creating product:";
    }
  };

  // Update a product by its ID
  updateProduct = async (prodId, prodData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(prodId)) {
        return "Invalid product ID";
      }

      let updatedProduct = await productsModel.updateOne(
        { _id: new mongoose.Types.ObjectId(prodId) },
        { $set: prodData }
      );

      return updatedProduct;
    } catch (error) {
      console.error("Error updating product:", error);
      return "Error updating product";
    }
  };

  // Delete a product by its ID
  deleteProduct = async (productId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return "Invalid product ID";
      }

      let deletedProduct = await productsModel.deleteOne({
        _id: new mongoose.Types.ObjectId(productId),
      });

      return deletedProduct;
    } catch (error) {
      console.error("Error delete product:", error);
      return "Error delete product";
    }
  };
}
