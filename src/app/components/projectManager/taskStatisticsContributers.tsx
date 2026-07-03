"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useMicroTaskStatisticContributors } from "@/lib/hooks/useProject";
import { PaginationControls } from "@/components/ui/pagination";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ContributorMicroTaskAssignment } from "@/app/types/project";

import type { SortingState } from "@tanstack/react-table";

interface MicroTaskListProps {
  taskId: string;
}

const TaskStatisticsContributers: React.FC<MicroTaskListProps> = ({
  taskId,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>();
  const {
    data: statisticsContributersData,
    isLoading: isMicroTaskLoading,
    error: microTaskError,
  } = useMicroTaskStatisticContributors({
    page,
    pageSize,
    searchQuery,
    taskId,
    verificationStatus,
  });

  const statisticsContributers: ContributorMicroTaskAssignment[] =
    Array.isArray(statisticsContributersData?.data?.result)
      ? statisticsContributersData.data.result
      : [];
  const microTaskTotalElements = statisticsContributersData?.data?.total || 0;
  const microTaskTotalPages = statisticsContributersData?.data?.totalPages || 1;
  const statisticsContributerstartRecord = statisticsContributers.length
    ? (page - 1) * pageSize + 1
    : 0;
  const microTaskEndRecord = Math.min(page * pageSize, microTaskTotalElements);

  // Define all possible columns
  const allColumns: ColumnDef<ContributorMicroTaskAssignment>[] = [
    {
      header: "Full name",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.contributor?.first_name || " "}{" "}
          {row.original.contributor?.middle_name || " "}{" "}
          {row.original.contributor?.last_name || " "}
        </div>
      ),
    },
    // {
    //   header: "Email",
    //   enableSorting: true,
    //   cell: ({ row }) => (
    //     <div className="min-w-[150px] max-w-[300px] truncate">
    //       {row.original.contributor?.email || " "}
    //     </div>
    //   ),
    // },
    {
      header: " phone number ",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.contributor?.phone_number || " "}
        </div>
      ),
    },
    {
      header: "Gender",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.contributor?.gender || " "}
        </div>
      ),
    },
    {
      header: "Total Micro task",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.total_micro_tasks || " "}
        </div>
      ),
    },
    {
      header: "Current batch",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.current_batch || " "}
        </div>
      ),
    },
    {
      header: "Dead line",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.dead_line
            ? new Date(row.original.dead_line).toLocaleString()
            : " "}
        </div>
      ),
    },
    {
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.status}
        </div>
      ),
    },
    {
      header: "Created date",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.created_date
            ? new Date(row.original.created_date).toLocaleString()
            : " "}
        </div>
      ),
    },
  ];

  const microTaskTable = useReactTable({
    data: statisticsContributers,
    columns: allColumns,
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize: pageSize },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    rowCount: microTaskTotalElements,
  });

  if (microTaskError) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Error loading statisticsContributers:{" "}
          {(microTaskError as Error).message}
        </p>
      </div>
    );
  }

  return (
    <>
      {isMicroTaskLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div>
          <div className="w-full overflow-x-auto rounded-md border border-gray-100 bg-white px-4 py-4">
            <Table>
              <TableHeader>
                {microTaskTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-sm font-bold text-gray-500 bg-gray-50 px-2 py-5"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className="flex items-center space-x-1 cursor-pointer"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {header.column.getCanSort() && (
                              <span className="text-gray-500">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ArrowDown className="h-4 w-4" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {microTaskTable.getRowModel().rows?.length ? (
                  microTaskTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-gray-100">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-2 py-5 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={allColumns.length}
                      className="h-24 text-center"
                    >
                      {isMicroTaskLoading ? (
                        ""
                      ) : (
                        <div className="flex justify-center items-center h-48"></div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between py-4">
            <PaginationControls
              pagination={{
                pageCount: microTaskTotalPages,
                page: page,
                setPage: setPage,
                pageSize: pageSize,
                setPageSize: setPageSize,
                showingText:
                  microTaskTotalElements > 0
                    ? `Showing ${statisticsContributerstartRecord} to ${microTaskEndRecord} out of ${microTaskTotalElements} records`
                    : "",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TaskStatisticsContributers;
