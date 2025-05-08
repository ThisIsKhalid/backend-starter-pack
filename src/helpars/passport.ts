import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import {Strategy as FacebookStrategy} from "passport-facebook";
import prisma from "../shared/prisma";
import {Provider, UserRole} from "@prisma/client";
import config from "../config";


passport.use(
    new GoogleStrategy(
        {
            clientID: config.google_client_id!,
            clientSecret: config.google_client_secret!,
            callbackURL: `${config.callback_url}/auth/callback/google`,
        },
        async (_, __, profile, done) => {
            try {
                console.log(profile)

                if (profile.emails) {
                    const data = {
                        uniqueId: profile.id,
                        email: profile.emails?.[0].value || "",
                        name: profile.displayName,
                        profileImage: profile.photos?.[0].value || "",
                    }
                    done(null, data);
                }
            } catch (err) {
                done(err, false);
            }
        }
    )
);

passport.use(
    new FacebookStrategy(
        {
            clientID: config.facebook_client_id!,
            clientSecret: config.facebook_client_secret!,
            callbackURL: `${config.callback_url}/auth/facebook/callback`,
            profileFields: ["id", "emails", "displayName"],
        },
        async (_, __, profile, done) => {
            try {
                console.log(profile)

                const profileImage = `https://graph.facebook.com/${profile.id}/picture?type=large`;

                const data = {
                    uniqueId: profile.id,
                    email: profile.emails?.[0].value || "",
                    name: profile.displayName,
                    profileImage
                }

                return done(null, data);
            } catch (err) {
                return done(err);
            }
        }
    )
);

export default passport;