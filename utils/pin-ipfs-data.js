(async () => {
  const pinataSDK = require("@pinata/sdk");
  const fs = require("fs");
  require("dotenv").config();

  const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET,
  });

  await pinata.testAuthentication().then(console.log).catch(console.log);

  const pinFileToIPFS = async (filePath) => {
    const readableStreamForFile = fs.createReadStream(filePath);
    const fileName = filePath.split("/").pop();

    const options = { pinataMetadata: { name: fileName } };

    return pinata.pinFileToIPFS(readableStreamForFile, options);
  };

  const files = fs.readdirSync(`./ipfs-data/images`);
  const imageHashes = [];

  for await (const fileName of files) {
    const name = fileName.split(".")[0];
    const imageFilePath = `./ipfs-data/images/${fileName}`;
    const metadataFilePath = `./ipfs-data/jsons/${name}.json`;

    const fileStats = await fs.promises.stat(metadataFilePath).catch(() => false)
    
    if (!fileStats) {
      console.log(`File ${metadataFilePath} is not a file`);
      imageHashes.push("");
      return;
    }

    const { IpfsHash: imageHash } = await pinFileToIPFS(imageFilePath);
    imageHashes.push(imageHash);
    console.log(`File ${imageFilePath} pinned to IPFS with hash ${imageHash}`);
  }

  for await (const [i, imageHash] of imageHashes.entries()) {
    const metadataFilePath = `./ipfs-data/jsons/${i}.json`;

    const metadata = JSON.parse(fs.readFileSync(metadataFilePath, "utf8"));
    metadata.image = "ipfs://" + imageHash;
    await fs.promises.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
  }

  await pinata.pinFromFS("./ipfs-data/jsons", {
    pinataMetadata: { name: "MakNFT Metadata" },
  });
})();
