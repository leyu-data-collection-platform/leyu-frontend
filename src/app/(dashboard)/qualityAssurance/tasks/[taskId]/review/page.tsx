"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AuthenticatedPage from "@/app/components/layout/AuthenticatedPage";
import MicroTaskList from "@/app/components/qualityAssurance/microTaskList";
import { Button } from "@/components/ui/button";
import { formatDateMedium } from "@/app/types/dateUtils";
import TaskDetailsGeneral from "@/app/components/qualityAssurance/taskDetailsGeneral";
import { filterComponentReviewer as FilterComponentReviewer } from "@/components/ui/filterComponentReviewer";
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function ReviewerTaskReviewPage() {
  const params = useParams();
  const taskId = (params?.taskId as string) || "";
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"Overview" | "Micro Tasks">(
    "Micro Tasks",
  );
  // State for pagination and filtering
  const [microTaskPage, setMicroTaskPage] = useState(1);
  const [microTaskPageSize, setMicroTaskPageSize] = useState(7);
  const [verificationStatus, setVerificationStatus] = useState<
    string | undefined
  >(undefined);
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeButton, setActiveButton] = useState<string>("Pending");
  const [isInnerDialogOpen, setIsInnerDialogOpen] = useState(false);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [isUncertain, setIsUncertain] = useState<boolean | undefined>(
    undefined,
  );

  // Load task data from localStorage
  useEffect(() => {
    const storedTaskData = localStorage.getItem(`QAtask_${taskId}`);
    if (storedTaskData) {
      try {
        const taskData = JSON.parse(storedTaskData);
        setTask(taskData);
      } catch (error) {
        console.error("Error parsing stored task data:", error);
      }
    }
    setIsLoading(false);
  }, [taskId]);

  const handleButtonClick = (button: string) => {
    setActiveButton(button);
    setMicroTaskPage(1); // Reset page when changing status
    setIsUncertain(undefined); // Reset uncertain filter when changing status
  };

  const handleReviewerFilterChange = (reviewerIds: string[]) => {
    setSelectedReviewerIds(reviewerIds);
    setMicroTaskPage(1); // Reset page when filter changes
  };
  return (
    <AuthenticatedPage loadingMessage={t("loadingTaskReviewPage")}>
      <div className="flex flex-row py-3 px-2 mb-4">
        <span className="text-lg mb-2 mr-4 font-semibold">{task?.name}</span>
        <div
          className={`flex items-center space-x-1 px-2 py-2 rounded-2xl ${task?.is_closed ? "bg-red-500" : "bg-[#ECFDF3]"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${task?.is_closed ? "bg-red-500" : "bg-[#037847]"}`}
          ></span>
          <span
            className={`text-xs text-gray-600 ${task?.is_closed ? "text-red-500" : "text-[#037847]"}`}
          >
            {task?.is_closed ? t("inactive") : t("active")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 px-2 text-xs text-gray-600 mb-3">
        <div className="flex flex-col items-start">
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
            {task?.taskType?.task_type ? task.taskType?.task_type : ""}
          </span>
        </div>
        <div className="flex flex-col items-start px-2 py-1">
          <span>
            {t("createdDate")}:{" "}
            {task?.created_date ? formatDateMedium(task.created_date) : ""}
          </span>
        </div>
      </div>
      <div className="border-b border-gray-100 mb-4 overflow-x-auto">
        <nav className="flex space-x-2 sm:space-x-4 min-w-max">
          <button
            onClick={() => setActiveTab("Overview")}
            className={`py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium flex items-center whitespace-nowrap ${activeTab === "Overview" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M7.55137 4.02194L2.69926 8.26778C2.28317 8.63192 2.56215 9.27858 3.13532 9.27858C3.48549 9.27858 3.76937 9.54075 3.76937 9.86425V12.5672C3.76937 14.8925 3.76937 16.0552 4.55147 16.7776C5.33357 17.5 6.59235 17.5 9.10992 17.5H10.8901C13.4077 17.5 14.6664 17.5 15.4485 16.7776C16.2307 16.0552 16.2307 14.8925 16.2307 12.5672V9.86425C16.2307 9.54075 16.5145 9.27858 16.8647 9.27858C17.4378 9.27858 17.7168 8.63192 17.3008 8.26778L12.4486 4.02194C11.2891 3.00732 10.7093 2.5 10 2.5C9.29067 2.5 8.71092 3.00732 7.55137 4.02194Z"
                stroke={activeTab === "Overview" ? "#095FAF" : "#667085"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 13.333H10.0075"
                stroke={activeTab === "Overview" ? "#095FAF" : "#667085"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("taskDetails")}
          </button>
          <button
            onClick={() => setActiveTab("Micro Tasks")}
            className={`py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium flex items-center whitespace-nowrap ${activeTab === "Micro Tasks" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-700"}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M5.42742 13.3337H8.76076M5.42742 9.16699H12.0941M8.34409 18.3337H9.17742M6.25826 18.3337C5.29992 18.3128 4.65492 18.3337 3.82242 18.1462C2.94742 17.917 2.40576 17.3753 2.21909 16.292C2.03159 15.5837 2.09159 12.437 2.09409 9.43783C2.09576 7.11033 2.11076 4.99949 2.30242 4.56283C2.57326 3.62533 3.19742 2.95866 5.13409 2.93783M13.3574 2.93783C14.0241 3.00033 15.7658 2.93783 16.1058 4.85449C16.2908 5.89616 16.2516 7.37533 16.2516 9.14616M6.81992 4.58366C7.69492 4.60449 10.5049 4.58366 11.4633 4.58366C12.4208 4.58366 12.9266 3.79533 12.9208 3.06283C12.9141 2.31616 12.2541 1.73366 11.6083 1.66699H6.79992C6.02909 1.70866 5.50826 2.33366 5.42492 2.95866C5.34159 3.81283 5.96659 4.54199 6.81992 4.58366ZM15.2316 11.9795C14.0858 13.1462 11.8791 15.2295 11.8791 15.3753C11.7016 15.6228 11.5458 16.1253 11.4416 16.8337C11.3116 17.4903 11.1549 18.0628 11.3383 18.2295C11.5216 18.3962 12.2108 18.2562 12.9408 18.1045C13.5241 18.042 14.0658 17.8337 14.3358 17.6253C14.7316 17.2753 17.4174 14.5628 17.7299 14.2087C17.9583 13.8962 17.9799 13.3128 17.7799 12.9587C17.6674 12.7087 16.9591 12.042 16.7299 11.8545C16.4995 11.7124 16.2296 11.6478 15.9598 11.6703C15.69 11.6928 15.4353 11.8012 15.2316 11.9795Z"
                stroke={activeTab === "Micro Tasks" ? "#095FAF" : "#667085"}
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("microTasks")}
          </button>
        </nav>
      </div>
      {activeTab === "Overview" && (
        <TaskDetailsGeneral type={true} task={task} />
      )}
      {activeTab === "Micro Tasks" && (
        <>
          {isLoading ? (
            <div className="p-6" />
          ) : task ? (
            <>
              {!isInnerDialogOpen && (
                <div className="flex flex-row items-center justify-between w-full">
                  <div className="flex flex-row gap-2">
                    <Button
                      className={`mr-4 mb-4 w-35 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "Pending" ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => handleButtonClick("Pending")}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#FB7E37]"></span>
                      <span className="text-xs">{t("pending")}</span>
                    </Button>
                    <Button
                      className={`mr-4 mb-4 w-25 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "all" ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => handleButtonClick("all")}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${activeButton === "all" ? "bg-white" : "bg-gray-400"}`}
                      ></span>
                      <span className="text-xs">{t("all")}</span>
                    </Button>
                    <Button
                      className={`mr-4 mb-4 w-35 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "Rejected" ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => handleButtonClick("Rejected")}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#f00]"></span>
                      <span className="text-xs">{t("rejected")}</span>
                    </Button>
                    <Button
                      className={`mr-4 mb-4 w-35 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "Approved" ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => handleButtonClick("Approved")}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#02B516]"></span>
                      <span className="text-xs">{t("approved")}</span>
                    </Button>
                    <Button
                      className={`mr-4 mb-4 w-35 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "Flagged" ? "bg-primary text-white" : "bg-white text-red-800"}`}
                      onClick={() => handleButtonClick("Flagged")}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${activeButton === "Flagged" ? "bg-[#f4fcf5]" : "bg-[#f77777]"}`}
                      ></span>
                      <span className="text-xs">{t("flagged")}</span>
                    </Button>
                    <Button
                      className={`mr-4 mb-4 px-4 py-2 rounded-full text-sm font-medium ${isUncertain === true ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => {
                        setIsUncertain(isUncertain === true ? undefined : true);
                        setMicroTaskPage(1);
                      }}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${isUncertain === true ? "bg-yellow-200" : "bg-yellow-400"}`}
                      ></span>
                      <span className="text-xs">Uncertain Reviews</span>
                    </Button>
                  </div>
                  <FilterComponentReviewer
                    taskId={taskId}
                    onFilterChange={handleReviewerFilterChange}
                  />
                </div>
              )}
              <MicroTaskList
                taskType={task?.task_type || ""}
                title={task?.name || ""}
                createdDate={task?.created_date || ""}
                taskId={taskId}
                taskStatus={task?.is_closed ?? true}
                microTaskPage={microTaskPage}
                setMicroTaskPage={setMicroTaskPage}
                microTaskPageSize={microTaskPageSize}
                setMicroTaskPageSize={setMicroTaskPageSize}
                searchQuery=""
                status_data={activeButton}
                verificationStatus={verificationStatus}
                setVerificationStatus={setVerificationStatus}
                onInnerDialogOpenChange={setIsInnerDialogOpen}
                reviewerIds={selectedReviewerIds}
                isUncertain={isUncertain}
              />
            </>
          ) : (
            <div className="p-6">
              <p className="text-red-600">{t("taskDataNotFound")}</p>
            </div>
          )}
        </>
      )}
    </AuthenticatedPage>
  );
}
