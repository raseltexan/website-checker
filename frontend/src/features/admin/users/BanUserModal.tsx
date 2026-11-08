"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useBanUserMutation } from "@/services/adminApi";

export function BanUserModal({ userId, open, onClose }: { userId: string; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("");
  const [ban, { isLoading }] = useBanUserMutation();

  const submit = async () => {
    const res = await ban({ id: userId, reason: reason || undefined, expiresInDays: days ? Number(days) : undefined });
    if ("error" in res) return toast.error(res.error);
    toast.success("User suspended and signed out");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suspend user"
      description="The user is signed out everywhere and cannot sign in until reactivated."
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={isLoading} onClick={submit}>Suspend</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Reason" htmlFor="ban-reason" hint="Shown to the user on sign-in.">
          <Textarea id="ban-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Violation of terms of service" />
        </FormField>
        <FormField label="Duration (days)" htmlFor="ban-days" hint="Leave empty for an indefinite suspension.">
          <Input id="ban-days" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
