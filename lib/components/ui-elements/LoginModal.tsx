"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useTransition, animated, config } from "@react-spring/web"
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
import { Eye, EyeIcon, EyeSlash, EyeSlashIcon } from "@phosphor-icons/react"
import TurnstileWidget from "../util/TurnstileWidget"

/**
 * Form validation schema
 */
const loginFormSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

/**
 * Login modal for research mode authentication
 * 
 * Uses React Hook Form with Zod validation
 * Validates password against WordPress config via API route
 * Sets HttpOnly session cookie on successful login
 */
export default function LoginModal() {
  const {
    isLoginModalOpen,
    setLoginModalOpen,
    setAuthenticated,
    setViewMode
  } = useAppModeStore()

  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      password: "",
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
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

      return data
    },
    onSuccess: (data) => {
      setAuthenticated(true, data.role as UserRole)
      setViewMode("research")
      form.reset()
      setLoginModalOpen(false)
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

  return transitions(
    (styles, item) =>
      item && (
        <animated.div
          style={styles}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-full max-w-md px-4 pointer-events-auto"
        >
          <div className="bg-transparent p-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 w-full bg-transparent flex flex-col items-end justify-center"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            type={isPasswordVisible ? "text" : "password"}
                            placeholder="Enter password..."
                            className="w-full rounded-none border-foreground text-foreground placeholder:text-foreground bg-background/70 shadow-none h-12 pr-12"
                            autoFocus
                            disabled={loginMutation.isPending}
                            {...field}
                          />
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
                >
                  <span className="font-zangezi translate-y-[1px]">
                    {loginMutation.isPending ? "Verifying..." : "SUBMIT"}

                  </span>
                </Button>

                <TurnstileWidget />
              </form>
            </Form>
          </div>
        </animated.div>
      )
  )
}
