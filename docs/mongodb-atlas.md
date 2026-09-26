# MongoDB Atlas Cloud Database Configuration Guide

Follow these steps to connect College Event Hub to MongoDB Atlas Cloud Database:

### Step 1: Create MongoDB Atlas Account
Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register a free account.

### Step 2: Create a New Project
Name your project `College Event Hub`.

### Step 3: Deploy a Cluster
Select the **M0 Free Tier** cluster, choose a cloud region (e.g. AWS / N. Virginia or Mumbai), and click **Create Cluster**.

### Step 4: Create Database User
In Database Access:
- Click **Add New Database User**
- Username: `admin_user`
- Password: `SecurePassword123!`
- Role: `Read and write to any database`

### Step 5: Configure Network Access
In Network Access:
- Click **Add IP Address**
- Click **Allow Access from Anywhere** (`0.0.0.0/0`) for cloud deployment compatibility.

### Step 6: Obtain MongoDB Connection String
- Go to Clusters -> Connect -> Drivers
- Copy connection string format:
`mongodb+srv://admin_user:SecurePassword123!@cluster0.mongodb.net/college_event_hub?retryWrites=true&w=majority`

### Step 7: Save in Environment Variable
Add the string to your `.env` file:
```env
MONGODB_URI=mongodb+srv://admin_user:SecurePassword123!@cluster0.mongodb.net/college_event_hub
```

### Step 8: Start Node.js Backend Server
Run `npm start` or `npm run dev`.

### Step 9: Verify Database Connection
Observe console output: `[College Event Hub] MongoDB Connected: cluster0-shard-...`

### Step 10: Verify Data in Atlas
Visit MongoDB Atlas Browse Collections to inspect `users`, `events`, and `registrations`.
