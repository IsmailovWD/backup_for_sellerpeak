import { exec } from "child_process";
import fs from "fs";
import mysql from "mysql";
import archiver from "archiver";
import dotenv from "dotenv";
import cron from "node-cron";
import { uploadFunc } from "./firebase.js";
dotenv.config();

// create a connection to the MySQL server
const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST;
const DB_PASS = process.env.DB_PASS;
console.log("Back up cron job is set!");
//set cron
//0 20 * * *
//cron.schedule("00 23 * * *", () => {
(() => {
  console.log("Operation started!");
  // connect to the MySQL server
  const DB_USER = process.env.DB_USER;
  const DB_HOST = process.env.DB_HOST;
  const DB_PASS = process.env.DB_PASS;

  const pool = mysql.createPool({
    connectionLimit: 10, // Set the connection limit as needed
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    connectTimeout: 60000, // 60 seconds
  });

  // Function to remove existing backups directory
  const clearBackupsDirectory = (callback) => {
    if (fs.existsSync("backups")) {
      fs.rm("backups", { recursive: true }, (error) => {
        if (error) {
          console.error(`Failed to delete folder: ${error}`);
        } else {
          console.log("Folder deleted successfully");
        }
        callback();
      });
    } else {
      console.log("No existing backups folder found.");
      callback();
    }
  };

  // Function to backup a single database
  const backupDatabase = (database, callback) => {
    const fileName = `backups/${database}.sql.gz`;
    const cmd = `mysqldump --skip-lock-tables --databases ${database} | gzip > ${fileName}`;

    exec(cmd, (err) => {
      if (err) {
        console.error(`Error backing up ${database}: ` + err);
      } else {
        console.log(`Successfully backed up ${database} to ${fileName}`);
      }
      callback(err);
    });
  };

  // Function to create a zip archive of backups
  const createBackupZip = (callback) => {
    const output = fs.createWriteStream("backups.zip");
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log("Successfully created backups.zip");
      callback(null);
    });

    archive.on("error", (err) => {
      console.error("Error creating backups.zip: " + err);
      callback(err);
    });

    archive.pipe(output);
    archive.directory("backups/", false);
    archive.finalize();
  };

  // Main backup function
  const performBackup = () => {
    console.log("Operation started!");

    clearBackupsDirectory(() => {
      fs.mkdirSync("backups");

      pool.query("SHOW DATABASES", (error, results) => {
        if (error) {
          console.error("Error fetching databases: " + error);
          pool.end();
          return;
        }

        const expectedBackups = results.length;
        let successfulBackups = 0;

        results.forEach((result) => {
          backupDatabase(result.Database, (err) => {
            if (!err) {
              successfulBackups++;
            }

            if (successfulBackups === expectedBackups) {
              createBackupZip((err) => {
                if (!err) {
                  // Upload to Firebase
                  uploadFunc("backups.zip");
                }
                pool.end(); // Close the pool after all backups are done
              });
            }
          });
        });
      });
    });
  };
  // process.exit(1)
})()
//});
// set cron
