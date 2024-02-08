import express from "express";
import { logger } from "../logger.js";
import TicketsDTO from "../dao/DTOs/tickets.dto.js";
import Tickets from "../dao/mongo/tickets.mongo.js";
import { ticketsService } from "../repositories/index.js";

const router = express.Router();
const ticketsMongo = new Tickets();

// Retrieve all tickets
router.get("/", async (req, res) => {
  try {
    logger.info("Tickets retrieved successfully");
    let tickets = await ticketsMongo.get();
    res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    logger.info("Error retrieving tickets", error);
    res.status(500).json({ status: "error", payload: "Internal Server Error" });
  }
});

// Retrieve a ticket by its ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await ticketsMongo.getTicket(id);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    logger.info("Ticket retrieved successfully");
    res.send({ status: "success", payload: ticket });
  } catch (error) {
    logger.error("Error retrieving ticket", error);
    res.status(404).send({ status: "error", payload: "Ticket not found" });
  }
});

// Create a new ticket
router.post("/", async (req, res) => {
  try {
    let { amount, purchaser } = req.body;
    let ticket = new TicketsDTO({ amount, purchaser });
    let newTicket = await ticketsService.createTicket(ticket);
    if (result) {
      logger.info("Ticket successfully created");
      res.status(200).json({ status: "success", payload: newTicket });
    } else {
      logger.error("Error creating ticket");
      res
        .status(500)
        .json({ status: "error", payload: "Internal Server Error" });
    }
  } catch (error) {
    logger.error("Error creating ticket", error);
    res.status(500).json({ status: "error", payload: "Internal Server Error" });
  }
});

// Update a ticket by its ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { amount, purchaser } = req.body;
  try {
    const ticket = new TicketsDTO(amount, purchaser);
    const updatedTicket = await ticketsService.updateTicket(id, ticket);
    logger.info("Ticket updated successfully");
    res.status(200).json({ status: "success", payload: updatedTicket });
  } catch (error) {
    logger.error("Error updating ticket", error);
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

// Delete a ticket by its ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTicket = await ticketsService.deleteTicket(id);
    logger.info("Ticket deleted successfully");
    res.send({ status: "success", payload: deletedTicket });
  } catch (error) {
    logger.error("Error deleting ticket");
    res.status(500).json({ status: "error", payload: "Internal Server Error" });
  }
});

export default router;
