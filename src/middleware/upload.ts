import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "input/",

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);

    const uniqueName =
      `upload_${Date.now()}${extension}`;

    callback(null, uniqueName);
  }
});

export const upload = multer({
  storage
});