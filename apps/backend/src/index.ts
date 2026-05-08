import path from 'path';
import fs from 'fs';
import express from 'express';
import { openDatabase } from './db';
import { createApp } from './app';

const PORT = process.env['PORT'] !== undefined ? Number(process.env['PORT']) : 3000;
const db = openDatabase();
const app = createApp(db);

// Serve the Angular portal build in production
const distPath = path.resolve(__dirname, '..', '..', 'portal', 'dist', 'portal', 'browser');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
