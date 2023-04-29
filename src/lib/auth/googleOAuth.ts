import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import UsersModel from "../../api/users/model";
import { createAccessToken } from "./tools";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, API_DEV_URL } = process.env;

const googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID!,
    clientSecret: GOOGLE_CLIENT_SECRET!,
    callbackURL: `${API_DEV_URL}/users/googleLogin`,
  },
  async (_, __, profile, passportNext) => {
    try {
      const { email, given_name, family_name, sub, picture } = profile._json;
      const user = await UsersModel.findOne({ email });
      if (user) {
        const accessToken = await createAccessToken({
          _id: user._id,
          email: user.email,
        });
        passportNext(null, { accessToken });
      } else {
        const newUser = new UsersModel({
          name: given_name,
          surname: family_name,
          email,
          avatar: picture,
          googleID: sub,
          password: Math.random().toString(36).slice(-10),
        });
        const { _id } = await newUser.save();
        const accessToken = await createAccessToken({
          _id,
          email: newUser.email,
        });
        passportNext(null, { accessToken });
      }
    } catch (error) {
      passportNext(error as Error);
    }
  }
);

export interface IGoogleLoginReq {
  accessToken: string;
}

export default googleStrategy;
