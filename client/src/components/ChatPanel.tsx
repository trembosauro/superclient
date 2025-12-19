import { useState } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, Paper } from '@mui/material';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const ChatPanel = ({ onNewData }: { onNewData: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { sender: 'user' as const, text: input.trim() };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      try {
        const response = await fetch('http://localhost:3001/api/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command: input.trim() }),
        });
        const data = await response.json();
        const botMessage = { sender: 'bot' as const, text: data.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
        onNewData(); // Trigger refresh
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = { sender: 'bot' as const, text: 'Sorry, I am having trouble connecting to the server.' };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    }
  };

  return (
    <Paper style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index}>
              <ListItemText primary={msg.text} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 2, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button variant="contained" color="primary" onClick={handleSend} sx={{ ml: 1 }}>
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
