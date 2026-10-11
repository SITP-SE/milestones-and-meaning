'use client';

import { useActionState, useEffect, useState } from 'react';

import { saveServiceAction } from './actions';

// Keep pricing consistent with the existing admin listing.
// Firestore stores prices as integer cents.
function formatPrice(priceCents) {
  if (typeof priceCents !== 'number' || priceCents <= 0) {
    return 'Pricing discussed together';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceCents / 100);
}

// This component is mounted only while a row is being edited.
// Unmounting it on Cancel resets unsaved form state.
function EditServiceRow({ service, onCancel, onSaved }) {
  const [state, formAction, isPending] = useActionState(saveServiceAction, {
    status: 'idle',
    message: '',
  });

  // After a successful Server Action, return to read-only mode.
  // Failed saves leave the form open so Gabi can correct the values.
  useEffect(() => {
    if (state.status === 'success') {
      onSaved();
    }
  }, [state.status, onSaved]);

  // Convert cents to a decimal string without changing the amount.
  const priceDollars = `${Math.floor(service.priceCents / 100)}.${String(
    service.priceCents % 100,
  ).padStart(2, '0')}`;

  const inputClass = 'mt-1 w-full rounded-md border border-gray-400 bg-white p-2 text-black';

  return (
    <tr className="border-t bg-gray-50">
      <td colSpan={5} className="p-4">
        {/* A single form inside the table cell keeps the HTML valid.
            Only this service's fields are submitted. */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="serviceId" value={service.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={`title-${service.id}`} className="block font-medium">
                Service name
              </label>
              <input
                id={`title-${service.id}`}
                name="title"
                type="text"
                defaultValue={service.title}
                maxLength={120}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={`price-${service.id}`} className="block font-medium">
                Price (USD)
              </label>
              <input
                id={`price-${service.id}`}
                name="priceDollars"
                type="text"
                inputMode="decimal"
                defaultValue={priceDollars}
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-600">
                Enter 0 for pricing discussed with the client.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor={`body-${service.id}`} className="block font-medium">
              Description
            </label>
            <textarea
              id={`body-${service.id}`}
              name="body"
              defaultValue={service.body}
              maxLength={2000}
              required
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiresDeposit"
                defaultChecked={service.requiresDeposit}
              />
              Requires $250 deposit
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="isGiftable" defaultChecked={service.isGiftable} />
              Eligible for gifting
            </label>
          </div>

          {/* Keep validation errors visible without closing the form. */}
          {state.status === 'error' && (
            <p role="alert" className="text-sm text-red-700">
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-md border px-4 py-2 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

// This component manages which service is currently editable.
// Keeping the selected ID here prevents multiple edit forms
// from being open at the same time.
export default function ServicesTable({ services }) {
  const [editingId, setEditingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="p-3">
              Service
            </th>
            <th scope="col" className="p-3">
              Price
            </th>
            <th scope="col" className="p-3">
              Deposit
            </th>
            <th scope="col" className="p-3">
              Giftable
            </th>
            <th scope="col" className="p-3">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {services.map((service) =>
            editingId === service.id ? (
              <EditServiceRow
                key={service.id}
                service={service}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  setSavedId(service.id);
                }}
              />
            ) : (
              <tr key={service.id} className="border-t">
                <th scope="row" className="p-3 font-medium">
                  {service.title}

                  <p className="mt-1 font-normal">{service.body}</p>

                  {/* Confirm the saved change without navigating away. */}
                  {savedId === service.id && (
                    <p role="status" className="mt-2 text-sm text-green-700">
                      Service saved successfully.
                    </p>
                  )}
                </th>

                <td className="p-3">{formatPrice(service.priceCents)}</td>

                <td className="p-3">{service.requiresDeposit ? 'Yes' : 'No'}</td>

                <td className="p-3">{service.isGiftable ? 'Yes' : 'No'}</td>

                <td className="p-3">
                  <button
                    type="button"
                    disabled={editingId !== null}
                    onClick={() => {
                      setSavedId(null);
                      setEditingId(service.id);
                    }}
                    className="font-medium underline disabled:opacity-50"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
