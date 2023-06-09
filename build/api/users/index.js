"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const model_1 = __importDefault(require("./model"));
const cloudinary_1 = require("../../lib/cloudinary");
const jwt_1 = require("../../lib/auth/jwt");
const tools_1 = require("../../lib/auth/tools");
const passport_1 = __importDefault(require("passport"));
const middlewares_1 = require("../../lib/middlewares");
const mail_1 = require("../../lib/mail");
const UsersRouter = express_1.default.Router();
// Register
UsersRouter.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const emailInUse = yield model_1.default.exists({ email: req.body.email });
        if (!emailInUse) {
            const newUser = new model_1.default(req.body);
            const user = yield newUser.save();
            const payload = {
                _id: user._id,
                email: user.email,
                verified: user.verified,
            };
            const accessToken = yield (0, tools_1.createAccessToken)(payload);
            const verificationToken = yield (0, tools_1.createVerificationToken)(payload);
            const verifyURL = `${process.env.API_URL}/users/verify?token=${verificationToken}`;
            (0, mail_1.sendVerifyMail)(user.email, verifyURL);
            res.status(201).send({
                user,
                accessToken,
            });
        }
        else {
            next((0, http_errors_1.default)(400, "The email is already in use!"));
        }
    }
    catch (error) {
        next(error);
    }
}));
// Verify the user
UsersRouter.get("/verify", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.query.token;
        if (token) {
            const { _id, email } = yield (0, tools_1.verifyVerificationToken)(token);
            const user = yield model_1.default.findOneAndUpdate({ _id, email }, { verified: true }, { new: true });
            if (user) {
                if (user.verified)
                    res.redirect(`${process.env.FE_URL}/verified?v=true&u=true`);
                else
                    res.redirect(`${process.env.FE_URL}/verified?v=false&u=true`);
            }
            else
                res.redirect(`${process.env.FE_URL}/verified?v=false&u=false`);
        }
        else {
            next((0, http_errors_1.default)(400, "No verification token in the URL!"));
        }
    }
    catch (error) {
        next(error);
    }
}));
// Login
UsersRouter.post("/session", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield model_1.default.checkCredentials(email, password);
        if (user) {
            const payload = {
                _id: user._id,
                email: user.email,
                verified: user.verified,
            };
            const accessToken = yield (0, tools_1.createAccessToken)(payload);
            res.send({ user, accessToken });
        }
    }
    catch (error) {
        next(error);
    }
}));
// Login with Google
UsersRouter.get("/googleLogin", passport_1.default.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
}), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.redirect(`${process.env.FE_URL}/googleRedirect?accessToken=${req.user.accessToken}`);
    }
    catch (error) {
        next(error);
    }
}));
// Get all the users in the DB
UsersRouter.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield model_1.default.find();
        res.send(users);
    }
    catch (error) {
        next(error);
    }
}));
//  Get users own info
UsersRouter.get("/me", jwt_1.JWTTokenAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield model_1.default.findById(req.user._id)
            .populate({
            path: "watchlists likedWatchlists",
            populate: {
                path: "members",
                model: "user",
                select: "_id name surname",
            },
            select: "_id name cover members movies likes",
        })
            .populate({
            path: "followers following",
            model: "user",
            select: "_id name surname avatar followers",
        });
        res.send(user);
    }
    catch (error) {
        next(error);
    }
}));
// Edit user
UsersRouter.put("/me", jwt_1.JWTTokenAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield model_1.default.findOneAndUpdate({ _id: req.user._id }, req.body, { new: true, runValidators: true })
            .populate({
            path: "watchlists likedWatchlists",
            populate: {
                path: "members",
                model: "user",
                select: "_id name surname",
            },
            select: "_id name cover members movies likes",
        })
            .populate({
            path: "followers following",
            model: "user",
            select: "_id name surname avatar followers",
        });
        res.send(user);
    }
    catch (error) {
        next(error);
    }
}));
// Get a user by their ID
UsersRouter.get("/:userID", jwt_1.JWTTokenAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield model_1.default.findById(req.params.userID)
            .populate({
            path: "watchlists likedWatchlists",
            populate: {
                path: "members",
                model: "user",
                select: "_id name surname",
            },
            select: "_id name cover members movies likes",
        })
            .populate({
            path: "followers following",
            model: "user",
            select: "_id name surname avatar followers",
        });
        if (user)
            res.send(user);
        else
            next((0, http_errors_1.default)(404, `User with the ID of ${req.params.userID} not found!`));
    }
    catch (error) {
        next(error);
    }
}));
// Upload avatar
UsersRouter.post("/me/avatar", jwt_1.JWTTokenAuth, cloudinary_1.avatarUploader, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.file) {
            yield model_1.default.findByIdAndUpdate(req.user._id, {
                avatar: req.file.path,
            });
            res.send({ avatarURL: req.file.path });
        }
        else {
            next((0, http_errors_1.default)(400, "Please provide an image file!"));
        }
    }
    catch (error) {
        next(error);
    }
}));
// Delete current avatar
UsersRouter.delete("/me/avatar", jwt_1.JWTTokenAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield model_1.default.findByIdAndUpdate(req.user._id, {
            avatar: "https://res.cloudinary.com/yasirdev/image/upload/v1684314041/WhataMovie/users/avatars/user_default.jpg",
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}));
// Follow
UsersRouter.post("/follow/:userID", jwt_1.JWTTokenAuth, middlewares_1.checkFollows, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // (req as IFollowChecks).user1 will follow (req as IFollowChecks).user2
    try {
        const user1 = req.user1;
        const user2 = req.user2;
        if (!req.ImFollowingThem) {
            user1.following = [...user1.following, user2._id];
            yield user1.save();
            user2.followers = [...user2.followers, user1._id];
            const user = yield (yield user2.save()).populate({
                path: "followers following",
                model: "user",
                select: "_id name surname avatar followers",
            });
            res.send({
                message: `Following ${user2.name} ${user2.surname}!`,
                followers: user.followers,
                following: user.following,
            });
        }
        else {
            next((0, http_errors_1.default)(400, "You're already following this user!"));
        }
    }
    catch (error) {
        next(error);
    }
}));
// Unfollow
UsersRouter.delete("/follow/:userID", jwt_1.JWTTokenAuth, middlewares_1.checkFollows, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // (req as IFollowChecks).user1 will unfollow (req as IFollowChecks).user2
    try {
        const user1 = req.user1;
        const user2 = req.user2;
        if (req.ImFollowingThem) {
            user1.following = user1.following.filter((id) => id.toString() !== user2._id.toString());
            yield user1.save();
            user2.followers = user2.followers.filter((id) => id.toString() !== user1._id.toString());
            const user = yield (yield user2.save()).populate({
                path: "followers following",
                model: "user",
                select: "_id name surname avatar followers",
            });
            res.send({
                message: `Unfollowed ${user2.name} ${user2.surname}!`,
                followers: user.followers,
                following: user.following,
            });
        }
        else {
            next((0, http_errors_1.default)(400, "You've already unfollowed this user!"));
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = UsersRouter;
