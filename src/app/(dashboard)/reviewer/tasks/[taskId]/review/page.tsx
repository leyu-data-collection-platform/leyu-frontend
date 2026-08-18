"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AuthenticatedPage from "@/app/components/layout/AuthenticatedPage";
import MicroTaskList from "@/app/components/reviewer/microTaskList";
import { Button } from "@/components/ui/button";
import { formatDateMedium } from "@/app/types/dateUtils";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { TaskInstructions, TaskInstructionsReviwer } from "@/app/types/project";
import InstructionView from "@/app/components/reviewer/instructionView";
import { useDebounce } from "@/lib/hooks/useDebounce";
export default function ReviewerTaskReviewPage() {
  const params = useParams();
  const taskId = (params?.taskId as string) || "";
  const { t } = useTranslation();

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
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Load task data from localStorage
  useEffect(() => {
    const storedTaskData = localStorage.getItem(`task_${taskId}`);
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
  };
  useEffect(() => {
    setMicroTaskPage(1); // Reset page when the search term changes
  }, [debouncedSearch]);
  const [selectedInstruction, setSelectedInstruction] = useState<any>(null);
  const [showInstruction, setShowInstruction] = useState(false);
  const [isInstructionFullScreen, setIsInstructionFullScreen] = useState(false);
  const handleOpenInstruction = (instruction: TaskInstructionsReviwer) => {
    setSelectedInstruction(instruction);
    setTimeout(() => {
      setIsInstructionFullScreen(true);
    }, 100);
  };
  return (
    <AuthenticatedPage loadingMessage={t("loadingTaskReviewPage")}>
      {isLoading ? (
        <div className="p-6" />
      ) : task ? (
        <>
          {isInstructionFullScreen ? (
            <>
              <InstructionView
                onCancel={() => setIsInstructionFullScreen(false)}
                taskInstructions={selectedInstruction}
                open={isInstructionFullScreen}
                setOpen={setIsInstructionFullScreen}
              />
            </>
          ) : (
            <>
              {!isInnerDialogOpen && (
                <>
                  <div className="flex flex-row py-3 px-2 mb-4">
                    <span className="text-lg mb-2 mr-4 font-semibold">
                      {task?.name}
                    </span>
                    <div
                      className={`flex items-center space-x-1 px-2 py-2 rounded-2xl ${
                        task?.is_closed ? "bg-red-500" : "bg-[#ECFDF3]"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          task?.is_closed ? "bg-red-500" : "bg-[#037847]"
                        }`}
                      ></span>
                      <span
                        className={`text-xs text-gray-600 ${
                          task?.is_closed ? "text-red-500" : "text-[#037847]"
                        }`}
                      >
                        {task?.is_closed ? t("inactive") : t("active")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 px-2 text-xs text-gray-600 mb-3">
                    <div className="flex flex-col items-start">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {task?.task_type}
                      </span>
                    </div>
                    <div className="flex flex-col items-start px-2 py-1">
                      <span>
                        {t("createdDate")}:{" "}
                        {task?.created_date
                          ? formatDateMedium(task.created_date)
                          : ""}
                      </span>
                    </div>
                  </div>
                  {task.content ? (
                    <div className="mt-auto flex justify-end pt-3">
                      <button
                        onClick={() =>
                          handleOpenInstruction({
                            title: task.title,
                            content: task.content,
                            image_instruction_url: task.image_instruction_url,
                            video_instruction_url: task.video_instruction_url,
                            audio_instruction_url: task.audio_instruction_url,
                          } as TaskInstructionsReviwer)
                        }
                        className="border border-gray-300 hover:border-blue-500 text-primary px-4 py-2 rounded-lg flex items-center"
                      >
                        <span className="text-sm">View Instruction</span>
                      </button>
                    </div>
                  ) : (
                    <></>
                  )}
                  <div className="px-2 mb-4 max-w-sm">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("searchByContributorOrDataset") || "Search by contributor or dataset..."}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-row">
                    <Button
                      className={`mr-4 mb-4 w-35 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "Pending" ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => handleButtonClick("Pending")}
                    >
                      <span
                        className={`h-2 w-2 rounded-full bg-[#FB7E37]`}
                      ></span>
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
                      <span className={`h-2 w-2 rounded-full bg-[#f00]`}></span>
                      <span className="text-xs">{t("rejected")}</span>
                    </Button>
                    <Button
                      className={`mr-4 mb-4 w-35 border-r-background px-4 py-2 rounded-full text-sm font-medium ${activeButton === "Approved" ? "bg-primary text-white" : "bg-white text-gray-800"}`}
                      onClick={() => handleButtonClick("Approved")}
                    >
                      <span
                        className={`h-2 w-2 rounded-full bg-[#02B516]`}
                      ></span>
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
                  </div>
                </>
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
                searchQuery={debouncedSearch}
                status_data={activeButton}
                verificationStatus={verificationStatus}
                setVerificationStatus={setVerificationStatus}
                onInnerDialogOpenChange={setIsInnerDialogOpen}
              />
            </>
          )}
        </>
      ) : (
        <div className="p-6">
          <p className="text-red-600">{t("taskDataNotFound")}</p>
        </div>
      )}
    </AuthenticatedPage>
  );
}
