# IMAP Duplicate Finder & Remover

A Next.js application that helps you find and remove duplicate emails across IMAP mailboxes. The application can scan individual mailboxes for duplicates or compare emails between two different mailboxes.

## Features

- **Single Mailbox Scanning**: Scan a single IMAP mailbox for duplicate emails within the same mailbox
- **Cross-Mailbox Comparison**: Compare emails between two different IMAP mailboxes to find duplicates
- **Duplicate Detection**: Uses content hashing to identify duplicate emails based on subject, sender, recipient, and content
- **Bulk Operations**: Select and delete multiple duplicate emails at once
- **Safe Deletion**: Multiple confirmation steps before permanent deletion
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Database Storage**: PostgreSQL database for storing email metadata and duplicates

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- IMAP access to your email accounts

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IMAPDupFindRemove
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a PostgreSQL database named `imap_duplicates`
   - Copy `env.example` to `.env.local` and update the database credentials:
   ```bash
   cp env.example .env.local
   ```

4. **Configure environment variables**
   Edit `.env.local` with your database settings:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=imap_duplicates
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

5. **Initialize the database**
   ```bash
   npm run dev
   ```
   The database tables will be created automatically when you first run the application.

## Usage

### Single Mailbox Scanning

1. Open the application in your browser
2. Click on the "Single Mailbox" tab
3. Fill in your IMAP details:
   - **IMAP Host**: Your email provider's IMAP server (e.g., `imap.gmail.com`)
   - **Port**: IMAP port (usually 993 for SSL/TLS)
   - **Username/Email**: Your email address
   - **Password**: Your email password or app password
   - **Mailbox ID**: A unique identifier for this mailbox (e.g., `gmail-account-1`)
   - **Secure Connection**: Usually "Yes" for modern email providers
4. Click "Scan Mailbox" to start scanning
5. View the results in the duplicates list below

### Cross-Mailbox Comparison

1. Click on the "Cross-Mailbox Comparison" tab
2. Fill in the details for both mailboxes
3. Click "Compare Mailboxes" to scan both mailboxes
4. View the results showing emails that exist in both mailboxes

### Managing Duplicates

- **View Details**: Click the eye icon to see where duplicates are located
- **Select Emails**: Use checkboxes to select emails for deletion
- **Bulk Delete**: Select multiple emails and click "Delete Selected"
- **Confirm Deletion**: The application will ask for confirmation before permanent deletion

## Security Features

- **Password Protection**: Passwords are not stored in the database
- **Secure Connections**: Supports SSL/TLS connections
- **Confirmation Dialogs**: Multiple warnings before deletion
- **Permanent Deletion**: Uses IMAP EXPUNGE for permanent removal

## Database Schema

The application uses two main tables:

### `emails` table
- `id`: Primary key
- `message_id`: Unique message identifier
- `subject`: Email subject
- `from_address`: Sender email
- `to_address`: Recipient email
- `date`: Email date
- `folder_name`: IMAP folder name
- `mailbox_id`: Mailbox identifier
- `content_hash`: Content hash for duplicate detection
- `uid`: IMAP UID
- `size`: Email size in bytes

### `mailboxes` table
- `id`: Primary key
- `name`: Mailbox name
- `host`: IMAP host
- `port`: IMAP port
- `username`: Username
- `secure`: SSL/TLS flag

## API Endpoints

- `POST /api/scan` - Scan an IMAP mailbox
- `GET /api/duplicates` - Get duplicate emails
- `DELETE /api/delete` - Delete selected emails

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify your IMAP host and port
   - Check if your email provider requires app passwords
   - Ensure SSL/TLS is enabled if required

2. **Authentication Errors**
   - Use app passwords for Gmail (2FA accounts)
   - Verify username and password
   - Check if your email provider allows IMAP access

3. **Database Errors**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env.local`
   - Verify database exists

### Gmail Setup

For Gmail accounts:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password instead of your regular password
4. IMAP Host: `imap.gmail.com`
5. Port: `993`
6. Secure Connection: `Yes`

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This application performs permanent deletion of emails. Always backup your emails before using this tool. The authors are not responsible for any data loss.
