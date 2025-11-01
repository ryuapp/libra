import ky from "ky";

// Create a ky instance with default User-Agent header
export const httpClient = ky.extend({
  headers: {
    "User-Agent": "Libra/1.0 (+https://libra.ryu.app)",
  },
});
