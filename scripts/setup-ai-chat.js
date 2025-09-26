const fetch = require('node-fetch');

async function setupAIChat() {
  try {
    console.log('🚀 Setting up AI Chat with vector database...');
    
    // Test if the server is running
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    
    try {
      const healthCheck = await fetch(`${baseUrl}/`);
      if (!healthCheck.ok) {
        throw new Error('Server not responding');
      }
      console.log('✅ Server is running');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first:');
      console.log('   npm run dev:web');
      process.exit(1);
    }
    
    // Index talents
    console.log('📚 Indexing talents in vector database...');
    const indexResponse = await fetch(`${baseUrl}/api/ai-chat/index-talents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!indexResponse.ok) {
      const error = await indexResponse.text();
      throw new Error(`Failed to index talents: ${error}`);
    }
    
    const indexResult = await indexResponse.json();
    console.log(`✅ Successfully indexed ${indexResult.indexedCount} talents`);
    
    // Test AI chat
    console.log('🤖 Testing AI chat...');
    const chatResponse = await fetch(`${baseUrl}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Find me a React developer' }),
    });
    
    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      throw new Error(`Failed to test AI chat: ${error}`);
    }
    
    const chatResult = await chatResponse.json();
    console.log('✅ AI chat is working!');
    console.log('📝 Sample response:', chatResult.message.substring(0, 100) + '...');
    
    console.log('\n🎉 AI Chat setup complete!');
    console.log('You can now use the AI Assistant in the talent pool page.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAIChat();
