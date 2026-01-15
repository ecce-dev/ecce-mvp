import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPasswordConfig } from "@/lib/actions/getGlobalSettings"

/** Session cookie name */
const SESSION_COOKIE_NAME = "ecce_session"

/** Session duration: 7 days in seconds */
const SESSION_DURATION = 7 * 24 * 60 * 60

interface LoginRequest {
  password: string
}

interface PasswordConfig {
  curator?: string
  designer?: string
  vc?: string
}

/**
 * POST /api/auth/login
 * 
 * Validates password against WordPress config and sets HttpOnly session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { password } = body

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }

    // Fetch password config from WordPress
    const passwordConfigRaw = await getPasswordConfig()
    
    if (!passwordConfigRaw) {
      return NextResponse.json(
        { error: "Authentication not configured" },
        { status: 500 }
      )
    }

    // Parse the JSON password config
    let passwordConfig: PasswordConfig
    try {
      passwordConfig = JSON.parse(passwordConfigRaw)
    } catch {
      console.error("Failed to parse password config")
      return NextResponse.json(
        { error: "Authentication configuration error" },
        { status: 500 }
      )
    }

    // Check password against each role
    let matchedRole: string | null = null
    
    for (const [role, configPassword] of Object.entries(passwordConfig)) {
      if (configPassword === password) {
        matchedRole = role
        break
      }
    }

    if (!matchedRole) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }

    // Create session data
    const sessionData = {
      role: matchedRole,
      authenticatedAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION * 1000,
    }

    // Encode session as base64 (in production, use proper encryption)
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64")

    // Set HttpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      role: matchedRole,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
