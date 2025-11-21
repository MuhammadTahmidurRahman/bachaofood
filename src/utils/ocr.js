import Tesseract from "tesseract.js";

export async function extractText(imageFile) {
  const result = await Tesseract.recognize(imageFile, "eng", {
    logger: (m) => console.log(m),
  });

  return result.data.text;
}
