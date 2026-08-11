import multer from "multer";
import path from "path";

const allowedExtensions = [
  ".mp4",
  ".mov",
  ".mkv",
  ".webm"
];

const storage = multer.diskStorage({
  destination: "input/",

  filename: (req, file, callback) => {
    const extension =
      path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `upload_${Date.now()}${extension}`;

    callback(null, uniqueName);
  }
});

const fileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  callback
) => {
  const extension =
    path.extname(file.originalname).toLowerCase();

  console.log(
    `Upload: ${file.originalname}, MIME: ${file.mimetype}`
  );

  if (!allowedExtensions.includes(extension)) {
    callback(
      new Error(
        "Invalid file type. Only MP4, MOV, MKV, and WEBM videos are allowed."
      )
    );

    return;
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  }
});