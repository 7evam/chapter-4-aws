const express = require("express");
const aws = require("@aws-sdk/client-s3")

//
// Throws an error if the any required environment variables are missing.
//

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error("Please specify the access key ID for an AWS IAM user in environment variable AWS_ACCESS_KEY_ID.");
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Please specify the secret access key for an AWS IAM user in environment variable AWS_SECRET_ACCESS_KEY.");
}

if (!process.env.AWS_BUCKET) {
    throw new Error("Please specify the name of your bucket in environment variable AWS_BUCKET.");
}

//
// Extracts environment variables to globals for convenience.
//
const port = process.env.PORT
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const bucketName = process.env.AWS_BUCKET


const s3Client = new aws.S3Client({
    region: 'us-east-2',
    accessKeyId,
    secretAccessKey
});

function getObjectParams(Key) {
    return {
        Bucket: bucketName,
        Key
    }
};

console.log(`Serving videos from AWS account with access key id ${accessKeyId}.`);

//
// Function to fetch video file from S3
//
async function fetchFileFromS3(fileName) {
    try {
        const { Body, ContentLength } = await s3Client.send(new aws.GetObjectCommand(getObjectParams(fileName)));
        return { Body, ContentLength }
    } catch (e) {
        console.error('error fetching file from s3')
        console.error(e)
    }
}

const app = express();

//
// Registers a HTTP GET route to retrieve videos from storage.
//
app.get("/video", async (req, res) => {

    const videoPath = req.query.path;
    console.log(`Streaming video from path ${videoPath}.`);

    const videoStream = await fetchFileFromS3(videoPath);

    res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": videoStream.ContentLength
    })
    videoStream.Body.pipe(res);
});

//
// Starts the HTTP server.
//
app.listen(port, () => {
    console.log(`Microservice online`);
});
