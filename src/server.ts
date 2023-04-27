import cors, { CorsOptions } from "cors";
import express from "express";
import createHttpError from "http-errors";
import {
  badRequestHandler,
  forbiddenHandler,
  genericErrorHandler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorHandlers";
import UsersRouter from "./api/users";
import PlaylistsRouter from "./api/playlists";
import SongsRouter from "./api/songs";
import AiRouter from "./ai";
// import passport from "passport";
// import googleStrategy from "./lib/auth/googleOauth";

const expressServer = express();
// passport.use("google", googleStrategy);

const whiteList = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];
const corsOptions: CorsOptions = {
  origin: (currentOrigin, corsNext) => {
    if (!currentOrigin || whiteList.includes(currentOrigin)) {
      corsNext(null, true);
    } else {
      corsNext(
        createHttpError(
          400,
          `The following origin is not allowed! ${currentOrigin}`
        )
      );
    }
  },
};

expressServer.use(cors(corsOptions));
expressServer.use(express.json());

// ROUTERS
expressServer.use("/users", UsersRouter);
expressServer.use("/playlists", PlaylistsRouter);
expressServer.use("/playlists", SongsRouter);
expressServer.use("/ai", AiRouter);

expressServer.use(badRequestHandler);
expressServer.use(unauthorizedHandler);
expressServer.use(forbiddenHandler);
expressServer.use(notFoundHandler);
expressServer.use(genericErrorHandler);

export { expressServer };
