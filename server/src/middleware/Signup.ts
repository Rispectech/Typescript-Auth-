import { NextFunction, Request, Response } from "express";

var emailRegex =
  /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isEmailValid(email: string) {
  if (!email) return false;

  if (email.length > 254) return false;

  var valid = emailRegex.test(email);
  if (!valid) return false;

  // Further checking of some things regex can't handle
  var parts = email.split("@");
  if (parts[0].length > 64) return false;

  var domainParts = parts[1].split(".");
  if (
    domainParts.some(function (part: string) {
      return part.length > 63;
    })
  )
    return false;

  return true;
}

const checkSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // console.log(req.body);
    const body = req.body;
    console.log(body);
    if (!isEmailValid(body.email)) {
      //   res.status(500).json({ status: "failure", message: "Email not valid" });
      return res.status(500).json({ status: "failure", message: "Email not valid" });
    }

    if (body.password !== body.confirmPassword) {
      //   res.status(500).json({ status: "failure", message: "" });
      return res.status(500).json({ status: "failure", message: "Password dont match" });
    }
    req.body = body;

    next();
  } catch (error) {
    return next();
  }
};

export { checkSignup };
