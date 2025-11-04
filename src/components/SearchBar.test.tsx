import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('should render with placeholder text', () => {
    render(
      <SearchBar searchQuery="" onSearchChange={vi.fn()} />
    );

    const input = screen.getByPlaceholderText('Search documentation...');
    expect(input).toBeInTheDocument();
  });

  it('should display the search query', () => {
    render(
      <SearchBar searchQuery="test query" onSearchChange={vi.fn()} />
    );

    const input = screen.getByDisplayValue('test query');
    expect(input).toBeInTheDocument();
  });

  it('should call onSearchChange when user types', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <SearchBar searchQuery="" onSearchChange={onSearchChange} />
    );

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'test');

    // Verify that onSearchChange was called
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange.mock.calls.length).toBeGreaterThan(0);
  });

  it('should show loading indicator when isSearching is true', () => {
    render(
      <SearchBar
        searchQuery="test"
        onSearchChange={vi.fn()}
        isSearching={true}
      />
    );

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should not show loading indicator when isSearching is false', () => {
    render(
      <SearchBar
        searchQuery="test"
        onSearchChange={vi.fn()}
        isSearching={false}
      />
    );

    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });

  it('should show search icon', () => {
    const { container } = render(
      <SearchBar searchQuery="" onSearchChange={vi.fn()} />
    );

    // lucide-react icons have a specific class structure
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should show results updated message when search is complete and query exists', () => {
    render(
      <SearchBar
        searchQuery="test"
        onSearchChange={vi.fn()}
        isSearching={false}
      />
    );

    expect(screen.getByText('Search results updated')).toBeInTheDocument();
  });

  it('should not show status message when query is empty', () => {
    render(
      <SearchBar
        searchQuery=""
        onSearchChange={vi.fn()}
        isSearching={false}
      />
    );

    expect(screen.queryByText('Search results updated')).not.toBeInTheDocument();
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });
});
