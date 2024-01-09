const express = require("express");
const multer = require("multer");
const { s3Uploadv2, s3Uploadv3 } = require("./s3Service");
const uuid = require("uuid").v4;
require("dotenv").config();

const app = express();

// const upload = multer({
//   // dest: what folder you want to upload on server
//   dest: "uploads/",
// });

// => comment dòng này với case 4

//1. upload single file
// app.post("/upload", upload.single("file"), (req, res) => {
//   res.json({ status: "ok" });
// });

//2. upload multiple files
// - tham số thử 2 của array sẽ là số lượng file tối đa ng dùng có thể đẩy lên
// app.post("/upload", upload.array("file", 2), (req, res) => {
//   res.json({ status: "ok" });
// });

//3. multiple fields upload
// const multiUpload = upload.fields([
//   { name: "avatar", maxCount: 1 },
//   { name: "resume", maxCount: 1 },
// ]);

// app.post("/upload", multiUpload, (req, res) => {
//   console.log(req.files);
//   res.json({ status: "ok" });
// });

//4. custom file name
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads");
//   },
//   filename: (req, file, cb) => {
//     const { originalname } = file;
//     cb(null, `${uuid()}-${originalname}`);
//     // => đặt tên tệp
//   },
// });

//5. AWS-S3

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

const upload = multer({
  storage,
  // fileFilter,
  limits: { limits: 2 },
  // The unit is bite
});

// => Dùng files ở limits, thì ko dùng maxCount ở upload.fields

const multiUpload = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);

// AWS-SDK_V2
// app.post("/upload", upload.array("file"), async (req, res) => {
//   try {
//     const results = await s3Uploadv2(req.files);
//     console.log("results", results);
//     return res.json({ status: "ok", results });
//   } catch (err) {}
// });

// AWS-SDK_V3
app.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const results = await s3Uploadv3(req.files);
    console.log("results", results);
    return res.json({ status: "ok", results });
  } catch (err) {
    console.log(err);
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.json({ message: "File size is too large" });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.json({ message: "File limit reached" });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.json({ message: "File is not of the correct type" });
    }
  }
});

app.listen(4000, () => console.log("Listening on port 4000"));
