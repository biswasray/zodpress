import * as fs from "fs";
import * as path from "path";

export function writeStringToFile(fileName: string, content: string): void {
  const filePath = path.join(__dirname, fileName);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log(`File "${fileName}" written successfully!`);
    }
  });
}
