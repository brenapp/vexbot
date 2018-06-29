import express from "express";
import path from "path";
const port = process.env.PORT || 3000;
const app = express();

app.get("*", function(request, response) {
  response.sendFile(path.resolve(__dirname, "index.html"));
});

app.listen(port);
console.log("Server started on port " + port);
