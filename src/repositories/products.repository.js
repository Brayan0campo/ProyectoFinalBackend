import ProductDTO from "../dao/DTOs/products.dto.js";

export default class ProductRepository {
  constructor(dao) {
    this.dao = dao;
  }

  // Retrieve all products
  getProducts = async () => {
    try {
      const products = await this.dao.get();
      return products;
    } catch (error) {
      console.error("Error getting products: ", error);
      return "Error getting products";
    }
  };

  // Retrieve product by id
  getProduct = async (id) => {
    try {
      const product = await this.dao.getProduct(id);
      if (!product) {
        return { error: "Product not found" };
      }
      return product;
    } catch (error) {
      console.error("Error getting product: ", error);
      return "Error getting product";
    }
  };

  // Create a new product
  createProduct = async (product) => {
    try {
      let newProduct = new ProductDTO(product);
      const createdProduct = await this.dao.addProduct(newProduct);
      return createdProduct;
    } catch (error) {
      console.error("Error creating product: ", error);
      throw new Error("Error creating product");
    }
  };

  // Update a product by id
  updateProduct = async (id, product) => {
    try {
      const updatedProduct = await this.dao.updateProduct(id, product);
      return updatedProduct;
    } catch (error) {
      console.error("Error updating product: ", error);
      throw new Error("Error updating product");
    }
  };

  // Delete a product by id
  deleteProduct = async (id) => {
    try {
      const deletedProduct = await this.dao.deleteProduct(id);
      return deletedProduct;
    } catch (error) {
      console.error("Error deleting product: ", error);
      throw new Error("Error deleting product");
    }
  };
}
