import type { UploadApiResponse } from "cloudinary";
import cloudinary from "cloudinary";
import type { Stream } from "stream";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function hasSecureUrl(obj: unknown): obj is UploadApiResponse {
  return (
    typeof obj === "object" &&
    typeof (obj as UploadApiResponse).secure_url === "string"
  );
}

async function uploadImage(fileStream: Stream, folder: string = "misc") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      }
    );
    fileStream.pipe(uploadStream);
  });
}

export { hasSecureUrl, uploadImage };
