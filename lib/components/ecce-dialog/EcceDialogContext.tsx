"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type EcceDialogContextType = {
  /** Currently open dialog ID, null if none open */
  openDialogId: string | null
  /** Open a specific dialog by ID, closes any currently open dialog */
  openDialog: (id: string) => void
  /** Close a specific dialog by ID */
  closeDialog: (id: string) => void
  /** Toggle a dialog open/closed */
  toggleDialog: (id: string) => void
  /** Check if a specific dialog is open */
  isDialogOpen: (id: string) => boolean
}

const EcceDialogContext = createContext<EcceDialogContextType | null>(null)

/**
 * Provider for managing ECCE dialog state
 * Ensures only one dialog can be open at a time
 */
export function EcceDialogProvider({ children }: { children: ReactNode }) {
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)

  const openDialog = useCallback((id: string) => {
    setOpenDialogId(id)
  }, [])

  const closeDialog = useCallback((id: string) => {
    setOpenDialogId((current) => (current === id ? null : current))
  }, [])

  const toggleDialog = useCallback((id: string) => {
    setOpenDialogId((current) => (current === id ? null : id))
  }, [])

  const isDialogOpen = useCallback(
    (id: string) => openDialogId === id,
    [openDialogId]
  )

  return (
    <EcceDialogContext.Provider
      value={{
        openDialogId,
        openDialog,
        closeDialog,
        toggleDialog,
        isDialogOpen,
      }}
    >
      {children}
    </EcceDialogContext.Provider>
  )
}

/**
 * Hook to access ECCE dialog context
 * Must be used within an EcceDialogProvider
 */
export function useEcceDialog() {
  const context = useContext(EcceDialogContext)
  if (!context) {
    throw new Error("useEcceDialog must be used within an EcceDialogProvider")
  }
  return context
}

