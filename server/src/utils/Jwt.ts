import jwt from "jsonwebtoken";

const signJwt = (object: {}, options: {}) => {
  return jwt.sign(object, process.env.JWT_SECRET_KEY as string, {
    ...(options && options),
  });
};

const verifyJwt = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    return {
      verify: true,
      decoded,
      expired: false,
    };
  } catch (error: any) {
    console.log(error);
    return {
      verify: false,
      decoded: false,
      expired: error.message === "jwt expired",
    };
  }
};

export { signJwt, verifyJwt };
