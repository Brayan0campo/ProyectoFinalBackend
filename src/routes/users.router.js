import express from "express";
import { logger } from "../logger.js";
import UsersDTO from "../dao/DTOs/users.dto.js";
import Users from "../dao/mongo/users.mongo.js";
import { transport, uploader } from "../utils.js";
import { usersService } from "../repositories/index.js";

const usersMongo = new Users();
const router = express.Router();

// Retrieve all users
router.get("/", async (req, res) => {
  try {
    logger.info("Users retrieved successfully");
    let result = await usersMongo.get();
    res.status(200).json({ status: "success", payload: result });
  } catch (error) {
    logger.error("Error getting users", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Retrieve a user by its ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersMongo.getById(id);

    if (!user) {
      logger.info("User not found");
      res.status(404).json({ error: "User not found" });
      return;
    }

    logger.info("User retrieved successfully");
    res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    logger.error("Error retrieving user", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new user
router.post("/", async (req, res) => {
  try {
    let { first_name, last_name, email, age, password, rol } = req.body;
    let user = new UsersDTO({
      first_name,
      last_name,
      email,
      age,
      password,
      rol,
    });
    let createdUser = await usersService.createUser(user);
    if (result) {
      logger.info("User successfully created");
    } else {
      logger.error("Error creating user");
    }
    res.status(200).json({ status: "success", payload: createdUser });
  } catch (error) {
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

//Actualizar Rol Usuario
router.post("/premium/:uid", async (req, res) => {
  try {
    const { rol } = req.body;
    const roles = ["premium", "admin", "usuario"];
    const { uid } = req.params;

    if (!roles.includes(rol)) {
      logger.error("Invalid role provided");
      return res.status(400).json({ status: "error", payload: "Invalid role" });
    }

    if (!(await hasRequiredDocuments(uid))) {
      logger.error("The user does not have the required documents");
      return res.status(400).json({
        error: "The user does not have the required documents",
      });
    }

    let changeRol = await usersService.updUserRol({ uid, rol });

    if (changeRol) {
      logger.info("Rol updated successfully");
      res.status(200).json({ status: "success", payload: changeRol });
    } else {
      logger.error("Error updating the role");
      res
        .status(500)
        .json({ status: "error", payload: "Internal server error" });
    }
  } catch (error) {
    logger.error("Error updating the role", error);
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

// Update a user by its ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, age, password, rol } = req.body;
    const user = new UsersDTO(first_name, last_name, email, age, password, rol);
    const updatedUser = await usersService.updateUser(id, user);
    logger.info("User updated successfully");
    res.send({ status: "success", payload: updatedUser });
  } catch (error) {
    logger.error("Error updating user");
    res.send({ status: "error", payload: error });
  }
});

// Delete a user by last_connection
router.delete("/", async (req, res) => {
  try {
    const currentDate = new Date();
    const cutoffDate = new Date(
      currentDate.getTime() - 2 * 24 * 60 * 60 * 1000
    );
    const user = await usersMongo.deleteUsersByFilter({
      last_connection: { $lt: cutoffDate },
    });

    if (user.length > 0) {
      for (const userEmail of user) {
        await transport.sendMail({
          from: "ocamporodriguezbrayan@gmail.com",
          to: userEmail,
          subject: "Account deletion due to inactivity",
          text: "Your account has been deleted due to inactivity",
        });
      }
      logger.info("Users deleted successfully");
      res.status(200).json({ status: "success", payload: user });
    } else {
      logger.error("No users were deleted for inactivity");
      res.status(500).json({ message: "No users were deleted for inactivity" });
    }
  } catch (error) {
    logger.error("Error deleting users", error);
    res.status(500).json({ status: "error", payload: "Internal server error" });
  }
});

// Update a user by its ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await usersServices.deleteUser(id);
    logger.info("User deleted successfully");
    res.send({ status: "success", payload: deletedUser });
  } catch (error) {
    logger.error("Error deleting user");
    res.send({ status: "error", payload: error });
  }
});

// Upload documents
router.post(
  "/:uid/documents",
  uploader.fields([
    { name: "profiles", maxCount: 2 },
    { name: "products", maxCount: 2 },
    { name: "documents", maxCount: 2 },
    { name: "identificacion", maxCount: 1 },
    { name: "comprobante_domicilio", maxCount: 1 },
    { name: "comprobante_estado_cuenta", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files;
    const { uid } = req.params;

    try {
      const user = await usersMongo.getUserById(uid);

      if (!user) {
        throw new Error("User not found");
      }

      const allFiles = [];

      Object.entries(files).forEach(([type, fileList]) => {
        if (fileList) {
          const formattedFiles = fileList.map((file) => ({
            name: type,
            path: file.path,
          }));
          usersMongo.updateDocuments(uid, ...formattedFiles);
          allFiles.push(...formattedFiles);
        }
      });

      logger.info("Documents uploaded successfully");
      res.send({
        status: "success",
        payload: allFiles,
        message: "Documents uploaded successfully",
      });
    } catch (error) {
      logger.error(error.message);
      res.status(error.status || 500).send({ message: error.message });
    }
  }
);

export default router;
