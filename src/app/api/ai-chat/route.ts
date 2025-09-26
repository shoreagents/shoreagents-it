import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { getVectorStore, searchSimilarTalents } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize ChatOpenAI
    const openai = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini', // Cost-effective model
      temperature: 0.7,
    })

    // Search for similar talents based on the query
    console.log('🔍 Searching for talents with query:', message)
    const allTalents = await searchSimilarTalents(message, 10) // Get more results for filtering
    console.log('🔍 Found talents:', allTalents.length, allTalents)
    
    // Filter talents based on relevance and quality
    const relevantTalents = allTalents.filter(talent => {
      // Only include talents with meaningful data
      const hasRelevantData = talent.skills?.length > 0 || 
                             talent.all_job_titles?.length > 0 || 
                             talent.aiAnalysis?.key_strengths?.length > 0 ||
                             talent.summary
      
      // Include talents with AI scores or good data quality
      const hasGoodQuality = talent.aiScore > 0 || 
                            talent.expected_monthly_salary > 0 ||
                            talent.interestedClientsCount > 0
      
      return hasRelevantData && hasGoodQuality
    }).slice(0, 5) // Limit to top 5 most relevant
    
    console.log('🔍 Filtered relevant talents:', relevantTalents.length)
    
    // Create context from filtered talents with enhanced information
    const talentContext = relevantTalents.map((talent, index) => {
      const skills = talent.skills?.slice(0, 10).join(', ') || 'No skills listed'
      const jobTitles = talent.all_job_titles?.join(', ') || 'No previous positions'
      const salary = talent.expected_monthly_salary || 'Not specified'
      const currentSalary = talent.current_salary || 'Not specified'
      const shift = talent.shift || 'Not specified'
      const aiScore = talent.aiScore || 'Not available'
      
      // Extract key qualifications from AI analysis
      const keyStrengths = talent.aiAnalysis?.key_strengths?.join(', ') || 'Not available'
      const certifications = talent.aiAnalysis?.strengths_analysis?.coreStrengths || 'Not available'
      const experience = talent.aiAnalysis?.strengths_analysis?.topStrengths || 'Not available'
      
      return `${index + 1}. **${talent.full_name || 'Unknown'}**
         - **Current Position**: ${talent.position || talent.job_title || 'Not specified'}
         - **Previous Job Titles**: ${jobTitles}
         - **Key Qualifications**: ${keyStrengths}
         - **Certifications**: ${certifications}
         - **Experience Highlights**: ${experience}
         - **Skills**: ${skills}
         - **Current Salary**: ₱${currentSalary}/month
         - **Expected Salary**: ₱${salary}/month
         - **Shift**: ${shift}
         - **AI Score**: ${aiScore}/10
         - **Location**: ${talent.address || 'Not specified'}
         - **Summary**: ${talent.summary || 'No summary available'}
         - **Interested Clients**: ${talent.interestedClientsCount || 0} clients interested`
    }).join('\n\n')

    // Create the prompt for the AI
    const systemPrompt = `You are an AI talent assistant for ShoreAgents, a talent acquisition platform. 
    Your role is to help users find the perfect candidates based on their requirements.
    
    Available talents in our database (${relevantTalents.length} candidates):
    ${talentContext}
    
    Guidelines:
    - ONLY recommend talents that are highly relevant to the user's specific requirements
    - Look for EXACT matches in job titles, positions, certifications, and qualifications
    - Match "Licensed Customs Broker" with candidates who have this certification
    - Match "recruitment experience" with candidates who have handled recruitment processes
    - Match "Shift Manager" with candidates who have "Shift Manager" in their job titles or previous positions
    - Match "BPO" experience with candidates who have worked in BPO companies
    - Pay special attention to "Key Qualifications", "Certifications", and "Experience Highlights" sections
    - Consider years of experience based on job history and application dates
    - Highlight specific qualifications that match the user's requirements
    - Be SELECTIVE - only mention the most relevant candidates (1-3 max)
    - If no good matches, say "No suitable candidates found" rather than showing irrelevant ones
    - IMPORTANT: Always mention the talent's FULL NAME when recommending them
    - Mention relevant skills, experience, and salary expectations
    - Be conversational and helpful
    - Keep responses concise but informative
    - Ask follow-up questions to better understand requirements if needed`

    const userPrompt = `User query: "${message}"
    
    Please provide talent recommendations based on this query. If the query is too vague, ask for more specific requirements.`

    // Generate AI response using the correct format
    const response = await openai.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ])

    // Parse the AI response to extract only the talents it actually mentioned
    const mentionedTalents = []
    const responseText = response.content as string
    
    // Extract talent names mentioned in the AI response
    for (const talent of relevantTalents) {
      const talentName = talent.full_name || 'Unknown'
      // Check if the talent name appears in the AI response
      if (responseText.includes(talentName)) {
        mentionedTalents.push(talent)
      }
    }
    
    console.log('🔍 AI mentioned talents:', mentionedTalents.length, mentionedTalents.map(t => t.full_name))
    
    return NextResponse.json({
      message: response.content,
      talents: mentionedTalents, // Only return talents the AI actually mentioned
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}