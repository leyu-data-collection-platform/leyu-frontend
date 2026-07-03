"use client";
import React, { useState } from "react";
import {
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialogLeft";
import {
  useGetTaskMicroTaskResponseForReviewersSubmission,
  useReject,
} from "@/lib/hooks/useReviewer";
import {
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from "lucide-react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ReviewerDataset } from "@/app/types/project";
import { SortingState } from "@tanstack/react-table";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface MicroTaskListProps {
  taskId: string;
  microTaskPage: number;
  setMicroTaskPage: (page: number) => void;
  microTaskPageSize: number;
  setMicroTaskPageSize: (pageSize: number) => void;
  searchQuery: string;
  verificationStatus?: string;
  setVerificationStatus: (status: string | undefined) => void;
}

interface PaginationProps {
  pageCount: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  showingText: string;
}

interface RejectPayload {
  reason: string;
  comment: string;
  rejection_type_id: string;
}

const PaginationControls: React.FC<{ pagination: PaginationProps }> = ({
  pagination,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="md:text-sm text-xs text-gray-500">{t('showing')}</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            pagination.setPageSize(newSize);
            pagination.setPage(1);
          }}
          className="border  border-gray-100 rounded-md md:text-sm text-xs px-2 py-1 bg-white"
          title="Page Size"
        >
          {[5, 10, 20, 30, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="md:text-sm text-xs pl-2 text-gray-500">
        {pagination.showingText}
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={() => pagination.setPage(Math.max(1, pagination.page - 1))}
          disabled={pagination.page <= 1}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        {Array.from(
          { length: Math.max(1, pagination.pageCount) },
          (_, i) => i + 1
        ).map((pageNumber) => (
          <Button
            key={pageNumber}
variant={pagination.page === pageNumber ? "outline" : "ghost"}            className={
              pagination.page === pageNumber ? "border-brand text-brand" : ""
            }
            size="sm"
            onClick={() => pagination.setPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          size="sm"
          onClick={() => pagination.setPage(pagination.page + 1)}
          disabled={pagination.page >= pagination.pageCount}
        >
          <ChevronRightIcon className="md:w-4 md:h-4 w-2 h-2" />
        </Button>
      </div>
    </div>
  );
};

const MicroTaskListSubission: React.FC<MicroTaskListProps> = ({
  taskId,
  searchQuery,
  verificationStatus,
  setVerificationStatus,
}) => {
  const [microTaskPage, setMicroTaskPage] = useState(1);
  const [microTaskPageSize, setMicroTaskPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const { t } = useTranslation();
  const [selectedRejectionReasonId, setSelectedRejectionReasonId] =
    useState<string>("");
  const [rejectionComment, setRejectionComment] = useState<string>("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedMicroTaskId, setSelectedMicroTaskId] = useState<string | null>(
    null
  );

  const {
    data: microtasksData,
    isLoading: isMicroTaskLoading,
    error: microTaskError,
  } = useGetTaskMicroTaskResponseForReviewersSubmission({
    microTaskPage,
    microTaskPageSize,
    searchQuery,
    taskId,
    verificationStatus,
  });

  const { data: rejectionReasonsData } = useReject();

  const microtasks: ReviewerDataset[] = Array.isArray(
    microtasksData?.data?.result
  )
    ? microtasksData.data.result
    : [];
  const rejectionReasons =
    rejectionReasonsData && Array.isArray(rejectionReasonsData.data)
      ? rejectionReasonsData.data
      : [];
  const microTaskTotalElements = microtasksData?.data?.total || 0;
  const microTaskTotalPages = microtasksData?.data?.totalPages || 1;
  const microTaskStartRecord = microtasks.length
    ? (microTaskPage - 1) * microTaskPageSize + 1
    : 0;
  const microTaskEndRecord = Math.min(
    microTaskPage * microTaskPageSize,
    microTaskTotalElements
  );

  const rejectMutation = useMutation({
    mutationFn: async ({
      microTaskId,
      payload,
    }: {
      microTaskId: string;
      payload: RejectPayload;
    }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/reject/${microTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Add authentication headers if required, e.g., Authorization: Bearer <token>
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to reject microtask: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Microtask rejected successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (microTaskId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviewer-task/approve/${microTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Add authentication headers if required, e.g., Authorization: Bearer <token>
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to approve microtask: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Microtask approved successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAccept = (microTaskId: string) => {
    approveMutation.mutate(microTaskId);
  };

  const handleReject = (microTaskId: string) => {
    setSelectedMicroTaskId(microTaskId);
    setIsRejectDialogOpen(true);
  };

  const submitRejection = () => {
    if (selectedMicroTaskId && selectedRejectionReasonId) {
      const selectedReason = rejectionReasons.find(
        (reason: { id: string; name: string }) =>
          reason.id === selectedRejectionReasonId
      );
      rejectMutation.mutate({
        microTaskId: selectedMicroTaskId,
        payload: {
          reason: selectedReason?.name || "Unknown",
          comment: rejectionComment || "",
          rejection_type_id: selectedRejectionReasonId,
        },
      });
      setIsRejectDialogOpen(false);
      setSelectedRejectionReasonId("");
      setRejectionComment("");
      setSelectedMicroTaskId(null);
    }
  };

  const microTaskColumns: ColumnDef<ReviewerDataset>[] = [
    {
      accessorKey: "code",
      header: t('codeHeader'),
    },
    {
      accessorKey: "microTask.code",
      header: t('microTaskCodeHeader'),
    },
    {
      accessorKey: "status",
      header: t('statusHeader'),
    },
    {
      accessorKey: "contributor.email",
      header: t('contributorHeader'),
    },
  ];

  const microTaskTable = useReactTable({
    data: microtasks,
    columns: microTaskColumns,
    state: {
      sorting,
      pagination: { pageIndex: microTaskPage - 1, pageSize: microTaskPageSize },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({
              pageIndex: microTaskPage - 1,
              pageSize: microTaskPageSize,
            })
          : updater;
      if (
        next.pageIndex !== undefined &&
        next.pageIndex !== microTaskPage - 1
      ) {
        setMicroTaskPage(next.pageIndex + 1);
      }
      if (next.pageSize !== undefined && next.pageSize !== microTaskPageSize) {
        setMicroTaskPageSize(next.pageSize);
        setMicroTaskPage(1);
      }
    },
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
          Error loading microtasks: {(microTaskError as Error).message}
        </p>
      </div>
    );
  }

  return (
    <>
      {microtasks.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-12">
          <img 
            src="/empty.svg" 
            alt="No micro tasks found" 
            className="w-64 h-64 opacity-50"
          />
          
          {/* Loading overlay for empty state */}
          {isMicroTaskLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>
      ) : isMicroTaskLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div>
          <div className="rounded-md border border-gray-100 bg-white overflow-hidden relative">
            <Table>
              <TableHeader>
                {microTaskTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-sm h-12 bg-[#FCFCFD] p-6 font-bold text-gray-500 px-2 py-5"
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
                        <TableCell key={cell.id} className="py-5 px-5 text-sm">
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
                      colSpan={microTaskColumns.length}
                      className="h-24 text-center"
                    >
                      {isMicroTaskLoading ? "" :  <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>}
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
                page: microTaskPage,
                setPage: setMicroTaskPage,
                pageSize: microTaskPageSize,
                setPageSize: setMicroTaskPageSize,
                showingText:
                  microTaskTotalElements > 0
                    ? `Showing ${microTaskStartRecord} to ${microTaskEndRecord} out of ${microTaskTotalElements} records`
                    : "",
              }}
            />
          </div>
        </div>
      )}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectMicroTask')}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="text-sm font-semibold">
                {t('rejectionReasonLabel')}
              </label>
              <select
                id="rejectionReason"
                value={selectedRejectionReasonId}
                onChange={(e) => setSelectedRejectionReasonId(e.target.value)}
                className="w-full border rounded-md p-2 mt-1"
              >
                <option value="">{t('selectAReason')}</option>
                {rejectionReasons.map(
                  (reason: { id: string; name: string }) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.name}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="rejectionComment" className="text-sm font-semibold">
                {t('commentOptional')}
              </label>
              <textarea
                id="rejectionComment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="w-full border rounded-md p-2 mt-1"
                rows={4}
                placeholder={t('enterAdditionalComments')}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setIsRejectDialogOpen(false); setSelectedRejectionReasonId(""); setRejectionComment(""); }}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={submitRejection} disabled={!selectedRejectionReasonId || rejectMutation.isPending}>
                {rejectMutation.isPending ? t('submitting') : t('submitRejection')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MicroTaskListSubission;
