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
    <div className="w-full overflow-x-auto rounded-xl border border-surface-border bg-surface-raised">
      <table className={cn("w-full text-left border-collapse", className)} {...props}>
        <thead>
          <tr className="bg-surface-sunken border-b border-surface-border">
            {headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border text-ink text-sm font-medium">
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
      className={cn("hover:bg-surface-sunken transition-colors duration-150", className)}
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
