-- 1. Create Global Users Table
CREATE TABLE users (
    wallet_address TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Everyone can read usernames
CREATE POLICY "Usernames are public" ON users
    FOR SELECT USING (true);

-- Only the owner can insert/update their username
CREATE POLICY "Users can manage their own username" ON users
    FOR ALL USING (auth.uid()::text = wallet_address);
