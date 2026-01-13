import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/** Session cookie name */
const SESSION_COOKIE_NAME = "ecce_session"

/**
 * POST /api/auth/logout
 * 
 * Clears the session cookie
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Delete the session cookie by setting it with maxAge 0
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    )
  }
}
