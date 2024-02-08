import express from "express";
import { logger } from "../logger.js";
import Carts from "../dao/mongo/carts.mongo.js";
import CartsDTO from "../dao/DTOs/carts.dto.js";
import TicketsDTO from "../dao/DTOs/tickets.dto.js";
import {
  ticketsService,
  cartsService,
  usersService,
} from "../repositories/index.js";

const cartsMongo = new Carts();
const router = express.Router();

// Retrieve all carts
router.get("/", async (req, res) => {
  try {
    logger.info("Carts retrieved successfully");
    const carts = await cartsMongo.get();
    res.status(200).json({ status: "success", payload: carts });
  } catch (error) {
    logger.info("Error retrieving carts", error);
    res.status(500).json({ status: "error", payload: "Internal Server Error" });
  }
});

// Retrieve a cart by its ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await cartsMongo.getCart(id);
    logger.info("Cart retrieved successfully");
    res.status(200).send({ status: "success", payload: cart });
  } catch (error) {
    logger.error("Error retrieving cart", error);
    res
      .status(500)
      .send({ status: "error", message: "Unable to retrieve cart." });
  }
});

// Create a new cart
router.post("/", async (req, res) => {
  try {
    const { products } = req.body;
    const email = req.body.email;
    const userRole = usersService.getRolUser(products.owner);

    if (userRole == "premium" && email == products.owner) {
      logger.error(
        "A premium user cannot add to his cart a product that belongs to him"
      );
      res.status(500).json({
        status: "error",
        payload:
          "A premium user cannot add to his cart a product that belongs to him",
      });
    } else {
      let cart = new CartsDTO({ products });
      let newCart = await cartsService.createCart(cart);

      if (newCart) {
        logger.info("Cart is successfully created");
        res.status(200).send({ status: "success", payload: newCart });
      } else {
        logger.error("Error creating cart");
        res
          .status(500)
          .json({ status: "error", payload: "Internal server error" });
      }
    }
  } catch (error) {
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

// Create purchase from cart and ticket
router.post("/:cid/purchase", async (req, res) => {
  try {
    const id = req.params.cid;
    const products = req.body.productos;
    const email = req.body.correo;
    const cart = cartsService.getCart(id);

    if (!cart) {
      logger.error("Cart not found");
      return { error: "Cart not found" };
    }

    let validateStock = cartsService.validateStock({ products });

    if (validateStock) {
      let totalAmount = await cartsService.getAmount({ products });
      const ticketFormat = new TicketsDTO({
        amount: totalAmount,
        purchaser: email,
      });
      const result = await ticketsService.createTicket(ticketFormat);
    } else {
      logger.error("There is not enough stock");
    }
  } catch (error) {
    logger.error("Error processing the purchase: " + error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update a cart by its ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { products } = req.body;
  try {
    const cart = await cartsMongo.updateCart(id, products);
    logger.info("Cart updated successfully");
    res.status(200).json({ status: "success", payload: cart });
  } catch (error) {
    logger.error("Error updating cart", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a cart by its ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await cartsMongo.deleteCart(id);

    if (cart) {
      logger.info("Cart deleted successfully");
      res
        .status(200)
        .json({ status: "success", message: "Cart deleted successfully" });
    } else {
      logger.warn(`Cart with ID ${id} not found`);
      res
        .status(404)
        .json({ status: "error", message: `Cart with ID ${id} not found` });
    }
  } catch (error) {
    logger.error("Error deleting cart", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

export default router;
