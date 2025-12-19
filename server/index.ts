import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory database
const db = {
  clients: [] as { id: number; name: string; email: string }[],
  notes: [] as { id: number; clientId: number; text: string }[],
};
let clientIdCounter = 1;
let noteIdCounter = 1;

app.get('/api/clients', (req, res) => {
  res.json(db.clients);
});

app.get('/api/notes', (req, res) => {
  res.json(db.notes);
});

app.post('/api/command', (req, res) => {
  const { command } = req.body;
  console.log(`Received command: ${command}`);

  let response = `Unknown command: "${command}"`;

  const addClientMatch = command.match(/add client (.*) email (.*)/i);
  if (addClientMatch) {
    const name = addClientMatch[1].trim();
    const email = addClientMatch[2].trim();
    const newClient = { id: clientIdCounter++, name, email };
    db.clients.push(newClient);
    response = `Added client: ${name} (${email})`;
  }

  const addNoteMatch = command.match(/add note for (.*): (.*)/i);
  if (addNoteMatch) {
    const clientName = addNoteMatch[1].trim();
    const noteText = addNoteMatch[2].trim();
    const client = db.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (client) {
      const newNote = { id: noteIdCounter++, clientId: client.id, text: noteText };
      db.notes.push(newNote);
      response = `Added note for ${client.name}`;
    } else {
      response = `Client not found: ${clientName}`;
    }
  }

  res.json({ response });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});