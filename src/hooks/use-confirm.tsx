"use client";
import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmState = {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
};

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: { title?: string; description?: string; onConfirm: () => void }) => {
    setConfirmState({
      isOpen: true,
      title: options.title || "Are you absolutely sure?",
      description: options.description || "This action cannot be undone.",
      onConfirm: options.onConfirm,
    });
  }, []);

  const handleClose = useCallback(() => {
    setConfirmState(prev => prev ? { ...prev, isOpen: false } : null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState?.onConfirm) {
      confirmState.onConfirm();
    }
    handleClose();
  }, [confirmState, handleClose]);

  const ConfirmDialog = useCallback(() => (
    <AlertDialog open={confirmState?.isOpen || false} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirmState?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [confirmState, handleClose, handleConfirm]);

  return { confirm, ConfirmDialog };
}
