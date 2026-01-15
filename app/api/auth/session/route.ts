import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/** Session cookie name */
const SESSION_COOKIE_NAME = "ecce_session"

interface SessionData {
  role: string
  authenticatedAt: number
  expiresAt: number
}

/**
 * GET /api/auth/session
 * 
 * Checks if user has a valid session and returns role info
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return NextResponse.json({
        authenticated: false,
        role: null,
      })
    }

    // Decode session data
    let sessionData: SessionData
    try {
      const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8")
      sessionData = JSON.parse(decoded)
    } catch {
      // Invalid session format, clear it
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
      
      return NextResponse.json({
        authenticated: false,
        role: null,
      })
    }

    // Check if session has expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
      
      return NextResponse.json({
        authenticated: false,
        role: null,
      })
    }

    return NextResponse.json({
      authenticated: true,
      role: sessionData.role,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({
      authenticated: false,
      role: null,
    })
  }
}
