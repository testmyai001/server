
const fs = require('fs');
const path = require('path');

const deleteFolderRecursive = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        try {
          fs.unlinkSync(curPath);
        } catch (e) {
          console.error(`Failed to delete file: ${curPath}`, e.message);
        }
      }
    });
    try {
      fs.rmdirSync(directoryPath);
      console.log(`Deleted directory: ${directoryPath}`);
    } catch (e) {
      console.error(`Failed to delete directory: ${directoryPath}`, e.message);
    }
  }
};

deleteFolderRecursive(path.resolve('release'));
