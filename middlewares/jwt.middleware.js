const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer" &&
    req.headers.authorization.split(" ")[1]
  ) {
    try {
      const theTokenInTheHeaders = req.headers.authorization.split(" ")[1];
      const theDataInTheToken = jwt.verify(
        theTokenInTheHeaders,
        process.env.TOKEN_SECRET
      );

      req.payLoad = theDataInTheToken;
      next();
    } catch (err) {
      console.log(err);
      res.status(403).json({ errorMessage: "invalid Token" });
    }
  } else {
    res.status(403).json({ errorMessage: "No token found" });
  }
}

module.exports = { isAuthenticated };
