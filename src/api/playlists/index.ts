import express from "express";
import PlaylistsModel from "./model";
import UsersModel from "../users/model";
import { IUserRequest, JWTTokenAuth } from "../../lib/auth/jwt";
import UsersRouter from "../users";
import createHttpError from "http-errors";
import { IPlaylist } from "../../interfaces/IPlaylist";
import { IUser } from "../../interfaces/IUser";
import mongoose from "mongoose";

const PlaylistsRouter = express.Router();

// Get all the playlists in database
PlaylistsRouter.get("/", JWTTokenAuth, async (req, res, next) => {
  try {
    const playlists = await PlaylistsModel.find().populate(
      "user",
      "_id fullName avatar"
    );
    res.send(playlists);
  } catch (error) {
    next(error);
  }
});

// Create a playlist
PlaylistsRouter.post("/me", JWTTokenAuth, async (req, res, next) => {
  try {
    const newPlaylist = new PlaylistsModel({
      ...req.body,
      user: (req as IUserRequest).user!._id,
    });
    const { _id } = await newPlaylist.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// Get a Playlist
PlaylistsRouter.get("/:playlistID", JWTTokenAuth, async (req, res, next) => {
  try {
    const playlist = await PlaylistsModel.findById(req.params.playlistID);
    if (playlist) res.send(playlist);
    else
      next(
        createHttpError(
          404,
          `Playlist with ID ${req.params.playlistID} not found!`
        )
      );
  } catch (error) {
    next(error);
  }
});

// Edit a Playlist
PlaylistsRouter.put("/:playlistID", JWTTokenAuth, async (req, res, next) => {
  try {
    const playlist = (await PlaylistsModel.findById(
      req.params.playlistID
    )) as IPlaylist;
    if (playlist) {
      if (playlist.user.toString() === (req as IUserRequest).user!._id) {
        const updatedPlaylist = await PlaylistsModel.findByIdAndUpdate(
          req.params.playlistID,
          req.body,
          { new: true, runValidators: true }
        );
        res.send(updatedPlaylist);
      } else {
        next(
          createHttpError(
            401,
            "This user does not have the permission to edit this playlist!"
          )
        );
      }
    } else
      next(
        createHttpError(
          404,
          `Playlist with the id ${req.params.playlistID} not found!`
        )
      );
  } catch (error) {
    next(error);
  }
});

// Delete a Playlist
PlaylistsRouter.delete("/:playlistID", JWTTokenAuth, async (req, res, next) => {
  try {
    const playlist = (await PlaylistsModel.findById(
      req.params.playlistID
    )) as IPlaylist;
    if (playlist) {
      if (playlist.user.toString() === (req as IUserRequest).user!._id) {
        await PlaylistsModel.findByIdAndDelete(req.params.playlistID);
        res.status(204).send();
      } else {
        next(
          createHttpError(
            401,
            "This user does not have the permission to delete this playlist!"
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Playlist with the id ${req.params.playlistID} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

// Get playlists of a User
UsersRouter.get("/:userID/playlists", JWTTokenAuth, async (req, res, next) => {
  try {
    const playlists = await PlaylistsModel.find({
      user: (req as IUserRequest).user!._id,
    });
    res.send(playlists);
  } catch (error) {
    next(error);
  }
});

// Like a playlist
PlaylistsRouter.post(
  "/:playlistID/likes",
  JWTTokenAuth,
  async (req, res, next) => {
    try {
      const userID = (req as IUserRequest).user!._id;
      const playlist = (await PlaylistsModel.findById(
        req.params.playlistID
      )) as IPlaylist;
      const user = (await UsersModel.findById(userID)) as IUser;
      if (playlist) {
        // isLike = false -> like
        // isLike = true -> throw error
        const isLiked =
          playlist.likes.some((id) => id.toString() === userID) &&
          user.likedPlaylists.some(
            (playlistID) => playlistID.toString() === req.params.playlistID
          );
        if (!isLiked) {
          await PlaylistsModel.findByIdAndUpdate(
            req.params.playlistID,
            {
              $push: { likes: userID },
            },
            { new: true, runValidators: true }
          );
          await UsersModel.findByIdAndUpdate(userID, {
            $push: { likedPlaylists: playlist._id },
          });
          res.send({ message: "Liked!" });
        } else {
          next(createHttpError(400, "You've already liked this playlist!"));
        }
      } else {
        next(
          createHttpError(
            404,
            `Playlist with ID ${req.params.playlistID} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// Dislike a Playlist
PlaylistsRouter.delete(
  "/:playlistID/likes",
  JWTTokenAuth,
  async (req, res, next) => {
    try {
      const userID = (req as IUserRequest).user!._id;
      const playlist = (await PlaylistsModel.findById(
        req.params.playlistID
      )) as IPlaylist;
      const user = (await UsersModel.findById(userID)) as IUser;
      if (playlist) {
        // isLike = true -> dislike
        // isLike = false -> throw error
        const isLiked =
          playlist.likes.some((id) => id.toString() === userID) &&
          user.likedPlaylists.some(
            (playlistID) => playlistID.toString() === req.params.playlistID
          );
        if (isLiked) {
          await PlaylistsModel.findByIdAndUpdate(
            req.params.playlistID,
            {
              $pull: { likes: userID },
            },
            { new: true, runValidators: true }
          );
          await UsersModel.findByIdAndUpdate(userID, {
            $pull: { likedPlaylists: playlist._id },
          });
          res.send({ message: "Disliked!" });
        } else {
          next(createHttpError(400, "You've already disliked this playlist!"));
        }
      } else {
        next(
          createHttpError(
            404,
            `Playlist with ID ${req.params.playlistID} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default PlaylistsRouter;
