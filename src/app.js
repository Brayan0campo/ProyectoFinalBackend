import __dirname, {
  transport,
  validatedPassword,
  roleAuthorization,
  generateHashPassword,
  passportAuthentication,
} from "./utils.js";
import {
  generateAndSetToken,
  generateAndSetTokenEmail,
  validateTokenResetPass,
  getEmailFromToken,
} from "./jwt/jwt.token.js";
import * as path from "path";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { nanoid } from "nanoid";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { logger } from "./logger.js";
import config from "./config/config.js";
import cookieParser from "cookie-parser";
import swaggerJSDoc from "swagger-jsdoc";
import { engine } from "express-handlebars";
import compression from "express-compression";
import UserDTO from "./dao/DTOs/users.dto.js";
import swaggerUIExpress from "swagger-ui-express";
import { loggerMiddleware } from "./middleware.js";
import cartsRouter from "./routes/carts.router.js";
import usersRouter from "./routes/users.router.js";
import UsersMongo from "./dao/mongo/users.mongo.js";
import CartsMongo from "./dao/mongo/carts.mongo.js";
import ticketsRouter from "./routes/tickets.router.js";
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt as ExtractJwt } from "passport-jwt";
import TicketsMongo from "./dao/mongo/tickets.mongo.js";
import productsRouter from "./routes/products.router.js";
import { initializePassport } from "./config/passport.js";
import ProductsMongo from "./dao/mongo/products.mongo.js";

// Express and Initialization
const app = express();
const port = config.PORT;
const usersMongo = new UsersMongo();
const cartsMongo = new CartsMongo();
const ticketsMongo = new TicketsMongo();
const productsMongo = new ProductsMongo();

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.1",
    info: {
      version: "1.0.0",
      title: "API E-commerce documentation",
      description: "API Documentation for the e-commerce project",
    },
  },
  apis: [
    `src/docs/users.yaml`,
    `src/docs/carts.yaml`,
    `src/docs/tickets.yaml`,
    `src/docs/products.yaml`,
  ],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUIExpress.serve,
  swaggerUIExpress.setup(swaggerDocs)
);

// MongoDB Connection
mongoose
  .connect(config.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Successfully connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB", error);
  });

// Server Configuration
const server = app.listen(port, () => {
  logger.info(`Server successfully running on port ${port}`);
});

// JWT Configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: "Secret-key",
};

// Passport Configuration
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await usersMongo.findJWT(
        (user) => user.email === payload.email
      );
      if (!user) {
        return done(null, false, { message: "User not found" });
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

initializePassport();
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(loggerMiddleware);
app.use(bodyParser.json());
app.use(passport.initialize());
app.engine("handlebars", engine());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname + "/views"));

// Socket Configuration
const socketServer = new Server(server);

socketServer.on("connection", (socket) => {
  logger.info("New user connected to the socket server");
  socket.on("message", (data) => {
    logger.info(data);
  });
  socket.on("delUser", (id) => {
    usersMongo.deleteUser(id);
    socketServer.emit("success", "User Deleted Correctly");
  });
  socket.on("updRolUser", ({ id, newRol, email, name }) => {
    usersMongo.updateUserRoleById({
      uid: id,
      rol: newRol,
      email: email,
      name: name,
    });
    socketServer.emit("success", "User Role Updated Correctly");
  });
  socket.on("newProdInCart", async ({ idProd, quantity, email }) => {
    let idCart = await usersMongo.getIdCartByEmailUser(email);
    cartsMongo.addToCart(idCart, idProd, quantity);
    socketServer.emit("success", "Product Added to Cart Correctly");
  });
  socket.on("newProd", async (newProduct) => {
    let validUserPremium = await usersMongo.getUserRoleByEmail(
      newProduct.owner
    );
    if (validUserPremium == "premium") {
      productsMongo.addProduct(newProduct);
      socketServer.emit("success", "Product Added Correctly");
    } else {
      socketServer.emit(
        "errorUserPremium",
        "Error when adding the product because it does not belong to a Premium user"
      );
    }
  });
  socket.on("updProd", ({ id, newProduct }) => {
    productsMongo.updateProduct(id, newProduct);
    socketServer.emit("success", "Product Updated Correctly");
  });
  socket.on("delProd", async (id) => {
    let ownerProd = await productsMongo.getProductOwnerById(id.id);
    const ownerResult = ownerProd.owner;
    let validUserPremium = await usersMongo.getUserRoleByEmail(ownerResult);
    if (validUserPremium == "premium") {
      transport.sendMail({
        from: `Informative Mailing for <${ownerProd}>`,
        to: ownerResult,
        subject: "Information Elimination Product",
        html: `Product with id ${id.id} is removed correctly`,
        attachments: [],
      });
      await productsMongo.deleteProduct(id);
      socketServer.emit("success", "Product Correctly Removed");
    } else {
      await productsMongo.deleteProduct(id);
      socketServer.emit("success", "Product Correctly Removed");
    }
  });
  socket.on("delProdPremium", ({ id, owner, email }) => {
    if (owner == email) {
      productsMongo.deleteProduct(id);
      socketServer.emit("success", "Product Correctly Removed");
    } else {
      socketServer.emit(
        "errorDelPremium",
        "Error deleting product because it does not belong to Premium user"
      );
    }
  });
  socket.on("notMatchPass", () => {
    socketServer.emit("warning", "Passwords are different, try again");
  });
  socket.on("validActualPass", async ({ password1, password2, email }) => {
    const emailToFind = email;
    const user = await usersMongo.findEmail({ email: emailToFind });
    const passActual = usersMongo.getPasswordByEmail(emailToFind);
    const validSamePass = validatedPassword(user, password1);

    if (validSamePass) {
      socketServer.emit(
        "samePass",
        "Unable to enter last valid password, try again"
      );
    } else {
      const hashedPassword = await generateHashPassword(password1);
      const updatePassword = await usersMongo.updatePassword(
        email,
        hashedPassword
      );
      if (updatePassword) {
        socketServer.emit("passChange", "Password was successfully changed");
      } else {
        socketServer.emit("errorPassChange", "Error changing password");
      }
    }
  });
  socket.on("newEmail", async ({ email, comment }) => {
    let result = await transport.sendMail({
      from: "Chat Mail <ocamporodriguezbrayan@gmail.com>",
      to: email,
      subject: "Mail sent correctly",
      html: `
            <div>
                <h1>${comment}</h1>
            </div>
            `,
      attachments: [],
    });
    socketServer.emit("success", "Mail sent correctly");
  });
  socket.emit(
    "test",
    "message from server to client is validated in browser console"
  );
});

