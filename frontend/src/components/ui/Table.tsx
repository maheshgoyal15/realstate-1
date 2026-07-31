import React from "react";
import { cn } from "@/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  headers: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  className,
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-surface-border bg-surface-raised">
      <table className={cn("w-full border-collapse text-left", className)} {...props}>
        <thead>
          <tr className="border-b border-surface-border">
            {headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className="whitespace-nowrap px-6 py-3.5 text-2xs font-medium uppercase tracking-[0.1em] text-ink-subtle"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border text-sm text-ink">
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return (
    <tr
      className={cn("transition-colors duration-150 hover:bg-surface", className)}
      {...props}
    >
      {children}
    </tr>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell: React.FC<TableCellProps> = ({ children, className, ...props }) => {
  return (
    <td className={cn("px-6 py-4 align-middle", className)} {...props}>
      {children}
    </td>
  );
};
