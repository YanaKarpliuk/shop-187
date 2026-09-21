export type Category = 'food' | 'accessory';
export type ReturnReason = 'wrong_item' | 'damaged' | 'changed_mind' | 'other';
export type ReturnStatus = 'open' | 'approved' | 'rejected';

export const REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

export interface LookupItem {
  id: number;
  name: string;
  orderedQuantity: number;
  alreadyRequested: number;
  returnableQuantity: number;
  isSale: boolean;
  category: Category;
  eligibleWithoutDamage: boolean;
}

export interface LookupResult {
  orderNumber: string;
  orderedAt: string;
  withinWindow: boolean;
  items: LookupItem[];
}

export interface CreatedReturn {
  returnNumber: string;
  status: ReturnStatus;
  items: { id: number; orderItemId: number; quantity: number; reason: ReturnReason }[];
}

export interface OwnerReturn {
  id: number;
  returnNumber: string;
  status: ReturnStatus;
  createdAt: string;
  order: { orderNumber: string; email: string };
  items: {
    id: number;
    quantity: number;
    reason: ReturnReason;
    orderItem: { name: string };
  }[];
}

export interface FieldError {
  orderItemId?: number;
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: FieldError[],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      headers: { 'content-type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the backend running?');
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? 'UNKNOWN',
      err.message ?? 'Request failed.',
      Array.isArray(err.details) ? err.details : undefined,
    );
  }
  return body as T;
}

export const api = {
  lookup: (orderNumber: string, email: string) =>
    request<LookupResult>('/lookup', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, email }),
    }),

  createReturn: (
    orderNumber: string,
    email: string,
    items: { orderItemId: number; quantity: number; reason: ReturnReason }[],
  ) =>
    request<CreatedReturn>('/returns', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, email, items }),
    }),

  // Owner endpoints live under /api/admin (unauthenticated, see DECISIONS.md).
  listReturns: () => request<OwnerReturn[]>('/admin/returns'),

  setStatus: (id: number, status: ReturnStatus) =>
    request<{ id: number; status: ReturnStatus }>(`/admin/returns/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};