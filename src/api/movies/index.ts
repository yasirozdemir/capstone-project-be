import express from "express";
import MoviesModel from "./model";
import { IUserRequest, JWTTokenAuth } from "../../lib/auth/jwt";
import WLRouter from "../watchlists";
import {
  IMovieWLChecks,
  checkIsMemberOfWL,
  checkMovieInWL,
} from "../../lib/middlewares";
import createHttpError from "http-errors";
import { movieDealer } from "../../lib/functions";
const q2m = require("query-to-mongo");

const MoviesRouter = express.Router();

// Get all the Movies in the DB
MoviesRouter.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const options = query.options;
    const movies = await MoviesModel.find(query.criteria)
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit);
    const totalMovies = await MoviesModel.countDocuments(query.criteria);
    const numberOfPages = Math.ceil(totalMovies / options.limit);
    const links = query.links(`${process.env.FE_URL}/movies`, totalMovies);
    res.send({ totalMovies, movies, links, numberOfPages });
  } catch (error) {
    next(error);
  }
});

// Get genres
MoviesRouter.get("/genres", async (req, res, next) => {
  try {
    const filteredGenres = await MoviesModel.find().select("genres -_id");
    const genres: string[] = [];
    filteredGenres.forEach((movie) => {
      movie.genres.forEach((genre) => {
        if (!genres.includes(genre)) {
          genres.push(genre);
        }
      });
    });
    genres.sort();
    res.send(genres);
  } catch (error) {
    next(error);
  }
});

// Add a movie into a Watchlist
WLRouter.post(
  "/:WLID/movies/:movieID",
  JWTTokenAuth,
  checkIsMemberOfWL,
  checkMovieInWL,
  async (req, res, next) => {
    try {
      if (!(req as IMovieWLChecks).movieIsAlreadyIn) {
        const WL = (req as IMovieWLChecks).WL;
        WL.movies = [...WL.movies, req.params.movieID];
        await WL.save();
        res.send({ movies: WL.movies });
      } else {
        next(
          createHttpError(400, "This movie is already added to this watchlist!")
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get a movie by its ID
MoviesRouter.get("/:movieID", async (req, res, next) => {
  try {
    const movie = await MoviesModel.findById(req.params.movieID);
    if (movie) res.send(movie);
    else
      next(
        createHttpError(
          404,
          `Movie with the ID of ${req.params.movieID} not found!`
        )
      );
  } catch (error) {
    next(error);
  }
});

// Remove a movie from a Watchlist
WLRouter.delete(
  "/:WLID/movies/:movieID",
  JWTTokenAuth,
  checkIsMemberOfWL,
  checkMovieInWL,
  async (req, res, next) => {
    try {
      if ((req as IMovieWLChecks).movieIsAlreadyIn) {
        const WL = (req as IMovieWLChecks).WL;
        WL.movies = WL.movies.filter(
          (id) => id.toString() !== req.params.movieID
        );
        await WL.save();
        res.send({ movies: WL.movies });
      } else {
        next(createHttpError(400, "This movie is not into this watchlist!"));
      }
    } catch (error) {
      next(error);
    }
  }
);

// Add movies into DB (only if the user is verified || logged in with Google)
MoviesRouter.post("/", JWTTokenAuth, async (req, res, next) => {
  try {
    const isVerified = (req as IUserRequest).user!.verified;
    if (isVerified) {
      const movie = await movieDealer(req.body.title, req.body.year);
      res.send(movie);
    } else {
      next(createHttpError(401, "You haven't verify your account yet!"));
    }
  } catch (error) {
    next(error);
  }
});

export default MoviesRouter;
