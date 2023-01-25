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
