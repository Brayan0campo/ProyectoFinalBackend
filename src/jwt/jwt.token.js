import jwt from "jsonwebtoken";

// Generate and set token
export function generateAndSetToken(res, email, password) {
  try {
    const token = jwt.sign({ email, password, role: "user" }, "secret-key", {
      expiresIn: "24h",
    });
    res.cookie("token", token, { httpOnly: true, maxAge: 60 * 60 * 1000 });
    return token;
  } catch (error) {
    console.error("Error signing the token: ", error);
    throw new Error("Could not generate token");
  }
}

// Get email from token
export function getEmailFromToken(token) {
  try {
    const decoded = jwt.verify(token, "secret-key");
    return decoded.email;
  } catch (error) {
    console.error("Error decoding the token:", error.message);
    throw error;
  }
}

// Generate and set token email
export function generateAndSetTokenEmail(email) {
  try {
    const token = jwt.sign({ email }, "secret-key", { expiresIn: "1h" });
    return token;
  } catch (error) {
    console.error("Error generating the token:", error.message);
    return null;
  }
}

// Validate token reset pass
export function validateTokenResetPass(token) {
  try {
    const result = jwt.verify(token, "secret-key");
    return result;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.error("Token expired: ", error.message);
      return null;
    } else {
      console.error("Error verifying token:", error.message);
      return null;
    }
  }
}
