# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL Database**
   - Install PostgreSQL if you haven't already
   - Create a new database named `imap_duplicates`
   - Copy the environment file:
   ```bash
   cp env.example .env.local
   ```
   - Edit `.env.local` with your database credentials

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open http://localhost:3000 in your browser
   - The database tables will be created automatically on first run

## Database Setup

### Option 1: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name imap-postgres \
  -e POSTGRES_DB=imap_duplicates \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Your .env.local should contain:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=imap_duplicates
DB_USER=postgres
DB_PASSWORD=password
```

### Option 2: Local PostgreSQL Installation
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database:
   ```sql
   CREATE DATABASE imap_duplicates;
   ```
3. Update your `.env.local` with the correct credentials

## Email Provider Configuration

### Gmail
- **IMAP Host**: `imap.gmail.com`
- **Port**: `993`
- **Secure Connection**: `Yes`
- **Username**: Your Gmail address
- **Password**: App password (not your regular password)
- **Mailbox ID**: Any unique identifier (e.g., `gmail-account-1`)

### Outlook/Hotmail
- **IMAP Host**: `outlook.office365.com`
- **Port**: `993`
- **Secure Connection**: `Yes`
- **Username**: Your email address
- **Password**: Your password or app password
- **Mailbox ID**: Any unique identifier

### Yahoo
- **IMAP Host**: `imap.mail.yahoo.com`
- **Port**: `993`
- **Secure Connection**: `Yes`
- **Username**: Your Yahoo email address
- **Password**: App password (if 2FA is enabled)
- **Mailbox ID**: Any unique identifier

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env.local`
   - Verify database exists

2. **IMAP Connection Error**
   - Check IMAP host and port
   - Verify username and password
   - Ensure SSL/TLS is enabled if required
   - For Gmail, use app passwords if 2FA is enabled

3. **Permission Denied**
   - Check if your email provider allows IMAP access
   - Some providers require enabling IMAP in settings

### Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Step Verification if not already enabled
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this app password in the application

## Security Notes

- Passwords are not stored in the database
- All IMAP connections use SSL/TLS when possible
- Email deletion requires multiple confirmations
- Always backup your emails before using this tool

## Development

### Running Tests
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

### Database Initialization
```bash
npm run init-db
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your email provider's IMAP settings
3. Ensure your database is properly configured
4. Check the application logs for detailed error messages
