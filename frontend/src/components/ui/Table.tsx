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
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/30">
      <table className={cn("w-full text-left border-collapse", className)} {...props}>
        <thead>
          <tr className="bg-slate-950/60 border-b border-white/10">
            {headers.map((header, idx) => (
              <th 
                key={idx} 
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300 text-sm font-medium">
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
      className={cn("hover:bg-white/5 transition-colors duration-150", className)} 
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
