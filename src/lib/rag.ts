import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant"
import { QdrantClient } from "@qdrant/js-client-rest"
import type { VectorStore } from "@langchain/core/vectorstores"

type Nullable<T> = T | null

// Qdrant configuration
const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY || undefined,
  collectionName: process.env.QDRANT_COLLECTION_NAME || 'talent_documents',
  vectorSize: 1536, // OpenAI embedding size
  distance: 'Cosine' as const
}

let embeddings: Nullable<OpenAIEmbeddings> = null
let store: Nullable<VectorStore> = null
let qdrantClient: Nullable<QdrantClient> = null
let initialized = false
let usedMemoryFallback = false

// Helper function to safely convert any value to string
function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map(item => safeStringify(item)).join(', ')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

async function ensureEmbeddings(): Promise<OpenAIEmbeddings | null> {
  if (embeddings) return embeddings
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  embeddings = new OpenAIEmbeddings({ 
    apiKey,
    modelName: 'text-embedding-3-small' // More cost-effective
  })
  return embeddings
}

async function ensureQdrantClient(): Promise<QdrantClient | null> {
  if (qdrantClient) return qdrantClient
  
  try {
    qdrantClient = new QdrantClient({
      url: QDRANT_CONFIG.url,
      apiKey: QDRANT_CONFIG.apiKey,
      checkCompatibility: false, // Skip version check for cloud
    })
    
    // Test connection
    await qdrantClient.getCollections()
    return qdrantClient
  } catch (error) {
    console.error('Failed to initialize Qdrant client:', error)
    return null
  }
}

async function initQdrantStore(): Promise<VectorStore | null> {
  const client = await ensureQdrantClient()
  const embs = await ensureEmbeddings()
  
  if (!client || !embs) return null
  
  try {
    // Check if collection exists, create if not
    const collections = await client.getCollections()
    const collectionExists = collections.collections.some(
      (col: any) => col.name === QDRANT_CONFIG.collectionName
    )
    
    if (!collectionExists) {
      await client.createCollection(QDRANT_CONFIG.collectionName, {
        vectors: {
          size: QDRANT_CONFIG.vectorSize,
          distance: QDRANT_CONFIG.distance,
        },
      })
      console.log(`Created Qdrant collection: ${QDRANT_CONFIG.collectionName}`)
    }
    
    // Initialize vector store
    const qdrantStore = await QdrantVectorStore.fromExistingCollection(embs, {
      client,
      collectionName: QDRANT_CONFIG.collectionName,
    })
    
    return qdrantStore
  } catch (error) {
    console.error('Failed to initialize Qdrant vector store:', error)
    return null
  }
}


async function initMemoryStore(): Promise<VectorStore | null> {
  const embs = await ensureEmbeddings()
  if (!embs) return null
  const mem = new MemoryVectorStore(embs)
  usedMemoryFallback = true
  return mem
}

async function ensureStore(): Promise<VectorStore | null> {
  if (initialized && store) return store
  if (initialized && !store) return null
  initialized = true
  
  // Try Qdrant first
  store = await initQdrantStore()
  if (store) return store
  
  // Fallback to memory store
  store = await initMemoryStore()
  return store
}

export async function isRagAvailable(): Promise<boolean> {
  const s = await ensureStore()
  return !!s
}

export async function isQdrantAvailable(): Promise<boolean> {
  const client = await ensureQdrantClient()
  return !!client
}

export async function indexTalentProfileDoc(talent: {
  id: string
  name: string
  position?: string
  skills?: string[]
  experience?: string
  description?: string
}): Promise<void> {
  const s = await ensureStore()
  if (!s) return
  
  const parts: string[] = []
  parts.push(`Name: ${talent.name}`)
  if (talent.position) parts.push(`Position: ${talent.position}`)
  if (talent.experience) parts.push(`Experience: ${talent.experience}`)
  if (Array.isArray(talent.skills) && talent.skills.length > 0) {
    parts.push(`Skills: ${talent.skills.join(", ")}`)
  }
  if (talent.description) parts.push(`Description: ${talent.description}`)

  const pageContent = parts.join("\n")
  await s.addDocuments([
    {
      pageContent,
      metadata: { 
        talentId: talent.id, 
        type: "profile",
        name: talent.name,
        position: talent.position || '',
        skills: talent.skills || [],
        timestamp: new Date().toISOString()
      },
    },
  ])
}

