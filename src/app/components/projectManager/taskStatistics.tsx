"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Eye,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
  PersonStanding,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { MicroTaskStatistic } from "@/app/types/project";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useContributorStats,
  useMicroTaskStatistic,
} from "@/lib/hooks/useProject";
import { useDebounce } from "@/lib/hooks/useDebounce";
import TaskStatisticsContributers from "@/app/components/projectManager/taskStatisticsContributers";
import { useTranslation } from "@/lib/hooks/useTranslation";
// --- INTERFACES ---
interface LanguageStatistic {
  dialect_id: string;
  dialect_name: string;
  count: string;
}

interface GenderStatistic {
  gender: "Male" | "Female" | string;
  count: string;
}

export interface ContributorStatsResponse {
  message: string;
  code: number;
  data: {
    total_contributor_micro_tasks: { [status: string]: number };
    total_micro_tasks: {
      NOT_ASSIGNED: number;
      PARTILALLY_ASSIGNED: number;
      ASSIGNED: number;
    };
    language_statistics: LanguageStatistic[];
    gender_statistics: GenderStatistic[];
  };
}

interface UserData {
  id: string;
  fullName: string;
  microtasksAssigned: number;
  microtasksCompleted: number;
}

interface MicroTaskData {
  id: string;
  text: string;
  status: "Active" | "Inactive";
  totalAssigned: number;
  expectedContributors: number;
}

// --- DATA TABLE COMPONENT ---
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableTitle: string;
}

