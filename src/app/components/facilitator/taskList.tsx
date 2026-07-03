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
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useGetProjectTaskFacilitator } from "@/lib/hooks/useReviewer";
import { Button } from "@/components/ui/button";
import { renderPaginationButtons } from "@/components/ui/paginationHelper";
import TaskCard from "@/app/components/projectManager/taskCard";
import { useRouter } from "next/navigation";
import {
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  Copy,
  Plus,
  Users,
  Link2,
  ChevronDown,
} from "lucide-react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { TaskCardType } from "@/app/types/project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MicroTaskList from "./microTaskList";
import { useTranslation } from "@/lib/hooks/useTranslation";

import type { SortingState } from "@tanstack/react-table";
interface TaskListProps {}
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
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="md:text-sm text-xs text-gray-500">{t("showing")}</span>
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

const TaskList: React.FC<TaskListProps> = ({}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const debouncedTaskSearch = useDebounce(taskSearchQuery, 500);
  const [verificationStatus, setVerificationStatus] = useState<string>();
  const [showMultiTaskList, setShowMultiTaskList] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { data: tasksData, isLoading: isTaskLoading } =
    useGetProjectTaskFacilitator({
      page,
      pageSize,
      searchQuery: debouncedTaskSearch,
      verificationStatus,
    });

  const tasks: TaskCardType[] = tasksData?.data?.result || [];
  const taskTotalPages = tasksData?.data?.totalPages || 1;
  const taskTotalElements = tasksData?.data?.total || 0;
  const taskStartRecord = tasks.length ? (page - 1) * pageSize + 1 : 0;
  const taskEndRecord = Math.min(page * pageSize, taskTotalElements);

  const handleCloseModal = () => {
    setSelectedTaskId(null);
  };

  const handleAccept = () => {
    // Handle accept logic here

    handleCloseModal();
  };

  const handleReject = () => {
    // Handle reject logic here

    handleCloseModal();
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowMultiTaskList(true);
  };

  return (
    <div>
      {showMultiTaskList && selectedTaskId ? (
        <>
          <MicroTaskList
            taskId={selectedTaskId}
            microTaskPage={1}
            setMicroTaskPage={() => {}}
            microTaskPageSize={7}
            setMicroTaskPageSize={() => {}}
            searchQuery=""
            verificationStatus={undefined}
            setVerificationStatus={() => {}}
            onCancelTask={() => {
              setShowMultiTaskList(false);
            }}
          />
        </>
      ) : (
        <>
          {isTaskLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <></>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between py-4">
            <PaginationControls
              pagination={{
                pageCount: taskTotalPages,
                page: page,
                setPage: setPage,
                pageSize: pageSize,
                setPageSize: setPageSize,
                showingText:
                  taskTotalElements > 0
                    ? `Showing ${taskStartRecord} to ${taskEndRecord} out of ${taskTotalElements} records`
                    : "",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TaskList;
