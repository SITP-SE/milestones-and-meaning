import { fireEvent, render, screen } from '@testing-library/react';

import ServicesTable from '@/components/admin/services/ServicesTable';

// The UI tests should not perform real database writes.
jest.mock('@/app/admin/(protected)/services/actions', () => ({
  saveServiceAction: jest.fn(),
}));

const services = [
  {
    id: 'wedding_officiation',
    title: 'Wedding Officiation',
    body: 'Personalized wedding ceremony.',
    priceCents: 59500,
    requiresDeposit: true,
    isGiftable: true,
  },
  {
    id: 'grief_support',
    title: 'Grief Support',
    body: 'Compassionate bereavement support.',
    priceCents: 0,
    requiresDeposit: false,
    isGiftable: false,
  },
];

describe('ServicesTable', () => {
  test('displays services in read-only mode initially', () => {
    render(<ServicesTable services={services} />);

    expect(screen.getByText('Wedding Officiation')).toBeInTheDocument();
    expect(screen.getByText('Grief Support')).toBeInTheDocument();

    // Both services should have an Edit button.
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);

    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  test('makes the selected row editable', () => {
    render(<ServicesTable services={services} />);

    // Edit the first service.
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    expect(screen.getByRole('textbox', { name: 'Service name' })).toHaveValue(
      'Wedding Officiation',
    );

    expect(screen.getByRole('textbox', { name: 'Price (USD)' })).toHaveValue('595.00');

    expect(screen.getByRole('checkbox', { name: 'Requires $250 deposit' })).toBeChecked();

    // Other rows must not become editable simultaneously.
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });

  test('Cancel discards unsaved changes', () => {
    render(<ServicesTable services={services} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    const nameInput = screen.getByRole('textbox', {
      name: 'Service name',
    });

    fireEvent.change(nameInput, {
      target: { value: 'Changed Service Name' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // The original service name is still displayed.
    expect(screen.getByText('Wedding Officiation')).toBeInTheDocument();

    expect(screen.queryByText('Changed Service Name')).not.toBeInTheDocument();

    // Reopening the editor must show the original value.
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    expect(screen.getByRole('textbox', { name: 'Service name' })).toHaveValue(
      'Wedding Officiation',
    );
  });
});
