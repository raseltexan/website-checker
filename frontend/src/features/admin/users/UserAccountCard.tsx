"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, LogOut, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ADMIN_BASE } from "@/lib/navigation";
import {
  useAssignPlanMutation,
  useDeleteUserMutation,
  useGetAdminPlansQuery,
  useRevokeUserSessionsMutation,
  useUnbanUserMutation,
  useUpdateAdminUserMutation,
} from "@/services/adminApi";
import type { AdminUserDetail } from "@/types/admin";
import { BanUserModal } from "./BanUserModal";

/** Role, plan and account-state controls for a single user. */
export function UserAccountCard({ user }: { user: AdminUserDetail }) {
  const router = useRouter();
  const toast = useToast();
  const { user: me } = useAuth();
  const isSelf = me?.id === user.id;
  const plans = useGetAdminPlansQuery();
  const [updateUser, updateState] = useUpdateAdminUserMutation();
  const [assignPlan, assignState] = useAssignPlanMutation();
  const [unban, unbanState] = useUnbanUserMutation();
  const [revoke, revokeState] = useRevokeUserSessionsMutation();
  const [remove, removeState] = useDeleteUserMutation();
  const [banOpen, setBanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const run = async (action: () => Promise<{ error?: unknown }>, success: string) => {
    const res = await action();
    if (res.error) toast.error(res.error);
    else toast.success(success);
    return !res.error;
  };

  return (
    <Card>
      <CardHeader title="Account controls" />
      <CardBody className="space-y-5">
        <FormField label="Role" htmlFor="u-role" hint={isSelf ? "You cannot change your own role." : undefined}>
          <Select
            id="u-role"
            value={user.role ?? "user"}
            disabled={isSelf || updateState.isLoading}
            onChange={(e) => run(() => updateUser({ id: user.id, role: e.target.value as "user" | "admin" }), "Role updated")}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
        <FormField label="Plan" htmlFor="u-plan" hint="Assigning a plan bypasses payment.">
          <Select
            id="u-plan"
            value={user.subscription?.planId ?? ""}
            disabled={assignState.isLoading || plans.isLoading}
            onChange={(e) => e.target.value && run(() => assignPlan({ userId: user.id, planId: e.target.value, interval: "monthly" }), "Plan assigned")}
          >
            <option value="" disabled>Select a plan</option>
            {plans.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {!user.emailVerified && (
            <Button variant="outline" icon={<ShieldCheck className="size-4" />} onClick={() => run(() => updateUser({ id: user.id, emailVerified: true }), "Email marked verified")}>
              Mark verified
            </Button>
          )}
          <Button variant="outline" icon={<LogOut className="size-4" />} loading={revokeState.isLoading} onClick={() => run(() => revoke(user.id), "Sessions revoked")}>
            Sign out everywhere
          </Button>
          {user.banned ? (
            <Button variant="outline" icon={<UserCheck className="size-4" />} loading={unbanState.isLoading} onClick={() => run(() => unban(user.id), "User reactivated")}>
              Reactivate
            </Button>
          ) : (
            <Button variant="outline" icon={<Ban className="size-4" />} disabled={isSelf} onClick={() => setBanOpen(true)}>
              Suspend
            </Button>
          )}
          <Button variant="danger" icon={<Trash2 className="size-4" />} disabled={isSelf} onClick={() => setDeleteOpen(true)}>
            Delete user
          </Button>
        </div>
      </CardBody>
      <BanUserModal userId={user.id} open={banOpen} onClose={() => setBanOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={removeState.isLoading}
        title={`Delete ${user.name}?`}
        description="This permanently deletes the user and all their websites, scans and reports."
        confirmLabel="Delete user"
        onConfirm={async () => {
          if (await run(() => remove(user.id), "User deleted")) router.replace(`${ADMIN_BASE}/users`);
        }}
      />
    </Card>
  );
}
