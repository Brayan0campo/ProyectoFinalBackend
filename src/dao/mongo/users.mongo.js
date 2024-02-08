import { usersModel } from "./models/users.model.js";

export default class Users {
  constructor() {}

  // Retrieve all users
  get = async () => {
    try {
      let users = await usersModel.find().select("_id first_name email rol");
      return users;
    } catch (error) {
      console.error("Error getting users:", error);
      return "Error getting users";
    }
  };

  // Retrieve user by id
  getUserById = async (id) => {
    try {
      const user = await usersModel.findById(id).lean();

      if (!user) {
        return "User not found";
      }

      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return "Error getting user";
    }
  };

  // Retrieve a user by email
  getUserRoleByEmail = async (email) => {
    try {
      const user = await usersModel.findOne({ email });

      if (user && user.rol === "premium") {
        return "premium";
      } else {
        return "User not found or not premium";
      }
    } catch (error) {
      console.error("Error getting user role by email:", error);
      return "Error getting user role";
    }
  };

  // Retrieve a user by email and return the id_cart
  getIdCartByEmailUser = async (email) => {
    try {
      const user = await usersModel.findOne({ email });

      if (user && user.id_cart) {
        return user.id_cart;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting id_cart by email:", error);
      return "Error getting id_cart";
    }
  };

  // Retrieve user by email
  findEmail = async (email) => {
    try {
      const user = await usersModel.findOne(email);
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return "Error getting user";
    }
  };

  // Add a user
  addUser = async (userData) => {
    try {
      let userCreate = await usersModel.create(userData);
      console.log("User successfully created");
      return userCreate;
    } catch (error) {
      console.error("Error creating user:", error);
      return "Error creating user";
    }
  };

  // Update password by email
  updatePassword = async (email, newPassword) => {
    try {
      const updatedUser = await usersModel.findOneAndUpdate(
        { email: email },
        { $set: { password: newPassword } },
        { new: true }
      );

      if (updatedUser) {
        return updatedUser;
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      return "Error updating password";
    }
  };

  // Update user last connection
  updateLastConnection = async (email) => {
    try {
      const updatedUser = await usersModel.findOneAndUpdate(
        { email: email },
        { $set: { last_connection: new Date() } },
        { new: true }
      );

      if (updatedUser) {
        return updatedUser;
      } else {
        console.error("User not found");
        return null;
      }
    } catch (error) {
      console.error("Error updating last connection:", error);
      return "Error updating last connection";
    }
  };

  // Update user cart id
  updateIdCartUser = async ({ email, newIdCart }) => {
    try {
      const updatedUser = await usersModel.findOneAndUpdate(
        { email: email },
        { $set: { id_cart: newIdCart } },
        { new: true }
      );

      if (updatedUser) {
        return updatedUser;
      } else {
        console.error("User not found");
        return null;
      }
    } catch (error) {
      console.error("Error updating id_cart:", error);
      return "Error updating id_cart";
    }
  };

  // Find user by JWT
  findJWT = async (filterFunction) => {
    try {
      const user = await usersModel.find(filterFunction);
      return user;
    } catch (error) {
      console.error("Error getting user by JWT:", error);
      return "Error getting user";
    }
  };

  // Retrieve password by email
  getPasswordByEmail = async (email) => {
    try {
      const user = await usersModel.findOne({ email: email }).lean();

      if (user) {
        const pass = user.password;
        return pass;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting password by email:", error);
      return "Error getting password";
    }
  };

  // Update user role by id
  updateUserRoleById = async ({ uid, rol }) => {
    try {
      const updatedUser = await usersModel.findByIdAndUpdate(
        uid,
        { $set: { rol: rol } },
        { new: true }
      );

      if (updatedUser) {
        return updatedUser;
      } else {
        console.error("User not found");
        return null;
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      return "Error updating user role";
    }
  };

  // Delete user by id
  deleteUser = async (userId) => {
    try {
      const idToDelete = typeof userId === "object" ? userId.id : userId;
      let deletedUser = await usersModel.deleteOne({ _id: idToDelete });
      return deletedUser;
    } catch (error) {
      console.error("Error deleting user:", error);
      return "Error deleting user";
    }
  };

  // Delete user by filter
  deleteUsersByFilter = async (filter) => {
    try {
      const usersToDelete = await usersModel.find(filter);
      const deletedUserEmails = usersToDelete.map((user) => user.email);
      const result = await usersModel.deleteMany(filter);

      if (result.deletedCount > 0) {
        return deletedUserEmails;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error deleting users by filter:", error);
      return "Error deleting users by filter";
    }
  };

  // Update documents
  updateDocuments = async (userId, newDocuments) => {
    try {
      const user = await usersModel.findById(userId);

      if (!user) {
        console.error("User not found");
        return null;
      }

      if (!Array.isArray(user.documents)) {
        user.documents = [];
      }

      user.documents.push(
        ...(Array.isArray(newDocuments) ? newDocuments : [newDocuments])
      );
      const updatedUser = await user.save();
      return updatedUser;
    } catch (error) {
      console.error("Error updating documents:", error);
      return "Error updating documents";
    }
  };

  // Verify if user has required documents
  hasRequiredDocuments = async (userId) => {
    try {
      const user = await usersModel.findById(userId);

      if (!user || !Array.isArray(user.documents)) {
        return false;
      }

      const requiredDocumentNames = [
        "identificacion",
        "comprobante_domicilio",
        "comprobante_estado_cuenta",
      ];

      for (const requiredDocumentName of requiredDocumentNames) {
        const hasDocument = user.documents.some(
          (doc) => doc.name === requiredDocumentName
        );
        if (!hasDocument) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error verifying required documents:", error);
      return "Error verifying required documents";
    }
  };
}
