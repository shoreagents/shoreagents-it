# Supabase Account Creation Script

This script creates Supabase user accounts without password authentication for all email addresses listed in `login.md`.

## Prerequisites

1. **Environment Variables**: Make sure you have the following environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (not the anon key)

2. **Email List**: The script reads email addresses from `login.md` in the project root

## Usage

### Option 1: Using npm script
```bash
npm run create-accounts
```

### Option 2: Direct execution
```bash
node scripts/create-supabase-accounts.js
```

## What the script does

1. **Reads email list**: Extracts all email addresses from `login.md`
2. **Creates accounts**: Uses Supabase Admin API to create user accounts
3. **Auto-confirms emails**: Sets `email_confirm: true` to skip email verification
4. **No passwords**: Creates passwordless accounts
5. **Adds metadata**: Includes role and creation info in user metadata
6. **Rate limiting**: Adds 100ms delay between requests to avoid rate limits
7. **Error handling**: Continues processing even if some accounts fail
8. **Results logging**: Saves detailed results to `supabase-accounts-results.json`

## Output

The script will:
- Show progress in real-time
- Display a summary of successful and failed account creations
- Save detailed results to `scripts/supabase-accounts-results.json`

## Example output
```
Found 150 email addresses
Creating account for: reyesabigail412@gmail.com
✅ Successfully created account for: reyesabigail412@gmail.com
Creating account for: cherwin019@gmail.com
✅ Successfully created account for: cherwin019@gmail.com
...

=== SUMMARY ===
✅ Successfully created: 148 accounts
❌ Failed: 2 accounts

✅ Successful accounts:
  - reyesabigail412@gmail.com (ID: 12345678-1234-1234-1234-123456789012)
  - cherwin019@gmail.com (ID: 87654321-4321-4321-4321-210987654321)

❌ Failed accounts:
  - invalid-email@example.com: Invalid email format
  - duplicate@example.com: User already registered

Results saved to: scripts/supabase-accounts-results.json
```

## Security Notes

- Uses service role key for admin operations
- Auto-confirms emails (no verification required)
- Creates passwordless accounts
- Includes user metadata for tracking

## Troubleshooting

1. **Missing environment variables**: Check that both Supabase URL and service role key are set
2. **Rate limiting**: The script includes delays, but you may need to increase them for large lists
3. **Duplicate emails**: Existing accounts will show as failed
4. **Invalid emails**: Malformed emails will be skipped

## Files created

- `scripts/supabase-accounts-results.json`: Detailed results of the account creation process 