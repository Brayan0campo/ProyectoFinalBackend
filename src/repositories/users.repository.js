import UserDTO from "../dao/DTOs/users.dto.js";

export default class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }

  // Retrieve all users
  getUsers = async () => {
    try {
      const users = await this.dao.get();
      return users;
    } catch (error) {
      console.error("Error getting users: ", error);
      return "Error getting users";
    }
  };

  // Retrieve user by id
  getUser = async (id) => {
    try {
      const user = await this.dao.getUser(id);
      if (!user) {
        return { error: "User not found" };
      }
      return user;
    } catch (error) {
      console.error("Error getting user: ", error);
      return "Error getting user";
    }
  };

  // Create a new user
  createUser = async (user) => {
    try {
      const newUser = new UserDTO(user);
      const createdUser = await this.dao.addUser(newUser);
      return createdUser;
    } catch (error) {
      console.error("Error creating user: ", error);
      return "Error creating user";
    }
  };

  // Update a user by id
  updateUser = async (id, user) => {
    try {
      const updatedUser = await this.dao.updateUser(id, user);
      return updatedUser;
    } catch (error) {
      console.error("Error updating user: ", error);
      return "Error updating user";
    }
  };

  // Retrieve user role by email
  getRolUser = async (email) => {
    try {
      const user = await this.dao.getUserRoleByEmail(email);
      if (!user) {
        return { error: "User not found" };
      }
      return user;
    } catch (error) {
      console.error("Error getting user: ", error);
      return "Error getting user";
    }
  };

  // Update user role by id
  updUserRol = async ({ uid, rol }) => {
    try {
      const updatedUser = await this.dao.updateUserRoleById({ uid, rol });
      return updatedUser;
    } catch (error) {
      console.error("Error updating user role: ", error);
      return "Error updating user role";
    }
  };

  // Delete a user by id
  deleteUser = async (id) => {
    try {
      const deletedUser = await this.dao.deleteUser(id);
      return deletedUser;
    } catch (error) {
      console.error("Error deleting user: ", error);
      return "Error deleting user";
    }
  };
}