// Enhanced function for BPOC talent data - using cleaned Applicant interface
export async function indexBpocTalentProfile(talent: {
  id: string
  user_id: string
  resume_slug?: string | null
  details: string | null
  status: string
  created_at: string
  updated_at: string
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  full_name?: string | null
  employee_id: string | null
  job_title?: string | null
  company_name?: string | null
  user_position?: string | null
  job_ids?: number[] | null
  video_introduction_url?: string | null
  current_salary?: number | null
  expected_monthly_salary?: number | null
  shift?: string | null
  all_job_titles?: string[]
  all_companies?: string[]
  all_job_statuses?: string[]
  all_job_timestamps?: string[]
  skills?: string[]
  interested_clients?: {
    user_id: number
    first_name: string | null
    last_name: string | null
    profile_picture: string | null
    employee_id: string | null
  }[]
  originalSkillsData?: any
  summary?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  aiAnalysis?: {
    overall_score?: number
    key_strengths?: any[]
    strengths_analysis?: any
    improvements?: any[]
    recommendations?: any[]
    improved_summary?: string
    salary_analysis?: any
    career_path?: any
    section_analysis?: any
  } | null
}): Promise<void> {
  const s = await ensureStore()
  if (!s) return
  
  const name = talent.full_name || `${talent.first_name || ''} ${talent.last_name || ''}`.trim()
  if (!name) return // Skip if no name available
  
  const parts: string[] = []
  
  // Basic Information
  parts.push(`Name: ${name}`)
  
  // Professional Summary (prioritize summary over details)
  if (talent.summary) {
    parts.push(`Professional Summary: ${talent.summary}`)
  } else if (talent.details) {
    parts.push(`Professional Summary: ${talent.details}`)
  }
  
  // Position and Experience
  if (talent.user_position) {
    parts.push(`Position: ${talent.user_position}`)
  }
  if (talent.job_title) {
    parts.push(`Job Title: ${talent.job_title}`)
  }
  
  // Skills (structured by category if available) - COMPLETELY FIXED
  if (talent.originalSkillsData && typeof talent.originalSkillsData === 'object' && !Array.isArray(talent.originalSkillsData)) {
    Object.entries(talent.originalSkillsData).forEach(([category, skills]) => {
      if (Array.isArray(skills) && skills.length > 0) {
        // Use safeStringify to handle arrays of objects properly
        const formattedSkills = skills.map(skill => safeStringify(skill)).join(", ")
        parts.push(`${category}: ${formattedSkills}`)
      } else if (typeof skills === 'object' && skills !== null) {
        // Handle object data (like education, experience) by converting to readable format
        const formattedData = safeStringify(skills)
        parts.push(`${category}: ${formattedData}`)
      }
    })
  } else if (Array.isArray(talent.skills) && talent.skills.length > 0) {
    parts.push(`Skills: ${talent.skills.join(", ")}`)
  }
  
  // Salary Information
  if (talent.current_salary) {
    parts.push(`Current Salary: ₱${talent.current_salary.toLocaleString()}/month`)
  }
  if (talent.expected_monthly_salary) {
    parts.push(`Expected Salary: ₱${talent.expected_monthly_salary.toLocaleString()}/month`)
  }
  
  // Shift Information
  if (talent.shift) {
    parts.push(`Shift: ${talent.shift}`)
  }
  
  // Work Experience
  if (Array.isArray(talent.all_job_titles) && talent.all_job_titles.length > 0) {
    parts.push(`Previous Job Titles: ${talent.all_job_titles.join(", ")}`)
  }
  
  // Application Dates (KEEP - useful for recency-based searches)
  if (Array.isArray(talent.all_job_timestamps) && talent.all_job_timestamps.length > 0) {
    const formattedDates = talent.all_job_timestamps.map(date => 
      new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    )
    parts.push(`Application Dates: ${formattedDates.join(", ")}`)
  }
  
  // Interested Clients (KEEP - shows demand/interest level)
  if (talent.interested_clients && talent.interested_clients.length > 0) {
    const clientNames = talent.interested_clients.map(client => 
      `${client.first_name || ''} ${client.last_name || ''}`.trim() || `Client ${client.user_id}`
    ).join(", ")
    parts.push(`Interested Clients: ${clientNames} (${talent.interested_clients.length} clients)`)
  }
  
  // Resume and Portfolio
  if (talent.resume_slug) {
    parts.push(`Resume: Available at https://www.bpoc.io/${talent.resume_slug}`)
  }
  
  // AI Analysis (ENHANCED - detailed analysis content) - FIXED
  if (talent.aiAnalysis) {
    if (talent.aiAnalysis.overall_score) {
      parts.push(`AI Overall Score: ${talent.aiAnalysis.overall_score}/10`)
    }
    if (talent.aiAnalysis.key_strengths && Array.isArray(talent.aiAnalysis.key_strengths)) {
      const strengths = talent.aiAnalysis.key_strengths.map((s: any) => 
        typeof s === 'string' ? s : (s.strength || safeStringify(s))
      ).join(", ")
      parts.push(`Key Strengths: ${strengths}`)
    }
    if (talent.aiAnalysis.improved_summary) {
      parts.push(`AI Enhanced Summary: ${talent.aiAnalysis.improved_summary}`)
    }
    if (talent.aiAnalysis.career_path) {
      parts.push(`Career Path Analysis: ${safeStringify(talent.aiAnalysis.career_path)}`)
    }
    
    // Detailed AI Analysis - FIXED
    if (talent.aiAnalysis.strengths_analysis) {
      if (talent.aiAnalysis.strengths_analysis.topStrengths) {
        const topStrengths = safeStringify(talent.aiAnalysis.strengths_analysis.topStrengths)
        parts.push(`Top Strengths: ${topStrengths}`)
      }
      if (talent.aiAnalysis.strengths_analysis.coreStrengths) {
        const coreStrengths = safeStringify(talent.aiAnalysis.strengths_analysis.coreStrengths)
        parts.push(`Core Strengths: ${coreStrengths}`)
      }
    }
    
    if (talent.aiAnalysis.improvements && Array.isArray(talent.aiAnalysis.improvements)) {
      const improvements = talent.aiAnalysis.improvements.map((imp: any) => 
        safeStringify(imp)
      ).join(", ")
      parts.push(`Areas for Improvement: ${improvements}`)
    }
    
    if (talent.aiAnalysis.recommendations && Array.isArray(talent.aiAnalysis.recommendations)) {
      const recommendations = talent.aiAnalysis.recommendations.map((rec: any) => 
        safeStringify(rec)
      ).join(", ")
      parts.push(`Recommendations: ${recommendations}`)
    }
    
    if (talent.aiAnalysis.salary_analysis) {
      parts.push(`Salary Analysis: ${safeStringify(talent.aiAnalysis.salary_analysis)}`)
    }
    
    if (talent.aiAnalysis.section_analysis) {
      parts.push(`Section Analysis: ${safeStringify(talent.aiAnalysis.section_analysis)}`)
    }
  }
  

  const pageContent = parts.join("\n")
  
  // Create comprehensive metadata (INCLUDING high-priority fields)
  const metadata = {
    talentId: talent.id,
    name: name,
    position: talent.user_position || '',
    jobTitle: talent.job_title || '',
    skills: talent.skills || [],
    currentSalary: talent.current_salary || 0,
    expectedSalary: talent.expected_monthly_salary || 0,
    shift: talent.shift || '',
    jobTitles: talent.all_job_titles || [],
    jobTimestamps: talent.all_job_timestamps || [], // KEEP - useful for filtering
    hasResume: !!talent.resume_slug,
    status: talent.status,
    interestedClientsCount: talent.interested_clients?.length || 0,
    aiScore: talent.aiAnalysis?.overall_score || 0,
    aiAnalysis: talent.aiAnalysis || null
  }
  
  await s.addDocuments([
    {
      pageContent,
      metadata
    },
  ])
  
  console.log(`✅ Indexed BPOC talent profile for ${name} (${talent.id})`)
}

