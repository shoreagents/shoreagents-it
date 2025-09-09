import { NextRequest, NextResponse } from "next/server"
import { 
  getJobRequestsForCompany, 
  getAllJobRequests,
  insertJobRequest, 
  resolveCompanyId,
  getJobRequestById,
  updateJobRequest,
  deleteJobRequest,
  updateJobRequestStatus,
  getJobRequestStats
} from "@/lib/db-utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const admin = searchParams.get("admin") === "true"
    const id = searchParams.get("id")
    const stats = searchParams.get("stats") === "true"

    // Get specific job request by ID
    if (id) {
      const jobRequest = await getJobRequestById(parseInt(id))
      if (!jobRequest) {
        return NextResponse.json({ error: "Job request not found" }, { status: 404 })
      }
      return NextResponse.json({ jobRequest })
    }

    // Get statistics
    if (stats) {
      const statistics = await getJobRequestStats(companyId || undefined)
      return NextResponse.json({ stats: statistics })
    }

    // Get job requests
    let rows
    if (admin) {
      rows = await getAllJobRequests()
    } else {
      rows = await getJobRequestsForCompany(companyId)
    }

    return NextResponse.json({ requests: rows })
  } catch (e: any) {
    console.error("job-requests GET error:", e)
    const message = e?.detail || e?.message || "Failed to fetch job requests"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const companyId = await resolveCompanyId(body.companyId)
    
    if (!companyId) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 })
    }

    const job = await insertJobRequest({
      companyId,
      jobTitle: body.jobTitle,
      workArrangement: body.workArrangement ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      jobDescription: body.jobDescription,
      requirements: body.requirements ?? [],
      responsibilities: body.responsibilities ?? [],
      benefits: body.benefits ?? [],
      skills: body.skills ?? [],
      experienceLevel: body.experienceLevel ?? null,
      applicationDeadline: body.applicationDeadline ?? null,
      industry: body.industry ?? null,
      department: body.department ?? null,
    })
    
    return NextResponse.json({ ok: true, job }, { status: 201 })
  } catch (e: any) {
    console.error("job-requests POST error:", e)
    const message = e?.detail || e?.message || "Failed to create job request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Job request ID is required" }, { status: 400 })
    }

    const job = await updateJobRequest(id, updates)
    return NextResponse.json({ ok: true, job })
  } catch (e: any) {
    console.error("job-requests PUT error:", e)
    const message = e?.detail || e?.message || "Failed to update job request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: "Job request ID is required" }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const job = await updateJobRequestStatus(id, status)
    return NextResponse.json({ ok: true, job })
  } catch (e: any) {
    console.error("job-requests PATCH error:", e)
    const message = e?.detail || e?.message || "Failed to update job request status"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Job request ID is required" }, { status: 400 })
    }

    await deleteJobRequest(parseInt(id))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("job-requests DELETE error:", e)
    const message = e?.detail || e?.message || "Failed to delete job request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
