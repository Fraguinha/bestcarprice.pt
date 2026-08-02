import bcrypt from "bcryptjs";
import pgSession from "connect-pg-simple";
import { Express } from "express";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import pg from "pg";
import { findUserByEmail, findUserById } from "../../models/user.js";

const configure = (app: Express, secret: string, databaseUrl: string) => {
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const PgStore = pgSession(session);

  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      },
      store: new PgStore({
        pool: new pg.Pool({ connectionString: databaseUrl }),
        tableName: "session",
        createTableIfMissing: false,
      }),
    })
  );

  passport.use(
    new LocalStrategy.Strategy(
      { usernameField: "email" },
      async (email, password, done) => {
        const user = await findUserByEmail(email);
        if (!user) {
          return done(null, false);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    const user = await findUserById(id);
    done(null, user || false);
  });

  app.use(passport.initialize());
  app.use(passport.session());
};

export default { configure };
