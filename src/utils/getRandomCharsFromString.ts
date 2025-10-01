export const getRandomCharsFromString = (str: string, length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * str.length);
    result += str[randomIndex];
  }
  return result.toUpperCase();
};
