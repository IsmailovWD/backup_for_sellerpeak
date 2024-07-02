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
cron.schedule("00 23 * * *", () => {
  // (() => {
    console.log("Operation started!");
    // connect to the MySQL server
    const connection = mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });
    connection.connect((err) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        return;
      }
  
      console.log("connected as id " + connection.threadId);
  
      // check if the backups directory exists, and create it if necessary
      if (fs.existsSync("backups")) {
        fs.rm("backups", { recursive: true }, (error) => {
          if (error) {
            console.error(`Failed to delete folder: ${error}`);
          } else {
            console.log("Folder deleted successfully");
            fs.mkdirSync("backups");
            if (fs.existsSync("backups.zip")) {
              fs.unlink("backups.zip", (error) => {
                if (error) {
                  console.error(`Failed to delete file: ${error}`);
                } else {
                  console.log("File deleted successfully");
                  // execute the command to backup each database separately
                  connection.query("show databases", (error, results, fields) => {
                    if (error) {
                      console.error("error fetching databases: " + error);
                      return;
                    }
  
                    const expectedBackups = results.length;
                    let successfulBackups = 0;
                    results.forEach((result) => {
                      const database = result.Database;
                      const fileName = `backups/${database}.sql.gz`;
  
                      const cmd = `mysqldump --skip-lock-tables --databases ${database} | gzip > ${fileName}`;
                      exec(cmd, (err) => {
                        if (err) {
                          console.error(`error backing up ${database}: ` + err);
                        } else {
                          console.log(
                            `successfully backed up ${database} to ${fileName}`
                          );
                          successfulBackups++;
                          if (successfulBackups === expectedBackups) {
                            const output = fs.createWriteStream("backups.zip");
                            const archive = archiver("zip", {
                              zlib: { level: 9 },
                            });
  
                            output.on("close", () => {
                              console.log("successfully created backups.zip");
                              const filePath = "backups.zip";
                              //upload to firebase start
                              uploadFunc(filePath);
                            });
  
                            archive.on("error", (err) => {
                              console.error("error creating backups.zip: " + err);
                            });
  
                            archive.pipe(output);
                            archive.directory("backups", false);
                            archive.finalize();
                            // Path to the file to send
                            //send file to bot
  
                            // close the connection to the MySQL server once all databases are backed up
                            connection.end();
                          }
                        }
                      });
                    });
                  });
                }
              });
            }else {
              console.log("File deleted successfully");
              // execute the command to backup each database separately
              connection.query("show databases", (error, results, fields) => {
                if (error) {
                  console.error("error fetching databases: " + error);
                  return;
                }

                const expectedBackups = results.length;
                let successfulBackups = 0;
                results.forEach((result) => {
                  const database = result.Database;
                  const fileName = `backups/${database}.sql.gz`;

                  const cmd = `mysqldump --skip-lock-tables --databases ${database} | gzip > ${fileName}`;
                  exec(cmd, (err) => {
                    if (err) {
                      console.error(`error backing up ${database}: ` + err);
                    } else {
                      console.log(
                        `successfully backed up ${database} to ${fileName}`
                      );
                      successfulBackups++;
                      if (successfulBackups === expectedBackups) {
                        const output = fs.createWriteStream("backups.zip");
                        const archive = archiver("zip", {
                          zlib: { level: 9 },
                        });

                        output.on("close", () => {
                          console.log("successfully created backups.zip");
                          const filePath = "backups.zip";
                          //upload to firebase start
                          uploadFunc(filePath);
                        });

                        archive.on("error", (err) => {
                          console.error("error creating backups.zip: " + err);
                        });

                        archive.pipe(output);
                        archive.directory("backups", false);
                        archive.finalize();
                        // Path to the file to send
                        //send file to bot

                        // close the connection to the MySQL server once all databases are backed up
                        connection.end();
                      }
                    }
                  });
                });
              });
            }
          }
        });
      }else{
        console.log("Folder deleted successfully");
      }
    });
    // process.exit(1)
  // })()
});
// set cron
