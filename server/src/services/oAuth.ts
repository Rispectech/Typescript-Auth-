import qs from "querystring";
import axios from "axios";

const getGoogleOauthToken = async (code: string) => {
  const url = "https://oauth2.googleapis.com/token";
  try {
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      grant_type: "authorization_code",
    };

    console.log(values);
    const res = await axios.post(url, qs.stringify(values), {
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
    });

    return res.data;
  } catch (error) {
    console.log(error);
  }
};

const getGoogleUser = async (id_token: string, access_token: string) => {
  try {
    const res = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export { getGoogleOauthToken, getGoogleUser };
