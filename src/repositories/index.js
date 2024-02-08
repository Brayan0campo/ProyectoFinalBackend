import { Carts, Products, Tickets, Users } from "../dao/factory.js";

import UserRepository from "./users.repository.js";
import CartRepository from "./carts.repository.js";
import TicketRepository from "./tickets.repository.js";
import ProductRepository from "./products.repository.js";

export const cartsService = new CartRepository(new Carts());
export const usersService = new UserRepository(new Users());
export const ticketsService = new TicketRepository(new Tickets());
export const productsService = new ProductRepository(new Products());
