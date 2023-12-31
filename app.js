const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const asyncHandler = require("express-async-handler");
const lyricsFinder = require("lyrics-finder");
require("dotenv").config();

const port = process.env.PORT;
console.clear();
console.log(`Me alive 🤨 on port ${port}`);
const app = express();
const tokenURL = "https://accounts.spotify.com/api/token";
const redirectUrl = process.env.REDIRECT_URL;
const authorizationBase64 =
  "Basic " +
  Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET).toString(
    "base64"
  );
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    const code = req.body.code;

    console.log(code)
    await fetch(tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorizationBase64,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUrl,
      }),
    })
      .then((resoult) => {
        resoult.json().then((data) => {
          if (data.error) {
            console.log("Something went wrong 😵");
            return res.json({
              errors: {
                ...data,
              },
            });
          }
          console.log("Login successful! 🥱");
          return res.json({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
          });
        });
      })
      .catch((e) => {
        console.error(e);
        return res.status(500);
      });
  })
);

app.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken;
    fetch(tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorizationBase64,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        redirect_uri: redirectUrl,
      }),
    })
      .then((resoult) => {
        resoult.json().then((data) => {
          if (data.error) {
            console.log("Something went wrong 😵");
            return res.json({
              errors: {
                ...data,
              },
            });
          }
          console.log("Token is refreshed successfully 🙂");
          return res.json({
            accessToken: data.access_token,
            tokenType: data.token_type,
            scope: data.scope,
            expiresIn: data.expires_in,
          });
        });
      })
      .catch((e) => {
        console.error(e);
        return res.status(500);
      });
  })
);

app.get(
  "/lyrics",
  asyncHandler(async (req, res) => {
    const lyrics =
      (await lyricsFinder(req.query.artist, req.query.track)) ||
      "No Lyrics Found";
    res.json({ lyrics });
  })
);

app.listen(port);
