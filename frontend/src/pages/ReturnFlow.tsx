import { useMemo, useState } from 'react';
import {
  api,
  ApiError,
  REASONS,
  type CreatedReturn,
  type FieldError,
  type LookupItem,
  type LookupResult,
  type ReturnReason,
} from '../api';
import { Badge } from '../components/Badge';
import { Checkbox } from '../components/Checkbox';
import { MessageBanner } from '../components/MessageBanner.tsx';
import { SectionHeading } from '../components/SectionHeading';
import { SelectField } from '../components/SelectField';
import { Spinner } from '../components/Spinner';
import { TextField } from '../components/TextField';
import Button from '../components/Button.tsx';

type Step = 'lookup' | 'select' | 'done';

interface LineState {
  selected: boolean;
  quantity: number;
  reason: ReturnReason;
}

export default function ReturnFlow() {
  const [step, setStep] = useState<Step>('lookup');

  // Step 1 state
  const [orderNumber, setOrderNumber] = useState('ORD-1001');
  const [email, setEmail] = useState('anna@example.com');

  // Shared async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);

  // Step 2 state
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lines, setLines] = useState<Record<number, LineState>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

  // Step 3 state
  const [confirmation, setConfirmation] = useState<CreatedReturn | null>(null);

  function resetAll() {
    setStep('lookup');
    setOrderNumber('');
    setEmail('');
    setLookup(null);
    setLines({});
    setFieldErrors({});
    setConfirmation(null);
    setError(null);
  }

  function isEligible(item: LookupItem, reason: ReturnReason): boolean {
    if (reason === 'damaged') return true;
    return item.eligibleWithoutDamage;
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.lookup(orderNumber, email);
      setLookup(result);
      const initial: Record<number, LineState> = {};
      for (const item of result.items) {
        initial[item.id] = { selected: false, quantity: 1, reason: 'wrong_item' };
      }
      setLines(initial);
      setFieldErrors({});
      setStep('select');
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ message: err.message });
      } else {
        setError({ message: 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedLines = useMemo(
    () =>
      Object.entries(lines)
        .filter(([, l]) => l.selected)
        .map(([id, l]) => ({ orderItemId: Number(id), quantity: l.quantity, reason: l.reason })),
    [lines],
  );

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const created = await api.createReturn(orderNumber, email, selectedLines);
      setConfirmation(created);
      setStep('done');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const perLine: Record<number, string> = {};
        const orderLevel: string[] = [];
        err.details.forEach((d: FieldError) => {
          if (d.orderItemId != null) perLine[d.orderItemId] = d.message;
          else orderLevel.push(d.message);
        });
        setFieldErrors(perLine);
        setError({
          message: err.message,
          details: orderLevel.length ? orderLevel : undefined,
        });
      } else if (err instanceof ApiError) {
        setError({ message: err.message });
      } else {
        setError({ message: 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  }

  function updateLine(id: number, patch: Partial<LineState>) {
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // -------------------------------------------------------------------------
  // Step 3: confirmation
  // -------------------------------------------------------------------------
  if (step === 'done' && confirmation) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-emerald-900">Return registered</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Your return number is{' '}
          <span className="font-mono font-semibold">{confirmation.returnNumber}</span>. Keep it for
          your records — we'll be in touch with the next steps.
        </p>
        <Button
          variant={'success'} size={'large'}
          onClick={resetAll}
          className={'mt-4'}
        >
          Register another return
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 2: item selection
  // -------------------------------------------------------------------------
  if (step === 'select' && lookup) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <SectionHeading
            title={<>Order {lookup.orderNumber}</>}
            subtitle="Select the items you'd like to return."
          />
          <Button
            variant={'text'} size={'large'}
            onClick={resetAll}
            className={'self-end md:self-auto'}
          >
            ← Different order
          </Button>
        </div>

        {!lookup.withinWindow && (
          <MessageBanner type={'error'} message="This order is outside the 30-day return window. New returns can't be registered." />
        )}
        {error && <MessageBanner type={'error'} message={error.message} details={error.details} />}

        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {lookup.items.map((item) => {
            const line = lines[item.id];
            const noneLeft = item.returnableQuantity <= 0;
            const eligible = line ? isEligible(item, line.reason) : item.eligibleWithoutDamage;
            const disabled = noneLeft || !lookup.withinWindow;
            const rowError = fieldErrors[item.id];

            return (
              <li key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    aria-label={`Select ${item.name} for return`}
                    className="mt-1"
                    checked={line?.selected ?? false}
                    disabled={disabled}
                    onCheckedChange={(selected) => updateLine(item.id, { selected })}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{item.name}</span>
                      {item.isSale && <Badge>Sale</Badge>}
                      {item.category === 'food' && <Badge>Tea / food</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {lookup.withinWindow
                        ? `${item.returnableQuantity} of ${item.orderedQuantity} still returnable`
                        : `${item.orderedQuantity} ordered`}
                      {item.alreadyRequested > 0 && ` · ${item.alreadyRequested} already requested`}
                    </p>

                    {line?.selected && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <TextField
                          label="Qty"
                          orientation="inline"
                          type="number"
                          min={1}
                          max={item.returnableQuantity}
                          value={line.quantity}
                          onValueChange={(value) =>
                            updateLine(item.id, { quantity: Number(value) })
                          }
                        />
                        <SelectField
                          label="Reason"
                          orientation="inline"
                          value={line.reason}
                          options={REASONS}
                          onValueChange={(reason) => updateLine(item.id, { reason })}
                        />
                        {!eligible && (
                          <span className="text-xs text-amber-700">
                            Normally not returnable — only accepted if damaged.
                          </span>
                        )}
                      </div>
                    )}

                    {rowError && <p className="mt-2 text-xs text-red-600">{rowError}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {selectedLines.length} item{selectedLines.length === 1 ? '' : 's'} selected
          </p>
          <Button
            onClick={handleSubmit}
            variant={'dark'} size={'large'} disabled={loading || selectedLines.length === 0 || !lookup.withinWindow}
          >
            {loading ? 'Submitting…' : 'Submit return request'}
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step 1: lookup
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleLookup} className="space-y-4">
      <SectionHeading
        title="Find your order"
        subtitle="Enter your order number and the email you used to order."
      />

      {error && <MessageBanner type={'error'} message={error.message} />}

      <div className="space-y-3">
        <TextField
          label="Order number"
          value={orderNumber}
          onValueChange={setOrderNumber}
          required
          placeholder="ORD-1001"
        />
        <TextField
          label="Email address"
          type="email"
          value={email}
          onValueChange={setEmail}
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <Button
        variant={'dark'} size={'large'} className={'w-full font-medium'} type={'submit'} disabled={loading}
      >
        {loading ? <Spinner label="Looking up…" /> : 'Find order'}
      </Button>
    </form>
  );
}
