import mongoose from "mongoose";
import { cartsModel } from "./models/carts.model.js";
import { productsModel } from "./models/products.model.js";

export default class Carts {
  constructor() {}

  // Retrieve all carts
  get = async () => {
    try {
      const carts = await cartsModel.find();
      return carts;
    } catch (error) {
      console.error("Error getting carts: ", error);
      return errorMessagesCarts.errorGettingCarts;
    }
  };

  // Retrieve cart by id
  getCart = async (id) => {
    try {
      const cart = await cartsModel.findById(id);

      if (!cart) {
        return { error: "Cart not found with ID provided" };
      }

      return { cart };
    } catch (error) {
      console.error("Error getting the cart: ", error);
      return { error: "Internal error when getting the cart" };
    }
  };

  // Retrieve stock of products
  getStock = async ({ products }) => {
    try {
      const stockInfo = {};
      const errors = [];

      for (const product of products) {
        const productInCollection = await productsModel.findOne({
          description: product.description,
        });

        if (!productInCollection) {
          errors.push({
            description: product.description,
            error: `The product is not in the collection`,
          });
          stockInfo[product.description] = {
            status: "Not in collection",
          };
          continue;
        }

        if (productInCollection.stock >= product.stock) {
          await productsModel.updateOne(
            { description: productInCollection.description },
            { $inc: { stock: -product.stock } }
          );

          stockInfo[product.description] = {
            status: "Available",
            availableQuantity: productInCollection.stock - product.stock,
            requiredQuantity: product.stock,
          };
        } else {
          errors.push({
            description: product.description,
            error: "Insufficient stock",
          });
          stockInfo[product.description] = { status: "Insufficient stock" };
        }
      }

      if (errors.length > 0) {
        return { errors, stockInfo };
      }

      return stockInfo;
    } catch (error) {
      console.error("Error in obtaining stock: ", error);
      return { error: "Internal error when obtaining stock" };
    }
  };

  // Retrieve the amount of the cart
  getAmount = async ({ products }) => {
    try {
      let totalAmount = 0;

      if (!products || !Array.isArray(products)) {
        console.error('The "products" property is not a valid array');
        return totalAmount;
      }

      for (const product of products) {
        totalAmount += product.price * product.stock;
      }

      return totalAmount;
    } catch (error) {
      console.error("Error in calculating the amount: ", error);
      return { error: "Internal error when calculating the amount" };
    }
  };

  // Create a new cart
  addCart = async (cart) => {
    try {
      let newCart = await cartsModel.create(cart);
      console.log("Cart created successfully");
      return newCart;
    } catch (error) {
      console.error("Error creating the cart:", error);
      throw new Error("Error creating the cart");
    }
  };

  // Add products to a cart
  addToCart = async (cartId, productId, quantity) => {
    try {
      if (typeof cartId !== "string") {
        throw new Error("Cart ID must be a string");
      }

      const cartObjectId = new mongoose.Types.ObjectId(cartId);
      let cart = await cartsModel.findById(cartObjectId);
      const existingProduct = cart.products.find((product) =>
        product.productId.equals(productId)
      );

      if (existingProduct) {
        existingProduct.quantity += parseInt(quantity, 10);
      } else {
        cart.products.push({
          productId: productId,
          quantity: quantity,
        });
      }
      await cart.save();
      console.log("Product added to cart successfully");
      return cart;
    } catch (error) {
      console.error("Error adding product to cart:", error);
      throw new Error("Error adding product to cart");
    }
  };

  // Retrieve a cart with its products
  getCartWithProducts = async (cartId) => {
    try {
      const cart = await cartsModel
        .findById(cartId)
        .populate("products.productId")
        .lean();

      if (!cart) {
        return "Cart not found with ID provided";
      }

      return cart;
    } catch (error) {
      console.error("Error getting the cart with products:", error);
      return "Error getting the cart with products";
    }
  };
}
