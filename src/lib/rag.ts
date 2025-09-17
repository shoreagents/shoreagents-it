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

// Enhanced function for BPOC talent data
export async function indexBpocTalentProfile(talent: {
  applicant_id: string
  first_name?: string | null
  last_name?: string | null
  summary?: string | null
  skills?: string[]
  current_salary?: number | null
  expected_monthly_salary?: number | null
  all_job_titles?: string[]
  all_companies?: string[]
  video_introduction_url?: string | null
  aiAnalysis?: {
    overall_score?: number
    key_strengths?: any[]
    improved_summary?: string
    career_path?: any
    salary_analysis?: any
  } | null
}): Promise<void> {
  const s = await ensureStore()
  if (!s) return
  
  const name = `${talent.first_name || ''} ${talent.last_name || ''}`.trim()
  if (!name) return // Skip if no name available
  
  const parts: string[] = []
  
  // Basic Information
  parts.push(`Name: ${name}`)
  
  // Professional Summary
  if (talent.summary) {
    parts.push(`Professional Summary: ${talent.summary}`)
  }
  
  // Skills
  if (Array.isArray(talent.skills) && talent.skills.length > 0) {
    parts.push(`Skills: ${talent.skills.join(", ")}`)
  }
  
  // Salary Information
  if (talent.expected_monthly_salary) {
    parts.push(`Expected Salary: $${talent.expected_monthly_salary.toLocaleString()}`)
  }
  
  
  // Work Experience
  if (Array.isArray(talent.all_job_titles) && talent.all_job_titles.length > 0) {
    parts.push(`Previous Job Titles: ${talent.all_job_titles.join(", ")}`)
  }
  
  // AI Analysis
  if (talent.aiAnalysis) {
    if (talent.aiAnalysis.overall_score) {
      parts.push(`AI Overall Score: ${talent.aiAnalysis.overall_score}/10`)
    }
    if (talent.aiAnalysis.key_strengths && Array.isArray(talent.aiAnalysis.key_strengths)) {
      const strengths = talent.aiAnalysis.key_strengths.map((s: any) => s.strength || s).join(", ")
      parts.push(`Key Strengths: ${strengths}`)
    }
    if (talent.aiAnalysis.improved_summary) {
      parts.push(`AI Enhanced Summary: ${talent.aiAnalysis.improved_summary}`)
    }
    if (talent.aiAnalysis.career_path) {
      parts.push(`Career Path Analysis: ${JSON.stringify(talent.aiAnalysis.career_path)}`)
    }
  }
  
  // Video Introduction
  if (talent.video_introduction_url) {
    parts.push(`Video Introduction: Available`)
  }

  const pageContent = parts.join("\n")
  
  // Create comprehensive metadata
  const metadata = {
    talentId: talent.applicant_id,
    type: "bpoc_profile",
    name: name,
    skills: talent.skills || [],
    expectedSalary: talent.expected_monthly_salary || 0,
    jobTitles: talent.all_job_titles || [],
    hasVideoIntro: !!talent.video_introduction_url,
    aiScore: talent.aiAnalysis?.overall_score || 0
  }
  
  await s.addDocuments([
    {
      pageContent,
      metadata
    },
  ])
  
  console.log(`✅ Indexed BPOC talent profile for ${name} (${talent.applicant_id})`)
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


