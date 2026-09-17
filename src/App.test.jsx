import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Vexel auth screen', () => {
  render(<App />);

  expect(screen.getByText(/welcome to vexel/i)).toBeDefined();

  expect(
    screen.getByRole('button', {
      name: /sign in/i,
    })
  ).toBeDefined();
});
