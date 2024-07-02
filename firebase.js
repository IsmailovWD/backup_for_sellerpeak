import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import dotenv from 'dotenv';
import config from './firebaseConfig.js'; // Ensure this file has correct Firebase config

dotenv.config();

initializeApp(config);

const SERVER_NAME = process.env.SERVER_NAME;
const storage = getStorage();
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const auth = getAuth();

const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = SERVER_NAME + " | "+ date + ' ' + time;
    return dateTime;
}

export async function uploadFunc(filePath) {
    // try {
        await signInWithEmailAndPassword(auth, email, password).catch((error) => {
            console.error("Error in signInWithEmailAndPassword:", error);
        });
        console.log("User signed in successfully");

        const dateTime = giveCurrentDateTime();
        const storageRef = ref(storage, `files/${dateTime}.zip`);
        const metadata = {
            contentType: 'application/zip',
        };

        fs.readFile(filePath, async (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return;
            }
            try {
                await uploadBytesResumable(storageRef, data, metadata);
                console.log("File uploaded successfully");
            } catch (error) {
                console.error("Error uploading file:", error);
            }
        });
    // } catch (error) {
    //     console.error("Error in uploadFunc:", error);
    // }
}
