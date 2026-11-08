"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/redux/hooks";
import { api } from "@/services/api";
import { useDeleteAccountMutation } from "@/services/userApi";

const CONFIRM_TEXT = "DELETE";

export function DangerZoneCard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const onDelete = async () => {
    const res = await deleteAccount();
    if ("error" in res) return toast.error(res.error);
    dispatch(api.util.resetApiState());
    router.replace("/");
  };

  return (
    <Card className="border-red-200">
      <CardHeader title="Danger zone" description="Permanently delete your account, websites, scans and reports." />
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">This action cannot be undone.</p>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete account</Button>
      </CardBody>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={confirm !== CONFIRM_TEXT} loading={isLoading} onClick={onDelete}>Delete forever</Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Type <span className="font-bold text-ink">{CONFIRM_TEXT}</span> to confirm. All of your data will be permanently removed.
        </p>
        <Input className="mt-3" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirmation text" />
      </Modal>
    </Card>
  );
}
