import TicketsDTO from "../dao/DTOs/tickets.dto.js";

export default class TicketRepository {
  constructor(dao) {
    this.dao = dao;
  }

  // Retrieve all tickets
  getTickets = async () => {
    try {
      const tickets = await this.dao.get();
      return tickets;
    } catch (error) {
      console.error("Error getting tickets: ", error);
      return "Error getting tickets";
    }
  };

  // Retrieve ticket by id
  getTicket = async (id) => {
    try {
      const ticket = await this.dao.getTicket(id);
      if (!ticket) {
        return { error: "Ticket not found" };
      }
      return ticket;
    } catch (error) {
      console.error("Error getting ticket: ", error);
      return "Error getting ticket";
    }
  };

  // Create a new ticket
  createTicket = async (ticket) => {
    try {
      const newTicket = await TicketsDTO(ticket);
      const createdTicket = await this.dao.addTicket(newTicket);
      return createdTicket;
    } catch (error) {
      console.error("Error creating ticket: ", error);
      return "Error creating ticket";
    }
  };

  // Update a ticket by id
  updateTicket = async (id, ticket) => {
    try {
      const updatedTicket = await this.dao.updateTicket(id, ticket);
      return updatedTicket;
    } catch (error) {
      console.error("Error updating ticket: ", error);
      return "Error updating ticket";
    }
  };

  // Delete a ticket by id
  deleteTicket = async (id) => {
    try {
      const deletedTicket = await this.dao.deleteTicket(id);
      return deletedTicket;
    } catch (error) {
      console.error("Error deleting ticket: ", error);
      return "Error deleting ticket";
    }
  };
}