export async function retrieveContextForTalent(
  talentId: string,
  query: string,
  k: number = 4
): Promise<string> {
  const s = await ensureStore()
  if (!s) return ""

  let docs: any[] = []
  try {
    // Try metadata filter first (Qdrant supports this)
    docs = await s.similaritySearch(query, k, { talentId })
  } catch (_) {
    try {
      // Fallback: unfiltered search then filter by metadata in-memory
      const all = await s.similaritySearch(query, k * 3)
      docs = all.filter((d: any) => d?.metadata?.talentId === talentId).slice(0, k)
    } catch (_) {
      docs = []
    }
  }

  const context = docs
    .map((d) => (typeof d?.pageContent === "string" ? d.pageContent : ""))
    .filter(Boolean)
    .join("\n\n---\n\n")
  return context
}

export function isUsingMemoryRag(): boolean {
  return usedMemoryFallback
}

// Enhanced RAG functions
export async function enhancedRetrieveContext(
  query: string,
  talentId?: string,
  k: number = 4
): Promise<{
  context: string
  sources: Array<{ content: string; metadata: any; score: number }>
}> {
  const s = await ensureStore()
  if (!s) {
    return { context: "", sources: [] }
  }

  let docs: any[] = []
  try {
    if (talentId) {
      // Search with talent filter
      docs = await s.similaritySearch(query, k, { talentId })
    } else {
      // Global search
      docs = await s.similaritySearch(query, k)
    }
  } catch (_) {
    try {
      // Fallback: unfiltered search then filter in-memory
      const all = await s.similaritySearch(query, k * 3)
      docs = talentId 
        ? all.filter((d: any) => d?.metadata?.talentId === talentId).slice(0, k)
        : all.slice(0, k)
    } catch (_) {
      docs = []
    }
  }

  const context = docs
    .map((d) => d.pageContent || "")
    .filter(Boolean)
    .join("\n\n---\n\n")

  const sources = docs.map((d: any) => ({
    content: d.pageContent || "",
    metadata: d.metadata || {},
    score: 0 // LangChain doesn't provide scores by default
  }))

  return { context, sources }
}

