import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import multer from "multer";
import passport from "passport";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import config from "./config/config.js";

// Function to generate a hash password
export const generateHashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Function to validate a password
export const validatedPassword = (user, password) => {
  try {
    return bcrypt.compareSync(password, user.password);
  } catch (error) {
    console.error("Error comparing passwords: ", error);
    return false;
  }
};

// Function for passport authentication
export const passportAuthentication = (strategy) => {
  return async (req, res, next) => {
    try {
      passport.authenticate(strategy, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res
            .status(401)
            .send({ error: info.messages ? info.messages : info.toString() });
        }
        req.user = user;
        next();
      })(req, res, next);
    } catch (error) {
      console.error("Error authenticating user: ", error);
      next(error);
    }
  };
};

// Function to authorization by role
export const roleAuthorization = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new Error("Unauthorized");
      if (req.user.role !== role) throw new Error("No permissions");
      next();
    } catch (error) {
      return res.status(error.status || 403).send({ message: error.message });
    }
  };
};

// Function to send an email
export const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

// Function to upload files
const destinationMap = {
  profiles: "profiles",
  products: "products",
  documents: "documents",
  identificacion: "documents",
  comprobante_domicilio: "documents",
  comprobante_estado_cuenta: "documents",
};

const getUploadPath = (fileType) => {
  const folder = destinationMap[fileType] || "other";
  return path.join(__dirname, "public/files", folder);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath(file.fieldname);
    fs.promises
      .mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const finalFilePath = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, finalFilePath);
  },
});

export const uploader = multer({ storage });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default __dirname;
