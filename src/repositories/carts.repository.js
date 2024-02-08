import CartDTO from "../dao/DTOs/carts.dto.js";

export default class CartRepository {
  constructor(dao) {
    this.dao = dao;
  }

  // Retrieve all carts
  getCarts = async () => {
    try {
      const carts = await this.dao.get();
      return carts;
    } catch (error) {
      console.error("Error getting carts: ", error);
      return "Error getting carts";
    }
  };

  // Retrieve cart by id
  getCart = async (id) => {
    try {
      const cart = await this.dao.getCart(id);
      if (!cart) {
        return { error: "Cart not found" };
      }
      return cart;
    } catch (error) {
      console.error("Error getting cart: ", error);
      return "Error getting cart";
    }
  };

  // Retrieve amount of products
  getAmount = async ({ products }) => {
    try {
      const amount = await this.dao.getAmount({ products });
      return amount;
    } catch (error) {
      console.error("Error getting amount: ", error);
      return "Error getting amount";
    }
  };

  // Validate stock of products
  validateStock = async ({ products }) => {
    try {
      const stock = await this.dao.getStock({ products });
      return stock;
    } catch (error) {
      console.error("Error getting stock: ", error);
      return "Error getting stock";
    }
  };

  // Create a new cart
  createCart = async (cart) => {
    try {
      let newCart = new CartDTO(cart);
      const createdCart = await this.dao.addCart(newCart);
      return createdCart;
    } catch (error) {
      console.error("Error creating cart: ", error);
      return "Error creating cart";
    }
  };

  // Update cart by id
  updateCart = async (id, cart) => {
    try {
      const updatedCart = await this.dao.updateCart(id, cart);
      return updatedCart;
    } catch (error) {
      console.error("Error updating cart: ", error);
      return "Error updating cart";
    }
  };

  // Delete cart by id
  deleteCart = async (id) => {
    try {
      const deletedCart = await this.dao.deleteCart(id);
      return deletedCart;
    } catch (error) {
      console.error("Error deleting cart: ", error);
      return "Error deleting cart";
    }
  };
}