export async function searchDocuments(
  query: string,
  k: number = 5,
  filter?: Record<string, any>
): Promise<Array<{ content: string; metadata: any; score: number }>> {
  const s = await ensureStore()
  if (!s) return []
  
  try {
    let docs: any[] = []
    
    // Try native filtering first (Qdrant supports this)
    if (filter) {
      docs = await s.similaritySearch(query, k, filter)
    } else {
      docs = await s.similaritySearch(query, k)
    }
    
    // If native filtering failed, fall back to in-memory filtering
    if (filter && docs.length === 0) {
      const all = await s.similaritySearch(query, k * 3)
      docs = all.filter((d: any) => {
        return Object.entries(filter).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Handle complex filters (e.g., { $contains: "value" })
            if (value.$contains && Array.isArray(d.metadata?.[key])) {
              return d.metadata[key].includes(value.$contains)
            }
            if (value.$gte && typeof d.metadata?.[key] === 'number') {
              return d.metadata[key] >= value.$gte
            }
            if (value.$lte && typeof d.metadata?.[key] === 'number') {
              return d.metadata[key] <= value.$lte
            }
          }
          return d.metadata?.[key] === value
        })
      }).slice(0, k)
    }
    
    return docs.map((d: any) => ({
      content: d.pageContent || "",
      metadata: d.metadata || {},
      score: 0 // LangChain doesn't provide scores by default
    }))
  } catch (_) {
    return []
  }
}

export async function indexDocument(
  content: string,
  metadata: Record<string, any>
): Promise<void> {
  const s = await ensureStore()
  if (!s) return
  
  await s.addDocuments([{
    pageContent: content,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  }])
}

