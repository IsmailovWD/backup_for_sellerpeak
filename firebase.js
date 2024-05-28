import config from './firebaseConfig.js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config()

initializeApp(config)
const SERVER_NAME = process.env.SERVER_NAME;
const storage = getStorage()

const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = SERVER_NAME + " | "+ date + ' ' + time;
    return dateTime;
}

export async function uploadFunc(filePath) {
    const dateTime = giveCurrentDateTime();
    const storageRef = ref(storage, `files/${dateTime}.zip`);
    const metadata = {
        contentType: 'application/zip',
    };

    fs.readFile(filePath, async(err, data) => {
        const stub = await uploadBytesResumable(storageRef, data, metadata);
    })
}