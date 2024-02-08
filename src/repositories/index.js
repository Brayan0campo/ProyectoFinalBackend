import { Carts, Products, Tickets, Users } from "../dao/factory.js";

import UserRepository from "./Users.repository.js";
import CartRepository from "./Carts.repository.js";
import TicketRepository from "./Tickets.repository.js";
import ProductRepository from "./Products.repository.js";

export const cartsService = new CartRepository(new Carts());
export const usersService = new UserRepository(new Users());
export const ticketsService = new TicketRepository(new Tickets());
export const productsService = new ProductRepository(new Products());
