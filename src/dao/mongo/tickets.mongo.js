import { ticketsModel } from "./models/tickets.model.js";

export default class Tickets {
  constructor() {}

  // Retrieve all tickets
  get = async () => {
    try {
      const tickets = await ticketsModel.find();
      return tickets;
    } catch (error) {
      console.error("Error getting tickets: ", error);
      return "Error getting tickets";
    }
  };

  // Retrieve ticket by id
  getTicket = async (ticketId) => {
    try {
      let ticket = await ticketsModel.findById(ticketId).lean();
      return ticket;
    } catch (error) {
      console.error("Error when obtaining the ticket by ID:", error);
      return "Error when obtaining the ticket by ID";
    }
  };

  // Add a ticket
  addTicket = async (ticket) => {
    try {
      let result = await ticketsModel.create(ticket);
      return result;
    } catch (error) {
      console.error("Error in ticket creation:", error);
      return "Error in ticket creation";
    }
  };

  // Update a ticket by id
  updateTicket = async (ticketId, ticket) => {
    try {
      let result = await ticketsModel.findByIdAndUpdate(ticketId, ticket, {
        new: true,
      });
      return result;
    } catch (error) {
      console.error("Error in ticket update:", error);
      return "Error in ticket update";
    }
  };

  // Delete a ticket by id
  deleteTicket = async (ticketId) => {
    try {
      let result = await ticketsModel.findByIdAndDelete(ticketId);
      return result;
    } catch (error) {
      console.error("Error in ticket deletion:", error);
      return "Error in ticket deletion";
    }
  };
}
