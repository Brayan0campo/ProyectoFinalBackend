import express from "express";
import { logger } from "../logger.js";
import { transport } from "../utils.js";
import ProductsDTO from "../dao/DTOs/products.dto.js";
import Products from "../dao/mongo/products.mongo.js";
import EErrors from "../services/custom-errors/errors.enum.js";
import CustomError from "../services/custom-errors/errors.customs.js";
import { productsService, usersService } from "../repositories/index.js";
import { generateProductErrorInfo } from "../services/custom-errors/errors.info.js";

const router = express.Router();
const productMongo = new Products();

// Retrieve all products
router.get("/", async (req, res) => {
  try {
    logger.info("Se cargan productos");
    let result = await productMongo.get();
    res.status(200).send({ status: "success", payload: result });
  } catch (error) {
    res
      .status(500)
      .send({ status: "error", message: "Error interno del servidor" });
  }
});

// Retrieve product by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    const productDetails = await productMongo.getProductById(id);
    logger.info("Product is obtained by id");
    res.render("viewDetails", { product: productDetails, email: email });
  } catch (error) {
    logger.error("Error in obtaining the product: " + error.message);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Create a new product
router.post("/", async (req, res) => {
  let { description, image, price, stock, category, availability, owner } =
    req.body;

  if (owner === undefined || owner == "") {
    owner = "admin@admin.cl";
  }

  const product = {
    description,
    image,
    price,
    stock,
    category,
    availability,
    owner,
  };

  if (!description || !price) {
    try {
      throw CustomError.createError({
        name: "ProductError",
        cause: generateProductErrorInfo(product),
        message: "Required data is missing",
        code: EErrors.REQUIRED_DATA,
      });
    } catch (error) {
      logger.error("Error when comparing passwords: " + error.message);
      res
        .status(500)
        .json({ status: "error", payload: "Internal server error" });
    }
  }

  let prod = new ProductsDTO({
    description,
    image,
    price,
    stock,
    category,
    availability,
    owner,
  });

  let userPremium = await usersService.getRolUser(owner);

  if (userPremium == "premium") {
    let result = await productsService.createProduct(prod);
    res.status(200).json({ status: "success", payload: result });
    logger.info("Product is created with premium user");
  } else {
    logger.error("User is not premium");
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

// Delete a product by id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let ownerProd = await productMongo.getProductOwnerById(id);
    let userRol = await usersService.getRolUser(ownerProd.owner);

    if (userRol == "premium") {
      await transport.sendMail({
        from: "ocamporodriguezbrayan@gmail.com",
        to: ownerProd.owner,
        subject: "Product is removed with Owner Premium",
        html: `Product with id ${id} is removed correctly`,
      });
      logger.info("Product is removed with Owner Premium");
      res.status(200).json({ status: "success", payload: "Product removed" });
    } else {
      productMongo.deleteProduct(id);
      res.status(200).json({ status: "success", payload: "Product removed" });
    }
  } catch (error) {
    logger.error("Error when deleting product: " + error.message);
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

export default router;
