import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

async function refreshAccessToken(token) {
try {
const url =
"https://accounts.spotify.com/api/token?" +
new URLSearchParams({
client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
client_secret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
grant_type: "refresh_token",
refresh_token: token.refreshToken,
});

const response = await fetch(url, {
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  method: "POST",
});

const refreshedTokens = await response.json();

if (!response.ok) {
  throw refreshedTokens;
}

return {
  ...token,
  accessToken: refreshedTokens.access_token,
  accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
  refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
};
} catch (error) {
console.log(error);

return {
  ...token,
  error: "RefreshAccessTokenError",
};
}
}

export default NextAuth({
providers: [
SpotifyProvider({
clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
authorizationUrl: "https://accounts.spotify.com/authorize",
authorizationParams: {
scope:
"user-read-email playlist-read-private user-read-email streaming user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state user-read-recently-played user-follow-read",
},
}),
],

callbacks: {
async jwt({ token, user, account }) {
if (account && user) {
return {
accessToken: account.access_token,
accessTokenExpires: Date.now() + account.expires_in * 1000,
refreshToken: account.refresh_token,
user,
};
}

  if (Date.now() < token.accessTokenExpires) {
    return token;
  }

  return refreshAccessToken(token);
},
async session({ session, token }) {
  session.user = token.user;
  session.accessToken = token.accessToken;
  session.error = token.error;

  return session;
},
},

secret: process.env.NEXTAUTH_SECRET,
jwt: {
secret: process.env.NEXTAUTH_SECRET,
},
pages: {
signIn: "/login",
},
debug: process.env.NODE_ENV === "development",
cookies: {
secure: process.env.NODE_ENV === "production",
},
adapter: Adapters.Prisma.Adapter({ prisma }),
database: process.env.DATABASE_URL,
session: {
jwt: true,
},
baseUrl: process.env.NEXTAUTH_URL,
});