// Routes Configuration
app.use("/carts", cartsRouter);
app.use("/users", usersRouter);
app.use("/tickets", ticketsRouter);
app.use("/products", productsRouter);

// Route Home
app.get("/", (req, res) => {
  logger.info("You are logged in to the main page");
  res.render("index");
});

// Route Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const emailToFind = email;
  const user = await usersMongo.findEmail({ email: emailToFind });

  if (!user) {
    logger.error("Authentication error: User not found");
    return res.status(401).json({ message: "Authentication error" });
  }

  try {
    const passwordMatch = validatedPassword(user, password);

    if (!passwordMatch) {
      logger.error("Authentication error: Incorrect password");
      return res.status(401).json({ message: "Authentication error" });
    }

    const token = generateAndSetToken(res, email, password);
    const userDTO = new UserDTO(user);
    const prodAll = await productsMongo.get();
    usersMongo.updateLastConnection(email);
    res.json({ token, user: userDTO, prodAll });
    logger.info("Successful user login: " + emailToFind);
  } catch (error) {
    logger.error("Error comparing passwords: " + error.message);
    console.error("Error comparing passwords:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Route Logout
app.get("/logout", (req, res) => {
  logger.info("User is logged out");
  let email = req.query.email;
  usersMongo.updateLastConnection(email);
  res.redirect("/");
});

// Route Register
app.get("/register", (req, res) => {
  logger.info("You are logged in to the registration page");
  res.render("register");
});

app.post("/api/register", async (req, res) => {
  const { first_name, last_name, email, age, password, rol } = req.body;
  const emailToFind = email;
  const exists = await usersMongo.findEmail({ email: emailToFind });

  if (exists) {
    logger.warn(
      "Attempt to register with an existing email address: " + emailToFind
    );
    return res.send({ status: "error", error: "User already exists" });
  }

  const hashedPassword = await generateHashPassword(password);
  let resultNewCart = await cartsMongo.addCart();
  const newUser = {
    first_name,
    last_name,
    email,
    age,
    password: hashedPassword,
    id_cart: resultNewCart._id.toString(),
    rol,
  };

  try {
    usersMongo.addUser(newUser);
    const token = generateAndSetToken(res, email, password);
    res.send({ token });
    logger.info("Successful registration for the user: " + emailToFind);
  } catch (error) {
    logger.error("Error trying to register user: " + error.message);
    console.error("Error trying to register user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route Current
app.get(
  "/current",
  passportAuthentication("jwt", { session: false }),
  roleAuthorization("user"),
  (req, res) => {
    logger.info("User page starts (Normal)");
    roleAuthorization("user")(req, res, async () => {
      const userData = {
        email: req.user.email,
      };
      const idCartUser = await usersMongo.getIdCartByEmailUser(req.user.email);
      const prodAll = await productsMongo.get();
      res.render("userHome", {
        products: prodAll,
        user: userData,
        cartId: idCartUser,
      });
    });
  }
);

// Route Premium
app.get(
  "/current-plus",
  passportAuthentication("jwt", { session: false }),
  roleAuthorization("user"),
  (req, res) => {
    logger.info("User page starts (Premium)");
    roleAuthorization("user")(req, res, async () => {
      const { token } = req.query;
      const emailToken = getEmailFromToken(token);
      const prodAll = await productsMongo.get();
      res.render("userPremium", { products: prodAll, email: emailToken });
    });
  }
);

// Route Admin
app.get(
  "/admin",
  passportAuthentication("jwt"),
  roleAuthorization("user"),
  (req, res) => {
    logger.info("Start Admin Page");
    roleAuthorization("user")(req, res, async () => {
      const prodAll = await productsMongo.get();
      res.render("adminHome", { products: prodAll });
    });
  }
);

// Route Admin Users
app.get(
  "/admin/users",
  passportAuthentication("jwt"),
  roleAuthorization("user"),
  (req, res) => {
    logger.info("Start Admin Users Page");
    roleAuthorization("user")(req, res, async () => {
      const userAll = await usersMongo.get();
      const simplifiedUserData = userAll.map((user) => ({
        _id: user._id.toString(),
        first_name: user.first_name,
        email: user.email,
        rol: user.rol,
      }));
      res.render("adminUser", { users: simplifiedUserData });
    });
  }
);

// Route Forgot Password
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const emailToFind = email;
  const userExists = await usersMongo.findEmail({ email: emailToFind });
  if (!userExists) {
    logger.error("Error resetting user password: " + email);
    console.error("Error resetting user password: " + email);
    return res.status(401).json({ message: "Error resetting password" });
  }
  const token = generateAndSetTokenEmail(email);
  const resetLink = `http://localhost:8080/reset-password?token=${token}`;
  let result = transport.sendMail({
    from: "<ocamporodriguezbrayan@gmail.com>",
    to: email,
    subject: "Reset password",
    html: `Click on the following link to reset your password: <a href="${resetLink}"> Reset password </a>`,
    attachments: [],
  });
  if (result) {
    logger.info("Password reset email is sent to: " + emailToFind);
    res.json("Password reset email was successfully sent to: " + email);
  } else {
    logger.error("Error sending email to reset password");
    console.error("Error trying to reset password");
    res.json("Error trying to reset password");
  }
});

// Route Reset Password
app.get("/reset-password", async (req, res) => {
  const { token } = req.query;
  const validate = validateTokenResetPass(token);
  const emailToken = getEmailFromToken(token);
  if (validate) {
    res.render("resetPassword", { token, email: emailToken });
  } else {
    res.render("index");
  }
});

// Route Carts
app.get("/carts/:cid", async (req, res) => {
  let id = req.params.cid;
  let emailActive = req.query.email;
  let allCarts = await carts.getCartWithProducts(id);
  allCarts.products.forEach((producto) => {
    producto.total = producto.quantity * producto.productId.price;
  });
  const sumTotal = allCarts.products.reduce((total, producto) => {
    return total + (producto.total || 0);
  }, 0);
  res.render("viewCart", {
    title: "Vista Carro",
    carts: allCarts,
    user: emailActive,
    calculateSumTotal: (products) =>
      products.reduce((total, producto) => total + (producto.total || 0), 0),
  });
});

// Route Checkout
app.get("/checkout", async (req, res) => {
  let cart_Id = req.query.cartId;
  let purchaser = req.query.purchaser;
  let totalAmount = req.query.totalPrice;

  let productIds = req.query.products || [];
  let quantities = req.query.quantities || [];

  if (
    productIds.length > 0 &&
    quantities.length > 0 &&
    productIds.length === quantities.length
  ) {
    for (let i = 0; i < productIds.length; i++) {
      let productId = productIds[i];
      let quantity = quantities[i];
      let product = await productsMongo.getProductById(productId);

      if (product && product.stock >= quantity) {
        product.stock -= quantity;
        await productsMongo.updateProduct(productId, { stock: product.stock });
      } else {
        return res
          .status(400)
          .send("Error: Product not available or insufficient stock");
      }
    }
  }

  let newCart = await cartsMongo.addCart();
  let newIdCart = newCart._id.toString();
  let updateUser = await usersMongo.updateIdCartUser({
    email: purchaser,
    newIdCart,
  });
  if (updateUser) {
    const newTicket = {
      code: nanoid(),
      purchase_datetime: Date(),
      amount: totalAmount,
      purchaser: purchaser,
      id_cart_ticket: cart_Id,
    };
    let result = await ticketsMongo.addTicket(newTicket);
    const newTicketId = result._id.toString();
    res.redirect(`/tickets/${newTicketId}`);
  }
});

// Route Tickets
app.get("/tickets/:tid", async (req, res) => {
  let id = req.params.tid;
  let allTickets = await ticketsMongo.getTicket(id);
  res.render("viewTicket", {
    title: "View Ticket Page",
    tickets: allTickets,
  });
});

// Route Mocking Products
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get("/mockingproducts", async (req, res) => {
  const products = [];

  for (let i = 0; i < 50; i++) {
    const product = {
      id: nanoid(),
      description: `Product ${i + 1}`,
      image: "https://example.com/image.jpg",
      price: getRandomNumber(1, 1000),
      stock: getRandomNumber(1, 100),
      category: `Category ${(i % 5) + 1}`,
      availability: "in_stock",
    };

    products.push(product);
  }

  res.send(products);
});
