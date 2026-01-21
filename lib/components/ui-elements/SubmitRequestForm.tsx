"use client"

import { useEffect } from "react"
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
import { Textarea } from "@/lib/components/ui/textarea"
import { Button } from "@/lib/components/ui/button"
import { trackRequestSubmitted } from "@/lib/analytics"
import { useEcceDialog } from "@/lib/components/ecce-elements"
import TurnstileWidget from "@/lib/components/util/TurnstileWidget"

/**
 * Form validation schema
 */
const requestFormSchema = z.object({
  message: z
    .string()
    .min(10, "Please provide more details (at least 10 characters)")
    .max(2000, "Message is too long (max 2000 characters)"),
})

type RequestFormValues = z.infer<typeof requestFormSchema>

/** Auto-close delay in milliseconds */
const AUTO_CLOSE_DELAY = 5000

/** View state for transitions */
type FormView = "form" | "success"

/**
 * Submit request form component
 * Uses React Hook Form with Zod validation
 * Submits data to PostHog as a custom event
 * Auto-closes after successful submission with animated transitions
 */
export function SubmitRequestForm() {
  const { closeDialog } = useEcceDialog()
  
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      message: "",
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (values: RequestFormValues) => {
      // Track the request in PostHog
      trackRequestSubmitted(values.message)
      
      // Simulate a small delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      return { success: true }
    },
    onSuccess: () => {
      form.reset()
    },
  })

  // Auto-close after success
  useEffect(() => {
    if (submitMutation.isSuccess) {
      const timer = setTimeout(() => {
        closeDialog("submit-request")
        // Reset mutation after dialog closes so form is ready for next open
        setTimeout(() => submitMutation.reset(), 300)
      }, AUTO_CLOSE_DELAY)
      
      return () => clearTimeout(timer)
    }
  }, [submitMutation.isSuccess, closeDialog, submitMutation])

  const onSubmit = (values: RequestFormValues) => {
    submitMutation.mutate(values)
  }

  // Determine current view
  const currentView: FormView = submitMutation.isSuccess ? "success" : "form"

  // Animated transition between form and success states
  const transitions = useTransition(currentView, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: config.gentle,
    keys: (view) => view,
  })

  return (
    <div className="relative w-full min-h-[200px]">
      {transitions((styles, view) => (
        <animated.div style={styles} className="absolute inset-0 w-full">
          {view === "success" ? (
            <div className="space-y-4 bg-background border rounded-none border-foreground">
              <div className="text-center py-4">
                <p className="text-sm text-foreground">
                  Request submitted successfully.
                </p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full bg-transparent flex flex-col items-end justify-center">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea
                          placeholder="Type your request here..."
                          className="min-h-[120px] resize-none w-full max-h-[240px] overflow-hidden overflow-y-auto rounded-none border-foreground text-foreground placeholder:text-foreground bg-background/70 shadow-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="ecceSecondary"
                  disabled={submitMutation.isPending}
                >
                  <span className="font-zangezi translate-y-[1px]">
                    {submitMutation.isPending ? "Sending..." : "SEND REQUEST"}
                  </span>
                </Button>

                <TurnstileWidget />

                {submitMutation.isError && (
                  <p className="text-sm text-destructive text-center">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            </Form>
          )}
        </animated.div>
      ))}
    </div>
  )
}
