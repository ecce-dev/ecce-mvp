"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/components/ui/form"
import { Textarea } from "@/lib/components/ui/textarea"
import { Button } from "@/lib/components/ui/button"
import { trackRequestSubmitted } from "@/lib/analytics"

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

/**
 * Submit request form component
 * Uses React Hook Form with Zod validation
 * Submits data to PostHog as a custom event
 */
export function SubmitRequestForm() {
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

  const onSubmit = (values: RequestFormValues) => {
    submitMutation.mutate(values)
  }

  // Show success state
  if (submitMutation.isSuccess) {
    return (
      <div className="space-y-4 bg-none">
        <div className="text-center py-4">
          <p className="text-sm text-green-600 dark:text-green-400 mb-2">
            Request submitted successfully
          </p>
          <p className="text-xs text-muted-foreground">
            Thank you for your feedback
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => submitMutation.reset()}
        >
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full bg-transparent flex flex-col items-end justify-center">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="w-full">
              {/* <FormLabel>Your Request</FormLabel> */}
              <FormControl>
                <Textarea
                  placeholder="Type your request here..."
                  className="min-h-[120px] resize-none w-full max-h-[240px] overflow-hidden overflow-y-auto rounded-none border-black text-black placeholder:text-black bg-background/70 shadow-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className=""
          variant="ecceSecondary"
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Sending..." : "Send Request"}
        </Button>

        {submitMutation.isError && (
          <p className="text-sm text-destructive text-center">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </Form>
  )
}
