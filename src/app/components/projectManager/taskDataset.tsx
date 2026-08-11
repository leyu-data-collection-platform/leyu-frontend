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
import { renderPaginationButtons } from "@/components/ui/paginationHelper";
import {
  useGetTaskTaskDatasetDetail,
  useGetTaskTaskDatasetDetailFilter,
} from "@/lib/hooks/useMicrotask";
import { ReviewerDatset } from "@/app/types/project";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  Copy,
  Eye,
  Plus,
  Users,
  Link2,
  ChevronDown,
  Play,
  Pause,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialogLeft";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { formatDateMedium } from "@/app/types/dateUtils";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap";
import { FilterComponent } from "@/components/ui/filterComponent";
import { useSession } from "next-auth/react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useDatasetDetails } from "@/lib/hooks/useDatasetDetails";

interface TaskDatasetProps {
  taskId: string;
}

interface PaginationProps {
  pageCount: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  showingText: string;
}

const PaginationControls: React.FC<{ pagination: PaginationProps }> = ({
  pagination,
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="md:text-sm text-xs text-gray-500">Showing</span>
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
        {renderPaginationButtons({
          currentPage: pagination.page,
          totalPages: pagination.pageCount,
          onPageChange: pagination.setPage,
        })}
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

const TaskDataset: React.FC<TaskDatasetProps> = ({ taskId }) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>();
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<{ [key: string]: string | boolean }>(
    {},
  );

  // Approval/Rejection states
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState("");
  const [selectedAnnotationName, setSelectedAnnotationName] = useState("");
  const [approvalAnnotation, setApprovalAnnotation] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [selectedRejectionTypeIds, setSelectedRejectionTypeIds] = useState<
    string[]
  >([]);
  const [rejectionFlag, setRejectionFlag] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigation states
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalSubmissionId, setModalSubmissionId] = useState<string | null>(null);
  const [isReviewStatusOpen, setIsReviewStatusOpen] = useState(false);

  // Bulk select/approve/reject state
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkRejectionReasonIds, setBulkRejectionReasonIds] = useState<
    string[]
  >([]);
  const [bulkRejectionComment, setBulkRejectionComment] = useState("");

  const toggleBulkSelected = (id: string) => {
    setSelectedBulkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch rejection types
  const [rejectionTypes, setRejectionTypes] = useState<any[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [hasAttemptedReject, setHasAttemptedReject] = useState(false);
  const [hasAttemptedApprove, setHasAttemptedApprove] = useState(false);
  useEffect(() => {
    const fetchRejectionTypes = async () => {
      if (!session?.access_token) return;
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/setting/rejection-type`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );
        setRejectionTypes(response.data.data || []);
      } catch (error) {
        console.error("Error fetching rejection types:", error);
      }
    };
    fetchRejectionTypes();
  }, [session?.access_token]);

  // Fetch annotations
  useEffect(() => {
    const fetchAnnotations = async () => {
      if (!session?.access_token) return;
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/setting/annotation`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );
        setAnnotations(response.data.data || []);
      } catch (error) {
        console.error("Error fetching annotations:", error);
      }
    };
    fetchAnnotations();
  }, [session?.access_token]);

  const filterableColumns = [{ accessorKey: "status", header: "Status" }];
  const handleFilterChange = (
    newFilters: { [key: string]: string | boolean },
    endpoint: string,
  ) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Approval handler
  const handleApprove = async () => {
    setHasAttemptedApprove(true);

    if (!selectedSubmissionId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/pm/approve/${selectedSubmissionId}`,
        {
          ...(selectedAnnotationId
            ? {
                annotation_id: selectedAnnotationId,
                annotation: selectedAnnotationName,
                annotationIds: [selectedAnnotationId],
              }
            : {}),
        },
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );

      toast.success("Submission approved successfully");
      setIsApproveDialogOpen(false);
      setSelectedAnnotationId("");
      setSelectedAnnotationName("");
      setHasAttemptedApprove(false);

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["taskDatasets", taskId],
      });

      // Auto-advance to the next submission instead of leaving the detail
      // modal open on the now-approved (stale) one.
      if (isDetailModalOpen) {
        handleNextSubmission();
      } else {
        setSelectedSubmissionId(null);
      }
    } catch (error: any) {
      toast.error("Error approving submission", {
        description:
          error.response?.data?.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rejection handler
  const handleReject = async () => {
    setHasAttemptedReject(true);

    if (!selectedSubmissionId || selectedRejectionTypeIds.length === 0) {
      toast.error("Please select at least one rejection reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/pm/reject/${selectedSubmissionId}`,
        {
          comment: rejectionComment,
          flag: rejectionFlag,
          rejection_type_ids: [selectedRejectionTypeIds],
        },
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );

      toast.success("Submission rejected successfully");
      setIsRejectDialogOpen(false);
      setRejectionComment("");
      setSelectedRejectionTypeIds([]);
      setRejectionFlag(true);
      setHasAttemptedReject(false);

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["taskDatasets", taskId],
      });

      // Auto-advance to the next submission instead of leaving the detail
      // modal open on the now-rejected (stale) one.
      if (isDetailModalOpen) {
        handleNextSubmission();
      } else {
        setSelectedSubmissionId(null);
      }
    } catch (error: any) {
      toast.error("Error rejecting submission", {
        description:
          error.response?.data?.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportBulkResult = (result: {
    succeeded: string[];
    failed: { id: string; error: string }[];
  }) => {
    if (result.failed.length === 0) {
      toast.success(`${result.succeeded.length} submission(s) processed successfully.`);
    } else if (result.succeeded.length === 0) {
      toast.error(`All ${result.failed.length} submission(s) failed`, {
        description: result.failed[0]?.error,
      });
    } else {
      toast.error(
        `${result.succeeded.length} succeeded, ${result.failed.length} failed`,
        { description: result.failed[0]?.error },
      );
    }
  };

  const bulkApproveMutation = async () => {
    if (selectedBulkIds.size === 0) return;
    setIsBulkSubmitting(true);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/pm/bulk-approve`,
        { ids: Array.from(selectedBulkIds) },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      reportBulkResult(response.data);
      setSelectedBulkIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["taskDatasets", taskId] });
    } catch (error: any) {
      toast.error("Error bulk approving submissions", {
        description: error.response?.data?.message || "An unexpected error occurred",
      });
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const bulkRejectMutation = async () => {
    if (selectedBulkIds.size === 0 || bulkRejectionReasonIds.length === 0) {
      toast.error("Please select at least one rejection reason.");
      return;
    }
    setIsBulkSubmitting(true);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/pm/bulk-reject`,
        {
          ids: Array.from(selectedBulkIds),
          rejection_type_ids: bulkRejectionReasonIds,
          comment: bulkRejectionComment || "",
          flag: false,
        },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      reportBulkResult(response.data);
      setSelectedBulkIds(new Set());
      setIsBulkRejectDialogOpen(false);
      setBulkRejectionReasonIds([]);
      setBulkRejectionComment("");
      queryClient.invalidateQueries({ queryKey: ["taskDatasets", taskId] });
    } catch (error: any) {
      toast.error("Error bulk rejecting submissions", {
        description: error.response?.data?.message || "An unexpected error occurred",
      });
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const {
    data: TaskDatasetsData = { data: { result: [], total: 0, totalPages: 1 } },
    isLoading: isTaskDatasetLoading,
    error: TaskDatasetError,
  } = useGetTaskTaskDatasetDetailFilter({
    page,
    pageSize,
    searchQuery,
    verificationStatus,
    task_id: taskId,
    filters: filters,
  });

  // Fetch detailed dataset information whenever modalSubmissionId changes
  const { data: detailedDataset, isLoading: isDetailedDatasetLoading, refetch } = useDatasetDetails(
    modalSubmissionId
  );
  
  console.log("[taskDataset] Hook called - modalSubmissionId:", modalSubmissionId, "detailedDataset:", detailedDataset, "isLoading:", isDetailedDatasetLoading);

  const TaskDatasets: ReviewerDatset[] =
    TaskDatasetsData?.data?.result &&
    Array.isArray(TaskDatasetsData.data.result)
      ? TaskDatasetsData.data.result
      : [];
  const TaskDatasetTotalElements =
    (TaskDatasetsData?.data?.total as number) ?? 0;
  const TaskDatasetTotalPages =
    (TaskDatasetsData?.data?.totalPages as number) ?? 1;
  const TaskDatasetStartRecord = TaskDatasets.length
    ? (page - 1) * pageSize + 1
    : 0;
  const TaskDatasetEndRecord = Math.min(
    page * pageSize,
    TaskDatasetTotalElements,
  );

  // Sync modalSubmissionId when currentRowIndex changes (for navigation)
  useEffect(() => {
    if (isDetailModalOpen && currentRowIndex !== null && TaskDatasets[currentRowIndex]) {
      setModalSubmissionId(TaskDatasets[currentRowIndex].id);
    }
  }, [isDetailModalOpen, currentRowIndex, TaskDatasets]);

  // Navigation handlers
  const handleNextSubmission = () => {
    if (currentRowIndex !== null && currentRowIndex < TaskDatasets.length - 1) {
      const nextIndex = currentRowIndex + 1;
      setCurrentRowIndex(nextIndex);
      setModalSubmissionId(TaskDatasets[nextIndex].id);
    } else if (
      currentRowIndex === TaskDatasets.length - 1 &&
      page < TaskDatasetTotalPages
    ) {
      setPage(page + 1);
      setCurrentRowIndex(0);
      setModalSubmissionId(null);
    } else {
      setIsDetailModalOpen(false);
      setCurrentRowIndex(null);
      setModalSubmissionId(null);
    }
  };

  const handlePreviousSubmission = () => {
    if (currentRowIndex !== null && currentRowIndex > 0) {
      const prevIndex = currentRowIndex - 1;
      setCurrentRowIndex(prevIndex);
      setModalSubmissionId(TaskDatasets[prevIndex].id);
    } else if (currentRowIndex === 0 && page > 1) {
      setPage(page - 1);
      setCurrentRowIndex(null); // Will be set to last index of previous page in useEffect
      setModalSubmissionId(null);
    } else {
      setIsDetailModalOpen(false);
      setCurrentRowIndex(null);
      setModalSubmissionId(null);
    }
  };

  // Sync currentRowIndex and selectedSubmissionId after page change
  useEffect(() => {
    if (
      TaskDatasets.length > 0 &&
      currentRowIndex !== null &&
      isDetailModalOpen &&
      !isTaskDatasetLoading
    ) {
      if (currentRowIndex >= TaskDatasets.length) {
        setCurrentRowIndex(TaskDatasets.length - 1);
        setSelectedSubmissionId(
          TaskDatasets[TaskDatasets.length - 1].data_set_review_id,
        );
      } else {
        setSelectedSubmissionId(
          TaskDatasets[currentRowIndex]?.data_set_review_id || null,
        );
      }
    } else if (
      TaskDatasets.length === 0 &&
      isDetailModalOpen &&
      !isTaskDatasetLoading
    ) {
      setIsDetailModalOpen(false);
      setCurrentRowIndex(null);
      setSelectedSubmissionId(null);
    }
  }, [TaskDatasets, currentRowIndex, isDetailModalOpen, isTaskDatasetLoading]);

  // Get current submission based on currentRowIndex
  const getCurrentSubmission = () => {
    if (currentRowIndex !== null && TaskDatasets[currentRowIndex]) {
      return TaskDatasets[currentRowIndex];
    }
    return null;
  };

  const TaskDatasetColumns: ColumnDef<ReviewerDatset>[] = [
    {
      id: "bulk-select",
      header: () => {
        const pendingIds = TaskDatasets.filter(
          (ds) => ds.status === "Pending",
        ).map((ds) => ds.id);
        const allSelected =
          pendingIds.length > 0 &&
          pendingIds.every((id) => selectedBulkIds.has(id));
        return (
          <input
            type="checkbox"
            checked={allSelected}
            disabled={pendingIds.length === 0}
            onChange={() => {
              setSelectedBulkIds((prev) => {
                const next = new Set(prev);
                if (allSelected) {
                  pendingIds.forEach((id) => next.delete(id));
                } else {
                  pendingIds.forEach((id) => next.add(id));
                }
                return next;
              });
            }}
          />
        );
      },
      enableSorting: false,
      cell: ({ row }) =>
        row.original.status === "Pending" ? (
          <input
            type="checkbox"
            checked={selectedBulkIds.has(row.original.id)}
            onChange={() => toggleBulkSelected(row.original.id)}
          />
        ) : null,
    },
    {
      accessorKey: "code",
      header: "ID",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[80px] max-w-[120px] truncate">
          {row.original.code}
        </div>
      ),
    },

    {
      accessorKey: "is_test",
      header: "Test",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[50px]">
          {row.original.is_test ? "true" : "false"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-row">
          <span
            className={`w-fit p-1 px-2 py-2  rounded-2xl  font-semibold ${
              row.original.status === "Pending"
                ? "bg-orange-100 text-orange-400"
                : row.original.status === "Rejected"
                  ? "text-white bg-[#D03710]"
                  : row.original.status === "Flagged"
                    ? "bg-[#FFF6F3] text-[#B32F0D]"
                    : row.original.status === "Approved"
                      ? "bg-green-100 text-green-600"
                      : ""
            }`}
          >
            {row.original.status}
          </span>
          {row.original.is_flagged && (
            <div
              className={`flex items-center max-w-[90px] ml-2 rounded-2xl px-1 py-1 bg-[#FFF6F3] text-[#B32F0D]`}
            >
              <span className={`h-2 w-2 rounded-full `}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.9395 1.5H5.1415C3.66 1.5 2.92 1.5 2.46 1.9395C2 2.3785 2 3.086 2 4.5L2.053 7.5H7.94C9.0515 7.5 9.607 7.5 9.843 7.2125C9.908 7.1335 9.956 7.0425 9.983 6.9445C10.0825 6.592 9.749 6.1675 9.082 5.318C8.8045 4.965 8.666 4.788 8.641 4.588C8.63364 4.52973 8.63364 4.47077 8.641 4.4125C8.666 4.2115 8.8045 4.035 9.082 3.682C9.749 2.8325 10.082 2.408 9.9835 2.0555C9.95542 1.95737 9.90762 1.86601 9.843 1.787C9.6065 1.5 9.051 1.5 7.9395 1.5Z"
                    fill="#B32F0D"
                    stroke="#B32F0D"
                    strokeWidth="0.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 10.5V4"
                    stroke="#B32F0D"
                    strokeWidth="0.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="truncate ml-2">Flagged</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "micro_task",
      header: "Micro Task",
      enableSorting: false,
      cell: ({ row }) => {
        const waveformRef = useRef<HTMLDivElement>(null);
        const wavesurferRef = useRef<WaveSurfer | null>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [isReady, setIsReady] = useState(false);
        const fullAudioUrl = row.original.microTask?.file_path;

        useEffect(() => {
          if (!fullAudioUrl || row.original.microTask?.type !== "audio") return;

          let isMounted = true;

          const initializeWaveSurfer = async () => {
            try {
              const ws = WaveSurfer.create({
                container: waveformRef.current!,
                waveColor: "#73a4d1",
                progressColor: "#095FAF",
                cursorColor: "#383351",
                barWidth: 1,
                barRadius: 2,
                cursorWidth: 0.01,
                height: 30,
                barGap: 2,
                url: fullAudioUrl,

                renderFunction: (peaks, ctx) => {
                  const height = ctx.canvas.height;
                  const width = ctx.canvas.width;
                  const halfHeight = height / 2;
                  const channel = peaks[0];
                  const pixelsPerSample = width / channel.length;

                  ctx.beginPath();
                  ctx.moveTo(0, halfHeight);

                  for (let i = 0; i < channel.length; i++) {
                    const x = i * pixelsPerSample;
                    const y = halfHeight - channel[i] * halfHeight; // Scale peak to canvas height
                    ctx.lineTo(x, y);
                  }

                  ctx.strokeStyle = "#73a4d1";
                  ctx.lineWidth = 1;
                  ctx.stroke();
                },
              });

              ws.on("ready", () => {
                if (isMounted) {
                  setIsReady(true);
                }
              });

              ws.on("play", () => isMounted && setIsPlaying(true));
              ws.on("pause", () => isMounted && setIsPlaying(false));
              ws.on("finish", () => isMounted && setIsPlaying(false));
              ws.on("error", (err) => {
                console.error("WaveSurfer error:", err);
                isMounted && setError("Failed to load audio");
              });

              wavesurferRef.current = ws;
            } catch (err) {
              console.error("WaveSurfer initialization error:", err);
              isMounted && setError("Failed to initialize player");
            }
          };

          initializeWaveSurfer();

          return () => {
            isMounted = false;
            wavesurferRef.current?.destroy();
            wavesurferRef.current = null;
          };
        }, [fullAudioUrl]);

        const handlePlayPause = () => {
          if (!wavesurferRef.current) return;
          wavesurferRef.current.playPause();
        };

        // Display image for image type
        if (row.original.microTask?.type === "image" && fullAudioUrl) {
          return (
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center gap-2 min-w-[120px] mt-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src={fullAudioUrl}
                    alt="Micro task image"
                    className="w-16 h-16 object-cover rounded border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/imageNotAvailable.png";
                    }}
                  />
                  <div className="text-xs text-gray-500 truncate max-w-[100px]">
                    {fullAudioUrl.split("/").pop()?.split("?")[0] || "image"}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Image Preview</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center items-center p-4">
                  <img
                    src={fullAudioUrl}
                    alt="Micro task image full view"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/imageNotAvailable.png";
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          );
        }

        if (row.original.microTask?.type === "audio" && fullAudioUrl) {
          return (
            <div className="flex items-center gap-2 w-full max-w-[280px] mt-3 mb-3">
              <div className="flex-1 min-w-0">
                <div ref={waveformRef} className="w-full h-[40px]" />
                {error && (
                  <div className="text-red-500 text-xs mt-1">{error}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                disabled={!isReady}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        } else {
          return (
            <div className="w-full max-w-[280px] truncate">
              {row.original.microTask?.text || "No text"}
            </div>
          );
        }
      },
    },
    {
      accessorKey: "actions",
      header: "Data",
      enableSorting: false,
      cell: ({ row }) => {
        const waveformRef = useRef<HTMLDivElement>(null);
        const wavesurferRef = useRef<WaveSurfer | null>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [isReady, setIsReady] = useState(false);
        const fullAudioUrl = row.original.file_path;

        useEffect(() => {
          if (!fullAudioUrl || row.original.type !== "audio") return;

          let isMounted = true;

          const initializeWaveSurfer = async () => {
            try {
              const ws = WaveSurfer.create({
                container: waveformRef.current!,
                waveColor: "#73a4d1",
                progressColor: "#095FAF",
                cursorColor: "#383351",
                barWidth: 1,
                barRadius: 2,
                cursorWidth: 0.01,
                height: 30,
                barGap: 2,
                url: fullAudioUrl,

                renderFunction: (peaks, ctx) => {
                  const height = ctx.canvas.height;
                  const width = ctx.canvas.width;
                  const halfHeight = height / 2;
                  const channel = peaks[0]; // Use first channel for mono or left channel
                  const pixelsPerSample = width / channel.length;

                  ctx.beginPath();
                  ctx.moveTo(0, halfHeight);

                  for (let i = 0; i < channel.length; i++) {
                    const x = i * pixelsPerSample;
                    const y = halfHeight - channel[i] * halfHeight; // Scale peak to canvas height
                    ctx.lineTo(x, y);
                  }

                  ctx.strokeStyle = "#73a4d1";
                  ctx.lineWidth = 1;
                  ctx.stroke();
                },
              });

              ws.on("ready", () => {
                if (isMounted) {
                  setIsReady(true);
                }
              });

              ws.on("play", () => isMounted && setIsPlaying(true));
              ws.on("pause", () => isMounted && setIsPlaying(false));
              ws.on("finish", () => isMounted && setIsPlaying(false));
              ws.on("error", (err) => {
                console.error("WaveSurfer error:", err);
                isMounted && setError("Failed to load audio");
              });

              wavesurferRef.current = ws;
            } catch (err) {
              console.error("WaveSurfer initialization error:", err);
              isMounted && setError("Failed to initialize player");
            }
          };

          initializeWaveSurfer();

          return () => {
            isMounted = false;
            wavesurferRef.current?.destroy();
            wavesurferRef.current = null;
          };
        }, [fullAudioUrl]);

        const handlePlayPause = () => {
          if (!wavesurferRef.current) return;
          wavesurferRef.current.playPause();
        };

        if (row.original.type !== "audio" || !fullAudioUrl) {
          return (
            <div className="w-full max-w-[280px] truncate text-gray-600">
              {row.original.text_data_set}
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2 w-full max-w-[280px] mt-3 mb-3">
            {row.original.type === "audio" ? (
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <div ref={waveformRef} className="w-full h-[40px]" />
                  {error && (
                    <div className="text-red-500 text-xs mt-1">{error}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={!isReady}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-[280px] truncate text-gray-800">
                {row.original.text_data_set}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "",
      header: "Action",
      enableSorting: false,
      cell: ({ row, table }) => {
        const rejectionReasons = row.original.rejectionReasons || [];
        const flagReasons = row.original.flagReason || [];
        const isPending = row.original.status === "Pending";

        return (
          <div className="flex justify-start items-center">
            <button
              onClick={() => {
                const allRows = table.getRowModel().rows;
                const rowIndex = allRows.findIndex(
                  (r) =>
                    r.original.id === row.original.id,
                );
                console.log("[View Button] Setting modalSubmissionId to:", row.original.id);
                setCurrentRowIndex(rowIndex);
                setModalSubmissionId(row.original.id);
                console.log("[View Button] Opening modal");
                setIsDetailModalOpen(true);
              }}
              className="px-3 py-1 text-sm rounded-2xl bg-primary text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View
            </button>
          </div>
        );
      },
    },
  ];

  const TaskDatasetTable = useReactTable({
    data: TaskDatasets,
    columns: TaskDatasetColumns,
    state: {
      sorting,
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    rowCount: TaskDatasetTotalElements,
  });

  if (TaskDatasetError) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Error loading TaskDatasets: {(TaskDatasetError as Error).message}
        </p>
      </div>
    );
  }

  return (
    <>
      {isTaskDatasetLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="w-full">
          <div className="flex justify-end items-center gap-4 mb-4">
            <FilterComponent
              columns={filterableColumns}
              onFilterChangeAction={handleFilterChange}
              initialFilters={filters}
              endpoint={`microtask/task-dataset/${taskId}/detail/`}
            />
          </div>
          {selectedBulkIds.size > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 mb-3">
              <span className="text-sm font-medium text-blue-700">
                {selectedBulkIds.size} selected
              </span>
              <Button
                size="sm"
                className="bg-[#54CB36] hover:bg-lime-600 text-white"
                disabled={isBulkSubmitting}
                onClick={bulkApproveMutation}
              >
                {isBulkSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Approve Selected"
                )}
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isBulkSubmitting}
                onClick={() => setIsBulkRejectDialogOpen(true)}
              >
                Reject Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isBulkSubmitting}
                onClick={() => setSelectedBulkIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
          <div className="rounded-md border border-gray-100 bg-white overflow-x-auto">
            <Table className="w-full overflow-x-auto px-2">
              <TableHeader>
                {TaskDatasetTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      // Only fix width for the Data column (actions)
                      let columnWidth = "";
                      const columnId = header.column.id;

                      if (columnId === "actions") columnWidth = "w-[300px]"; // Only Data column fixed

                      return (
                        <TableHead
                          key={header.id}
                          className={`text-sm font-bold text-gray-500 bg-gray-50 px-4 py-5 ${columnWidth} ${
                            header.column.id === "" ? "text-left" : ""
                          }`}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className="flex items-center space-x-1 cursor-pointer"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <span>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
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
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {TaskDatasetTable.getRowModel().rows?.length ? (
                  TaskDatasetTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-gray-100">
                      {row.getVisibleCells().map((cell) => {
                        // Only fix width for the Data column (actions)
                        let columnWidth = "";
                        const columnId = cell.column.id;

                        if (columnId === "actions") columnWidth = "w-[300px]"; // Only Data column fixed

                        return (
                          <TableCell
                            key={cell.id}
                            className={`py-5 px-4 text-sm ${columnWidth} ${
                              cell.column.id === ""
                                ? "text-left align-middle"
                                : ""
                            }`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={TaskDatasetColumns.length}
                      className="h-24 text-center"
                    >
                      {isTaskDatasetLoading ? (
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
                pageCount: TaskDatasetTotalPages,
                page: page,
                setPage: setPage,
                pageSize: pageSize,
                setPageSize: setPageSize,
                showingText:
                  TaskDatasetTotalElements > 0
                    ? `Showing ${TaskDatasetStartRecord} to ${TaskDatasetEndRecord} out of ${TaskDatasetTotalElements} records`
                    : "",
              }}
            />
          </div>
        </div>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        {(() => {
          const currentSubmission = getCurrentSubmission();
          if (!currentSubmission) return null;

          const rejectionReasons = currentSubmission.rejectionReasons || [];
          const flagReasons = currentSubmission.flagReason || [];
          const isPending = currentSubmission.status === "Pending";

          return (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">
                    Submission Details
                  </DialogTitle>
                  {/* Status Badge */}
                  <span
                    className={`px-3 py-2 rounded-2xl font-semibold ${
                      currentSubmission.status === "Pending"
                        ? "bg-orange-100 text-orange-400"
                        : currentSubmission.status === "Rejected"
                          ? "text-white bg-[#D03710]"
                          : currentSubmission.status === "Approved"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {currentSubmission.status || "Unknown"}
                  </span>
                </div>
              </DialogHeader>
              <div className="flex gap-3 mt-3 text-xs">
                <Button
                  className="text-white border-red-600 rounded-2xl bg-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedSubmissionId(currentSubmission.id);
                    setHasAttemptedReject(false);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M10.0063 0.981445L1.05664 9.93111M1.05664 0.981445L10.0063 9.93111"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Reject
                </Button>
                <Button
                  className="bg-[#54CB36] hover:bg-lime-600 rounded-2xl text-white"
                  onClick={() => {
                    setSelectedSubmissionId(currentSubmission.id);
                    setHasAttemptedApprove(false);
                    setIsApproveDialogOpen(true);
                  }}
                >
                  <svg
                    width="13"
                    height="11"
                    viewBox="0 0 13 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M1.72266 6.91762L4.05599 9.25095L11.7227 1.58428"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Approve
                </Button>
              </div>

              <div className="mt-6 space-y-6">
                {/* Question Section - Micro Task */}
                <div className="rounded-2xl  p-2">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    Question
                  </h3>
                  {currentSubmission.microTask?.type === "image" &&
                  currentSubmission.microTask?.file_path ? (
                    <div className="mt-3">
                      <img
                        src={currentSubmission.microTask.file_path}
                        alt="Question"
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/imageNotAvailable.png";
                        }}
                      />
                    </div>
                  ) : currentSubmission.microTask?.type === "audio" &&
                    currentSubmission.microTask?.file_path ? (
                    <div className="mt-3">
                      <audio controls className="w-full">
                        <source src={currentSubmission.microTask.file_path} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 mt-2">
                      {currentSubmission.microTask?.text ||
                        "No question text available"}
                    </p>
                  )}
                </div>

                {/* Answer Section - Submitted Data */}
                <div className="rounded-2xl p-5">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    Answer
                  </h3>
                  {currentSubmission.type === "audio" &&
                  currentSubmission.file_path ? (
                    <div className="mt-3">
                      <audio controls className="w-full">
                        <source src={currentSubmission.file_path} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : currentSubmission.type === "image" &&
                    currentSubmission.file_path ? (
                    <div className="mt-3">
                      <img
                        src={currentSubmission.file_path}
                        alt="Answer"
                        className="max-w-full max-h-96 rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/imageNotAvailable.png";
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 mt-2">
                      {currentSubmission.text_data_set ||
                        "No answer text available"}
                    </p>
                  )}
                </div>

                {/* Review Status - Figma Design */}
                <div className="border border-gray-300 rounded-2xl p-6 bg-white">
                  <h3 className="font-semibold text-gray-800 text-lg mb-4">
                    Review Status
                  </h3>

                  {isDetailedDatasetLoading && (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {!isDetailedDatasetLoading && detailedDataset && (
                    <>
                      {Array.isArray(detailedDataset.reviews) && detailedDataset.reviews.length > 0 ? (
                        <div>
                          {/* Summary */}
                          <p className="text-sm text-gray-600 mb-6">
                            This task has been reviewed by {detailedDataset.reviews.length} reviewer(s)
                          </p>

                          {/* Reviews List */}
                          <div className="space-y-6">
                            {detailedDataset.reviews.map((review: any, idx: number) => (
                              <div key={idx}>
                                {/* Reviewer Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      Reviewer {idx + 1} • <span className="font-medium">{review.reviewer_name || "Unknown"}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Reviewed on • {review.created_date ? new Date(review.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                    </p>
                                  </div>
                                  
                                  {/* Status Badge */}
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${
                                      review.review_status?.toLowerCase() === "approved"
                                        ? "bg-green-100 text-green-700"
                                        : review.review_status?.toLowerCase() === "rejected"
                                          ? "bg-red-100 text-red-700"
                                          : review.review_status?.toLowerCase() === "flagged"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {review.review_status || "Pending"}
                                  </span>
                                </div>

                                {/* Score */}
                                {review.score !== undefined && (
                                  <p className="text-sm text-gray-600 mb-3">
                                    Score: <span className="font-medium">{review.score}</span>
                                  </p>
                                )}

                                {/* Approved - Annotations */}
                                {review.review_status?.toLowerCase() === "approved" && (
                                  <div className="border border-green-300 rounded-lg p-4 bg-white">
                                    <p className="text-sm font-semibold text-green-700 mb-2">Annotations</p>
                                    {review.annotations && review.annotations.length > 0 ? (
                                      <p className="text-sm text-gray-700">
                                        {review.annotations.join(", ")}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-gray-600">No annotations provided</p>
                                    )}
                                  </div>
                                )}

                                {/* Rejected - Rejection Reason */}
                                {review.review_status?.toLowerCase() === "rejected" && (
                                  <div className="border border-red-300 rounded-lg p-4 bg-white">
                                    <p className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</p>
                                    {review.rejection_reason && review.rejection_reason.length > 0 ? (
                                      <p className="text-sm text-red-700">
                                        {review.rejection_reason.join(", ")}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-gray-600">No rejection reason provided</p>
                                    )}
                                  </div>
                                )}

                                {/* Comment */}
                                {review.comment && (
                                  <div className="mt-3">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Comment:</span> {review.comment}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No review information available</p>
                      )}
                    </>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="max-w-[1000px] mx-auto px-6 py-4">
                  <div className="flex justify-end space-x-2">
                    <div className="flex justify-between w-full">
                      <Button
                        onClick={handlePreviousSubmission}
                        disabled={currentRowIndex === 0 && page === 1}
                        className="bg-white text-gray-700 border border-gray-400 rounded-xl hover:bg-gray-200 flex items-center gap-2"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextSubmission}
                        disabled={
                          currentRowIndex === TaskDatasets.length - 1 &&
                          page === TaskDatasetTotalPages
                        }
                        className="bg-primary text-white hover:bg-blue-700 flex items-center gap-2"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {annotations.length > 0 && (
              <div>
                <label
                  htmlFor="annotation"
                  className="text-sm font-semibold block mb-2"
                >
                  Annotation
                </label>
                <select
                  id="annotation"
                  value={selectedAnnotationId}
                  onChange={(e) => {
                    setSelectedAnnotationId(e.target.value);
                    const selectedAnnotation = annotations.find(
                      (annotation) => annotation.id === e.target.value,
                    );
                    setSelectedAnnotationName(selectedAnnotation?.name || "");
                  }}
                  className="w-full border rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select an annotation</option>
                  {annotations.map((annotation: { id: string; name: string }) => (
                    <option key={annotation.id} value={annotation.id}>
                      {annotation.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsApproveDialogOpen(false);
                  setSelectedAnnotationId("");
                  setSelectedAnnotationName("");
                  setSelectedSubmissionId(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#54CB36] hover:bg-lime-600 text-white"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">
                Rejection Reasons <span className="text-red-500">*</span>
              </label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {rejectionTypes.map((type: any) => (
                  <label
                    key={type.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRejectionTypeIds.includes(type.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRejectionTypeIds([
                            ...selectedRejectionTypeIds,
                            type.id,
                          ]);
                        } else {
                          setSelectedRejectionTypeIds(
                            selectedRejectionTypeIds.filter(
                              (id) => id !== type.id,
                            ),
                          );
                        }
                      }}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{type.name}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {selectedRejectionTypeIds.length > 0
                  ? `${selectedRejectionTypeIds.length} reason${selectedRejectionTypeIds.length > 1 ? "s" : ""} selected`
                  : "No reasons selected"}
              </div>
            </div>

            <div>
              <label
                htmlFor="rejectionComment"
                className="text-sm font-semibold block mb-2"
              >
                Comment (Optional)
              </label>
              <textarea
                id="rejectionComment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Enter any additional comments"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">
                Flag Status
              </label>
              <div className="inline-flex bg-gray-100 p-1 rounded-md border border-gray-200">
                <label
                  className={`cursor-pointer px-3 py-1 text-sm rounded-md flex items-center gap-2 transition-colors ${
                    rejectionFlag
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="flagStatus"
                    className="sr-only"
                    checked={rejectionFlag === true}
                    onChange={() => setRejectionFlag(true)}
                  />
                  <span>Flag</span>
                </label>
                <label
                  className={`cursor-pointer px-3 py-1 text-sm rounded-md flex items-center gap-2 transition-colors ${
                    !rejectionFlag
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="flagStatus"
                    className="sr-only"
                    checked={rejectionFlag === false}
                    onChange={() => setRejectionFlag(false)}
                  />
                  <span>No Flag</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select "Flag" to mark the submission as flagged
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionComment("");
                  setSelectedRejectionTypeIds([]);
                  setRejectionFlag(true);
                  setSelectedSubmissionId(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={selectedRejectionTypeIds.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Rejection Dialog */}
      <Dialog
        open={isBulkRejectDialogOpen}
        onOpenChange={setIsBulkRejectDialogOpen}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Reject {selectedBulkIds.size} Submission
              {selectedBulkIds.size === 1 ? "" : "s"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">
                Rejection Reasons <span className="text-red-500">*</span>
              </label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {rejectionTypes.map((type: any) => (
                  <label
                    key={type.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={bulkRejectionReasonIds.includes(type.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkRejectionReasonIds([
                            ...bulkRejectionReasonIds,
                            type.id,
                          ]);
                        } else {
                          setBulkRejectionReasonIds(
                            bulkRejectionReasonIds.filter(
                              (id) => id !== type.id,
                            ),
                          );
                        }
                      }}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{type.name}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {bulkRejectionReasonIds.length > 0
                  ? `${bulkRejectionReasonIds.length} reason${bulkRejectionReasonIds.length > 1 ? "s" : ""} selected`
                  : "No reasons selected"}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={bulkRejectionComment}
                onChange={(e) => setBulkRejectionComment(e.target.value)}
                className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Applied to all selected submissions"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkRejectDialogOpen(false);
                  setBulkRejectionReasonIds([]);
                  setBulkRejectionComment("");
                }}
                disabled={isBulkSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={bulkRejectMutation}
                disabled={
                  bulkRejectionReasonIds.length === 0 || isBulkSubmitting
                }
              >
                {isBulkSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Selected"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskDataset;
