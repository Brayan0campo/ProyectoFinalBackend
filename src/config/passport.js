import jwt from "passport-jwt";
import passport from "passport";
import config from "./config.js";

const JwtStrategy = jwt.Strategy;
const ExtractJwt = jwt.ExtractJwt;

// Extract token from cookie
const cookieExtractor = (req) => {
  return req.cookies ? req.cookies["token"] : null;
};

// Initialize passport with jwt strategy
export const initializePassport = () => {
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          return done(null, payload);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};
