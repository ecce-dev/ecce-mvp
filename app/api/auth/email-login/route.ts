import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

/** Session cookie name */
const SESSION_COOKIE_NAME = "ecce_session"

/** Session duration: 7 days in seconds */
const SESSION_DURATION = 7 * 24 * 60 * 60

const emailLoginSchema = z.object({
  email: z.string().trim().pipe(z.email("A valid email is required")),
})

/**
 * POST /api/auth/email-login
 *
 * Validates email and sets an authenticated session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = emailLoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      )
    }

    const sessionData = {
      role: null,
      email: parsed.data.email,
      authenticatedAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION * 1000,
    }

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64")

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
      role: null,
    })
  } catch (error) {
    console.error("Email login error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
