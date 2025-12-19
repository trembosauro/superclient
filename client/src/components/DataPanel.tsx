import { useState, useEffect } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Button, Divider } from '@mui/material';

interface Client {
  id: number;
  name: string;
  email: string;
}

interface Note {
  id: number;
  clientId: number;
  text: string;
}

const DataPanel = ({ refresh }: { refresh: boolean }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const fetchData = async () => {
    try {
      const clientsRes = await fetch('http://localhost:3001/api/clients');
      const clientsData = await clientsRes.json();
      setClients(clientsData);

      const notesRes = await fetch('http://localhost:3001/api/notes');
      const notesData = await notesRes.json();
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  return (
    <Paper style={{ height: '100%', padding: '1rem', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Clients
      </Typography>
      <List dense>
        {clients.map(client => (
          <ListItem key={client.id}>
            <ListItemText primary={client.name} secondary={client.email} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>
        Notes
      </Typography>
      <List dense>
        {notes.map(note => {
            const client = clients.find(c => c.id === note.clientId);
            return (
                <ListItem key={note.id}>
                    <ListItemText primary={note.text} secondary={client ? `For: ${client.name}`: ''} />
                </ListItem>
            )
        })}
      </List>
    </Paper>
  );
};

export default DataPanel;
