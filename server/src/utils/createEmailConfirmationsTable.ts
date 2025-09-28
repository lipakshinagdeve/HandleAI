import { supabaseAdmin } from '../config/supabase';

export const createEmailConfirmationsTable = async (): Promise<boolean> => {
  try {
    // Create the email_confirmations table
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_confirmations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_email_confirmations_token ON email_confirmations(token);
        CREATE INDEX IF NOT EXISTS idx_email_confirmations_user_id ON email_confirmations(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_confirmations_expires_at ON email_confirmations(expires_at);
      `
    });

    if (error) {
      console.error('Error creating email_confirmations table:', error);
      return false;
    }

    console.log('Email confirmations table created successfully');
    return true;
  } catch (error) {
    console.error('Failed to create email_confirmations table:', error);
    return false;
  }
};

// Run this function to create the table
if (require.main === module) {
  createEmailConfirmationsTable()
    .then((success) => {
      if (success) {
        console.log('✅ Table creation completed successfully');
        process.exit(0);
      } else {
        console.log('❌ Table creation failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
