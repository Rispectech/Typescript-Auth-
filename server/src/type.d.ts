import { Request } from "express";

interface authUserEntityResponse extends Request {
  user: {
    _id: string;
    verified: boolean;
    email: string;
  };
}

interface authClientEntityResponse extends Request {
  Client: {
    _id: string;
    verified: boolean;
    email: string;
  };
}

interface resetPasswordModelType {
  entityId: string;
  resetString: string;
  createdAt: number;
  expiresAt: number;
}

interface clientInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
