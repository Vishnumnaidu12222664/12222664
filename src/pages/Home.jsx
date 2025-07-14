import React, { useState } from 'react';
import {
  Container, TextField, Button, Typography, Grid, Card, CardContent,
  Snackbar, Alert, Box, Divider, Paper
} from '@mui/material';
import { validateURL, validateShortcode, validateMinutes } from '../utils/validation';
import { Log } from '../middleware/logger';

const MAX_URLS = 5;

const Home = () => {
//   const [inputs, setInputs] = useState(Array(MAX_URLS).fill({ url: '', shortcode: '', validity: '' }));
const [inputs, setInputs] = useState(
  Array.from({ length: MAX_URLS }, () => ({ url: '', shortcode: '', validity: '' }))
);

  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (index, field, value) => {
    const updated = [...inputs];
    updated[index][field] = value;
    setInputs(updated);
  };

  const handleSubmit = async () => {
    const validEntries = [];

    for (let i = 0; i < inputs.length; i++) {
      const { url, shortcode, validity } = inputs[i];

      if (!url.trim()) continue;

      if (!validateURL(url)) {
        setError(` Invalid URL at row ${i + 1}`);
        await Log({ stack: 'frontend', level: 'warn', pkg: 'utils', message: `Invalid URL entered: ${url}` });
        return;
      }

      if (shortcode && !validateShortcode(shortcode)) {
        setError(` Invalid shortcode at row ${i + 1}`);
        await Log({ stack: 'frontend', level: 'warn', pkg: 'utils', message: `Invalid shortcode: ${shortcode}` });
        return;
      }

      if (validity && !validateMinutes(validity)) {
        setError(` Invalid validity at row ${i + 1}`);
        await Log({ stack: 'frontend', level: 'warn', pkg: 'utils', message: `Invalid validity: ${validity}` });
        return;
      }

      validEntries.push({
        longUrl: url,
        shortcode: shortcode || generateRandomCode(),
        validity: validity ? parseInt(validity) : 30,
      });
    }

    if (validEntries.length === 0) {
      setError('Please enter at least one valid URL.');
      return;
    }

    const now = new Date();
    const newResults = validEntries.map((entry) => {
      const expiry = new Date(now.getTime() + entry.validity * 60000);
      return {
        ...entry,
        shortUrl: `http://localhost:3000/${entry.shortcode}`,
        expiry,
      };
    });

    setResults(newResults);
    localStorage.setItem('shortenedUrls', JSON.stringify([...results, ...newResults]));

    setSuccessMsg(' URLs shortened successfully!');
    setError('');

    await Log({
      stack: 'frontend',
      level: 'info',
      pkg: 'page',
      message: `Shortened ${newResults.length} URL(s) successfully.`,
    });
  };

  const generateRandomCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom textAlign="center" color="primary">
          🔗 Smart URL Shortener
        </Typography>
        <Typography variant="subtitle1" gutterBottom textAlign="center">
          You can shorten up to {MAX_URLS} URLs at once.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {inputs.map((input, idx) => (
          <Box key={idx} mb={3} sx={{ backgroundColor: '#f9f9f9', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              URL #{idx + 1}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Long URL" value={input.url}
                  onChange={(e) => handleChange(idx, 'url', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Shortcode (optional)" value={input.shortcode}
                  onChange={(e) => handleChange(idx, 'shortcode', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Validity (min)" value={input.validity}
                  onChange={(e) => handleChange(idx, 'validity', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        ))}

        <Box textAlign="center" mt={4}>
          <Button variant="contained" color="primary" size="large" onClick={handleSubmit}>
            🚀 Shorten URLs
          </Button>
        </Box>
      </Paper>

      {results.length > 0 && (
        <Box mt={6}>
          <Typography variant="h5" gutterBottom>📋 Shortened URLs:</Typography>
          {results.map((res, idx) => (
            <Card key={idx} sx={{ mt: 2, p: 2 }}>
              <CardContent>
                <Typography><strong>🔗 Original:</strong> {res.longUrl}</Typography>
                <Typography>
                  <strong>🔒 Short URL:</strong>{' '}
                  <a href={res.shortUrl} target="_blank" rel="noopener noreferrer">{res.shortUrl}</a>
                </Typography>
                <Typography><strong>⏰ Expiry:</strong> {res.expiry.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>

      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg('')}>
        <Alert severity="success" variant="filled">{successMsg}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;
