import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page', () => {
  render(<App />);
  const heading = screen.getByText(/welcome to someshop/i);
  expect(heading).toBeInTheDocument();
});