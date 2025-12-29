'use server';

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function uploadPhoto(formData: FormData) {
    const file = formData.get('photo') as File;
    if (!file) {
        return { error: 'No photo provided.' };
    }

    try {
        const fileBuffer = await file.arrayBuffer();
        const mime = file.type;
        const encoding = 'base64';
        const base64Data = Buffer.from(fileBuffer).toString('base64');
        const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;

        const result = await cloudinary.uploader.upload(fileUri, {
            folder: 'csm-profile-photos'
        });

        if (result.secure_url) {
            return { success: true, url: result.secure_url };
        } else {
            return { error: 'Cloudinary upload failed.' };
        }
    } catch (error: any) {
        console.error('Upload action error:', error);
        return { error: error.message };
    }
}
