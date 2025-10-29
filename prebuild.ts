// See https://github.com/denoland/fresh/issues/3402#issuecomment-3357527216
const content = "export default {};\n";
const dirPath = "_fresh";
const filePath = `${dirPath}/server.js`;

try {
  await Deno.mkdir(dirPath, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    throw error;
  }
}

await Deno.writeTextFile(filePath, content);
