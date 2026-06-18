import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DeletedCardsPagination } from './DeletedCardsPagination';

describe('DeletedCardsPagination', () => {
  it('페이지 번호를 렌더하고 클릭 시 onPageChange 를 호출한다', () => {
    const onPageChange = vi.fn();
    render(
      <DeletedCardsPagination
        safePage={2}
        visiblePageNumbers={[1, 2, 3]}
        previousPage={1}
        nextPage={3}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('이전 페이지가 없으면 < 버튼이 비활성화된다', () => {
    render(
      <DeletedCardsPagination
        safePage={1}
        visiblePageNumbers={[1, 2]}
        previousPage={null}
        nextPage={2}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText('<')).toBeDisabled();
  });
});
