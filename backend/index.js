const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const sanitizeHtml = require('sanitize-html');
const cors = require('cors');

// Import the 'bad-words' package dynamically
async function getBadWordsFilter() {
    const badWordsFilter = await import('bad-words');
    return new badWordsFilter.default();
}

const app = express();
const port = process.env.PORT || 9000;

// Enable CORS for all routes
app.use(cors());

// MongoDB connection
// const url = 'mongodb://localhost:27017';
const url = 'mongodb+srv://spiritual_book:RDkGSiqFOnAWRqgJ@cluster0.fuern.gcp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'spiritial_book';
// const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
const client = new MongoClient(url, {
    serverSelectionTimeoutMS: 3000,
    autoSelectFamily: false}
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/submit', async (req, res) => {
    // const filter = await getBadWordsFilter();
    
    let content = sanitizeHtml(req.body.content);
    // let flagged = filter.isProfane(content);

    
    if(!content){  //empty input
        return;
    }
    
    const newText = {
        content: content,
        // flagged: flagged,
        flagged:'check'
    };

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('texts');
        await collection.insertOne(newText);
        res.send('Content saved!');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    } finally {
        await client.close();
    }
});

app.get('/randomTexts', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('texts');
        // const texts = await collection.aggregate([{ $sample: { size: 10 } }]).toArray();
        const texts = await collection.find({
            flagged: 'check'
        }).toArray();
        res.json(texts);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
