let ENDPOINT = "";

if (process.env.NODE_ENV === "development") {
  ENDPOINT = "http://localhost:3001";
} else if (process.env.NODE_ENV === "production") {
  ENDPOINT = "https://teetotally-nonlaminable-maisha.ngrok-free.dev";
}

export default ENDPOINT;
