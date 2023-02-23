import { writeAsyncIterableToWritable } from "@remix-run/node";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "cloudinary";

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

async function uploadImage(
  data: AsyncIterable<Uint8Array>,
  folder: string = "misc"
) {
  const uploadPromise = new Promise<UploadApiResponse>(
    async (resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result!);
        }
      );
      await writeAsyncIterableToWritable(data, uploadStream);
    }
  );

  return uploadPromise;
}

async function uploadImageURL(file: string, folder: string = "misc") {
  const upload = await cloudinary.v2.uploader.upload(file, (error, result) => {
    if (error) {
      console.error(error);
      return null;
    }
    return result;
  });
  return upload;
}

export { hasSecureUrl, uploadImage, uploadImageURL };
