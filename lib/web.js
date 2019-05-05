/**
 * Basic Web Server (mainly so Heroku doesn't complain)
 */

const express = require('express')
const path = require('path')
const port = process.env.PORT || 3000
const app = express()


app.get('*', function (request, response) {
    response.sendFile(path.resolve(__dirname, "../", "index.html"))
})

app.listen(port)
console.log("Server started on port " + port)