function DataTable<TData, TValue>({
  columns,
  data,
  tableTitle,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="bg-white border border-gray-100 rounded-lg ">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{tableTitle}</h3>
      </div>
      <div className="p-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    colSpan={columns.length}
                    className="h-96 text-center"
                  >
                    <div className="relative flex flex-col items-center justify-center py-12">
                      <img
                        src="/empty.svg"
                        alt="No data available"
                        className="w-64 h-64 opacity-50"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// --- CHART COMPONENT ---
const COLORS = ["#2563EB", "#60A5FA", "#10B981", "#34D399"];

function DialectStatisticsChart({ data }: { data: LanguageStatistic[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500"></div>
    );
  }
  const chartData = data.map((item) => ({
    name: item.dialect_name,
    value: parseInt(item.count, 10),
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Tooltip
          formatter={(value) =>
            value != null ? `${value} contributors` : "0 contributors"
          }
        />

        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// --- REUSABLE CARD COMPONENTS ---
const Card = ({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={`bg-white border border-gray-100 rounded-lg  ${className}`}>
    {children}
  </div>
);
const CardHeader = ({
  title,
  subTitle,
}: {
  title: string;
  subTitle?: string;
}) => (
  <div className="p-4 border-b">
    <h3 className="font-semibold text-gray-800">{title}</h3>
    {subTitle && <p className="text-sm text-gray-500">{subTitle}</p>}
  </div>
);
const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 ${className}`}>{children}</div>;

// --- MAIN COMPONENT ---
interface TaskStatisticsProps {
  task_id: string;
}

export default function TaskStatistics({ task_id }: TaskStatisticsProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>();
  const debouncedTaskSearch = useDebounce(searchQuery, 500);
  const { t } = useTranslation();
  const {
    data: microtasksData,
    isLoading: isMicroTaskLoading,
    error: microTaskError,
  } = useMicroTaskStatistic({
    page,
    pageSize,
    searchQuery,
    taskId: task_id,
    verificationStatus,
  });
  const microtasks: MicroTaskStatistic[] = Array.isArray(
    microtasksData?.data?.result
  )
    ? microtasksData.data.result
    : [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const microTaskTotalElements = microtasksData?.data?.total || 0;
  const microTaskTotalPages = microtasksData?.data?.totalPages || 1;
  const microTaskStartRecord = microtasks.length
    ? (page - 1) * pageSize + 1
    : 0;
  const microTaskEndRecord = Math.min(page * pageSize, microTaskTotalElements);
  const [activeTab, setActiveTab] = useState("distributed-users");
  const {
    data: stats,
    isLoading,
    isError,
  } = useContributorStats(task_id) as {
    data: ContributorStatsResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  const microTaskColumns: ColumnDef<MicroTaskStatistic>[] = [
    {
      header: t("codeHeader"),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.microTask?.code || " "}
        </div>
      ),
    },
    {
      accessorKey: "",
      header: t("noOfContributors"),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.no_of_contributors || " "}
        </div>
      ),
    },
    {
      accessorKey: "",
      header: t("totalFemales"),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.total_female || " "}
        </div>
      ),
    },
    {
      accessorKey: "",
      header: t("totalMales"),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.total_male || " "}
        </div>
      ),
    },
    
    {
      accessorKey: "",
      header: t("expectedNoOfContributors"),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[150px] max-w-[300px] truncate">
          {row.original.expected_no_of_contributors || " "}
        </div>
      ),
    }
    
  ];
  const microTaskTable = useReactTable({
    data: microtasks,
    columns: microTaskColumns,
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
  if (isError)
    return (
      <div className="text-center text-red-500">Failed to load statistics.</div>
    );
  if (isLoading)
    return (
      <div className="text-center">
        <Loader2 />
      </div>
    );

  return (
    <div className="container mx-auto p-4 md:p-6 ">
      <div className="mb-6">
        <div className="w-full h15 bg-gray-200/70 p-1 rounded-3xl inline-flex items-center space-x-1">
          <button
            onClick={() => setActiveTab("distributed-users")}
            className={`w-1/2 h-12 py-1.5 px-6 text-sm font-semibold transition-all rounded-3xl ${
              activeTab === "distributed-users"
                ? "bg-white text-gray-900 "
                : "bg-transparent text-gray-600 hover:bg-white/70"
            }`}
          >
            {t("distributedUsers")}
          </button>
          <button
            onClick={() => setActiveTab("microtasks-list")}
            className={`w-1/2  h-12 py-1.5 px-6 text-sm font-semibold transition-all rounded-3xl ${
              activeTab === "microtasks-list"
                ? "bg-white text-gray-900 "
                : "bg-transparent text-gray-600 hover:bg-white/70"
            }`}
          >
            {t("microTasksList")}
          </button>
        </div>
      </div>

      {/* Conditional Content Rendering */}
      <div>
        {activeTab === "distributed-users" && (
          <div className="space-y-6 animate-fadeIn ">
            {/* Row 1: Contributor Status */}
            <div className="border border-gray-100 rounded-lg px-4 py-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Users size={20} /> {t("contributorsStatusStats")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50/50 text-center p-4">
                  <p className="text-3xl font-bold text-primary">
                    {stats?.data?.total_contributor_micro_tasks?.["New"] ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600">{t("pending")}</p>
                </div>
                <div className="bg-green-50/50 text-center p-4">
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.data?.total_contributor_micro_tasks?.[
                      "InProgress"
                    ] ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600">{t("inProgress")}</p>
                </div>
                <div className="bg-orange-50/50 text-center p-4">
                  <p className="text-3xl font-bold text-orange-600">
                    {stats?.data?.total_contributor_micro_tasks?.[
                      "Completed"
                    ] ?? "0"}
                  </p>
                  <p className="text-sm text-gray-600">{t("completed")}</p>
                </div>
              </div>
            </div>

            {/* Row 2: Gender Statistics */}
            <div className="border border-gray-100 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <PersonStanding size={20} /> {t("genderStatistics")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 text-center p-4">
                  <p className="text-3xl font-bold text-primary">
                    {stats?.data?.gender_statistics?.find(
                      (g) => g.gender === "Male"
                    )?.count || "0"}
                  </p>
                  <p className="text-sm text-gray-600">{t("male")}</p>
                </div>
                <div className="bg-gray-50 text-center p-4">
                  <p className="text-3xl font-bold text-pink-600">
                    {stats?.data?.gender_statistics?.find(
                      (g) => g.gender === "Female"
                    )?.count || "0"}
                  </p>
                  <p className="text-sm text-gray-600">{t("female")}</p>
                </div>
              </div>
            </div>

            {/* Row 3: Users Table */}
            <div className="w-auto overflow-auto">
              <TaskStatisticsContributers taskId={task_id} />
            </div>
          </div>
        )}

        {activeTab === "microtasks-list" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Dialect Statistics (Moved to Top) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-3 py-3  ">
              {/* Left Column: Micro Tasks Statistics */}
              <div className="lg:col-span-1 w-full">
                <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center mb-2">
                    <svg
                      width="22"
                      height="21"
                      viewBox="0 0 26 27"
                      fill="none"
                      className="mr-4"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.05672 17.7746H11.3901M7.05672 12.3579H15.7234M10.8484 24.2746H11.9317M8.13681 24.2746C6.89097 24.2475 6.05247 24.2746 4.97022 24.0308C3.83272 23.7329 3.12856 23.0287 2.88589 21.6204C2.64214 20.6996 2.72014 16.6089 2.72339 12.71C2.72556 9.68424 2.74506 6.94016 2.99422 6.37249C3.34631 5.15374 4.15772 4.28708 6.67539 4.25999M17.3657 4.25999C18.2324 4.34124 20.4966 4.25999 20.9386 6.75166C21.1791 8.10583 21.1281 10.0287 21.1281 12.3308M8.86697 6.39958C10.0045 6.42666 13.6575 6.39958 14.9033 6.39958C16.1481 6.39958 16.8056 5.37474 16.7981 4.42249C16.7894 3.45183 15.9314 2.69458 15.0918 2.60791H8.84097C7.83889 2.66208 7.16181 3.47458 7.05347 4.28708C6.94514 5.39749 7.75764 6.34541 8.86697 6.39958ZM19.8021 16.0142C18.3126 17.5308 15.4439 20.2392 15.4439 20.4287C15.2131 20.7505 15.0106 21.4037 14.8751 22.3246C14.7061 23.1782 14.5025 23.9225 14.7408 24.1392C14.9791 24.3558 15.8751 24.1738 16.8241 23.9767C17.5824 23.8954 18.2866 23.6246 18.6376 23.3537C19.1521 22.8987 22.6437 19.3725 23.05 18.9121C23.3468 18.5058 23.375 17.7475 23.115 17.2871C22.9687 16.9621 22.0479 16.0954 21.75 15.8517C21.4504 15.6669 21.0995 15.583 20.7488 15.6122C20.398 15.6415 20.067 15.7823 19.8021 16.0142Z"
                        stroke="black"
                        strokeWidth="1.625"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-800">
                    {t("microTasksStatistics")}
                  </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {t("overviewContributorProgress")}
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-primary">
                        {stats?.data?.total_micro_tasks?.ASSIGNED ?? ""}
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        {t("assigned")}
                      </span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-green-600">
                        {stats?.data?.total_micro_tasks?.PARTILALLY_ASSIGNED ??
                          ""}
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        {t("partiallyAssigned")}
                      </span>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-orange-600">
                        {stats?.data?.total_micro_tasks?.NOT_ASSIGNED ?? "20"}
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        {t("notAssigned")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Column: Micro Tasks List */}
              <Card className="">
                <CardHeader
                  title={t("dialectStatistics")}
                  subTitle={t("distributionByDialect")}
                />
                <CardContent>
                  <DialectStatisticsChart
                    data={stats?.data?.language_statistics || []}
                  />
                </CardContent>
              </Card>
            </div>
            <div>
              <div className=" rounded-md border border-gray-100 bg-white overflow-hidden ">
                <Table>
                  <TableHeader>
                    {microTaskTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="text-sm font-bold bg-grey-200 text-gray-500 px-5 py-5"
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
                                    ) : header.column.getIsSorted() ===
                                      "desc" ? (
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
                            <TableCell
                              key={cell.id}
                              className="py-5 px-6 text-sm"
                            >
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
                          className="h-14 text-center px-5 py-5"
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
                        ? `Showing ${microTaskStartRecord} to ${microTaskEndRecord} out of ${microTaskTotalElements} records`
                        : "",
                  }}
                />
              </div>
            </div>

            {/* Grid for Micro Tasks Statistics and Micro Tasks List */}
          </div>
        )}
      </div>
    </div>
  );
}
