import bycrpt from "bcrypt";

const generateHash = async (value: string) => {
  const saltRounds = 10;
  return bycrpt.hashSync(value, saltRounds);
};

const compareHash = async (value: string, hash: string) => {
  console.log(value, hash);
  return bycrpt.compareSync(value, hash);
};

export { generateHash, compareHash };
