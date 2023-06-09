import { RequestHandler, Request } from "express";
import { IUserRequest } from "../auth/jwt";
import createHttpError from "http-errors";
import WLsModel from "../../api/watchlists/model";
import UsersModel from "../../api/users/model";
import MoviesModel from "../../api/movies/model";
import { IUser, IUserDocument } from "../../interfaces/IUser";
import { IMovieDocument } from "../../interfaces/IMovie";
import { IWatchlistDocument } from "../../interfaces/IWatchlist";

export const checkIsMemberOfWL: RequestHandler = async (req, res, next) => {
  const userID = (req as IUserRequest).user!._id;
  const WL = await WLsModel.findById(req.params.WLID);
  if (WL) {
    if (WL.members.includes(userID)) {
      next();
    } else {
      next(createHttpError(401, "You are not a member of this watchlist!"));
    }
  } else {
    next(
      createHttpError(
        404,
        `Watchlist with the ID of ${req.params.WLID} not found!`
      )
    );
  }
};

export const checkIsLiked: RequestHandler = async (req, res, next) => {
  const userID = (req as IUserRequest).user!._id;
  const WL = await WLsModel.findById(req.params.WLID);
  if (!WL) {
    next(
      createHttpError(
        404,
        `Watchlist with the ID ${req.params.WLID} not found!`
      )
    );
  } else {
    const user = (await UsersModel.findById(userID)) as IUser;
    const isLiked =
      WL.likes.includes(userID) &&
      user.likedWatchlists.includes(req.params.WLID);
    (req as IUserRequest).isLiked = isLiked;
    next();
  }
};

export interface IFollowChecks extends Request {
  user1: IUserDocument;
  user2: IUserDocument;
  ImFollowingThem: boolean;
  TheyAreFollowingMe: boolean;
}

export const checkFollows: RequestHandler = async (req, res, next) => {
  const u1ID = (req as IUserRequest).user!._id;
  const u2ID = req.params.userID;
  if (u1ID === u2ID) {
    next(createHttpError(400, "You cannot follow yourself!"));
  } else {
    const user2 = await UsersModel.findById(u2ID);
    if (!user2) {
      next(createHttpError(404, `User with the ID ${u2ID} not found!`));
    } else {
      const user1 = await UsersModel.findById(u1ID);
      if (user1) (req as IFollowChecks).user1 = user1;
      (req as IFollowChecks).user2 = user2;
      // checks if user1 is following user2
      (req as IFollowChecks).ImFollowingThem = user1!.following.includes(u2ID);
      // checks if user2 is following user1
      (req as IFollowChecks).TheyAreFollowingMe =
        user2.following.includes(u1ID);
      next();
    }
  }
};

export interface IMovieWLChecks extends Request {
  movie: IMovieDocument;
  WL: IWatchlistDocument;
  movieIsAlreadyIn: boolean;
}

export const checkMovieInWL: RequestHandler = async (req, res, next) => {
  const WLID = req.params.WLID;
  const movieID = req.params.movieID;
  const WL = await WLsModel.findById(WLID);
  if (WL) {
    (req as IMovieWLChecks).WL = WL;
    const movie = await MoviesModel.findById(movieID);
    if (movie) {
      (req as IMovieWLChecks).movie = movie;
      (req as IMovieWLChecks).movieIsAlreadyIn = WL.movies.includes(movieID);
      next();
    } else {
      next(createHttpError(404, `Movie with the ID ${movieID} not found!`));
    }
  } else {
    next(createHttpError(404, `Watchlist with the ID ${WLID} not found!`));
  }
};
