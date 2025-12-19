import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import theme from './theme';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import ChatPanel from './components/ChatPanel';
import DataPanel from './components/DataPanel';

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleNewData = () => {
    setRefresh(prev => !prev);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container style={{ height: '100vh', padding: '2rem' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ChatCRM
        </Typography>
        <Grid container spacing={2} style={{ height: '90%' }}>
          <Grid item xs={8}>
            <ChatPanel onNewData={handleNewData} />
          </Grid>
          <Grid item xs={4}>
            <DataPanel refresh={refresh} />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  )
}

export default App