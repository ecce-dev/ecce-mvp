"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useTransition, animated, config, useSpring } from "@react-spring/web"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/lib/components/ui/form"
import { Input } from "@/lib/components/ui/input"
import { Button } from "@/lib/components/ui/button"
import { useAppModeStore, type UserRole } from "@/lib/stores/appModeStore"
import { useGarments } from "@/lib/context/GarmentsContext"
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"
import TurnstileWidget from "../util/TurnstileWidget"
import { trackEngageLoginEmail } from "@/lib/analytics/tracking"

/**
 * Form validation schema
 */
const isPasswordAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_PASSWORD_AUTH === "true"

const loginFormSchema = z
  .object({
    email: z.string().trim().pipe(z.email("Please enter a valid email address")),
    password: z.string(),
  })
  .superRefine((values, context) => {
    if (isPasswordAuthEnabled && values.password.trim().length === 0) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password is required",
      })
    }
  })

type LoginFormValues = z.infer<typeof loginFormSchema>

/**
 * Login modal for research mode authentication
 * 
 * Uses React Hook Form with Zod validation
 * Active flow: validates email and grants immediate access.
 * Legacy flow (feature-flagged): validates password via API route.
 */
export default function LoginModal({ passwordEntryInfo }: { passwordEntryInfo: string | null }) {
  const {
    isLoginModalOpen,
    setLoginModalOpen,
    setAuthenticated,
    setViewMode,
    selectedGarment,
    updateSelectedGarmentData,
  } = useAppModeStore()
  const { reloadGarments } = useGarments()

  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordEntryInfoOpen, setIsPasswordEntryInfoOpen] = useState(true)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      if (!isPasswordAuthEnabled) {
        return { success: true, role: null as UserRole | null }
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: values.password.trim() }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Authentication failed")
      }

      return { success: true, role: data.role as UserRole | null }
    },
    onSuccess: async (data, values) => {
      if (!isPasswordAuthEnabled) {
        trackEngageLoginEmail(values.email.trim())
      }

      setAuthenticated(true, data.role)
      setViewMode("research")
      form.reset()
      setLoginModalOpen(false)

      // Re-fetch garments with full data now that session cookie is set
      const reloaded = await reloadGarments()

      // Update selected garment with full data if one is selected
      if (selectedGarment?.slug) {
        const updated = reloaded.find((g) => g.slug === selectedGarment.slug)
        if (updated) {
          updateSelectedGarmentData(updated)
        }
      }
    },
  })

  const handleClose = useCallback(() => {
    form.reset()
    loginMutation.reset()
    setIsPasswordVisible(false)
    setLoginModalOpen(false)
  }, [form, loginMutation, setLoginModalOpen])

  // Reset mutation error when form changes
  useEffect(() => {
    if (loginMutation.isError) {
      const subscription = form.watch(() => {
        loginMutation.reset()
      })
      return () => subscription.unsubscribe()
    }
  }, [loginMutation, form])

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values)
  }

  const transitions = useTransition(isLoginModalOpen, {
    from: { opacity: 0, transform: "scale(0.95) translateY(-10px)" },
    enter: { opacity: 1, transform: "scale(1) translateY(0px)" },
    leave: { opacity: 0, transform: "scale(0.95) translateY(-10px)" },
    config: config.gentle,
  })


  const passwordInfoSpring = useSpring({
    opacity: isPasswordEntryInfoOpen ? 1 : 0,
    transform: isPasswordEntryInfoOpen ? "scale(1)" : "scale(0.95)",
    config: config.gentle,
  })

  return transitions(
    (styles, item) =>
      item && (
        <animated.div
          style={styles}
          className="safe-area-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/8  z-[200] w-full max-w-md px-4 pointer-events-auto"
        >
          <div className="bg-transparent p-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 w-full bg-transparent flex flex-col items-end justify-center"
              >
                <FormField
                  control={form.control}
                  name={isPasswordAuthEnabled ? "password" : "email"}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            type={isPasswordAuthEnabled ? (isPasswordVisible ? "text" : "password") : "email"}
                            placeholder={isPasswordAuthEnabled ? "Enter password..." : "Enter email..."}
                            className="w-full rounded-none border-foreground text-foreground placeholder:text-foreground bg-background/70 shadow-none h-12 pr-12"
                            autoFocus
                            disabled={loginMutation.isPending}
                            {...field}
                          />
                          {isPasswordAuthEnabled && (
                            <button
                              type="button"
                              onClick={() => setIsPasswordVisible((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground/70 transition-colors"
                              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                            >
                              {isPasswordVisible ? (
                                <EyeSlashIcon size={20} weight="regular" />
                              ) : (
                                <EyeIcon size={20} weight="regular" />
                              )}
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginMutation.isError && (
                  <p className="text-sm text-red-600 w-full">
                    {loginMutation.error?.message || "Authentication failed"}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="ecceSecondary"
                  disabled={loginMutation.isPending}
                  className="w-[100px]"
                >
                  <span className="font-zangezi translate-y-[1px]">
                    {loginMutation.isPending ? "Verifying..." : "SUBMIT"}

                  </span>
                </Button>

                <TurnstileWidget />
              </form>
            </Form>
          </div>
          {/* <div className="flex w-full justify-end">
            <Button
              variant="ecceSecondary"
              className="w-[100px]"
              onClick={() => setIsPasswordEntryInfoOpen((prev) => !prev)}
            >
              <span className="font-zangezi translate-y-[1px]">
                INFO
              </span>
            </Button>
          </div> */}
          <animated.div
            style={passwordInfoSpring}
            className="wpAcfWysiwyg font-zangezi w-full text-sm bg-background/70 border border-foreground p-8 overflow-y-auto w-full"
            dangerouslySetInnerHTML={{ __html: passwordEntryInfo ?? "" }}
          />
        </animated.div>
      )
  )
}