// Qdrant-specific utility functions
export async function deleteTalentDocuments(talentId: string): Promise<void> {
  const client = await ensureQdrantClient()
  if (!client) return
  
  try {
    await client.delete(QDRANT_CONFIG.collectionName, {
      filter: {
        must: [
          {
            key: 'talentId',
            match: { value: talentId }
          }
        ]
      }
    })
    console.log(`Deleted documents for talent: ${talentId}`)
  } catch (error) {
    console.error('Failed to delete talent documents:', error)
  }
}

export async function getCollectionStats(): Promise<{
  totalDocuments: number
  collectionInfo: any
} | null> {
  const client = await ensureQdrantClient()
  if (!client) return null
  
  try {
    const info = await client.getCollection(QDRANT_CONFIG.collectionName)
    return {
      totalDocuments: info.points_count || 0,
      collectionInfo: info
    }
  } catch (error) {
    console.error('Failed to get collection stats:', error)
    return null
  }
}

// Search for similar talents based on query
// Get the vector store instance
export async function getVectorStore(): Promise<VectorStore | null> {
  return await ensureStore()
}


export async function searchSimilarTalents(query: string, limit: number = 5): Promise<any[]> {
  try {
    console.log('🔍 searchSimilarTalents called with query:', query, 'limit:', limit)
    const store = await getVectorStore()
    if (!store) {
      console.error('❌ Vector store not available')
      return []
    }
    console.log('✅ Vector store available, performing search...')

    // Perform similarity search using the enhanced search function
    const searchResults = await searchDocuments(query, limit)
    console.log('🔍 Search results:', searchResults.length, 'results found')
    
    // Extract talent data from results with enhanced information
    const talents = searchResults.map(result => {
      const metadata = result.metadata || {}
      const talent = {
        id: metadata.talentId,
        full_name: metadata.name || metadata.full_name,
        skills: metadata.skills || [],
        summary: metadata.summary,
        expected_monthly_salary: metadata.expectedSalary || metadata.expected_monthly_salary,
        address: metadata.address,
        all_job_titles: metadata.jobTitles || metadata.all_job_titles || [],
        job_title: metadata.jobTitle || metadata.job_title,
        position: metadata.position,
        shift: metadata.shift,
        current_salary: metadata.currentSalary || metadata.current_salary,
        status: metadata.status,
        interestedClientsCount: metadata.interestedClientsCount,
        aiScore: metadata.aiScore,
        aiAnalysis: metadata.aiAnalysis,
        score: result.score || 0
      }
      
      // Debug logging for AI analysis
      if (talent.full_name) {
        console.log(`🔍 Talent ${talent.full_name}:`, {
          aiScore: talent.aiScore,
          hasAiAnalysis: !!talent.aiAnalysis,
          aiAnalysisKeys: talent.aiAnalysis ? Object.keys(talent.aiAnalysis) : 'null'
        })
      }
      
      return talent
    })

    return talents
  } catch (error) {
    console.error('Failed to search similar talents:', error)
    return []
  }
}

// Index all talents from the database using enhanced function
export async function indexTalentDocuments(): Promise<{
  success: boolean
  indexedCount: number
  error?: string
}> {
  try {
    console.log('Starting enhanced talent indexing...')
    
    // Fetch all talents from the database
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/bpoc?status=passed`)
    if (!response.ok) {
      throw new Error('Failed to fetch talents from database')
    }
    
    const talents = await response.json()
    console.log(`Found ${talents.length} talents to index`)
    
    if (talents.length === 0) {
      return { success: true, indexedCount: 0 }
    }
    
    // Process and index each talent using the enhanced function
    let indexedCount = 0
    for (const talent of talents) {
      try {
        // Use the enhanced indexing function with all the rich data
        await indexBpocTalentProfile(talent)
        indexedCount++
        
        console.log(`Indexed talent: ${talent.full_name || talent.id}`)
      } catch (error) {
        console.error(`Failed to index talent ${talent.id}:`, error)
        // Continue with other talents
      }
    }
    
    console.log(`Successfully indexed ${indexedCount} talents with enhanced data`)
    return { success: true, indexedCount }
    
  } catch (error) {
    console.error('Failed to index talents:', error)
    return { 
      success: false, 
      indexedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}


