import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { executeQuery } from "../utils/dbHelpers.js";
import bcrypt from "bcrypt";

const verifyCallback = async (username, password, done) => {
  try {
    const result = await executeQuery(
      `SELECT id, first_name, last_name, email, phone, password, is_admin FROM clients WHERE email = $1`,
      [username],
      "checking if there is a client with the given email"
    );

    const user = result.rows[0];
    if (!user) {
      // Dummy bcrypt compare to normalize timing and prevent user enumeration
      await bcrypt.compare(password, "$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
      return done(null, false, {
        message: "Email does not relate to any user",
      });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: "Wrong Password: please try again" });
    }

    return done(null, user);
  } catch (error) {
    console.error(`Failed to Verify email & password`, error);
    return done(error);
  }
};

passport.use(new LocalStrategy({ usernameField: "email" }, verifyCallback));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await executeQuery(
      `SELECT id, first_name, last_name, email, phone, is_admin
         FROM clients WHERE id = $1`,
      [id],
      "Deserializing User with passport"
    );
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});
