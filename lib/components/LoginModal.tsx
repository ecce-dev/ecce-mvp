"use client"

import { useState, useCallback } from "react"
import { useTransition, animated, config } from "@react-spring/web"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useAppModeStore, type UserRole } from "@/lib/stores/appModeStore"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Login modal for research mode authentication
 * 
 * Validates password against WordPress config via API route
 * Sets HttpOnly session cookie on successful login
 */
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { setAuthenticated, setViewMode } = useAppModeStore()

  const transitions = useTransition(isOpen, {
    from: { opacity: 0, transform: "scale(0.95) translateY(-10px)" },
    enter: { opacity: 1, transform: "scale(1) translateY(0px)" },
    leave: { opacity: 0, transform: "scale(0.95) translateY(-10px)" },
    config: config.gentle,
  })

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError("Password is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAuthenticated(true, data.role as UserRole)
        setViewMode("research")
        setPassword("")
        onClose()
      } else {
        setError(data.error || "Authentication failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [password, setAuthenticated, setViewMode, onClose])

  const handleClose = useCallback(() => {
    setPassword("")
    setError(null)
    onClose()
  }, [onClose])

  return transitions(
    (styles, item) =>
      item && (
        <>
          {/* Backdrop */}
          <animated.div
            style={{ opacity: styles.opacity }}
            className="fixed inset-0 bg-black/30 z-[200]"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <animated.div
            style={styles}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-full max-w-md"
          >
            <div className="bg-white/95 border border-black p-8 mx-4">
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Close"
              >
                <XIcon className="size-5" />
              </button>

              <h2 className="font-zangezi uppercase text-2xl mb-6">Research Access</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2 border border-black bg-white/70 focus:outline-none focus:ring-2 focus:ring-black/20",
                      error && "border-red-500"
                    )}
                    placeholder="Enter access password"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full px-4 py-2 border border-black font-zangezi uppercase text-lg transition-colors",
                    isLoading
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-black text-white hover:bg-black/80"
                  )}
                >
                  {isLoading ? "Verifying..." : "Access Research"}
                </button>
              </form>
            </div>
          </animated.div>
        </>
      )
  )
}
