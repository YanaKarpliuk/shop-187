import { useEffect, useState } from 'react';
import { api, ApiError, type OwnerReturn, type ReturnStatus } from '../api';
import { MessageBanner } from '../components/MessageBanner.tsx';
import { SectionHeading } from '../components/SectionHeading';
import { Spinner } from '../components/Spinner';
import { StatusPill } from '../components/StatusPill';
import Button from '../components/Button.tsx';

const REASON_LABELS: Record<string, string> = {
  wrong_item: 'Wrong item',
  damaged: 'Damaged',
  changed_mind: 'Changed mind',
  other: 'Other',
};

export default function OwnerList() {
  const [returns, setReturns] = useState<OwnerReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setReturns(await api.listReturns());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load return requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeStatus(id: number, status: ReturnStatus) {
    setUpdatingId(id);
    setError(null);
    // Optimistic update, rolled back on failure.
    const previous = returns;
    setReturns((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await api.setStatus(id, status);
    } catch (err) {
      setReturns(previous);
      setError(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <Spinner label="Loading return requests…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeading
          title="Return requests"
          subtitle={`${returns?.length ?? 0} total`}
        />
        <Button onClick={() => void load()} size={'large'}>Refresh</Button>
      </div>

      <MessageBanner
        type={'warning'}
        message={'⚠ Owner view is unauthenticated in this version. Add access control before production.'}
      />

      {error && <MessageBanner type={'error'} message={error} />}

      {returns && returns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          No return requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {returns && returns.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {r.returnNumber}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Order {r.order.orderNumber} · {r.order.email} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
                    {r.items.map((it) => (
                      <li key={it.id}>
                        {it.quantity} × {it.orderItem.name}
                        <span className="text-slate-400"> — {REASON_LABELS[it.reason] ?? it.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 gap-2 flex-wrap">
                  {r.status === 'open' ? (
                    <>
                      <Button onClick={() => changeStatus(r.id, 'approved')} variant={'success'} disabled={updatingId === r.id}>Approve</Button>
                      <Button onClick={() => changeStatus(r.id, 'rejected')} variant={'danger'} disabled={updatingId === r.id}>Reject</Button>
                    </>
                  ) : (
                    <Button onClick={() => changeStatus(r.id, 'open')} variant={'neutral'} disabled={updatingId === r.id}>Reopen</Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}