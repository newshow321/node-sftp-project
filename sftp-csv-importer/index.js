require('dotenv').config();
const fs = require('fs');
const path = require('path');
const SftpClient = require('ssh2-sftp-client');
const csv = require('csv-parser');
const { Client } = require('pg');

const sftp = new SftpClient();

// Fungsi utama
async function main() {
  try {
    // 1. Koneksi ke SFTP dan download file
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
    });

    console.log('✅ Terhubung ke SFTP');

    const remotePath = process.env.SFTP_REMOTE_PATH;
    const localPath = path.resolve(process.env.LOCAL_DOWNLOAD_PATH);

    console.log(`📡 Mencoba download dari remote: ${remotePath}`);
    console.log(`📁 Akan disimpan ke lokal: ${localPath}`);

    // List isi direktori tempat file berada
    const dirPath = path.posix.dirname(remotePath);
    const files = await sftp.list(dirPath);
    console.log(`📂 Isi direktori ${dirPath}:`, files.map(f => f.name));

    await sftp.fastGet(remotePath, localPath);

    await sftp.end();

    // 2. Koneksi ke PostgreSQL
    const pgClient = new Client({
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
    });

    await pgClient.connect();
    console.log('✅ Terhubung ke PostgreSQL');

    // 3. Parsing CSV dan insert ke DB
    const results = [];
    fs.createReadStream(localPath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        console.log(`📦 ${results.length} baris ditemukan di file CSV`);
        
        try {
            for (const row of results) {
                await pgClient.query(
                    `INSERT INTO users (id, name, email, age)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (id) DO UPDATE
                     SET name = EXCLUDED.name,
                         email = EXCLUDED.email,
                         age = EXCLUDED.age`,
                    [row.id, row.name, row.email, row.age]
                  );
            }
        
            console.log('✅ Semua data berhasil dimasukkan ke database');
        } catch (error) {
            console.error('❌ Gagal insert ke database:', error.message);
        } finally {
            await pgClient.end();
        
            // 🧹 Hapus file lokal setelah selesai
            try {
            fs.unlinkSync(localPath);
            console.log(`🧹 File lokal ${localPath} telah dihapus`);
            } catch (err) {
            console.error('⚠️ Gagal menghapus file lokal:', err.message);
            }
        }
    });
  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err.message);
  }
}

main();
