/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


// export default {
//   async fetch(request, env, ctx) {
//     return new Response('Hello World!');
//   },
// };

// export default {
//   async fetch(request, env, ctx) {
//     const url = new URL(request.url);

//     let destinationUrl;
//     let hostHeader;

//     // Determine destination based on the requested path
//     if (url.pathname === '/randomTexts') {
//       destinationUrl = 'http://129.151.160.170:9000/randomTexts';
//       hostHeader = '129.151.160.170';
//     } else if (url.pathname === '/submit') {
//       destinationUrl = 'http://129.151.160.170:9000/submit';
//       hostHeader = '129.151.160.170';
//     } else {
//       return new Response('Not Found', { status: 404 });
//     }

//     // Prepare the request to be sent to the destination server
//     const destinationRequest = new Request(destinationUrl, {
//       method: request.method,
//       headers: new Headers({
//         ...Object.fromEntries(request.headers),
//         'Host': hostHeader
//       }),
//       body: request.method === 'POST' ? await request.text() : null,
//     });

//     // Fetch response from the destination server
//     const destinationResponse = await fetch(destinationRequest);

//     // Create a response to be returned to the client
//     return new Response(destinationResponse.body, {
//       status: destinationResponse.status,
//       headers: destinationResponse.headers,
//     });
//   }
// };



import { Router } from 'itty-router';
import sanitizeHtml from 'sanitize-html';
import { MongoClient } from 'mongodb';

const router = Router();

const client = new MongoClient('mongodb+srv://spiritual_book:RDkGSiqFOnAWRqgJ@cluster0.fuern.gcp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  serverSelectionTimeoutMS: 3000,
  autoSelectFamily: false
});

const dbName = 'spiritial_book';

async function connectToDB() {
  if (!client.isConnected()) {
    await client.connect();
  }
  return client.db(dbName);
}

// Route for submitting content
router.post('/submit', async request => {
  try {
    const { content } = await request.json();
    const sanitizedContent = sanitizeHtml(content);
    // const filter = await getBadWordsFilter();
    // let flagged = filter.isProfane(sanitizedContent);

    const newText = {
      content: sanitizedContent,
      flagged: 'check' // replace with flagged variable if needed
    };

    const db = await connectToDB();
    const collection = db.collection('texts');
    await collection.insertOne(newText);

    return new Response('Content saved!', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('An error occurred', { status: 500 });
  }
});

// Route for getting random texts
router.get('/randomTexts', async request => {
  try {
    const db = await connectToDB();
    const collection = db.collection('texts');
    const texts = await collection.aggregate([{ $sample: { size: 10 } }]).toArray();

    return new Response(JSON.stringify(texts), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return new Response('An error occurred', { status: 500 });
  }
});

// Handle all other routes
router.all('*', () => new Response('Not Found', { status: 404 }));

addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request));
});

